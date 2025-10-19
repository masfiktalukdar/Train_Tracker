type chartData = {
  month: string;
	data: {
		date: string; // Format: YYYY-MM-DD
		registrationCount: number;
	}[];
}[];

export const chartData: chartData = [
	{
		month: "August",
		data: Array.from({ length: 30 }, (_, i) => ({
			date: `2025-08-${String(i + 1).padStart(2, "0")}`,
			registrationCount: Math.floor(Math.random() * 10) + 40, // 10–59
		})),
	},
	{
		month: "September",
		data: Array.from({ length: 30 }, (_, i) => ({
			date: `2025-09-${String(i + 1).padStart(2, "0")}`,
			registrationCount: Math.floor(Math.random() * 10) + 50,
		})),
	},
	{
		month: "October",
		data: Array.from({ length: 30 }, (_, i) => ({
			date: `2025-10-${String(i + 1).padStart(2, "0")}`,
			registrationCount: Math.floor(Math.random() * 10) + 60,
		})),
	},
	{
		month: "November",
		data: Array.from({ length: 30 }, (_, i) => ({
			date: `2025-11-${String(i + 1).padStart(2, "0")}`,
			registrationCount: Math.floor(Math.random() * 10) + 70,
		})),
	},
	{
		month: "December",
		data: Array.from({ length: 30 }, (_, i) => ({
			date: `2025-12-${String(i + 1).padStart(2, "0")}`,
			registrationCount: Math.floor(Math.random() * 10) + 80,
		})),
	},
	{
		month: "January",
		data: Array.from({ length: 30 }, (_, i) => ({
			date: `2026-01-${String(i + 1).padStart(2, "0")}`,
			registrationCount: Math.floor(Math.random() * 10) + 80,
		})),
	}
];

