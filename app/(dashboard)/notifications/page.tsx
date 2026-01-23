"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Search,
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
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case "class":
        return <BookOpen className="w-5 h-5 text-blue-600" />;
      case "student":
        return <Users className="w-5 h-5 text-purple-600" />;
      case "attendance":
        return <UserCheck className="w-5 h-5 text-indigo-600" />;
      case "fee":
        return <Coins className="w-5 h-5 text-green-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "success":
        return "border-green-200";
      case "error":
        return "border-red-200";
      case "warning":
        return "border-amber-200";
      case "class":
        return "border-blue-200";
      case "student":
        return "border-purple-200";
      case "attendance":
        return "border-indigo-200";
      case "fee":
        return "border-green-200";
      default:
        return "border-gray-200";
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

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground mt-1">
            Stay updated with all your attendance management activities
          </p>
          <Popover>
            <PopoverTrigger asChild>
              <Info className="sm:w-5 sm:h-5 text-muted-foreground cursor-pointer w-7 h-7" />
            </PopoverTrigger>
            <PopoverContent>
              <p>Notifications are automatically deleted after 7 days</p>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <Bell className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{notifications.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <span className="text-red-600 dark:text-red-400 font-bold text-sm">
                {unreadCount}
              </span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                Unread
              </p>
              <p className="text-2xl font-bold">{unreadCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Read</p>
              <p className="text-2xl font-bold">
                {notifications.length - unreadCount}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                This Week
              </p>
              <p className="text-2xl font-bold">
                {
                  notifications.filter((n) => isThisWeek(new Date(n.createdAt)))
                    .length
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
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
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Read status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterDate} onValueChange={setFilterDate}>
              <SelectTrigger className="w-full sm:w-48">
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
        </CardContent>
      </Card>

      <div className="w-full flex justify-end">
        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAllAsRead}
            variant="outline"
            disabled={markAllAsReadMutation.isPending}
            className="cursor-pointer"
          >
            {markAllAsReadMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCheck className="w-4 h-4 mr-2" />
            )}
            {markAllAsReadMutation.isPending ? "Marking..." : "Mark All Read"}
          </Button>
        )}
      </div>
      {/* Notifications List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12 min-h-[200px]">
              <Loader size="md" text="please wait..." />
            </CardContent>
          </Card>
        ) : filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No notifications found</h3>
                <p className="text-muted-foreground">
                  {notifications.length === 0
                    ? "You don't have any notifications yet."
                    : "Try adjusting your filters to see more notifications."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-all duration-200 hover:shadow-md ${
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
                        <h3 className="font-semibold text-base mb-1">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2 dark:text-black">
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
                                className="cursor-pointer"
                              >
                                {approvingNotifications.has(notification.id) ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4 mr-2" />
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
                                className="cursor-pointer"
                              >
                                {rejectingNotifications.has(notification.id) ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <XCircle className="w-4 h-4 mr-2" />
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
                          <Badge variant="destructive" className="text-xs">
                            Unread
                          </Badge>
                        )}
                        {!notification.isRead && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <MoreVertical className="h-4 w-4" />
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
                                <Check className="w-4 h-4 mr-2" />
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
