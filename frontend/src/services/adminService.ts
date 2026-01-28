import api from "../features/auth/axiosConfig";
import type { User, SwapRequest, Feedback } from "../types";

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  totalSwaps: number;
  pendingSwaps: number;
  completedSwaps: number;
  averageRating: number;
}

export interface AdminMessage {
  _id: string;
  title: string;
  content: string;
  type: "info" | "warning" | "update" | "maintenance";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMessageData {
  title: string;
  content: string;
  type: "info" | "warning" | "update" | "maintenance";
}

// Get admin statistics
export const getAdminStats = async (): Promise<AdminStats> => {
  const response = await api.get("/admin/stats");
  return response.data;
};

// Get all users (admin view)
export const getAllUsersAdmin = async (): Promise<User[]> => {
  const response = await api.get("/admin/users");
  return response.data;
};

// Get all swaps (admin view)
export const getAllSwapsAdmin = async (): Promise<SwapRequest[]> => {
  const response = await api.get("/admin/swaps");
  return response.data;
};

// Get all feedback (admin view)
export const getAllFeedbackAdmin = async (): Promise<Feedback[]> => {
  const response = await api.get("/admin/feedback");
  return response.data;
};

// Create admin message
export const createAdminMessage = async (
  data: CreateMessageData,
): Promise<AdminMessage> => {
  const response = await api.post("/admin/messages", data);
  return response.data;
};

// Get all admin messages
export const getAdminMessages = async (): Promise<AdminMessage[]> => {
  const response = await api.get("/admin/messages");
  return response.data;
};

// Update admin message
export const updateAdminMessage = async (
  messageId: string,
  data: Partial<CreateMessageData>,
): Promise<AdminMessage> => {
  const response = await api.put(`/admin/messages/${messageId}`, data);
  return response.data;
};

// Delete admin message
export const deleteAdminMessage = async (messageId: string): Promise<void> => {
  await api.delete(`/admin/messages/${messageId}`);
};

// Get reports
export const getReports = async (): Promise<unknown[]> => {
  const response = await api.get("/admin/reports");
  return response.data;
};
