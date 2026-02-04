/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'mfleet-blue': {
                    'light': '#3b82f6',
                    DEFAULT: '#1e40af',
                    'dark': '#1e3a8a',
                },
                'mfleet-gray': {
                    'light': '#f3f4f6',
                    DEFAULT: '#6b7280',
                    'dark': '#111827',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            animation: {
                'marquee': 'marquee var(--marquee-duration, 40s) linear infinite',
                'marquee-reverse': 'marquee-reverse var(--marquee-duration, 40s) linear infinite',
            },
            keyframes: {
                marquee: {
                    '0%': { transform: 'translateX(0%)' },
                    '100%': { transform: 'translateX(-50%)' },
                },
                'marquee-reverse': {
                    '0%': { transform: 'translateX(-50%)' },
                    '100%': { transform: 'translateX(0%)' },
                },
            },
        }
    },
    plugins: [],
}
