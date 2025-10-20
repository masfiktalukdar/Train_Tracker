export default function Footer() {
	return (
		<footer className="bg-primary-200 w-full py-4 flex justify-center items-center">
			<div className="max-w-screen-lg w-full px-6">
				<p className="text-base font-medium text-primary-950 text-center">
					&copy; {new Date().getFullYear()} TrainTracker. All rights reserved.
				</p>
			</div>
		</footer>
	);
}
