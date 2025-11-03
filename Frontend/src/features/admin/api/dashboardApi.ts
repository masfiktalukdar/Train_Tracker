import apiClient from "@/lib/apiClient";
import type { DashboardStats } from "@app-types/AdminDashboardTypes";

/**
 * Fetches all consolidated stats for the admin dashboard.
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const { data } = await apiClient.get("/admin/dashboard/stats");
  return data;
};
