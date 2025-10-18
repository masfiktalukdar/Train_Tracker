import Cart from "@/components/cart";
import { Activity, Database, UsersRound, TrainFront, Castle, TrainTrack } from "lucide-react";

export default function AdminDashboard(){
  const cartInfoRow1 = [
		{
			label: "Active users",
			content: 356,
      icon: Activity
		},
		{
			label: "Total users",
			content: 5654,
      icon: UsersRound
		},
		{
			label: "Database limit",
			content: "56%",
      icon: Database
		},
	];

  const cartInfoRow2 = [
		{
			label: "Total routes",
			content: 2,
			icon: TrainTrack,
		},
		{
			label: "Total stations",
			content: 26,
			icon: Castle,
		},
		{
			label: "Total trains",
			content: 10,
			icon: TrainFront,
		},
	];

  return (
		<div className="h-full w-full px-6 bg-primary-100 inset-y-0">
			<div className="row-container flex flex-col gap-5 pt-5">
				<div className="flex first-row justify-between">
					{cartInfoRow1.map((cart) => (
						<Cart
							headingText={cart.label}
							mainNumber={cart.content}
							cartIcon={cart.icon}
						/>
					))}
				</div>
				<div className="second-row flex justify-between">
					{cartInfoRow2.map((cart) => (
						<Cart
							headingText={cart.label}
							mainNumber={cart.content}
							cartIcon={cart.icon}
						/>
					))}
				</div>
			</div>
		</div>
	);
}