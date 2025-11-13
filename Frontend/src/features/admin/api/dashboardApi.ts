import apiClient from "@/lib/apiClient";
import type { DashboardStats } from "@app-types/AdminDashboardTypes";

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const { data } = await apiClient.get("/admin/dashboard/stats");
  return data;
};
