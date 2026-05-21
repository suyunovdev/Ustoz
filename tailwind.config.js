/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'var(--color-border)',
        input: 'var(--color-input)',
        ring: 'var(--color-ring)',
        background: 'var(--color-background)', /* gray-50 / deep dark blue-gray */
        foreground: 'var(--color-foreground)', /* gray-900 / white 92% */
        primary: {
          DEFAULT: 'var(--color-primary)', /* Deep academic blue / Lighter blue */
          foreground: 'var(--color-primary-foreground)', /* white */
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)', /* Approachable learning blue / Lighter blue */
          foreground: 'var(--color-secondary-foreground)', /* white / gray-950 */
        },
        accent: {
          DEFAULT: 'var(--color-accent)', /* Achievement gold */
          foreground: 'var(--color-accent-foreground)', /* gray-900 / gray-950 */
        },
        destructive: {
          DEFAULT: 'var(--color-destructive)', /* red-600 / red-400 */
          foreground: 'var(--color-destructive-foreground)', /* white / gray-950 */
        },
        success: {
          DEFAULT: 'var(--color-success)', /* green-600 / green-500 */
          foreground: 'var(--color-success-foreground)', /* white / gray-950 */
        },
        warning: {
          DEFAULT: 'var(--color-warning)', /* yellow-600 / yellow-500 */
          foreground: 'var(--color-warning-foreground)', /* gray-900 / gray-950 */
        },
        error: {
          DEFAULT: 'var(--color-error)', /* red-600 / red-400 */
          foreground: 'var(--color-error-foreground)', /* white / gray-950 */
        },
        muted: {
          DEFAULT: 'var(--color-muted)', /* gray-100 / elevated dark surface */
          foreground: 'var(--color-muted-foreground)', /* gray-600 / white 60% */
        },
        card: {
          DEFAULT: 'var(--color-card)', /* white / elevated dark surface */
          foreground: 'var(--color-card-foreground)', /* gray-700 / white 92% */
        },
        popover: {
          DEFAULT: 'var(--color-popover)', /* white / higher elevation surface */
          foreground: 'var(--color-popover-foreground)', /* gray-700 / white 92% */
        },
        'text-primary': 'var(--color-text-primary)', /* gray-900 / white 92% */
        'text-secondary': 'var(--color-text-secondary)', /* gray-600 / white 60% */
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      fontFamily: {
        heading: ['Crimson Text', 'Georgia', 'serif'],
        body: ['Source Sans 3', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        caption: ['IBM Plex Sans', 'sans-serif'],
        data: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      boxShadow: {
        'warm': '0 2px 4px rgba(15, 76, 117, 0.08)',
        'warm-md': '0 4px 8px rgba(15, 76, 117, 0.12)',
        'warm-lg': '0 8px 16px rgba(15, 76, 117, 0.14)',
        'warm-xl': '0 12px 24px rgba(15, 76, 117, 0.16)',
        'warm-2xl': '0 20px 40px -8px rgba(15, 76, 117, 0.16)',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      zIndex: {
        '1': '1',
        '50': '50',
        '100': '100',
        '200': '200',
        '300': '300',
      },
    },
  },
  plugins: [],
}