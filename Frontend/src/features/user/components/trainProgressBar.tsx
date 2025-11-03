import { useState, useEffect } from "react";
import { Train } from "lucide-react";

type TrainProgressBarProps = {
	info: {
		from: string;
		to: string;
		startTime: number;
		endTime: number;
	};
};

export default function TrainProgressBar({ info }: TrainProgressBarProps) {
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		const { startTime, endTime } = info;
		let animationFrameId: number;

		const updateProgress = () => {
			const now = Date.now();
			const totalDuration = endTime - startTime;
			const elapsed = now - startTime;

			let newProgress = 0;
			if (totalDuration > 0) {
				newProgress = (elapsed / totalDuration) * 100;
			} else if (elapsed >= 0) {
				newProgress = 100;
			}

			if (newProgress < 0) newProgress = 0;
			if (newProgress > 100) newProgress = 100;

			setProgress(newProgress);

			if (newProgress < 100) {
				animationFrameId = requestAnimationFrame(updateProgress);
			}
		};

		animationFrameId = requestAnimationFrame(updateProgress);
		return () => cancelAnimationFrame(animationFrameId);
	}, [info]);

	return (
		<div className="w-full">
			<div className="flex justify-between items-end mb-2">
				<div className="text-left">
					<span className="block text-sm text-gray-500">From</span>
					<span className="text-xl font-bold text-gray-800">{info.from}</span>
					<span className="block text-xs text-gray-500 font-mono">
						{new Date(info.startTime).toLocaleTimeString([], {
							hour: "2-digit",
							minute: "2-digit",
						})}
					</span>
				</div>

				<div className="text-right">
					<span className="block text-sm text-gray-500">To</span>
					<span className="text-xl font-bold text-primary-700">{info.to}</span>
					<span className="block text-xs text-primary-700 font-mono">
						~
						{new Date(info.endTime).toLocaleTimeString([], {
							hour: "2-digit",
							minute: "2-digit",
						})}
					</span>
				</div>
			</div>

			<div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
				<div
					className="absolute top-0 left-0 h-full bg-primary-600 rounded-full transition-all duration-500 ease-linear"
					style={{ width: `${progress}%` }}
				/>
				<div
					className="absolute top-1/2 -translate-y-1/2 transition-all duration-500 ease-linear"
					style={{ left: `calc(${progress}% - 12px)` }}
				>
					<Train className="h-6 w-6 text-white bg-primary-800 p-0.5 rounded-full shadow-md" />
				</div>
			</div>
		</div>
	);
}
