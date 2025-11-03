import { WifiOff, ServerCrash } from "lucide-react";

type ErrorDisplayProps = {
	title?: string;
	message: string;
	onRetry?: () => void;
	fullPage?: boolean;
};

export default function ErrorDisplay({
	title = "Something went wrong",
	message,
	onRetry,
	fullPage = false,
}: ErrorDisplayProps) {
	const isOffline = message.includes("Network Error");
	const icon = isOffline ? (
		<WifiOff className="h-12 w-12 text-yellow-500" />
	) : (
		<ServerCrash className="h-12 w-12 text-red-500" />
	);

	const containerClasses = fullPage
		? "flex-1 flex flex-col items-center justify-center p-10 min-h-[60vh] text-center"
		: "flex flex-col items-center justify-center p-10 text-center";

	return (
		<div className={containerClasses}>
			<div className="p-4 bg-gray-100 rounded-full">{icon}</div>
			<h2 className="mt-4 text-2xl font-bold text-gray-800">
				{isOffline ? "No Internet Connection" : title}
			</h2>
			<p className="mt-2 text-base text-gray-600 max-w-md">
				{isOffline
					? "Please check your network connection and try again."
					: message}
			</p>
			{onRetry && (
				<button
					onClick={onRetry}
					className="mt-6 px-5 py-2.5 bg-primary-700 text-white font-semibold rounded-lg shadow-md hover:bg-primary-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
				>
					Try Again
				</button>
			)}
		</div>
	);
}
