import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "@/context/SocketContext";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  X,
  Loader2,
  Circle,
  MoreVertical,
  Flag,
  AlertTriangle,
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

interface ChatWindowProps {
  otherUser: {
    _id: string;
    name: string;
    profilePhoto?: string;
  };
  onClose: () => void;
}

const REPORT_REASONS = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "inappropriate_content", label: "Inappropriate Content" },
  { value: "scam", label: "Scam or Fraud" },
  { value: "offensive_language", label: "Offensive Language" },
  { value: "other", label: "Other" },
];

export const ChatWindow: React.FC<ChatWindowProps> = ({
  otherUser,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportingMessage, setReportingMessage] = useState<Message | null>(
    null,
  );
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [isReporting, setIsReporting] = useState(false);
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

  const isOnline = onlineUsers.includes(otherUser._id);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch message history
  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${API_URL}/messages/conversation/${otherUser._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setMessages(response.data.messages);
    } catch (error: unknown) {
      console.error("Failed to fetch messages:", error);
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        toast.error("You can only message users you have a swap request with");
        onClose();
      }
    } finally {
      setIsLoading(false);
    }
  }, [otherUser._id, token, API_URL, onClose]);

  // Join conversation on mount
  useEffect(() => {
    joinConversation(otherUser._id);
    fetchMessages();

    return () => {
      leaveConversation(otherUser._id);
    };
  }, [otherUser._id, joinConversation, leaveConversation, fetchMessages]);

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      // Only add message if it's for this conversation
      if (
        (message.senderId._id === otherUser._id &&
          message.receiverId._id === user?._id) ||
        (message.senderId._id === user?._id &&
          message.receiverId._id === otherUser._id)
      ) {
        setMessages((prev) => [...prev, message]);
      }
    };

    const handleUserTyping = ({ userId }: { userId: string }) => {
      if (userId === otherUser._id) {
        setIsTyping(true);
      }
    };

    const handleUserStoppedTyping = ({ userId }: { userId: string }) => {
      if (userId === otherUser._id) {
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
  }, [socket, otherUser._id, user?._id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    startTyping(otherUser._id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(otherUser._id);
    }, 1000);
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || isSending) return;

    try {
      setIsSending(true);
      stopTyping(otherUser._id);
      await sendMessage(otherUser._id, newMessage.trim());
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
      // Mark message as reported in UI
      setMessages((prev) =>
        prev.map((m) =>
          m._id === reportingMessage._id ? { ...m, isReported: true } : m,
        ),
      );
    } catch (error: unknown) {
      console.error("Failed to report message:", error);
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || "Failed to report message");
      }
    } finally {
      setIsReporting(false);
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

  return (
    <>
      <Card className="w-96 h-[500px] flex flex-col shadow-2xl">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar>
                  <AvatarImage src={otherUser.profilePhoto} />
                  <AvatarFallback>
                    {otherUser.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Circle
                  className={`absolute bottom-0 right-0 w-3 h-3 ${
                    isOnline
                      ? "text-green-500 fill-green-500"
                      : "text-gray-400 fill-gray-400"
                  }`}
                />
              </div>
              <div>
                <CardTitle className="text-base">{otherUser.name}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {isTyping ? "Typing..." : isOnline ? "Online" : "Offline"}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>No messages yet. Say hello! 👋</p>
              </div>
            ) : (
              <div className="space-y-4">
                {groupedMessages.map((group, groupIndex) => (
                  <div key={groupIndex}>
                    <div className="flex justify-center mb-4">
                      <span className="px-3 py-1 text-xs bg-muted rounded-full text-muted-foreground">
                        {group.date}
                      </span>
                    </div>
                    {group.messages.map((message) => {
                      const isOwnMessage = message.senderId._id === user?._id;
                      return (
                        <div
                          key={message._id}
                          className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-2 group`}
                        >
                          <div className="flex items-start gap-1">
                            {!isOwnMessage && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <MoreVertical size={14} />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem
                                    onClick={() => handleReportMessage(message)}
                                    disabled={message.isReported}
                                    className="text-red-600"
                                  >
                                    <Flag size={14} className="mr-2" />
                                    {message.isReported
                                      ? "Already Reported"
                                      : "Report Message"}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                            <div
                              className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                                isOwnMessage
                                  ? "bg-primary text-primary-foreground rounded-br-md"
                                  : "bg-muted rounded-bl-md"
                              } ${message.isReported ? "opacity-60" : ""}`}
                            >
                              {message.isReported && (
                                <div className="flex items-center gap-1 text-xs mb-1 text-yellow-600">
                                  <AlertTriangle size={12} />
                                  <span>Reported</span>
                                </div>
                              )}
                              <p className="text-sm">{message.content}</p>
                              <p
                                className={`text-[10px] mt-1 ${
                                  isOwnMessage
                                    ? "text-primary-foreground/70"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {formatTime(message.createdAt)}
                                {isOwnMessage && message.read && " ✓✓"}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-muted px-4 py-2 rounded-2xl rounded-bl-md">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>
        </CardContent>

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
              size="icon"
              disabled={!newMessage.trim() || isSending}
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </Button>
          </form>
        </div>
      </Card>

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="text-red-500" size={20} />
              Report Message
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Message Content</Label>
              <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                {reportingMessage?.content}
              </div>
            </div>
            <div>
              <Label htmlFor="reason">Reason for Report</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger className="mt-1">
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
            <div>
              <Label htmlFor="details">Additional Details (Optional)</Label>
              <Textarea
                id="details"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Provide any additional context..."
                className="mt-1"
                maxLength={500}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReportDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={submitReport}
              disabled={!reportReason || isReporting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isReporting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Flag size={16} className="mr-2" />
              )}
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
