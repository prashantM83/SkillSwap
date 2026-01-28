import api from "../features/auth/axiosConfig";
import type { User } from "../types";

export interface UpdateUserData {
  name?: string;
  location?: string;
  profilePhoto?: string;
  skillsOffered?: string[];
  skillsWanted?: string[];
  availability?: string[];
  isPublic?: boolean;
}

// Get current user profile
export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get("/auth/me");
  return response.data;
};

// Get user by ID
export const getUserById = async (userId: string): Promise<User> => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

// Update user profile
export const updateUser = async (
  userId: string,
  userData: UpdateUserData,
): Promise<User> => {
  const response = await api.put(`/users/${userId}`, userData);
  return response.data;
};

// Search users
export const searchUsers = async (
  skill?: string,
  location?: string,
): Promise<User[]> => {
  const params = new URLSearchParams();
  if (skill) params.append("skill", skill);
  if (location) params.append("location", location);

  const response = await api.get(`/users/search?${params.toString()}`);
  return response.data;
};

// Get all users (with optional filters)
export const getAllUsers = async (
  skill?: string,
  location?: string,
): Promise<User[]> => {
  const params = new URLSearchParams();
  if (skill) params.append("skill", skill);
  if (location) params.append("location", location);

  const response = await api.get(`/users?${params.toString()}`);
  return response.data;
};

// Admin functions
export const banUser = async (userId: string): Promise<void> => {
  await api.post(`/users/${userId}/ban`);
};

export const unbanUser = async (userId: string): Promise<void> => {
  await api.post(`/users/${userId}/unban`);
};

export const deleteUser = async (userId: string): Promise<void> => {
  await api.delete(`/users/${userId}`);
};
