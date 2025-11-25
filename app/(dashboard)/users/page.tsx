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
import { Users, MoreVertical, CheckCircle, XCircle, Trash2, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader } from "@/components/loader";
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
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === "admin") {
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
          Admin
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
          Teacher
        </Badge>
      );
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
            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
            Approve
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleReject(user.id)}
            disabled={approveMutation.isPending}
            className="cursor-pointer"
          >
            <XCircle className="h-4 w-4 mr-2 text-red-600" />
            Reject
          </DropdownMenuItem>
        </>
      );
    } else if (user.role === "teacher") {
      // Approved teachers: Delete
      return (
        <DropdownMenuItem
          onClick={() => handleDelete(user)}
          className="cursor-pointer text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      );
    }
    // Approved admins: No actions
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="md" text="Loading users..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <OfflineIndicator />
      <div>
        <p className="text-muted-foreground mt-1">
          Manage all users in the system
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
              <p className="text-muted-foreground text-lg">No users found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg sm:rounded-xl hover:shadow-md sm:hover:shadow-lg transition-all duration-200 bg-card hover:bg-card/50"
                >
                  {/* User Avatar */}
                  <Avatar className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 ring-2 ring-muted shrink-0">
                    <AvatarImage
                      src={user.avatar || undefined}
                      alt={user.name}
                    />
                    <AvatarFallback className="text-sm sm:text-base font-semibold bg-primary/10 text-primary">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* User Information */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base md:text-lg leading-tight truncate">
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
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
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