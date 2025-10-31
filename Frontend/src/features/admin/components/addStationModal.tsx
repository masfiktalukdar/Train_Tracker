import {
	useAdminStationModalToogle,
	useAdminStationData,
  // useStationModalData
} from "@/store/adminStationStore";
import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";

type operationName = {
  operation: "add" | "update",
  editIndex: number | null
}

export default function AdminStationModal({operation, editIndex}: operationName) {
	const { closeModal } = useAdminStationModalToogle();
	const { stationList, setStationData, updateStationData } = useAdminStationData();
  console.log(stationList)

	const [stationName, setStationName] = useState("");
	const [stationLocation, setStationLocation] = useState("");
	const [stationLocationURL, setStationLocationURL] = useState("");
	const [error, setError] = useState<string>();

  console.log(stationList)

  // previous data before editing the cart
  const previousData = (editIndex !== null && typeof(editIndex) === "number") ? stationList?.[editIndex] : undefined;

    const same =
			previousData &&
			previousData.stationName === stationName &&
			previousData.stationLocation === stationLocation &&
			previousData.stationLocationURL === stationLocationURL;

  useEffect(()=>{
    // When opened in "update" mode
    if(operation === "update" && previousData){
      setStationName(previousData.stationName ?? "");
      setStationLocation(previousData.stationLocation ?? "");
      setStationLocationURL(previousData.stationLocationURL ?? "");
      setError(undefined)
    }

    // Clearing all the fields when switching to "add" mode
    if(operation === "add"){
      setStationName("");
      setStationLocation("");
			setStationLocationURL("");
			setError(undefined);
    }
  },[operation, previousData, editIndex])

  const updateHandler = function(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if(editIndex === null || typeof(editIndex) !== "number"){
      setError("No station selected to update.");
      return;
    }

    if (!stationName || !stationLocation || !stationLocationURL) {
			setError("! All the fields are requred");
			return;
		}

    const previous = stationList[editIndex];
		if (!previous) {
			setError("Station not found.");
			return;
		}

    const updatedData = {
			stationId: previous.stationId,
			stationName,
			stationLocation,
			stationLocationURL,
		};

    updateStationData(editIndex, updatedData);
    setError(undefined);
    closeModal();
  }

	const submitHandler = function (e: React.MouseEvent<HTMLButtonElement>) {
		e.preventDefault();
		if (!stationName || !stationLocation || !stationLocationURL) {
			setError("All the fields are requred");
			return;
		}

		setStationData({
			stationId: uuid(),
			stationName,
			stationLocation,
			stationLocationURL,
		});

		setError(undefined);
		closeModal();
	};


	return (
		<div
			onClick={closeModal}
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
		>
			<div
				onClick={(e) => e.stopPropagation()}
				className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6"
			>
				{/* Close Button */}
				<button
					onClick={closeModal}
					className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl font-bold"
				>
					&times;
				</button>

				{/* Modal Title */}
				<h2 className="text-2xl font-semibold text-primary-800 mb-4 font-mono">
					{operation === "add" ? "Add New Station" : "Update Station"}
				</h2>

				{/* Form Fields */}
				<form className="flex flex-col gap-4">
					<label className="flex flex-col font-mono text-sm text-gray-700">
						Station Name
						<input
							type="text"
							placeholder="Enter station name"
							className="mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
							onChange={(e) => setStationName(e.target.value)}
							value={stationName}
						/>
					</label>

					<label className="flex flex-col font-mono text-sm text-gray-700">
						Station Location
						<input
							type="text"
							placeholder="Enter location"
							className="mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
							onChange={(e) => setStationLocation(e.target.value)}
							value={stationLocation}
						/>
					</label>

					<label className="flex flex-col font-mono text-sm text-gray-700">
						Map URL
						<input
							type="url"
							placeholder="Paste map URL"
							className="mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
							onChange={(e) => setStationLocationURL(e.target.value)}
							value={stationLocationURL}
						/>
					</label>

					{/* Error Message */}
					{error && <pre className=" text-red-500">! {error}</pre>}

					{/* Submit Button */}
					<button
						type="submit"
						className="mt-4 bg-primary-800 text-white py-2 px-4 rounded-md hover:bg-primary-700 font-mono disabled:opacity-70"
            disabled={same}
						onClick={operation === "add"? submitHandler : updateHandler}
					>
						{operation === "add" ? "Save Station" : "Update Station"}
					</button>
				</form>
			</div>
		</div>
	);
}
