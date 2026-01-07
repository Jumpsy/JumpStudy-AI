import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
      },
      colors: {
        'bg-deep': '#0a0a0f',
        'bg-card': '#12121a',
        'bg-elevated': '#1a1a24',
        'border-subtle': 'rgba(255, 255, 255, 0.08)',
        'text-primary': '#ffffff',
        'text-secondary': '#a0a0b0',
        'text-muted': '#606070',
        'accent-red': '#ef4444',
        'accent-crimson': '#dc2626',
        'accent-orange': '#f97316',
        'accent-rose': '#f43f5e',
        'accent-ember': '#fb923c',
        'glow-red': 'rgba(239, 68, 68, 0.4)',
      },
      animation: {
        'aurora': 'aurora 15s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        aurora: {
          '0%, 100%': { transform: 'translateX(-25%) translateY(-25%) rotate(0deg)' },
          '50%': { transform: 'translateX(25%) translateY(25%) rotate(180deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
