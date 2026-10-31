"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface ExtendedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isApproved: boolean;
  avatar?: string;
  createdAt: string;
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, MoreVertical, CheckCircle, XCircle, Trash2, Clock, Crown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader } from "@/components/loader";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import OfflineIndicator from "@/components/OfflineIndicator";
import { toast } from "sonner";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";

export default function UsersPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Redirect teachers to attendance page
  useEffect(() => {
    if ((session?.user as ExtendedUser)?.role === "teacher") {
      router.push("/attendance");
    }
  }, [session, router]);

  const { data: users = [], isLoading } = useQuery<ExtendedUser[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json().then(data => data.users);
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const approveMutation = useMutation({
    mutationFn: async ({ userId, approved }: { userId: string; approved: boolean }) => {
      const res = await fetch("/api/users/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, approved }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update user status");
      }
      const data = await res.json();
      return { ...data, approved };
    },
    onSuccess: (data) => {
      toast.dismiss();
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread"] });

      const actorName = (session?.user as ExtendedUser)?.name || "Admin";
      if (data.approved) {
        toast.success(`${actorName} approved ${data.user.name}`);
      } else {
        toast.success(`${actorName} rejected and deleted user`);
      }
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message || "Failed to update user status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete user");
      }
      return res.json();
    },
    onSuccess: (data, userId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread"] });

      const deletedUser = users.find(u => u.id === userId);
      const actorName = (session?.user as ExtendedUser)?.name || "Admin";
      toast.success(`${actorName} deleted ${deletedUser?.name}`);

      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete user");
    },
  });

  const upgradeMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: "admin" }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to upgrade user");
      }
      return res.json();
    },
    onSuccess: async (data, userId) => {
      toast.dismiss();
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });

      const upgradedUser = users.find(u => u.id === userId);
      const actorName = (session?.user as ExtendedUser)?.name || "Admin";
      toast.success(`${actorName} upgraded ${upgradedUser?.name} to admin`);

      // Create notification for all admins
      try {
        const adminUsers = users.filter(u => u.role === "admin").map(u => u.id);
        await fetch("/api/notifications/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: {
              title: "User Upgraded to Admin",
              message: `**${actorName}** upgraded ${upgradedUser?.name || "User"} to admin.`,
              type: "success" as const,
              entityType: "user" as const,
              actorName,
              action: "upgraded",
            },
            userIds: adminUsers,
          }),
        });
      } catch (error) {
        console.error("Failed to create upgrade notification:", error);
      }
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message || "Failed to upgrade user");
    },
  });

  const handleApprove = (userId: string) => {
    toast.loading("Approving user...");
    approveMutation.mutate({ userId, approved: true });
  };

  const handleReject = (userId: string) => {
    toast.loading("Rejecting user...");
    approveMutation.mutate({ userId, approved: false });
  };

  const handleDelete = (user: ExtendedUser) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleUpgrade = (userId: string) => {
    toast.loading("Upgrading user to admin...");
    upgradeMutation.mutate(userId);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;

    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync(selectedUser.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (user: ExtendedUser) => {
    if (user.isApproved) {
      return (
        <Badge variant="success">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    } else {
      return (
        <Badge variant="warning">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === "admin") {
      return <Badge variant="danger">Admin</Badge>;
    } else {
      return <Badge variant="info">Teacher</Badge>;
    }
  };

  const getUserActions = (user: ExtendedUser) => {
    if (!user.isApproved) {
      // Pending users: Approve and Reject
      return (
        <>
          <DropdownMenuItem
            onClick={() => handleApprove(user.id)}
            disabled={approveMutation.isPending}
            className="cursor-pointer"
          >
            <CheckCircle className="mr-2 text-success" />
            Approve
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleReject(user.id)}
            disabled={approveMutation.isPending}
            className="cursor-pointer"
          >
            <XCircle className="mr-2 text-destructive" />
            Reject
          </DropdownMenuItem>
        </>
      );
    } else if (user.role === "teacher") {
      // Approved teachers: Upgrade to Admin and Delete
      return (
        <>
          <DropdownMenuItem
            onClick={() => handleUpgrade(user.id)}
            disabled={upgradeMutation.isPending}
            className="cursor-pointer"
          >
            <Crown className="mr-2 text-warning" />
            Upgrade to Admin
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleDelete(user)}
            className="cursor-pointer text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </>
      );
    }
    // Approved admins: No actions
    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <OfflineIndicator />
        <PageHeader description="Manage all users in the system" />
        <Card>
          <CardContent className="py-12">
            <Loader variant="skeleton" shape="users" className="max-w-none" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <OfflineIndicator />
      <PageHeader description="Manage all users in the system" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <EmptyState bare icon={Users} title="No users found" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 sm:gap-4 rounded-lg border bg-card p-3 sm:p-4 transition-colors hover:bg-card/50"
                >
                  {/* User Avatar */}
                  <Avatar className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 ring-2 ring-muted shrink-0">
                    <AvatarImage
                      src={user.avatar || undefined}
                      alt={user.name}
                    />
                    <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* User Information */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold leading-tight truncate">
                      {user.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed truncate">
                      {user.email}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {getRoleBadge(user.role)}
                      {getStatusBadge(user)}
                    </div>
                  </div>

                  {/* Actions Menu */}
                  <div className="shrink-0">
                    {getUserActions(user) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          {getUserActions(user)}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete User"
        description={`Are you sure you want to delete ${selectedUser?.name}? This action cannot be undone and will also remove all associated data.`}
        isDeleting={isDeleting}
      />
    </div>
  );
}