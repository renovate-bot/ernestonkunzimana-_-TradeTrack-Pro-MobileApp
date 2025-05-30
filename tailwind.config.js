/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
    "app/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "#EBF2FF",
          100: "#D6E4FF",
          200: "#ADC8FF",
          300: "#85ABFF",
          400: "#5C8EFF",
          500: "#3B82F6",
          600: "#0A5BEF",
          700: "#0747BD",
          800: "#05348A",
          900: "#032058",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          50: "#E6FFF7",
          100: "#CCFFEF",
          200: "#99FFE0",
          300: "#66FFD1",
          400: "#33FFC2",
          500: "#10B981",
          600: "#0D9A6B",
          700: "#0A7B55",
          800: "#075C40",
          900: "#043D2A",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
          50: "#FDEDED",
          100: "#FBDBDB",
          200: "#F8B7B7",
          300: "#F49393",
          400: "#F16F6F",
          500: "#EF4444",
          600: "#E71414",
          700: "#B61010",
          800: "#850C0C",
          900: "#540808",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        warning: {
          DEFAULT: "#F59E0B",
          50: "#FEF3E0",
          100: "#FDE7C2",
          200: "#FBCF85",
          300: "#F9B749",
          400: "#F7A01C",
          500: "#F59E0B",
          600: "#C47D08",
          700: "#935D06",
          800: "#623E04",
          900: "#311F02",
        },
        info: {
          DEFAULT: "#3B82F6",
          50: "#EBF2FF",
          100: "#D6E4FF",
          200: "#ADC8FF",
          300: "#85ABFF",
          400: "#5C8EFF",
          500: "#3B82F6",
          600: "#0A5BEF",
          700: "#0747BD",
          800: "#05348A",
          900: "#032058",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
