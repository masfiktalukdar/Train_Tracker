// All the imports
import {LayoutDashboard, TrainFront, Castle} from "lucide-react";
import {NavLink} from "react-router-dom";

import type { SideNavigationProps } from "../types/navigation";



export default function SideNavigation({isOpen, onClose}: SideNavigationProps){
  const navItems = [
      {path: "/dashboard", label: "dashboard", icon: LayoutDashboard},
      {path: "/trains", label: "trains", icon: TrainFront},
      {path: "/stations", label: "stations", icon: Castle}
    ];

  return (
		<>
			{isOpen && (
				<div
					className="lg:hidden fixed inset-0 bg-black opacity-50 z-20"
					onClick={onclose}
				></div>
			)}

			<div className={`lg:static fixed inset-y-0 left-0 z-30 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-0 lg:translate-x-0"}`}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-8 ">Navigations</h2>
          <nav className="space-y-2">
            {navItems.map(item => {
              const Icon = item.icon;
              return(
                <>
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({isActive}) => `${isActive ? "bg-blue-600 text-white": "text-gray-300 hover:bg-gray-800 hover:text-white "} flex items-center gap-3 px-4 py-3 rounded-md transition-colors`}
                >
                </NavLink>
                <Icon className="h-5 w-5" fill="white"/>
                <label>{item.label}</label>
                </>
              )
            })}
          </nav>
        </div>
      </div>
		</>
	);
}

