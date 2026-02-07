import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { io, Socket } from "socket.io-client";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

interface Message {
  _id: string;
  conversationId: string;
  senderId: { _id: string; name: string; profilePhoto?: string };
  receiverId: { _id: string; name: string; profilePhoto?: string };
  content: string;
  read: boolean;
  createdAt: string;
}

interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: string[];
  notifications: Notification[];
  unreadNotificationCount: number;
  unreadMessageCount: number;
  joinConversation: (userId: string) => void;
  leaveConversation: (userId: string) => void;
  sendMessage: (receiverId: string, content: string) => Promise<Message>;
  startTyping: (userId: string) => void;
  stopTyping: (userId: string) => void;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  refreshNotifications: () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  const { token, user } = useSelector((state: RootState) => state.auth);

  const API_URL =
    import.meta.env.VITE_API_URL?.replace("/api", "") ||
    "http://localhost:5000";

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, [token, API_URL]);

  // Fetch unread message count
  const fetchUnreadMessageCount = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/api/messages/unread-count`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setUnreadMessageCount(data.count || 0);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }, [token, API_URL]);

  // Initialize socket connection
  useEffect(() => {
    if (token && user) {
      const newSocket = io(API_URL, {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on("connect", () => {
        console.log("✅ Socket connected");
        setIsConnected(true);
      });

      newSocket.on("disconnect", () => {
        console.log("❌ Socket disconnected");
        setIsConnected(false);
      });

      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error.message);
        setIsConnected(false);
      });

      // Handle online users
      newSocket.on("online_users", (users: string[]) => {
        setOnlineUsers(users);
      });

      newSocket.on("user_online", ({ userId }: { userId: string }) => {
        setOnlineUsers((prev) => [...new Set([...prev, userId])]);
      });

      newSocket.on("user_offline", ({ userId }: { userId: string }) => {
        setOnlineUsers((prev) => prev.filter((id) => id !== userId));
      });

      // Handle notifications
      newSocket.on("notification", (notification: Notification) => {
        setNotifications((prev) => [notification, ...prev]);
        // Update unread message count if it's a message notification
        if (notification.type === "new_message") {
          setUnreadMessageCount((prev) => prev + 1);
        }
      });

      // Handle messages read
      newSocket.on("messages_read", () => {
        fetchUnreadMessageCount();
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      // Fetch existing data
      fetchNotifications();
      fetchUnreadMessageCount();

      return () => {
        newSocket.disconnect();
        socketRef.current = null;
      };
    } else {
      // Disconnect if logged out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers([]);
        setNotifications([]);
        setUnreadMessageCount(0);
      }
    }
  }, [token, user, API_URL, fetchNotifications, fetchUnreadMessageCount]);

  const joinConversation = useCallback((userId: string) => {
    socketRef.current?.emit("join_conversation", userId);
  }, []);

  const leaveConversation = useCallback((userId: string) => {
    socketRef.current?.emit("leave_conversation", userId);
  }, []);

  const sendMessage = useCallback(
    (receiverId: string, content: string): Promise<Message> => {
      return new Promise((resolve, reject) => {
        if (!socketRef.current) {
          reject(new Error("Socket not connected"));
          return;
        }

        socketRef.current.emit(
          "send_message",
          { receiverId, content },
          (response: {
            success?: boolean;
            message?: Message;
            error?: string;
          }) => {
            if (response.success && response.message) {
              resolve(response.message);
            } else {
              reject(new Error(response.error || "Failed to send message"));
            }
          },
        );
      });
    },
    [],
  );

  const startTyping = useCallback((userId: string) => {
    socketRef.current?.emit("typing_start", userId);
  }, []);

  const stopTyping = useCallback((userId: string) => {
    socketRef.current?.emit("typing_stop", userId);
  }, []);

  const markNotificationRead = useCallback((notificationId: string) => {
    socketRef.current?.emit("mark_notification_read", notificationId);
    setNotifications((prev) =>
      prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    if (!token) return;
    try {
      await fetch(`${API_URL}/api/notifications/read-all`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  }, [token, API_URL]);

  const clearNotifications = useCallback(async () => {
    if (!token) return;
    try {
      await fetch(`${API_URL}/api/notifications`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setNotifications([]);
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    }
  }, [token, API_URL]);

  const refreshNotifications = useCallback(() => {
    fetchNotifications();
    fetchUnreadMessageCount();
  }, [fetchNotifications, fetchUnreadMessageCount]);

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUsers,
        notifications,
        unreadNotificationCount,
        unreadMessageCount,
        joinConversation,
        leaveConversation,
        sendMessage,
        startTyping,
        stopTyping,
        markNotificationRead,
        markAllNotificationsRead,
        clearNotifications,
        refreshNotifications,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
