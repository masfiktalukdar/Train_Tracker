export type ChartDataEntry = {
  date: string; // "Oct '25"
  registrationCount: number;
  month: string; // "Oct"
  showMonthLabel: boolean;
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
