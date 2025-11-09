import "@styles/blinkingButtonStyle.css";

interface PrimaryButtonProps {
	children: React.ReactNode;
	onClick: () => void;
}

interface BlinkingButtonProp {
	onClick: () => void;
}

export const ButtonPrimary = function ({
	children,
	onClick,
}: PrimaryButtonProps) {
	return (
		<div
			className="flex justify-center items-center bg-primary-800 h-auto w-auto px-6 py-2 text-white font-mono font-medium text-[12px] lg:text-lg rounded-[4px] cursor-pointer"
			onClick={onClick}
		>
			{children}
		</div>
	);
};

export const RoundedBlinkingButton = function ({
	onClick,
}: BlinkingButtonProp) {
	return (
    <div className="pulse-btn-div">
      <button className="pulse-btn" onClick={onClick}>
        Create New <br/> Route
      </button>
    </div>
	);
};
