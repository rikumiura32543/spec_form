/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          900: '#111827',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      screens: {
        'xs': '475px',
      },
    },
  },
  plugins: [
    // Accessibility-focused plugins will be added here
  ],
  // High contrast mode support
  variants: {
    extend: {
      backgroundColor: ['focus-visible'],
      textColor: ['focus-visible'],
      borderColor: ['focus-visible'],
    }
  }
}