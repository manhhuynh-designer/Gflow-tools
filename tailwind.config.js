/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./main.tsx",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cds: {
          background: 'var(--cds-background)',
          layer1: 'var(--cds-layer-01)',
          layer2: 'var(--cds-layer-02)',
          text: {
            primary: 'var(--cds-text-primary)',
            secondary: 'var(--cds-text-secondary)',
            muted: 'var(--cds-text-muted)',
          },
          border: {
            subtle: 'var(--cds-border-subtle)',
            strong: 'var(--cds-border-strong)',
          },
          interactive: {
            DEFAULT: 'var(--cds-interactive)',
            hover: 'var(--cds-interactive-hover)',
            active: 'var(--cds-interactive-active)',
          },
          support: {
            error: 'var(--cds-support-error)',
            success: 'var(--cds-support-success)',
            warning: 'var(--cds-support-warning)',
            info: 'var(--cds-support-info)',
          }
        }
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      }
    },
  },
  plugins: [],
}
