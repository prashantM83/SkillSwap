const jwt = require("jsonwebtoken");
const Message = require("../models/Message");
const Notification = require("../models/Notification");
const SwapRequest = require("../models/SwapRequest");
const User = require("../models/User");

// Store online users: { odegreeId: socketId }
const onlineUsers = new Map();

const initializeSocket = (io) => {
  // Authentication middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return next(new Error("User not found"));
      }

      if (user.isBanned) {
        return next(new Error("User is banned"));
      }

      socket.userId = decoded.id;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`✅ User connected: ${socket.user.name} (${socket.userId})`);

    // Add user to online users
    onlineUsers.set(socket.userId, socket.id);

    // Broadcast online status to all connected users
    io.emit("user_online", {
      userId: socket.userId,
      name: socket.user.name,
    });

    // Send current online users to the newly connected user
    socket.emit("online_users", Array.from(onlineUsers.keys()));

    // Handle joining a conversation room
    socket.on("join_conversation", async (otherUserId) => {
      try {
        // Verify swap request exists between users (allow completed for read-only access)
        const hasSwap = await verifySwapConnection(socket.userId, otherUserId, true);
        if (!hasSwap) {
          socket.emit("error", { message: "No swap request exists with this user" });
          return;
        }

        const conversationId = Message.getConversationId(socket.userId, otherUserId);
        socket.join(conversationId);
        console.log(`📝 ${socket.user.name} joined conversation: ${conversationId}`);

        // Mark messages as read when joining conversation
        await Message.updateMany(
          {
            conversationId,
            receiverId: socket.userId,
            read: false,
          },
          { read: true }
        );
      } catch (error) {
        console.error("Error joining conversation:", error);
        socket.emit("error", { message: "Failed to join conversation" });
      }
    });

    // Handle leaving a conversation room
    socket.on("leave_conversation", (otherUserId) => {
      const conversationId = Message.getConversationId(socket.userId, otherUserId);
      socket.leave(conversationId);
    });

    // Handle sending a message
    socket.on("send_message", async (data, callback) => {
      try {
        const { receiverId, content } = data;

        if (!receiverId || !content) {
          return callback({ error: "Receiver and content are required" });
        }

        if (content.length > 2000) {
          return callback({ error: "Message too long (max 2000 characters)" });
        }

        // Verify swap request exists between users (only accepted can send messages)
        const swapRequest = await verifySwapConnection(socket.userId, receiverId, false);
        if (!swapRequest) {
          return callback({ error: "You can only message users with an accepted swap request" });
        }

        const conversationId = Message.getConversationId(socket.userId, receiverId);

        // Save message to database
        const message = await Message.create({
          conversationId,
          swapRequestId: swapRequest._id,
          senderId: socket.userId,
          receiverId,
          content: content.trim(),
        });

        // Populate sender info
        const populatedMessage = await Message.findById(message._id)
          .populate("senderId", "name profilePhoto")
          .populate("receiverId", "name profilePhoto");

        // Send message to the conversation room (both users if in room)
        io.to(conversationId).emit("new_message", populatedMessage);

        // If receiver is online but not in the conversation, send notification
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          const receiverSocket = io.sockets.sockets.get(receiverSocketId);
          if (receiverSocket && !receiverSocket.rooms.has(conversationId)) {
            // Create notification
            const notification = await Notification.create({
              userId: receiverId,
              type: "new_message",
              title: "New Message",
              message: `${socket.user.name} sent you a message`,
              data: {
                senderId: socket.userId,
                senderName: socket.user.name,
                messagePreview: content.substring(0, 50),
              },
            });

            io.to(receiverSocketId).emit("notification", notification);
          }
        } else {
          // User is offline, create notification for later
          await Notification.create({
            userId: receiverId,
            type: "new_message",
            title: "New Message",
            message: `${socket.user.name} sent you a message`,
            data: {
              senderId: socket.userId,
              senderName: socket.user.name,
              messagePreview: content.substring(0, 50),
            },
          });
        }

        callback({ success: true, message: populatedMessage });
      } catch (error) {
        console.error("Error sending message:", error);
        callback({ error: "Failed to send message" });
      }
    });

    // Handle typing indicator
    socket.on("typing_start", (otherUserId) => {
      const conversationId = Message.getConversationId(socket.userId, otherUserId);
      socket.to(conversationId).emit("user_typing", {
        userId: socket.userId,
        name: socket.user.name,
      });
    });

    socket.on("typing_stop", (otherUserId) => {
      const conversationId = Message.getConversationId(socket.userId, otherUserId);
      socket.to(conversationId).emit("user_stopped_typing", {
        userId: socket.userId,
      });
    });

    // Handle marking messages as read
    socket.on("mark_messages_read", async (otherUserId) => {
      const conversationId = Message.getConversationId(socket.userId, otherUserId);
      await Message.updateMany(
        {
          conversationId,
          receiverId: socket.userId,
          read: false,
        },
        { read: true }
      );

      // Notify the sender that their messages were read
      const otherSocketId = onlineUsers.get(otherUserId);
      if (otherSocketId) {
        io.to(otherSocketId).emit("messages_read", {
          conversationId,
          readBy: socket.userId,
        });
      }
    });

    // Handle marking notification as read
    socket.on("mark_notification_read", async (notificationId) => {
      await Notification.findByIdAndUpdate(notificationId, { read: true });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${socket.user.name}`);
      onlineUsers.delete(socket.userId);

      io.emit("user_offline", {
        userId: socket.userId,
      });
    });
  });

  return { onlineUsers };
};

// Verify that a swap request exists between two users (only accepted can send messages)
async function verifySwapConnection(userId1, userId2, allowCompleted = false) {
  const statuses = allowCompleted 
    ? ["pending", "accepted", "completed"] 
    : ["accepted"]; // Only accepted swaps can exchange messages
  
  const swapRequest = await SwapRequest.findOne({
    $or: [
      { fromUserId: userId1, toUserId: userId2 },
      { fromUserId: userId2, toUserId: userId1 },
    ],
    status: { $in: statuses },
  });
  return swapRequest;
}

// Helper function to send notification to a user
const sendNotificationToUser = async (io, userId, notification) => {
  const savedNotification = await Notification.create({
    userId,
    ...notification,
  });

  const socketId = onlineUsers.get(userId.toString());
  if (socketId) {
    io.to(socketId).emit("notification", savedNotification);
  }

  return savedNotification;
};

// Helper function to broadcast to all users
const broadcastToAll = (io, event, data) => {
  io.emit(event, data);
};

// Get online users
const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};

module.exports = {
  initializeSocket,
  sendNotificationToUser,
  broadcastToAll,
  getOnlineUsers,
  onlineUsers,
};
