// All the imports
import { Menu, LogOut } from "lucide-react";
import type { TopNavgiationProp } from "@app-types/navigation";

export default function TopNav({ onMenuToggle }: TopNavgiationProp) {
	return (
		<div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex items-center justify-between">
			<div className="flex items-center gap-4">
				<button
					onClick={onMenuToggle}
					className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
				>
					<Menu className="w-6 h-6 text-gray-600" />
					<h1 className="text-2xl font-bold text-gray-800">Dashboard App</h1>
				</button>
			</div>
			<div className="flex items-center gap-4">
				<div className="text-sm text-gray-600">Welcome, User</div>
				<button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
					<LogOut className="w-5 h-5 text-gray-600" />
				</button>
			</div>
		</div>
	);
}
