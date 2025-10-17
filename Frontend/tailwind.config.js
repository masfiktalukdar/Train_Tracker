/** @type {import('tailwindcss').Config} */
export default {
	content: ["./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				primary: {
					100: "#e0f0fe",
					200: "#b9e1fe",
					300: "#7cc9fd",
					400: "#36affa",
					500: "#0c94eb",
					600: "#0076cb",
					700: "#015ca3",
					800: "#064f86",
					900: "#0b426f",
					950: "#072a4a",
				},
			},
		},
	},
	plugins: [],
};

