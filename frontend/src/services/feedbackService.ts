import api from "../features/auth/axiosConfig";
import type { User } from "../types";

export interface Feedback {
  _id: string;
  swapId: string;
  fromUserId: string | User;
  toUserId: string | User;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeedbackData {
  swapId: string;
  toUserId: string;
  rating: number;
  comment: string;
}

// Get all feedback
export const getAllFeedback = async (): Promise<Feedback[]> => {
  const response = await api.get("/feedback");
  return response.data;
};

// Get feedback for a specific user
export const getUserFeedback = async (userId: string): Promise<Feedback[]> => {
  const response = await api.get(`/feedback/user/${userId}`);
  return response.data;
};

// Submit feedback
export const submitFeedback = async (
  data: CreateFeedbackData,
): Promise<Feedback> => {
  const response = await api.post("/feedback", data);
  return response.data;
};

// Delete feedback (admin only)
export const deleteFeedback = async (feedbackId: string): Promise<void> => {
  await api.delete(`/feedback/${feedbackId}`);
};
