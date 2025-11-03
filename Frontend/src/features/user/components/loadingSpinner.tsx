import { Loader2 } from "lucide-react";

type LoadingSpinnerProps = {
	text?: string;
	fullPage?: boolean;
};

export default function LoadingSpinner({
	text = "Loading...",
	fullPage = false,
}: LoadingSpinnerProps) {
	if (fullPage) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center p-10 min-h-[60vh]">
				<Loader2 className="h-12 w-12 animate-spin text-primary-700" />
				<span className="mt-4 text-lg font-medium text-gray-600">{text}</span>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center p-10">
			<Loader2 className="h-8 w-8 animate-spin text-primary-700" />
			<span className="mt-3 text-base font-medium text-gray-600">{text}</span>
		</div>
	);
}
