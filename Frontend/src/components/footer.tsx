export default function Footer() {
	return (
		<footer className="bg-primary-200 w-full py-3 flex justify-center items-center mt-auto">
				<p className="text-base font-medium text-primary-950 text-center">
					&copy; {new Date().getFullYear()} TrainTracker. All rights reserved.
				</p>
		</footer>
	);
}
