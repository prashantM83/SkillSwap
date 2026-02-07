import api from "../features/auth/axiosConfig";
import type { Session } from "../types";

export interface CreateSessionData {
  swapRequestId: string;
  guestUserId: string;
  title: string;
  description?: string;
  scheduledAt: string;
  duration?: number;
  timezone?: string;
  meetingLink?: string;
  meetingType?: "external" | "jitsi" | "in-person";
  location?: string;
  notes?: string;
}

export interface UpdateSessionData {
  title?: string;
  description?: string;
  scheduledAt?: string;
  duration?: number;
  timezone?: string;
  meetingLink?: string;
  meetingType?: "external" | "jitsi" | "in-person";
  location?: string;
  notes?: string;
  status?: "scheduled" | "in-progress" | "completed" | "cancelled";
}

export interface JitsiInfo {
  roomId: string;
  roomName: string;
  userName: string;
  isHost: boolean;
}

// Create a new session
export const createSession = async (
  sessionData: CreateSessionData
): Promise<Session> => {
  const response = await api.post("/sessions", sessionData);
  return response.data;
};

// Get all sessions for current user
export const getSessions = async (filters?: {
  status?: string;
  upcoming?: boolean;
  past?: boolean;
}): Promise<Session[]> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append("status", filters.status);
  if (filters?.upcoming) params.append("upcoming", "true");
  if (filters?.past) params.append("past", "true");

  const response = await api.get(`/sessions?${params.toString()}`);
  return response.data;
};

// Get sessions for a specific swap
export const getSwapSessions = async (swapId: string): Promise<Session[]> => {
  const response = await api.get(`/sessions/swap/${swapId}`);
  return response.data;
};

// Get a single session by ID
export const getSessionById = async (sessionId: string): Promise<Session> => {
  const response = await api.get(`/sessions/${sessionId}`);
  return response.data;
};

// Update a session
export const updateSession = async (
  sessionId: string,
  sessionData: UpdateSessionData
): Promise<Session> => {
  const response = await api.put(`/sessions/${sessionId}`, sessionData);
  return response.data;
};

// Cancel a session
export const cancelSession = async (
  sessionId: string,
  reason?: string
): Promise<{ message: string; session: Session }> => {
  const response = await api.put(`/sessions/${sessionId}/cancel`, { reason });
  return response.data;
};

// Mark session as completed
export const completeSession = async (
  sessionId: string,
  notes?: string
): Promise<{ message: string; session: Session }> => {
  const response = await api.put(`/sessions/${sessionId}/complete`, { notes });
  return response.data;
};

// Get Jitsi meeting info
export const getJitsiInfo = async (sessionId: string): Promise<JitsiInfo> => {
  const response = await api.get(`/sessions/jitsi/${sessionId}`);
  return response.data;
};

// Get user's timezone
export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

// Get common timezone options
export const getTimezoneOptions = (): { value: string; label: string }[] => {
  const timezones = [
    { value: "America/New_York", label: "Eastern Time (ET)" },
    { value: "America/Chicago", label: "Central Time (CT)" },
    { value: "America/Denver", label: "Mountain Time (MT)" },
    { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
    { value: "America/Anchorage", label: "Alaska Time (AKT)" },
    { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
    { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
    { value: "Europe/Paris", label: "Central European Time (CET)" },
    { value: "Europe/Moscow", label: "Moscow Time (MSK)" },
    { value: "Asia/Dubai", label: "Gulf Standard Time (GST)" },
    { value: "Asia/Kolkata", label: "India Standard Time (IST)" },
    { value: "Asia/Singapore", label: "Singapore Time (SGT)" },
    { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
    { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
    { value: "Pacific/Auckland", label: "New Zealand Time (NZT)" },
    { value: "UTC", label: "UTC" },
  ];

  // Add user's local timezone if not in list
  const userTimezone = getUserTimezone();
  if (!timezones.find((tz) => tz.value === userTimezone)) {
    timezones.unshift({ value: userTimezone, label: `Local (${userTimezone})` });
  }

  return timezones;
};

// Format date for display in user's local timezone
export const formatSessionDate = (
  dateString: string,
  options?: Intl.DateTimeFormatOptions
): string => {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    ...options,
  });
};

// Check if session is happening soon (within 15 minutes)
export const isSessionSoon = (scheduledAt: string): boolean => {
  const sessionTime = new Date(scheduledAt).getTime();
  const now = Date.now();
  const fifteenMinutes = 15 * 60 * 1000;
  return sessionTime - now <= fifteenMinutes && sessionTime > now;
};

// Check if session can be joined (within 5 minutes before or during)
export const canJoinSession = (
  scheduledAt: string,
  duration: number
): boolean => {
  const sessionStart = new Date(scheduledAt).getTime();
  const sessionEnd = sessionStart + duration * 60 * 1000;
  const now = Date.now();
  const fiveMinutesBefore = sessionStart - 5 * 60 * 1000;

  return now >= fiveMinutesBefore && now <= sessionEnd;
};
