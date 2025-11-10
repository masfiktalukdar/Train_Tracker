export type ChartDataEntry = {
  date: string; // "YYYY-MM-DD"
  registrationCount: number;
};

/**
 * Represents the complete stats object from the dashboard API.
 */
export type DashboardStats = {
  totalUsers: number;
  totalRoutes: number;
  totalStations: number;
  totalTrains: number;
  chartData: ChartDataEntry[];
};