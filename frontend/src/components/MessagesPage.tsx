import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "@/context/SocketContext";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Send,
  Loader2,
  Circle,
  MoreVertical,
  Flag,
  AlertTriangle,
  Search,
  MessageCircle,
  CheckCircle,
  User,
  ArrowRight,
  ShieldAlert,
  Lock,
  History,
} from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";

interface Message {
  _id: string;
  conversationId: string;
  senderId: { _id: string; name: string; profilePhoto?: string };
  receiverId: { _id: string; name: string; profilePhoto?: string };
  content: string;
  read: boolean;
  isReported?: boolean;
  createdAt: string;
}

interface Conversation {
  conversationId: string;
  swapRequestId: string;
  swapStatus: "pending" | "accepted" | "completed";
  skillOffered: string;
  skillWanted: string;
  canReply: boolean;
  otherUser: {
    _id: string;
    name: string;
    profilePhoto?: string;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    senderId: string;
  } | null;
  unreadCount: number;
}

const REPORT_REASONS = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "inappropriate_content", label: "Inappropriate Content" },
  { value: "scam", label: "Scam or Fraud" },
  { value: "offensive_language", label: "Offensive Language" },
  { value: "other", label: "Other" },
];

const PRIVACY_WARNING = {
  title: "Privacy Warning",
  message: `Before you start chatting, please keep in mind:

• Never share sensitive personal information like your home address, phone number, or financial details until you fully trust the other user.
• Be cautious with sharing social media accounts or other identifiable information.
• Keep conversations on the platform until you're comfortable.
• Report any suspicious behavior using the report feature.
• Remember: Your safety is your priority!

This warning is shown once per conversation.`,
};

export const MessagesPage: React.FC = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");

  // Report dialog state
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportingMessage, setReportingMessage] = useState<Message | null>(
    null,
  );
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  // Privacy warning state
  const [privacyWarningOpen, setPrivacyWarningOpen] = useState(false);
  const [pendingConversation, setPendingConversation] =
    useState<Conversation | null>(null);
  const [acknowledgedConversations, setAcknowledgedConversations] = useState<
    Set<string>
  >(() => {
    const saved = localStorage.getItem("acknowledgedConversations");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Complete swap dialog state
  const [completeSwapDialogOpen, setCompleteSwapDialogOpen] = useState(false);
  const [completingSwap, setCompletingSwap] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    socket,
    joinConversation,
    leaveConversation,
    sendMessage,
    startTyping,
    stopTyping,
    onlineUsers,
  } = useSocket();
  const { user, token } = useSelector((state: RootState) => state.auth);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // Filter conversations based on tab and search
  const currentConversations = conversations.filter(
    (c) => c.swapStatus === "pending" || c.swapStatus === "accepted",
  );
  const historyConversations = conversations.filter(
    (c) => c.swapStatus === "completed",
  );

  const filteredConversations = (
    activeTab === "current" ? currentConversations : historyConversations
  ).filter((c) =>
    c.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch all conversations
  const fetchConversations = useCallback(async () => {
    try {
      setIsLoadingConversations(true);
      const response = await axios.get(`${API_URL}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(response.data);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      setIsLoadingConversations(false);
    }
  }, [token, API_URL]);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(
    async (userId: string) => {
      try {
        setIsLoadingMessages(true);
        const response = await axios.get(
          `${API_URL}/messages/conversation/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setMessages(response.data.messages);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        toast.error("Failed to load messages");
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [token, API_URL],
  );

  // Handle conversation selection with privacy warning
  const handleSelectConversation = (conversation: Conversation) => {
    // Check if this is a new conversation that hasn't been acknowledged
    const hasMessages = conversation.lastMessage !== null;
    const isAcknowledged = acknowledgedConversations.has(
      conversation.conversationId,
    );

    if (!hasMessages && !isAcknowledged && conversation.canReply) {
      // Show privacy warning for new conversations
      setPendingConversation(conversation);
      setPrivacyWarningOpen(true);
    } else {
      // Proceed directly
      selectConversation(conversation);
    }
  };

  // Actually select the conversation
  const selectConversation = (conversation: Conversation) => {
    // Leave previous conversation if any
    if (selectedConversation) {
      leaveConversation(selectedConversation.otherUser._id);
    }

    setSelectedConversation(conversation);
    joinConversation(conversation.otherUser._id);
    fetchMessages(conversation.otherUser._id);

    // Mark as acknowledged
    if (!acknowledgedConversations.has(conversation.conversationId)) {
      const newAcknowledged = new Set(acknowledgedConversations);
      newAcknowledged.add(conversation.conversationId);
      setAcknowledgedConversations(newAcknowledged);
      localStorage.setItem(
        "acknowledgedConversations",
        JSON.stringify(Array.from(newAcknowledged)),
      );
    }
  };

  // Handle privacy warning acknowledgment
  const handleAcknowledgePrivacy = () => {
    if (pendingConversation) {
      selectConversation(pendingConversation);
    }
    setPrivacyWarningOpen(false);
    setPendingConversation(null);
  };

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      // Update messages if in the same conversation
      if (selectedConversation) {
        const isInConversation =
          (message.senderId._id === selectedConversation.otherUser._id &&
            message.receiverId._id === user?._id) ||
          (message.senderId._id === user?._id &&
            message.receiverId._id === selectedConversation.otherUser._id);

        if (isInConversation) {
          setMessages((prev) => [...prev, message]);
        }
      }

      // Update conversations list with new message
      setConversations((prev) =>
        prev.map((c) => {
          const isRelevantConversation =
            c.otherUser._id === message.senderId._id ||
            c.otherUser._id === message.receiverId._id;

          if (isRelevantConversation) {
            return {
              ...c,
              lastMessage: {
                content: message.content,
                createdAt: message.createdAt,
                senderId: message.senderId._id,
              },
              unreadCount:
                message.senderId._id !== user?._id &&
                selectedConversation?.otherUser._id !== message.senderId._id
                  ? c.unreadCount + 1
                  : c.unreadCount,
            };
          }
          return c;
        }),
      );
    };

    const handleUserTyping = ({ userId }: { userId: string }) => {
      if (
        selectedConversation &&
        userId === selectedConversation.otherUser._id
      ) {
        setIsTyping(true);
      }
    };

    const handleUserStoppedTyping = ({ userId }: { userId: string }) => {
      if (
        selectedConversation &&
        userId === selectedConversation.otherUser._id
      ) {
        setIsTyping(false);
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stopped_typing", handleUserStoppedTyping);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stopped_typing", handleUserStoppedTyping);
    };
  }, [socket, selectedConversation, user?._id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (selectedConversation) {
      startTyping(selectedConversation.otherUser._id);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(selectedConversation.otherUser._id);
      }, 1000);
    }
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || isSending || !selectedConversation) return;

    // Check if messaging is allowed
    if (!selectedConversation.canReply) {
      toast.error("Cannot send messages for completed swaps");
      return;
    }

    try {
      setIsSending(true);
      stopTyping(selectedConversation.otherUser._id);
      await sendMessage(selectedConversation.otherUser._id, newMessage.trim());
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  // Report message
  const handleReportMessage = (message: Message) => {
    setReportingMessage(message);
    setReportDialogOpen(true);
  };

  const submitReport = async () => {
    if (!reportingMessage || !reportReason) return;

    setIsReporting(true);
    try {
      await axios.post(
        `${API_URL}/messages/report/${reportingMessage._id}`,
        {
          reason: reportReason,
          additionalDetails: reportDetails,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast.success("Message reported successfully");
      setReportDialogOpen(false);
      setReportingMessage(null);
      setReportReason("");
      setReportDetails("");
      setMessages((prev) =>
        prev.map((m) =>
          m._id === reportingMessage._id ? { ...m, isReported: true } : m,
        ),
      );
    } catch (error) {
      console.error("Failed to report message:", error);
      toast.error("Failed to report message");
    } finally {
      setIsReporting(false);
    }
  };

  // Complete swap
  const handleCompleteSwap = async () => {
    if (!selectedConversation) return;

    setCompletingSwap(true);
    try {
      await axios.put(
        `${API_URL}/swaps/${selectedConversation.swapRequestId}`,
        { status: "completed" },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Swap marked as completed!");
      setCompleteSwapDialogOpen(false);

      // Update local state
      setConversations((prev) =>
        prev.map((c) =>
          c.swapRequestId === selectedConversation.swapRequestId
            ? { ...c, swapStatus: "completed", canReply: false }
            : c,
        ),
      );
      setSelectedConversation((prev) =>
        prev ? { ...prev, swapStatus: "completed", canReply: false } : null,
      );

      // Switch to history tab
      setActiveTab("history");
    } catch (error) {
      console.error("Failed to complete swap:", error);
      toast.error("Failed to complete swap");
    } finally {
      setCompletingSwap(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatLastMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  let currentDate = "";

  messages.forEach((message) => {
    const messageDate = formatDate(message.createdAt);
    if (messageDate !== currentDate) {
      currentDate = messageDate;
      groupedMessages.push({ date: messageDate, messages: [message] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(message);
    }
  });

  const isOnline = selectedConversation
    ? onlineUsers.includes(selectedConversation.otherUser._id)
    : false;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[calc(100vh-8rem)]">
      <div className="h-full flex gap-4">
        {/* Sidebar - Conversations List */}
        <Card className="w-full md:w-96 flex-shrink-0 flex flex-col">
          <CardHeader className="pb-3 space-y-4">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle size={20} />
              Messages
            </CardTitle>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "current" | "history")}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  value="current"
                  className="flex items-center gap-1.5"
                >
                  <MessageCircle size={14} />
                  Current
                  {currentConversations.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                      {currentConversations.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="flex items-center gap-1.5"
                >
                  <History size={14} />
                  History
                  {historyConversations.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                      {historyConversations.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              {isLoadingConversations ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <MessageCircle className="w-12 h-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? "No conversations match your search"
                      : activeTab === "current"
                        ? "No active conversations yet"
                        : "No completed swaps yet"}
                  </p>
                  {!searchQuery && activeTab === "current" && (
                    <Button
                      variant="link"
                      className="mt-2"
                      onClick={() => navigate("/browse")}
                    >
                      Browse skills to start swapping
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredConversations.map((conversation) => (
                    <button
                      key={conversation.conversationId}
                      onClick={() => handleSelectConversation(conversation)}
                      className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                        selectedConversation?.conversationId ===
                        conversation.conversationId
                          ? "bg-muted"
                          : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <Avatar className="w-10 h-10">
                            <AvatarImage
                              src={conversation.otherUser.profilePhoto}
                            />
                            <AvatarFallback>
                              {conversation.otherUser.name
                                .charAt(0)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {conversation.canReply &&
                            onlineUsers.includes(
                              conversation.otherUser._id,
                            ) && (
                              <Circle className="absolute bottom-0 right-0 w-3 h-3 text-green-500 fill-green-500" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium truncate">
                              {conversation.otherUser.name}
                            </span>
                            {conversation.lastMessage && (
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                {formatLastMessageTime(
                                  conversation.lastMessage.createdAt,
                                )}
                              </span>
                            )}
                          </div>

                          {/* Swap info */}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <span className="truncate">
                              {conversation.skillOffered}
                            </span>
                            <ArrowRight size={10} />
                            <span className="truncate">
                              {conversation.skillWanted}
                            </span>
                          </div>

                          {/* Last message preview */}
                          {conversation.lastMessage ? (
                            <p className="text-sm text-muted-foreground truncate mt-1">
                              {conversation.lastMessage.senderId ===
                                user?._id && "You: "}
                              {conversation.lastMessage.content}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground italic mt-1">
                              No messages yet
                            </p>
                          )}

                          {/* Status badges */}
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge
                              variant={
                                conversation.swapStatus === "accepted"
                                  ? "default"
                                  : conversation.swapStatus === "completed"
                                    ? "secondary"
                                    : "outline"
                              }
                              className="text-xs"
                            >
                              {conversation.swapStatus === "completed" && (
                                <Lock size={10} className="mr-1" />
                              )}
                              {conversation.swapStatus}
                            </Badge>
                            {conversation.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {conversation.unreadCount} new
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Main Chat Area */}
        <Card className="hidden md:flex flex-1 flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage
                          src={selectedConversation.otherUser.profilePhoto}
                        />
                        <AvatarFallback>
                          {selectedConversation.otherUser.name
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {selectedConversation.canReply && (
                        <Circle
                          className={`absolute bottom-0 right-0 w-3 h-3 ${
                            isOnline
                              ? "text-green-500 fill-green-500"
                              : "text-gray-400 fill-gray-400"
                          }`}
                        />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {selectedConversation.otherUser.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {!selectedConversation.canReply ? (
                          <span className="flex items-center gap-1">
                            <Lock size={10} />
                            {selectedConversation.swapStatus === "pending"
                              ? "Pending - Accept to chat"
                              : "Swap completed - Read only"}
                          </span>
                        ) : isTyping ? (
                          "Typing..."
                        ) : isOnline ? (
                          "Online"
                        ) : (
                          "Offline"
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical size={20} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          navigate(
                            `/profile/${selectedConversation.otherUser._id}`,
                          )
                        }
                      >
                        <User size={16} className="mr-2" />
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/swaps")}>
                        <MessageCircle size={16} className="mr-2" />
                        View Swap Details
                      </DropdownMenuItem>
                      {selectedConversation.swapStatus === "accepted" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setCompleteSwapDialogOpen(true)}
                            className="text-green-600"
                          >
                            <CheckCircle size={16} className="mr-2" />
                            Mark Swap as Complete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Swap Info Bar */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{selectedConversation.skillOffered}</span>
                    <ArrowRight size={14} />
                    <span>{selectedConversation.skillWanted}</span>
                  </div>
                  <Badge
                    variant={
                      selectedConversation.swapStatus === "accepted"
                        ? "default"
                        : selectedConversation.swapStatus === "completed"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {selectedConversation.swapStatus}
                  </Badge>
                </div>
              </CardHeader>

              {/* Messages Area */}
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full p-4">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                      {selectedConversation.canReply ? (
                        <>
                          <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
                          <p className="text-lg font-medium mb-2">
                            Start the conversation!
                          </p>
                          <p className="text-muted-foreground max-w-md">
                            Say hello to {selectedConversation.otherUser.name}{" "}
                            and discuss how you'd like to swap skills.
                          </p>
                        </>
                      ) : (
                        <>
                          <History className="w-16 h-16 text-muted-foreground mb-4" />
                          <p className="text-lg font-medium mb-2">
                            No messages in this swap
                          </p>
                          <p className="text-muted-foreground">
                            This swap was completed without any messages.
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Read-only notice for completed swaps */}
                      {!selectedConversation.canReply && (
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg mb-4">
                          <Lock size={16} className="text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            This conversation is read-only because the swap has
                            been completed.
                          </span>
                        </div>
                      )}

                      {groupedMessages.map((group, groupIndex) => (
                        <div key={groupIndex}>
                          <div className="flex justify-center mb-4">
                            <span className="px-3 py-1 text-xs bg-muted rounded-full text-muted-foreground">
                              {group.date}
                            </span>
                          </div>
                          {group.messages.map((message) => {
                            const isOwn = message.senderId._id === user?._id;
                            return (
                              <div
                                key={message._id}
                                className={`flex mb-3 ${isOwn ? "justify-end" : "justify-start"}`}
                              >
                                <div
                                  className={`group relative max-w-[70%] ${
                                    isOwn ? "order-2" : ""
                                  }`}
                                >
                                  <div
                                    className={`px-4 py-2 rounded-2xl ${
                                      isOwn
                                        ? "bg-black text-white rounded-br-md"
                                        : "bg-muted rounded-bl-md"
                                    } ${message.isReported ? "opacity-60" : ""}`}
                                  >
                                    <p className="text-sm whitespace-pre-wrap break-words">
                                      {message.content}
                                    </p>
                                    <div
                                      className={`flex items-center gap-1 mt-1 ${
                                        isOwn ? "justify-end" : ""
                                      }`}
                                    >
                                      <span
                                        className={`text-xs ${
                                          isOwn
                                            ? "text-gray-300"
                                            : "text-muted-foreground"
                                        }`}
                                      >
                                        {formatTime(message.createdAt)}
                                      </span>
                                      {message.isReported && (
                                        <Flag
                                          size={10}
                                          className="text-red-400"
                                        />
                                      )}
                                    </div>
                                  </div>

                                  {/* Report button for received messages */}
                                  {!isOwn && !message.isReported && (
                                    <button
                                      onClick={() =>
                                        handleReportMessage(message)
                                      }
                                      className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                                      title="Report message"
                                    >
                                      <Flag
                                        size={14}
                                        className="text-muted-foreground"
                                      />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}

                      {/* Typing indicator */}
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="bg-muted px-4 py-2 rounded-2xl rounded-bl-md">
                            <div className="flex gap-1">
                              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                              <span
                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0.1s" }}
                              />
                              <span
                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
              </CardContent>

              {/* Message Input - Only show for active swaps */}
              {selectedConversation.canReply ? (
                <div className="p-4 border-t">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={handleInputChange}
                      placeholder="Type a message..."
                      disabled={isSending}
                      className="flex-1"
                      maxLength={2000}
                    />
                    <Button
                      type="submit"
                      disabled={!newMessage.trim() || isSending}
                    >
                      {isSending ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}
                    </Button>
                  </form>
                </div>
              ) : (
                <div className="p-4 border-t bg-muted/50">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Lock size={16} />
                    <span>
                      {selectedConversation.swapStatus === "pending"
                        ? "Messaging is available only after the swap is accepted"
                        : "Messaging is disabled for completed swaps"}
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            // No conversation selected
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <MessageCircle className="w-20 h-20 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">Your Messages</h3>
              <p className="text-muted-foreground max-w-md">
                Select a conversation from the sidebar to start chatting with
                your swap partners.
              </p>
            </div>
          )}
        </Card>

        {/* Mobile: Show selected conversation full screen */}
        {selectedConversation && (
          <div className="md:hidden fixed inset-0 z-50 bg-background">
            {/* Mobile implementation would go here - similar to desktop but full screen */}
          </div>
        )}
      </div>

      {/* Privacy Warning Dialog */}
      <Dialog open={privacyWarningOpen} onOpenChange={setPrivacyWarningOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <ShieldAlert size={24} />
              {PRIVACY_WARNING.title}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-amber-800 whitespace-pre-line">
                {PRIVACY_WARNING.message}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPrivacyWarningOpen(false);
                setPendingConversation(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAcknowledgePrivacy}>
              I Understand, Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Message Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={20} />
              Report Message
            </DialogTitle>
            <DialogDescription>
              Report this message if it violates our community guidelines.
            </DialogDescription>
          </DialogHeader>

          {reportingMessage && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Message content:</p>
                <p className="text-sm text-muted-foreground">
                  "{reportingMessage.content}"
                </p>
              </div>

              <div className="space-y-2">
                <Label>Reason for report *</Label>
                <Select value={reportReason} onValueChange={setReportReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_REASONS.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Additional details (optional)</Label>
                <Textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Provide any additional context..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReportDialogOpen(false);
                setReportingMessage(null);
                setReportReason("");
                setReportDetails("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={submitReport}
              disabled={!reportReason || isReporting}
            >
              {isReporting ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : (
                <Flag size={16} className="mr-2" />
              )}
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Swap Dialog */}
      <Dialog
        open={completeSwapDialogOpen}
        onOpenChange={setCompleteSwapDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle size={20} />
              Mark Swap as Complete?
            </DialogTitle>
            <DialogDescription>
              This will mark the skill swap as completed. Once completed, you
              won't be able to send new messages in this conversation.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Only mark as complete when both parties
                have successfully exchanged skills. This action cannot be
                undone.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCompleteSwapDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCompleteSwap}
              disabled={completingSwap}
              className="bg-green-600 hover:bg-green-700"
            >
              {completingSwap ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : (
                <CheckCircle size={16} className="mr-2" />
              )}
              Complete Swap
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
