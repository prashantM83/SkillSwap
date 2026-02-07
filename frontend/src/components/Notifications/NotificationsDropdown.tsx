import React from "react";
import { useSocket } from "@/context/SocketContext";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  RefreshCw,
  CheckCircle,
  XCircle,
  MessageSquare,
  Megaphone,
  Check,
  Trash2,
  AlertTriangle,
  ExternalLink,
  Calendar,
  Video,
  Clock,
} from "lucide-react";

interface NotificationData {
  swapId?: string;
  senderId?: string;
  senderName?: string;
  fromUser?: { _id: string; name: string };
  messagePreview?: string;
  sessionId?: string;
  swapRequestId?: string;
  scheduledAt?: string;
  meetingType?: string;
  meetingLink?: string;
  jitsiRoomId?: string;
  location?: string;
  duration?: number;
  hoursUntil?: number;
  [key: string]: unknown;
}

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  data?: NotificationData;
  read: boolean;
  createdAt: string;
}

const notificationIcons: Record<string, React.ReactNode> = {
  swap_request: <RefreshCw className="w-4 h-4 text-blue-500" />,
  swap_accepted: <CheckCircle className="w-4 h-4 text-green-500" />,
  swap_rejected: <XCircle className="w-4 h-4 text-red-500" />,
  swap_completed: <CheckCircle className="w-4 h-4 text-green-500" />,
  swap_cancelled: <XCircle className="w-4 h-4 text-orange-500" />,
  new_message: <MessageSquare className="w-4 h-4 text-purple-500" />,
  admin_announcement: <Megaphone className="w-4 h-4 text-yellow-500" />,
  message_reported: <AlertTriangle className="w-4 h-4 text-red-500" />,
  session_scheduled: <Calendar className="w-4 h-4 text-blue-500" />,
  session_updated: <Calendar className="w-4 h-4 text-yellow-500" />,
  session_cancelled: <XCircle className="w-4 h-4 text-red-500" />,
  session_reminder: <Clock className="w-4 h-4 text-green-500" />,
};

// Get navigation destination based on notification type
const getNotificationDestination = (
  notification: Notification,
): string | null => {
  switch (notification.type) {
    case "new_message":
      // Navigate to messages page
      return "/messages";
    case "swap_request":
    case "swap_accepted":
    case "swap_rejected":
    case "swap_completed":
    case "swap_cancelled":
      // Navigate to swaps page
      return "/swaps";
    case "message_reported":
      // Navigate to admin page (for admins)
      return "/admin";
    case "admin_announcement":
      // Stay on current page or go home
      return "/";
    case "session_scheduled":
    case "session_updated":
    case "session_cancelled":
    case "session_reminder":
      // Navigate to sessions page
      return "/sessions";
    default:
      return null;
  }
};

export const NotificationsDropdown: React.FC = () => {
  const {
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
  } = useSocket();
  const navigate = useNavigate();

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    markNotificationRead(notification._id);

    // Get destination and navigate
    const destination = getNotificationDestination(notification);
    if (destination) {
      navigate(destination);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={20} />
          {unreadNotificationCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <div className="flex gap-1">
            {unreadNotificationCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  markAllNotificationsRead();
                }}
              >
                <Check size={14} className="mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell size={40} className="mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            notifications.slice(0, 20).map((notification) => {
              const destination = getNotificationDestination(notification);
              return (
                <DropdownMenuItem
                  key={notification._id}
                  className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/80 transition-colors ${
                    !notification.read ? "bg-muted/50" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="mt-0.5">
                    {notificationIcons[notification.type] || (
                      <Bell className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {notification.message}
                    </p>
                    {/* Show meeting link for session notifications */}
                    {notification.data?.meetingLink && (
                      <a
                        href={notification.data.meetingLink as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Video size={12} />
                        Join Meeting
                      </a>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground">
                        {formatTime(notification.createdAt)}
                      </p>
                      {destination && (
                        <span className="text-xs text-primary flex items-center gap-1">
                          <ExternalLink size={10} />
                          View
                        </span>
                      )}
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-primary rounded-full mt-1 flex-shrink-0" />
                  )}
                </DropdownMenuItem>
              );
            })
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive justify-center"
              onClick={(e) => {
                e.preventDefault();
                clearNotifications();
              }}
            >
              <Trash2 size={14} className="mr-2" />
              Clear all
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
