import apiClient from "@/lib/apiClient";

export type FeedbackReason = "bug" | "feature" | "general" | "other";

export type ContactFormPayload = {
  userId?: string; // Optional, if user is logged in
  name: string;
  email: string;
  reason: FeedbackReason;
  message: string;
};

export const submitFeedback = async (payload: ContactFormPayload): Promise<{ message: string }> => {
  const { data } = await apiClient.post("/public/feedback", payload);
  return data;
};