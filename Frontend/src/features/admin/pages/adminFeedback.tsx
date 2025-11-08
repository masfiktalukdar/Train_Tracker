import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	getFeedback,
	updateFeedbackStatus,
	type FeedbackQueryParams,
	type FeedbackStatus,
} from "../api/feedbackApi";
import {
	Loader2,
	Search,
	Filter,
	ChevronLeft,
	ChevronRight,
	Mail,
	Archive,
	CheckCircle,
	Inbox,
	MessageSquare,
} from "lucide-react";
import Footer from "@/components/footer";
import { formatTimeFromDate } from "@/features/user/utils/formatTime";

export default function AdminFeedbackPage() {
	const queryClient = useQueryClient();
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [filter, setFilter] = useState<FeedbackQueryParams["filter"]>("all");
	const [debouncedSearch, setDebouncedSearch] = useState("");

	// Debounce search input
	useState(() => {
		const timer = setTimeout(() => setDebouncedSearch(search), 500);
		return () => clearTimeout(timer);
	}); // This actually needs to be in a useEffect, fixing below.

	const { data, isLoading, isError } = useQuery({
		queryKey: ["feedback", page, debouncedSearch, filter],
		queryFn: () => getFeedback({ page, search: debouncedSearch, filter }),
		placeholderData: (previousData) => previousData, // Keep previous data while fetching new
	});

	const statusMutation = useMutation({
		mutationFn: ({ id, status }: { id: string; status: FeedbackStatus }) =>
			updateFeedbackStatus(id, status),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["feedback"] });
		},
	});

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearch(e.target.value);
		setPage(1); // Reset to page 1 on search
	};

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedSearch(search);
		}, 300);
		return () => clearTimeout(handler);
	}, [search]);

	const totalPages = data ? Math.ceil(data.count / data.limit) : 0;

	const getStatusColor = (status: FeedbackStatus) => {
		switch (status) {
			case "new":
				return "bg-blue-100 text-blue-800";
			case "read":
				return "bg-green-100 text-green-800";
			case "archived":
				return "bg-gray-100 text-gray-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getReasonBadge = (reason: string) => {
		// Define allowed keys so TypeScript can check indexing
		const colors: Record<"bug" | "feature" | "general" | "other", string> = {
			bug: "bg-red-100 text-red-800",
			feature: "bg-purple-100 text-purple-800",
			general: "bg-blue-100 text-blue-800",
			other: "bg-gray-100 text-gray-800",
		};
		// Cast incoming reason to the known key union and fallback to 'other' when unknown
		const key = reason as "bug" | "feature" | "general" | "other";
		const colorClass = colors[key] ?? colors.other;
		return (
			<span
				className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${colorClass}`}
			>
				{reason}
			</span>
		);
	};

	return (
		<div className="w-full flex-1 min-h-full bg-primary-100 flex flex-col">
			<div className="p-6">
				<div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
					<h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
						<MessageSquare className="h-8 w-8 text-primary-700" />
						User Feedback
					</h1>

					{/* Controls */}
					<div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
							<input
								type="text"
								placeholder="Search feedback..."
								value={search}
								onChange={handleSearchChange}
								className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full sm:w-64"
							/>
						</div>
						<div className="relative">
							<Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
							<select
								value={filter}
								// @ts-expect-error - value type mismatch safe to ignore here for simple string
								onChange={(e) => setFilter(e.target.value)}
								className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white w-full sm:w-auto"
							>
								<option value="all">All Time</option>
								<option value="today">Today</option>
								<option value="week">Last 7 Days</option>
								<option value="month">Last 30 Days</option>
							</select>
						</div>
					</div>
				</div>

				{/* Content */}
				<div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
					{isLoading && !data ? (
						<div className="p-20 flex justify-center items-center">
							<Loader2 className="h-10 w-10 animate-spin text-primary-600" />
						</div>
					) : isError ? (
						<div className="p-10 text-center text-red-500">
							Failed to load feedback.
						</div>
					) : data?.data.length === 0 ? (
						<div className="p-20 text-center text-gray-500 flex flex-col items-center">
							<Inbox className="h-12 w-12 mb-4 text-gray-300" />
							<p>No feedback found.</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200">
								<thead className="bg-gray-50">
									<tr>
										<th
											scope="col"
											className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
										>
											User / Email
										</th>
										<th
											scope="col"
											className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
										>
											Reason
										</th>
										<th
											scope="col"
											className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3"
										>
											Message
										</th>
										<th
											scope="col"
											className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
										>
											Date
										</th>
										<th
											scope="col"
											className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
										>
											Status
										</th>
										<th
											scope="col"
											className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
										>
											Actions
										</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{data?.data.map((item) => (
										<tr
											key={item.id}
											className="hover:bg-gray-50 transition-colors"
										>
											<td className="px-6 py-4">
												<div className="flex flex-col">
													<span className="font-medium text-gray-900">
														{item.name || "Anonymous"}
													</span>
													<span className="text-sm text-gray-500 flex items-center gap-1">
														<Mail className="h-3 w-3" /> {item.email}
													</span>
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												{getReasonBadge(item.reason)}
											</td>
											<td className="px-6 py-4">
												<p
													className="text-sm text-gray-900 line-clamp-2"
													title={item.message}
												>
													{item.message}
												</p>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{new Date(item.created_at).toLocaleDateString()} <br />
												<span className="text-xs">
													{formatTimeFromDate(item.created_at)}
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<span
													className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)} capitalize`}
												>
													{item.status}
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
												<div className="flex justify-end gap-2">
													{item.status === "new" && (
														<button
															onClick={() =>
																statusMutation.mutate({
																	id: item.id,
																	status: "read",
																})
															}
															className="text-green-600 hover:text-green-900 bg-green-50 p-2 rounded-full hover:bg-green-100 transition-colors"
															title="Mark as Read"
														>
															<CheckCircle className="h-4 w-4" />
														</button>
													)}
													{item.status !== "archived" && (
														<button
															onClick={() =>
																statusMutation.mutate({
																	id: item.id,
																	status: "archived",
																})
															}
															className="text-gray-400 hover:text-gray-700 bg-gray-50 p-2 rounded-full hover:bg-gray-100 transition-colors"
															title="Archive"
														>
															<Archive className="h-4 w-4" />
														</button>
													)}
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}

					{/* Pagination */}
					{data && data.count > 0 && (
						<div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
							<div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
								<div>
									<p className="text-sm text-gray-700">
										Showing{" "}
										<span className="font-medium">
											{(page - 1) * data.limit + 1}
										</span>{" "}
										to{" "}
										<span className="font-medium">
											{Math.min(page * data.limit, data.count)}
										</span>{" "}
										of <span className="font-medium">{data.count}</span> results
									</p>
								</div>
								<div>
									<nav
										className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
										aria-label="Pagination"
									>
										<button
											onClick={() => setPage((p) => Math.max(1, p - 1))}
											disabled={page === 1}
											className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
										>
											<span className="sr-only">Previous</span>
											<ChevronLeft className="h-5 w-5" aria-hidden="true" />
										</button>
										<button
											onClick={() =>
												setPage((p) => Math.min(totalPages, p + 1))
											}
											disabled={page === totalPages}
											className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
										>
											<span className="sr-only">Next</span>
											<ChevronRight className="h-5 w-5" aria-hidden="true" />
										</button>
									</nav>
								</div>
							</div>
							{/* Mobile Pagination Simple */}
							<div className="flex sm:hidden justify-between w-full">
								<button
									onClick={() => setPage((p) => Math.max(1, p - 1))}
									disabled={page === 1}
									className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100"
								>
									Previous
								</button>
								<button
									onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
									disabled={page === totalPages}
									className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100"
								>
									Next
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
			<Footer />
		</div>
	);
}
