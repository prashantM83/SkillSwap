import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useSocket } from "@/context/SocketContext";
import { ChatWindow } from "./ChatWindow";
import { ConversationsList } from "./ConversationsList";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, X } from "lucide-react";

interface ChatUser {
  _id: string;
  name: string;
  profilePhoto?: string;
}

// Custom event for opening chat programmatically
declare global {
  interface WindowEventMap {
    "open-chat": CustomEvent<ChatUser>;
  }
}

export const ChatManager: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeChats, setActiveChats] = useState<ChatUser[]>([]);
  const { user } = useSelector((state: RootState) => state.auth);
  const { isConnected, unreadMessageCount } = useSocket();

  // Listen for programmatic chat opening
  useEffect(() => {
    const handleOpenChat = (event: CustomEvent<ChatUser>) => {
      const chatUser = event.detail;
      if (chatUser && chatUser._id !== user?._id) {
        handleSelectConversation(chatUser);
        setIsOpen(true);
      }
    };

    window.addEventListener("open-chat", handleOpenChat);
    return () => {
      window.removeEventListener("open-chat", handleOpenChat);
    };
  }, [user?._id]);

  // Don't render if not logged in
  if (!user) return null;

  const handleSelectConversation = (chatUser: ChatUser) => {
    // Don't add duplicate chats
    if (!activeChats.find((c) => c._id === chatUser._id)) {
      setActiveChats((prev) => [...prev.slice(-1), chatUser]); // Keep max 2 chats open
    }
  };

  const handleCloseChat = (userId: string) => {
    setActiveChats((prev) => prev.filter((c) => c._id !== userId));
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg relative"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
          {!isOpen && unreadMessageCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
            </Badge>
          )}
          {!isConnected && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
          )}
        </Button>
      </div>

      {/* Conversations List */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50">
          <ConversationsList onSelectConversation={handleSelectConversation} />
        </div>
      )}

      {/* Active Chat Windows */}
      <div className="fixed bottom-6 right-28 z-50 flex gap-4">
        {activeChats.map((chatUser) => (
          <ChatWindow
            key={chatUser._id}
            otherUser={chatUser}
            onClose={() => handleCloseChat(chatUser._id)}
          />
        ))}
      </div>
    </>
  );
};

// Export a function to open chat programmatically
export const openChatWith = (user: ChatUser) => {
  window.dispatchEvent(new CustomEvent("open-chat", { detail: user }));
};
