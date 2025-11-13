import { useState } from "react";
import { useInterfaceStore } from "@store/useInterfaceStore";
import { ArrowRight } from "lucide-react";

import onboardingImage1 from "@assets/onboarding_img_1.jpg";
import onboardingImage2 from "@assets/onboarding_img_2.jpg";
import onboardingImage3 from "@assets/onboarding_img_3.jpg"

const slides = [
	{
		image: onboardingImage1,
		title: "Welcome to Train Tracker",
		text: "Your guide to real-time train schedules and locations across Bangladesh.",
	},
	{
		image: onboardingImage2,
		title: "Live Train Status",
		text: "See exactly where your train is with live updates and predictive ETAs.",
	},
	{
		image: onboardingImage3,
		title: "Find Your Station",
		text: "Quickly find station details and see all arriving and departing trains.",
	},
];

export default function OnboardingPage() {
	const [currentSlide, setCurrentSlide] = useState(0);
	const setHasOnboarded = useInterfaceStore((state) => state.setHasOnboarded);

	const handleNext = () => {
		if (currentSlide < slides.length - 1) {
			setCurrentSlide(currentSlide + 1);
		} else {
			setHasOnboarded(true);
		}
	};

	const handleSkip = () => {
		setHasOnboarded(true);
	};

	const slide = slides[currentSlide];

	return (
		<div className="flex flex-col h-screen bg-white">
			{/* --- Image Section --- */}
			<div className="flex-1 relative">
				<img
					src={slide.image}
					alt={slide.title}
					className="w-full h-full object-cover"
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
				<button
					onClick={handleSkip}
					className="absolute top-6 right-6 px-4 py-2 bg-black/30 text-white rounded-full text-sm font-medium backdrop-blur-sm hover:bg-black/50 transition-colors"
				>
					Skip
				</button>
			</div>

			{/* --- Content Section --- */}
			<div className="flex-[0.8] bg-white rounded-t-3xl -mt-6 relative z-10 flex flex-col justify-between p-8 shadow-2xl">
				{/* Pagination Dots */}
				<div className="flex justify-center gap-2 mb-4">
					{slides.map((_, index) => (
						<div
							key={index}
							className={`h-2.5 w-2.5 rounded-full transition-all ${
								index === currentSlide ? "w-6 bg-primary-700" : "bg-gray-300"
							}`}
						/>
					))}
				</div>

				{/* Text Content */}
				<div className="text-center">
					<h1 className="text-3xl font-bold text-primary-900 mb-4">
						{slide.title}
					</h1>
					<p className="text-lg text-gray-600">{slide.text}</p>
				</div>

				{/* Next Button */}
				<button
					onClick={handleNext}
					className="w-full flex items-center justify-center gap-2 bg-primary-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-primary-800 transition-transform active:scale-95"
				>
					{currentSlide === slides.length - 1 ? "Get Started" : "Next"}
					<ArrowRight className="w-6 h-6" />
				</button>
			</div>
		</div>
	);
}
