/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Outfit", "Inter", "-apple-system", "BlinkMacSystemFont", "PingFang SC", "Microsoft YaHei", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Fraunces", "Georgia", "Cambria", "Times New Roman", "serif"],
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
      colors: {
        border: "hsl(var(--border-hsl))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
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
        // Paper palette - 暖白纸色
        paper: {
          DEFAULT: "#faf9f7",
          50: "#fdfcfb",
          100: "#f5f3f0",
          200: "#ebe8e3",
          300: "#ddd8d1",
        },
        // Ink palette - 墨蓝靛青
        ink: {
          DEFAULT: "#1a1a2e",
          50: "#f5f5f9",
          100: "#e8e8f0",
          200: "#c9c9da",
          300: "#9898b5",
          400: "#6b6b8d",
          500: "#4a4a6a",
          600: "#353552",
          700: "#25253d",
          800: "#1a1a2e",
          900: "#0f0f1c",
        },
        // Amber palette - 琥珀点缀
        amber: {
          DEFAULT: "#c87941",
          light: "#e8a87c",
          bg: "#fdf4ec",
          50: "#fdf4ec",
          100: "#f9e4d2",
          200: "#f2c9a6",
          300: "#edb88c",
          400: "#e8a87c",
          500: "#d68f5a",
          600: "#c87941",
          700: "#a86235",
        },
        // Status
        success: {
          DEFAULT: "#5b8c5a",
          bg: "#f0f5ef",
          50: "#f0f5ef",
          100: "#dce8da",
        },
        error: {
          DEFAULT: "#b85450",
          bg: "#f8efee",
          50: "#f8efee",
          100: "#ecd6d4",
        },
        warning: "#c9a227",
        // Border
        "border-strong": "#c9c4bb",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "sm": "0 1px 2px rgba(0,0,0,0.03)",
        DEFAULT: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
        "md": "0 2px 6px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03)",
        "lg": "0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.03)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "flip": {
          "0%": { transform: "rotateY(0deg)" },
          "100%": { transform: "rotateY(180deg)" },
        },
        "flip-back": {
          "0%": { transform: "rotateY(180deg)" },
          "100%": { transform: "rotateY(0deg)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "progress-fill": {
          from: { width: "0%" },
        },
        "confetti-fall": {
          "0%": { transform: "translateY(-100vh) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(100vh) rotate(720deg)", opacity: "0" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(12px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "slide-out-left": {
          from: { opacity: "1", transform: "translateX(0)" },
          to: { opacity: "0", transform: "translateX(-12px)" },
        },
        // ─── 新增炫酷动效 keyframes ───
        "spring-up": {
          "0%": { opacity: "0", transform: "translateY(16px) scale(0.96)" },
          "60%": { opacity: "1", transform: "translateY(-4px) scale(1.01)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "spring-in": {
          "0%": { opacity: "0", transform: "scale(0.85)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(200, 121, 65, 0)" },
          "50%": { boxShadow: "0 0 16px 4px rgba(200, 121, 65, 0.12)" },
        },
        "shimmer-sweep": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
        "float-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "20%": { opacity: "1" },
          "80%": { opacity: "1" },
          "100%": { opacity: "0", transform: "translateY(-24px)" },
        },
        "number-pop": {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.3)" },
          "70%": { transform: "scale(0.92)" },
          "100%": { transform: "scale(1)" },
        },
        "ring-fill": {
          "0%": { strokeDashoffset: "var(--ring-circumference)" },
          "100%": { strokeDashoffset: "var(--ring-offset)" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "border-trace": {
          "0%": { backgroundPosition: "0% 0%" },
          "100%": { backgroundPosition: "200% 0%" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "flip": "flip 0.6s ease-in-out",
        "flip-back": "flip-back 0.6s ease-in-out",
        "fade-in": "fade-in 0.25s ease-out",
        "fade-out": "fade-out 0.2s ease-out",
        "shimmer": "shimmer 2s infinite linear",
        "progress-fill": "progress-fill 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        "confetti-fall": "confetti-fall 3s ease-in forwards",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-out-left": "slide-out-left 0.25s ease-in",
        // ─── 新增炫酷动效 ───
        "spring-up": "spring-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "spring-in": "spring-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "shimmer-sweep": "shimmer-sweep 0.8s ease-out",
        "float-up": "float-up 1.2s ease-out forwards",
        "number-pop": "number-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "gradient-shift": "gradient-shift 3s ease-in-out infinite",
        "border-trace": "border-trace 2s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
