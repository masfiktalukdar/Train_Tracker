import Cart from "@/components/cart";
import {
	Activity,
	Database,
	UsersRound,
	TrainFront,
	Castle,
	TrainTrack,
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
import { chartData } from "@/utils/dashboardChartData";
import type {ChartData} from "@app-types/AdminDashboardTypes"

export default function AdminDashboard() {
	const cartInfoRow1 = [
		{
			label: "Active users",
			content: 356,
			icon: Activity,
		},
		{
			label: "Total users",
			content: 5654,
			icon: UsersRound,
		},
		{
			label: "Database limit",
			content: "56%",
			icon: Database,
		},
	];

	const cartInfoRow2 = [
		{
			label: "Total routes",
			content: 2,
			icon: TrainTrack,
		},
		{
			label: "Total stations",
			content: 26,
			icon: Castle,
		},
		{
			label: "Total trains",
			content: 10,
			icon: TrainFront,
		},
	];

	// const organizedChartData = chartData.flatMap((monthBlock) => monthBlock.data);

  const flattenedChartData = chartData.flatMap((monthBlock) =>
		monthBlock.data.map((d) => ({
			...d,
			month: monthBlock.month,
		}))
	);

  const formattedChartData : ChartData = [];
	const seenMonths = new Set();

  

	flattenedChartData.forEach((entry) => {
		const month = entry.date.slice(5, 7); // "09", "10", etc.
		if (!seenMonths.has(month)) {
			seenMonths.add(month);
			formattedChartData.push({ ...entry, showMonthLabel: true });
		} else {
			formattedChartData.push({ ...entry, showMonthLabel: false });
		}
	});


  console.log(formattedChartData)

	return (
		<div className="min-h-screen w-full px-6 bg-primary-100 inset-y-0">
			<div className="row-container flex flex-col gap-5 pt-5">
				<div className="flex first-row justify-between gap-4">
					{cartInfoRow1.map((cart) => (
						<Cart
							headingText={cart.label}
							mainNumber={cart.content}
							cartIcon={cart.icon}
						/>
					))}
				</div>
				<div className="second-row flex gap-4 justify-between">
					{cartInfoRow2.map((cart) => (
						<Cart
							headingText={cart.label}
							mainNumber={cart.content}
							cartIcon={cart.icon}
						/>
					))}
				</div>
			</div>

			<div className="chart-container mt-8">
				<span className="font-semibold text-2xl text-primary-900">User regestration trend</span>
				<ResponsiveContainer width="100%" height={400}>
					<LineChart data={formattedChartData} margin={{ top: 20, bottom: 20 }}>
						<CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            />
						<XAxis
							dataKey="date"
							tickFormatter={(_, index) => {
								const entry = formattedChartData[index];
								return entry?.showMonthLabel ? entry.month : "";
							}}
							interval={0}
							tick={{ fontSize: 16, fill: "#064f86", dy: 8, dx: 25 }}
							tickLine={false}
							axisLine={{ stroke: "#064f86" }}
						/>
						<YAxis
							width="auto"
							tick={{ fontSize: 16, fill: "#064f86", dy: 8 }}
							tickLine={false}
							axisLine={{ stroke: "#064f86" }}
						/>
						<Tooltip 
              formatter={(value)=> [`${value} users`, "Regestration"]}
            />
						{/* <Legend /> */}
						<Line
							dataKey="registrationCount"
							stroke="#064f86"
							strokeWidth={2}
							dot={false}
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}
