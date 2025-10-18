// All the imports
import { LogOut } from "lucide-react";
import { useLocation } from "react-router-dom";
import type { TopNavgiationProp } from "@app-types/navigation";
import { useEffect, useState } from "react";

export default function TopNav({ onMenuToggle }: TopNavgiationProp) {
  const [upperNavContent, setUpperNavContent] = useState("");
  const location = useLocation();

  useEffect(()=>{
    const pathSegment = location.pathname.split("/").pop();
    switch (pathSegment) {
      case "dashboard":
        setUpperNavContent("Admin Dashboard")
        break;
      case "trains":
        setUpperNavContent("All Trains")
        break
      case "stations":
        setUpperNavContent("All Stations")
        break
      case "routes":
        setUpperNavContent("Availbale Routes")
        break
      default:
        setUpperNavContent("Something went wrong")
        break;
    }
  },[location.pathname])



	return (
		<div className="bg-white shadow-sm border-b border-gray-200 px-6 py-3 flex items-center justify-between">
			<div className="flex items-center gap-4">
				<div className="text-lg text-gray-800 font-semibold">{upperNavContent}</div>
			</div>
			<div className="flex items-center gap-4">
				<div className="text-base text-gray-600 font-normal">Welcome, Admin</div>
				<button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
					<LogOut className="w-5 h-5 text-gray-600 hover:text-red-500" />
				</button>
			</div>
		</div>
	);
}
