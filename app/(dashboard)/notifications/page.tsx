"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  CheckCircle,
  XCircle,
  BookOpen,
  Users,
  UserCheck,
  CheckCheck,
  MoreVertical,
  AlertTriangle,
  Info,
  Check,
  Loader2,
  Coins,
} from "lucide-react";
import type { Notification } from "@/lib/schema";
import { toast } from "sonner";
import OfflineIndicator from "@/components/OfflineIndicator";
import { PageHeader } from "@/components/page-header";
import { StatsCard } from "@/components/stats-card";
import { EmptyState } from "@/components/empty-state";
import { SearchInput } from "@/components/filters/search-input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  format,
  isToday,
  isYesterday,
  isThisWeek,
  isThisMonth,
} from "date-fns";
import { Loader } from "@/components/loader";

export default function NotificationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterReadStatus, setFilterReadStatus] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("all");
  const [approvingNotifications, setApprovingNotifications] = useState<
    Set<string>
  >(new Set());
  const [rejectingNotifications, setRejectingNotifications] = useState<
    Set<string>
  >(new Set());

  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json() as unknown as Notification[];
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
      if (!res.ok) throw new Error("Failed to mark as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/notifications/unread"],
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to mark notification as read");
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications/mark-all-read", {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to mark all notifications as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/notifications/unread"],
      });
      toast.success("All notifications marked as read");
    },
    onError: () => {
      toast.error("Failed to mark all notifications as read");
    },
  });

  const approveUserMutation = useMutation({
    mutationFn: async ({
      userId,
      notificationId,
    }: {
      userId: string;
      notificationId: string;
    }) => {
      const res = await fetch("/api/users/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, approved: true }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to approve user");
      }
      const data = await res.json();
      return { data, notificationId };
    },
    onMutate: ({ notificationId }) => {
      setApprovingNotifications((prev) => new Set(prev).add(notificationId));
    },
    onSuccess: ({ data, notificationId }) => {
      // Mark notification as read
      markAsReadMutation.mutate(notificationId);
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/notifications/unread"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
      toast.success(`User ${data.user.name} approved successfully`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to approve user");
    },
    onSettled: (data, error, { notificationId }) => {
      setApprovingNotifications((prev) => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    },
  });

  const rejectUserMutation = useMutation({
    mutationFn: async ({
      userId,
      notificationId,
    }: {
      userId: string;
      notificationId: string;
    }) => {
      const res = await fetch("/api/users/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, approved: false }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to reject user");
      }
      const data = await res.json();
      return { data, notificationId };
    },
    onMutate: ({ notificationId }) => {
      setRejectingNotifications((prev) => new Set(prev).add(notificationId));
    },
    onSuccess: ({ notificationId }) => {
      // Mark notification as read
      markAsReadMutation.mutate(notificationId);
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/notifications/unread"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
      toast.success("User rejected and deleted");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reject user");
    },
    onSettled: (data, error, { notificationId }) => {
      setRejectingNotifications((prev) => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    },
  });

  const filteredNotifications = useMemo(() => {
    return notifications
      .filter((notification) => {
        // Search filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          if (
            !notification.title.toLowerCase().includes(searchLower) &&
            !notification.message.toLowerCase().includes(searchLower)
          ) {
            return false;
          }
        }

        // Type filter
        if (filterType !== "all" && notification.type !== filterType) {
          return false;
        }

        // Read status filter
        if (filterReadStatus === "read" && !notification.isRead) {
          return false;
        }
        if (filterReadStatus === "unread" && notification.isRead) {
          return false;
        }

        // Date filter
        if (filterDate !== "all") {
          const notificationDate = new Date(notification.createdAt);

          switch (filterDate) {
            case "today":
              if (!isToday(notificationDate)) return false;
              break;
            case "yesterday":
              if (!isYesterday(notificationDate)) return false;
              break;
            case "week":
              if (!isThisWeek(notificationDate)) return false;
              break;
            case "month":
              if (!isThisMonth(notificationDate)) return false;
              break;
          }
        }

        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [notifications, searchTerm, filterType, filterReadStatus, filterDate]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-success" />;
      case "error":
        return <XCircle className="w-5 h-5 text-destructive" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case "class":
        return <BookOpen className="w-5 h-5 text-primary" />;
      case "student":
        return <Users className="w-5 h-5 text-info" />;
      case "attendance":
        return <UserCheck className="w-5 h-5 text-info" />;
      case "fee":
        return <Coins className="w-5 h-5 text-success" />;
      default:
        return <Info className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "success":
        return "border-success/40";
      case "error":
        return "border-destructive/40";
      case "warning":
        return "border-warning/40";
      case "class":
        return "border-primary/40";
      case "student":
        return "border-info/40";
      case "attendance":
        return "border-info/40";
      case "fee":
        return "border-success/40";
      default:
        return "border-border";
    }
  };

  const formatDate = (date: Date) => {
    const notificationDate = new Date(date);

    if (isToday(notificationDate)) {
      return `Today at ${format(notificationDate, "h:mm a")}`;
    } else if (isYesterday(notificationDate)) {
      return `Yesterday at ${format(notificationDate, "h:mm a")}`;
    } else if (isThisWeek(notificationDate)) {
      return format(notificationDate, "EEEE 'at' h:mm a");
    } else {
      return format(notificationDate, "MMM dd, yyyy 'at' h:mm a");
    }
  };

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    if (unreadCount > 0) {
      markAllAsReadMutation.mutate();
    }
  };

  const handleApproveUser = (userId: string, notificationId: string) => {
    approveUserMutation.mutate({ userId, notificationId });
  };

  const handleRejectUser = (userId: string, notificationId: string) => {
    rejectUserMutation.mutate({ userId, notificationId });
  };

  return (
    <div className="space-y-6">
      <OfflineIndicator />

      <PageHeader
        description="Stay updated with all your attendance management activities"
        actions={
          <Popover>
            <PopoverTrigger asChild>
              <Info className="h-5 w-5 text-muted-foreground" />
            </PopoverTrigger>
            <PopoverContent>
              <p>Notifications are automatically deleted after 7 days</p>
            </PopoverContent>
          </Popover>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total" value={notifications.length} icon={Bell} />
        <StatsCard
          title="Unread"
          value={unreadCount}
          icon={Bell}
          tone="danger"
        />
        <StatsCard
          title="Read"
          value={notifications.length - unreadCount}
          icon={CheckCircle}
          tone="success"
        />
        <StatsCard
          title="This Week"
          value={
            notifications.filter((n) => isThisWeek(new Date(n.createdAt)))
              .length
          }
          icon={AlertTriangle}
          tone="warning"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between rounded-lg border bg-muted/30 p-3 sm:p-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search notifications..."
        />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="class">Class</SelectItem>
            <SelectItem value="student">Student</SelectItem>
            <SelectItem value="attendance">Attendance</SelectItem>
            <SelectItem value="fee">Fee</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filterReadStatus}
          onValueChange={setFilterReadStatus}
        >
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Read status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterDate} onValueChange={setFilterDate}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-full flex justify-end">
        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAllAsRead}
            variant="outline"
            disabled={markAllAsReadMutation.isPending}
          >
            {markAllAsReadMutation.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <CheckCheck />
            )}
            {markAllAsReadMutation.isPending ? "Marking..." : "Mark All Read"}
          </Button>
        )}
      </div>
      {/* Notifications List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="py-12">
              <Loader
                variant="skeleton"
                shape="notifications"
                className="max-w-none"
              />
            </CardContent>
          </Card>
        ) : filteredNotifications.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                bare
                icon={Bell}
                title="No notifications found"
                description={
                  notifications.length === 0
                    ? "You don't have any notifications yet."
                    : "Try adjusting your filters to see more notifications."
                }
              />
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-colors ${
                !notification.isRead
                  ? getNotificationColor(notification.type)
                  : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold mb-1">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message
                            .split("**")
                            .map((part, index) =>
                              index % 2 === 1 ? (
                                <strong key={index}>{part}</strong>
                              ) : (
                                part
                              )
                            )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-3">
                          {formatDate(notification.createdAt)}
                        </p>
                        {notification.entityType === "user" &&
                          notification.action === "pending" &&
                          notification.entityId &&
                          !notification.isRead && (
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleApproveUser(
                                    notification.entityId!,
                                    notification.id
                                  )
                                }
                                disabled={approvingNotifications.has(
                                  notification.id
                                )}
                              >
                                {approvingNotifications.has(notification.id) ? (
                                  <Loader2 className="animate-spin" />
                                ) : (
                                  <CheckCircle />
                                )}
                                {approvingNotifications.has(notification.id)
                                  ? "Approving..."
                                  : "Approve"}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  handleRejectUser(
                                    notification.entityId!,
                                    notification.id
                                  )
                                }
                                disabled={rejectingNotifications.has(
                                  notification.id
                                )}
                              >
                                {rejectingNotifications.has(notification.id) ? (
                                  <Loader2 className="animate-spin" />
                                ) : (
                                  <XCircle />
                                )}
                                {rejectingNotifications.has(notification.id)
                                  ? "Rejecting..."
                                  : "Reject"}
                              </Button>
                            </div>
                          )}
                      </div>
                      <div className="flex items-center gap-2 ml-0 md:ml-4">
                        {!notification.isRead && (
                          <Badge variant="danger" className="text-xs">
                            Unread
                          </Badge>
                        )}
                        {!notification.isRead && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" side="bottom">
                              <DropdownMenuItem
                                onClick={() =>
                                  handleMarkAsRead(notification.id)
                                }
                                className="cursor-pointer"
                                disabled={markAsReadMutation.isPending}
                              >
                                <Check className="mr-2" />
                                Mark as Read
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
