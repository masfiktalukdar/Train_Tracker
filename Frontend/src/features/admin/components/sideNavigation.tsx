// All the imports
import {LayoutDashboard, TrainFront, Castle, TrainTrack} from "lucide-react";
import BRLogo from "@assets/bangaldesh-railway-logo.png"
import {NavLink} from "react-router-dom";

import type { SideNavigationProps } from "@app-types/navigation";


export default function SideNavigation({isOpen, onClose}: SideNavigationProps){
  const navItems = [
      {path: "/admin/dashboard", label: "dashboard", icon: LayoutDashboard},
      {path: "/admin/routes", label: "routes", icon: TrainTrack},
      {path: "/admin/stations", label: "stations", icon: Castle},
      {path: "/admin/trains", label: "trains", icon: TrainFront},
    ];

  return (
		<>
			{isOpen && (
				<div
					className="lg:hidden fixed inset-0 bg-black opacity-50 z-20"
					onClick={onClose}
				></div>
			)}

			<div className={`lg:static fixed inset-y-0 left-0 z-30 bg-primary-950 text-primary-100 transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-0 lg:translate-x-0"}`}>
        <div className="p-6">
          <div className="flex items-center justify-center">
            <img className="h-20 mb-1" src={BRLogo} alt="Train-logo"/>
          </div>
          <h2 className="text-lg font-bold mb-8 text-center">Bangaldesh Railway</h2>
          <nav className="space-y-2">
            {navItems.map(item => {
              const Icon = item.icon;
              return(
                <>
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({isActive}) => `${isActive ? "bg-primary-700 text-white font-medium": "text-primary-200 hover:bg-primary-800 hover:text-primary-100 "} flex items-center gap-3 px-4 py-2 rounded-md cursor-pointer transition-colors`}
                >
                  <Icon className="h-5 w-5"/>
                  <span className="capitalize">{item.label}</span>
                </NavLink>
                </>
              )
            })}
          </nav>
        </div>
      </div>
		</>
	);
}