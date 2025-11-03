import { useQuery } from "@tanstack/react-query";
import Cart from "@/components/cart";
import {
	Activity,
	Database,
	UsersRound,
	TrainFront,
	Castle,
	TrainTrack,
	Loader2,
	AlertCircle,
} from "lucide-react";
import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import type { ChartDataEntry } from "@app-types/AdminDashboardTypes";
import { getDashboardStats } from "@/features/admin/api/dashboardApi";
import Footer from "@/components/footer";

// Helper to format chart labels
const formatChartData = (data: ChartDataEntry[]): ChartDataEntry[] => {
	const seenMonths = new Set();
	return data.map((entry) => {
		const month = entry.month;
		if (!seenMonths.has(month)) {
			seenMonths.add(month);
			return { ...entry, showMonthLabel: true };
		}
		return { ...entry, showMonthLabel: false };
	});
};

export default function AdminDashboard() {
	const {
		data: stats,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ["dashboardStats"],
		queryFn: getDashboardStats,
	});

	const cartInfoRow1 = [
		{
			label: "Active Users",
			content: "N/A",
			icon: Activity,
		},
		{
			label: "Total Users",
			content: isLoading ? "..." : (stats?.totalUsers ?? 0),
			icon: UsersRound,
		},
		{
			label: "Database Limit",
			content: "N/A",
			icon: Database,
		},
	];

	const cartInfoRow2 = [
		{
			label: "Total Routes",
			content: isLoading ? "..." : (stats?.totalRoutes ?? 0),
			icon: TrainTrack,
		},
		{
			label: "Total Stations",
			content: isLoading ? "..." : (stats?.totalStations ?? 0),
			icon: Castle,
		},
		{
			label: "Total Trains",
			content: isLoading ? "..." : (stats?.totalTrains ?? 0),
			icon: TrainFront,
		},
	];

	const formattedChartData = stats ? formatChartData(stats.chartData) : [];

	return (
		<div className="w-full flex-1 min-h-full bg-primary-100 flex flex-col">
			{/* Top Carts */}
			<div className="row-container flex flex-col gap-5 mt-5 px-6">
				{/* Responsive grid: 1 column on mobile, 3 on desktop */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{cartInfoRow1.map((cart, index) => (
						<Cart
							key={index}
							headingText={cart.label}
							mainNumber={cart.content}
							cartIcon={cart.icon}
						/>
					))}
				</div>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{cartInfoRow2.map((cart, index) => (
						<Cart
							key={index}
							headingText={cart.label}
							mainNumber={cart.content}
							cartIcon={cart.icon}
						/>
					))}
				</div>
			</div>

			{/* Chart Area */}
			<div className="chart-container mt-8 mb-10 px-6">
				<span className="font-semibold text-2xl text-primary-900">
					User Registration Trend (Last 6 Months)
				</span>
				<ResponsiveContainer width="100%" height={400}>
					{isLoading ? (
						<div className="flex items-center justify-center h-full">
							<Loader2 className="w-8 h-8 text-primary-700 animate-spin" />
							<span className="ml-4 text-lg text-primary-900">
								Loading chart data...
							</span>
						</div>
					) : isError ? (
						<div className="flex items-center justify-center h-full text-red-600">
							<AlertCircle className="w-8 h-8 mr-4" />
							<span className="text-lg">Could not load chart data.</span>
						</div>
					) : (
						<LineChart
							data={formattedChartData}
							margin={{ top: 30, right: 30, left: 10, bottom: 5 }}
						>
							<CartesianGrid strokeDasharray="3 3" vertical={false} />
							<XAxis
								dataKey="date"
								tickFormatter={(_, index) => {
									const entry = formattedChartData[index];
									// Show month label only for the first entry of that month
									return entry?.showMonthLabel ? entry.month : "";
								}}
								interval={0}
								tick={{
									fontSize: 14, // Responsive font size
									fill: "#064f86",
								}}
								tickLine={false}
								axisLine={{ stroke: "#064f86" }}
							/>
							<YAxis
								width={50}
								tick={{ fontSize: 12, fill: "#064f86" }}
								tickLine={false}
								axisLine={{ stroke: "#064f86", strokeWidth: 1 }}
								allowDecimals={false}
							/>
							<Tooltip
								formatter={(value, name) => [`${value} users`, `${name}`]}
							/>
							<Line
								dataKey="registrationCount"
								name="Registrations" // Add name for tooltip
								stroke="#064f86"
								strokeWidth={1.5}
								dot={false}
								activeDot={{ r: 4, strokeWidth: 1 }}
							/>
						</LineChart>
					)}
				</ResponsiveContainer>
			</div>
			{/* Footer Section */}
			<Footer />
		</div>
	);
}
