import apiClient from "@/lib/apiClient";

export type FeedbackStatus = 'new' | 'read' | 'archived';
export type FeedbackReason = 'bug' | 'feature' | 'general' | 'other';

export type FeedbackItem = {
  id: string;
  user_id: string | null;
  name: string | null;
  email: string;
  reason: FeedbackReason;
  message: string;
  status: FeedbackStatus;
  created_at: string;
};

export type FeedbackResponse = {
  data: FeedbackItem[];
  count: number;
  page: number;
  limit: number;
};

export type FeedbackQueryParams = {
  page?: number;
  limit?: number; // Added limit
  search?: string;
  filter?: 'all' | 'today' | 'week' | 'month';
};

export const getFeedback = async (params: FeedbackQueryParams): Promise<FeedbackResponse> => {
  const { data } = await apiClient.get("/admin/feedback", { params });
  return data;
};

export const updateFeedbackStatus = async (id: string, status: FeedbackStatus): Promise<void> => {
  await apiClient.patch(`/admin/feedback/${id}/status`, { status });
};