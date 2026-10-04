import type { Config } from 'tailwindcss';

// Semantic tokens only (docs/design.md rule: never expose primitives to components).
// Values are CSS variables declared in src/app/globals.css.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      text: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        disabled: 'var(--text-disabled)',
        inverse: 'var(--text-inverse)',
      },
      bg: {
        primary: 'var(--bg-primary)',
        surface: 'var(--bg-surface)',
        subtle: 'var(--bg-subtle)',
        pressed: 'var(--bg-pressed)',
      },
      brand: {
        DEFAULT: 'var(--brand)',
        hover: 'var(--brand-hover)',
        subtle: 'var(--brand-subtle)',
      },
      border: {
        DEFAULT: 'var(--border-default)',
        strong: 'var(--border-strong)',
        focus: 'var(--focus-ring)',
      },
      success: {
        bg: 'var(--status-success-bg)',
        border: 'var(--status-success-border)',
        text: 'var(--status-success-text)',
        solid: 'var(--status-success-solid)',
      },
      danger: {
        bg: 'var(--status-error-bg)',
        border: 'var(--status-error-border)',
        text: 'var(--status-error-text)',
        solid: 'var(--status-error-solid)',
      },
      warning: {
        bg: 'var(--status-warning-bg)',
        border: 'var(--status-warning-border)',
        text: 'var(--status-warning-text)',
        solid: 'var(--status-warning-solid)',
      },
      accent: 'var(--accent)',
    },
    // 4px grid. Keys are Tailwind units (1 = 4px).
    spacing: {
      0: '0px',
      0.5: '2px',
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
      5: '20px',
      6: '24px',
      8: '32px',
      10: '40px',
      12: '48px',
      16: '64px',
      24: '96px',
      28: '112px',
    },
    borderRadius: {
      none: '0px',
      sm: '4px',
      md: '6px',
      lg: '8px',
      xl: '12px',
      full: '9999px',
    },
    boxShadow: { none: 'none' },
    fontFamily: {
      sans: ["'Inter Display'", 'var(--font-inter)', 'system-ui', 'sans-serif'],
    },
    fontSize: {
      // [size, { lineHeight, fontWeight }] from the design system type scale
      h1: ['48px', { lineHeight: '56px', fontWeight: '700' }],
      h2: ['36px', { lineHeight: '44px', fontWeight: '700' }],
      h3: ['30px', { lineHeight: '38px', fontWeight: '600' }],
      h4: ['28px', { lineHeight: '36px', fontWeight: '600' }],
      h5: ['24px', { lineHeight: '32px', fontWeight: '500' }],
      'body-lg': ['16px', { lineHeight: '24px', fontWeight: '500' }],
      'body-sm': ['12px', { lineHeight: '18px', fontWeight: '400' }],
    },
    extend: {
      transitionDuration: { fast: '100ms', base: '150ms', panel: '200ms' },
    },
  },
  plugins: [],
};

export default config;
