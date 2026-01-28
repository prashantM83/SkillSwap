import api from "../auth/axiosConfig";

export const getAllSwaps = () => api.get("/swaps");
export const getSentSwaps = () => api.get("/swaps/sent");
export const getReceivedSwaps = () => api.get("/swaps/received");
export const getSwapById = (id: string) => api.get(`/swaps/${id}`);
export const createSwap = (data: {
  fromUserId: string;
  toUserId: string;
  skillOffered: string;
  skillWanted: string;
  message?: string;
}) => api.post("/swaps", data);
export const updateSwapStatus = (id: string, status: string) =>
  api.put(`/swaps/${id}`, { status });
export const deleteSwap = (id: string) => api.delete(`/swaps/${id}`);
