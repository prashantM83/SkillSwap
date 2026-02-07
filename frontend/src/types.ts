export interface User {
  _id: string;
  name: string;
  email: string;
  location?: string;
  profilePhoto?: string;
  skillsOffered: string[];
  skillsWanted: string[];
  availability: string[];
  isPublic: boolean;
  rating: number;
  totalSwaps: number;
  joinDate: string;
  isAdmin: boolean;
  isBanned: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SwapRequest {
  _id: string;
  fromUserId: string | User; // Can be string or populated User object
  toUserId: string | User; // Can be string or populated User object
  skillOffered: string;
  skillWanted: string;
  message?: string;
  status: "pending" | "accepted" | "rejected" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface Feedback {
  _id: string;
  swapId: string;
  fromUserId: string | User; // Can be string or populated User object
  toUserId: string | User; // Can be string or populated User object
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminMessage {
  _id: string;
  title: string;
  content: string;
  type: "info" | "warning" | "update" | "maintenance";
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
}

export interface Session {
  _id: string;
  swapRequestId: string | SwapRequest;
  hostUserId: string | User;
  guestUserId: string | User;
  title: string;
  description?: string;
  scheduledAt: string;
  duration: number;
  timezone: string;
  meetingLink?: string;
  meetingType: "external" | "jitsi" | "in-person";
  jitsiRoomId?: string;
  location?: string;
  notes?: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled" | "no-show";
  cancelledBy?: string;
  cancelReason?: string;
  reminder24hSent: boolean;
  reminder1hSent: boolean;
  createdAt: string;
  updatedAt: string;
}
