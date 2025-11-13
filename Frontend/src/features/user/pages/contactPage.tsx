import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import {
	submitFeedback,
	type FeedbackReason,
	type ContactFormPayload,
} from "../api/contactApi";
import {
	Send,
	Loader2,
	CheckCircle,
	MessageSquare,
	Bug,
	Lightbulb,
	HelpCircle,
} from "lucide-react";

export default function ContactPage() {
	const user = useAuthStore((state) => state.user);
	const [name, setName] = useState("");
	const [email, setEmail] = useState(user?.email || "");
	const [reason, setReason] = useState<FeedbackReason>("general");
	const [message, setMessage] = useState("");
	const [isSuccess, setIsSuccess] = useState(false);

	const mutation = useMutation({
		mutationFn: submitFeedback,
		onSuccess: () => {
			setIsSuccess(true);
			setName("");
			if (!user?.email) setEmail("");
			setReason("general");
			setMessage("");
			setTimeout(() => setIsSuccess(false), 5000);
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const payload: ContactFormPayload = {
			userId: user?.id,
			name,
			email,
			reason,
			message,
		};
		mutation.mutate(payload);
	};

	const reasons: {
		value: FeedbackReason;
		label: string;
		icon: React.ElementType;
	}[] = [
		{ value: "general", label: "General Inquiry", icon: MessageSquare },
		{ value: "bug", label: "Report a Bug", icon: Bug },
		{ value: "feature", label: "Feature Request", icon: Lightbulb },
		{ value: "other", label: "Other", icon: HelpCircle },
	];

	return (
		<div className="flex flex-col min-h-[calc(100vh-128px)] md:min-h-[calc(100vh-64px)] bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md mx-auto w-full">
				<div className="text-center mb-10">
					<h1 className="text-3xl font-extrabold text-primary-900 sm:text-4xl">
						Get in Touch
					</h1>
					<p className="mt-4 text-lg text-gray-600">
						We'd love to hear from you. Send us a message and we'll respond as
						soon as possible.
					</p>
				</div>

				<div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-gray-100">
					{isSuccess ? (
						<div className="flex flex-col items-center justify-center py-10 text-center animate-fade-in">
							<div className="rounded-full bg-green-100 p-3 mb-4">
								<CheckCircle className="h-8 w-8 text-green-600" />
							</div>
							<h3 className="text-xl font-bold text-gray-900">Message Sent!</h3>
							<p className="text-gray-600 mt-2">
								Thank you for your feedback. We appreciate you reaching out.
							</p>
						</div>
					) : (
						<form className="space-y-6" onSubmit={handleSubmit}>
							{/* Name Input */}
							<div>
								<label
									htmlFor="name"
									className="block text-sm font-medium text-gray-700"
								>
									Name
								</label>
								<div className="mt-1">
									<input
										id="name"
										name="name"
										type="text"
										autoComplete="name"
										required
										value={name}
										onChange={(e) => setName(e.target.value)}
										className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
										placeholder="Your name"
									/>
								</div>
							</div>

							{/* Email Input */}
							<div>
								<label
									htmlFor="email"
									className="block text-sm font-medium text-gray-700"
								>
									Email address
								</label>
								<div className="mt-1">
									<input
										id="email"
										name="email"
										type="email"
										autoComplete="email"
										required
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
										placeholder="you@example.com"
									/>
								</div>
							</div>

							{/* Reason Dropdown (Custom-ish) */}
							<div>
								<label
									htmlFor="reason"
									className="block text-sm font-medium text-gray-700"
								>
									Reason for contact
								</label>
								<div className="mt-1 grid grid-cols-2 gap-3">
									{reasons.map((r) => {
										const Icon = r.icon;
										const isSelected = reason === r.value;
										return (
											<div
												key={r.value}
												onClick={() => setReason(r.value)}
												className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
													isSelected
														? "bg-primary-50 border-primary-500 ring-2 ring-primary-500 ring-opacity-50"
														: "border-gray-300 hover:border-primary-400 hover:bg-gray-50"
												}`}
											>
												<Icon
													className={`h-5 w-5 mr-2 ${
														isSelected ? "text-primary-700" : "text-gray-400"
													}`}
												/>
												<span
													className={`text-sm font-medium ${
														isSelected ? "text-primary-900" : "text-gray-900"
													}`}
												>
													{r.label}
												</span>
											</div>
										);
									})}
								</div>
							</div>

							{/* Message Input */}
							<div>
								<label
									htmlFor="message"
									className="block text-sm font-medium text-gray-700"
								>
									Message
								</label>
								<div className="mt-1">
									<textarea
										id="message"
										name="message"
										rows={4}
                    maxLength={70}
										required
										value={message}
										onChange={(e) => setMessage(e.target.value)}
										className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors resize-none"
										placeholder="How can we help you?"
									/>
								</div>
							</div>

							{/* Error Message */}
							{mutation.isError && (
								<div className="rounded-md bg-red-50 p-4">
									<div className="flex">
										<div className="ml-3">
											<h3 className="text-sm font-medium text-red-800">
												Oops! Something went wrong.
											</h3>
											<div className="mt-2 text-sm text-red-700">
												<p>{mutation.error.message}</p>
											</div>
										</div>
									</div>
								</div>
							)}

							{/* Submit Button */}
							<div>
								<button
									type="submit"
									disabled={mutation.isPending}
									className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-primary-700 hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70 transition-all"
								>
									{mutation.isPending ? (
										<>
											<Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
											Sending...
										</>
									) : (
										<>
											Send Message
											<Send className="ml-2 h-5 w-5" />
										</>
									)}
								</button>
							</div>
						</form>
					)}
				</div>
			</div>
		</div>
	);
}
