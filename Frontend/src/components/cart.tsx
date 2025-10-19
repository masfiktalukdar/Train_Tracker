import type { cart } from "@/types/component";

export default function Cart({ headingText, mainNumber, cartIcon: Icon }: cart) {
	return (
		<div className="h-auto flex-1 rounded-[4px] flex flex-row items-center gap-4 bg-gradient-to-br from-primary-600 to-primary-700 backdrop-blur-lg border border-white/20 shadow-xl p-4 text-white">
			<div className="h-16 w-16 flex justify-center items-center rounded-full bg-primary-800">
				<Icon strokeWidth={2} className="h-7 w-7"/>
			</div>
			<div>
				<span className="text-xl font-medium tracking-wide text-primary-100">
					{headingText}
				</span>
				<h1 className="text-2xl font-bold mt-1 text-white">{mainNumber}</h1>
			</div>
		</div>
	);
}
