import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useSocket } from "@/context/SocketContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Circle, Loader2, RefreshCw } from "lucide-react";
import axios from "axios";

interface Conversation {
  conversationId: string;
  swapRequestId: string;
  swapStatus: string;
  skillOffered: string;
  skillWanted: string;
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

interface ConversationsListProps {
  onSelectConversation: (user: {
    _id: string;
    name: string;
    profilePhoto?: string;
  }) => void;
}

export const ConversationsList: React.FC<ConversationsListProps> = ({
  onSelectConversation,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useSelector((state: RootState) => state.auth);
  const { onlineUsers } = useSocket();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await axios.get(`${API_URL}/messages/conversations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setConversations(response.data);
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [token, API_URL]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "completed":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (isLoading) {
    return (
      <Card className="w-80">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-80 h-[500px] flex flex-col">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare size={20} />
          Messages
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Chat with your swap partners
        </p>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground p-4">
              <RefreshCw size={40} className="mb-2 opacity-50" />
              <p className="text-center text-sm">No conversations yet</p>
              <p className="text-center text-xs mt-1">
                Send a swap request to start chatting!
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {conversations.map((conversation) => {
                const isOnline = onlineUsers.includes(
                  conversation.otherUser._id,
                );
                return (
                  <button
                    key={conversation.conversationId}
                    onClick={() => onSelectConversation(conversation.otherUser)}
                    className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage
                            src={conversation.otherUser.profilePhoto}
                          />
                          <AvatarFallback>
                            {conversation.otherUser.name
                              .charAt(0)
                              .toUpperCase()}
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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium truncate">
                            {conversation.otherUser.name}
                          </span>
                          {conversation.lastMessage && (
                            <span className="text-xs text-muted-foreground">
                              {formatTime(conversation.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] px-1.5 py-0 ${getStatusColor(conversation.swapStatus)}`}
                          >
                            {conversation.swapStatus}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground truncate">
                            {conversation.lastMessage
                              ? conversation.lastMessage.content
                              : `${conversation.skillOffered} ↔ ${conversation.skillWanted}`}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <Badge
                              variant="default"
                              className="ml-2 h-5 min-w-5 flex items-center justify-center"
                            >
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
