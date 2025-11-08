/**
 * Apple-inspired Design token definitions for the next-generation UI.
 * These map directly to CSS custom properties so we can
 * swap themes without rewriting components.
 *
 * Philosophy:
 * - Generous whitespace and breathing room
 * - Subtle gradients and blur effects for depth
 * - Fluid animations with precise timing functions
 * - SF Pro typography hierarchy
 * - Glassmorphism with frosted backgrounds
 */
export type ThemeTokens = Record<string, string>;

export const lightTokens: ThemeTokens = {
  // Base colors - inspired by macOS Big Sur/Ventura
  '--bg': 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf4 100%)',
  '--bg-solid': '#f5f7fa',
  '--surface': '#ffffff',
  '--surface-glass': 'rgba(255, 255, 255, 0.78)',
  '--surface-elevated': 'rgba(255, 255, 255, 0.88)',
  '--surface-muted': '#f7f9fc',
  '--surface-hover': 'rgba(0, 0, 0, 0.03)',
  '--surface-pressed': 'rgba(0, 0, 0, 0.06)',

  // Text hierarchy
  '--text-primary': '#1d1d1f',
  '--text-secondary': '#6e6e73',
  '--text-tertiary': '#86868b',
  '--text-quaternary': '#aeaeb2',

  // Borders & dividers
  '--border': 'rgba(0, 0, 0, 0.08)',
  '--border-medium': 'rgba(0, 0, 0, 0.12)',
  '--border-strong': 'rgba(0, 0, 0, 0.18)',
  '--separator': 'rgba(0, 0, 0, 0.06)',

  // Accent colors - Apple system colors
  '--accent': '#007aff',
  '--accent-hover': '#0051d5',
  '--accent-subtle': 'rgba(0, 122, 255, 0.1)',

  // Semantic colors
  '--stakeholder': '#007aff',
  '--stakeholder-bg': 'rgba(0, 122, 255, 0.08)',
  '--system': '#34c759',
  '--system-bg': 'rgba(52, 199, 89, 0.08)',
  '--functional': '#ff9500',
  '--functional-bg': 'rgba(255, 149, 0, 0.08)',
  '--danger': '#ff3b30',
  '--danger-bg': 'rgba(255, 59, 48, 0.08)',
  '--warning': '#ff9500',
  '--warning-bg': 'rgba(255, 149, 0, 0.08)',
  '--success': '#34c759',
  '--success-bg': 'rgba(52, 199, 89, 0.08)',

  // Shadows - Apple-style layered shadows
  '--shadow-sm': '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.03)',
  '--shadow-md': '0 4px 12px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.04)',
  '--shadow-lg': '0 12px 40px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.05)',
  '--shadow-xl': '0 24px 60px rgba(0, 0, 0, 0.1), 0 8px 20px rgba(0, 0, 0, 0.06)',

  // Focus & interaction
  '--focus-ring': '0 0 0 4px rgba(0, 122, 255, 0.25)',
  '--glow-accent': '0 0 20px rgba(0, 122, 255, 0.3)',

  // Blur for glassmorphism
  '--blur-sm': 'blur(10px)',
  '--blur-md': 'blur(20px)',
  '--blur-lg': 'blur(40px)',

  // Typography scale (8pt grid)
  '--font-xs': '11px',
  '--font-sm': '13px',
  '--font-base': '15px',
  '--font-md': '17px',
  '--font-lg': '20px',
  '--font-xl': '24px',
  '--font-2xl': '28px',
  '--font-3xl': '32px',
  '--font-4xl': '40px',

  // Spacing (8pt grid)
  '--space-xs': '4px',
  '--space-sm': '8px',
  '--space-md': '12px',
  '--space-base': '16px',
  '--space-lg': '24px',
  '--space-xl': '32px',
  '--space-2xl': '48px',
  '--space-3xl': '64px',

  // Border radius
  '--radius-sm': '8px',
  '--radius-md': '12px',
  '--radius-lg': '16px',
  '--radius-xl': '20px',
  '--radius-2xl': '24px',
  '--radius-full': '9999px',

  // Timing functions
  '--ease-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
  '--ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  '--ease-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',

  // Duration
  '--duration-fast': '200ms',
  '--duration-base': '250ms',
  '--duration-slow': '320ms',
  '--duration-slower': '400ms'
};

export const darkTokens: ThemeTokens = {
  // Base colors - inspired by macOS dark mode
  '--bg': 'linear-gradient(135deg, #1c1c1e 0%, #121214 100%)',
  '--bg-solid': '#1c1c1e',
  '--surface': '#2c2c2e',
  '--surface-glass': 'rgba(44, 44, 46, 0.78)',
  '--surface-elevated': 'rgba(58, 58, 60, 0.88)',
  '--surface-muted': '#3a3a3c',
  '--surface-hover': 'rgba(255, 255, 255, 0.06)',
  '--surface-pressed': 'rgba(255, 255, 255, 0.12)',

  // Text hierarchy
  '--text-primary': '#f5f5f7',
  '--text-secondary': '#a1a1a6',
  '--text-tertiary': '#6e6e73',
  '--text-quaternary': '#48484a',

  // Borders & dividers
  '--border': 'rgba(255, 255, 255, 0.1)',
  '--border-medium': 'rgba(255, 255, 255, 0.15)',
  '--border-strong': 'rgba(255, 255, 255, 0.2)',
  '--separator': 'rgba(255, 255, 255, 0.08)',

  // Accent colors - brighter for dark mode
  '--accent': '#0a84ff',
  '--accent-hover': '#409cff',
  '--accent-subtle': 'rgba(10, 132, 255, 0.15)',

  // Semantic colors
  '--stakeholder': '#0a84ff',
  '--stakeholder-bg': 'rgba(10, 132, 255, 0.15)',
  '--system': '#30d158',
  '--system-bg': 'rgba(48, 209, 88, 0.15)',
  '--functional': '#ff9f0a',
  '--functional-bg': 'rgba(255, 159, 10, 0.15)',
  '--danger': '#ff453a',
  '--danger-bg': 'rgba(255, 69, 58, 0.15)',
  '--warning': '#ff9f0a',
  '--warning-bg': 'rgba(255, 159, 10, 0.15)',
  '--success': '#30d158',
  '--success-bg': 'rgba(48, 209, 88, 0.15)',

  // Shadows - darker for dark mode
  '--shadow-sm': '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
  '--shadow-md': '0 4px 12px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(0, 0, 0, 0.3)',
  '--shadow-lg': '0 12px 40px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.4)',
  '--shadow-xl': '0 24px 60px rgba(0, 0, 0, 0.6), 0 8px 20px rgba(0, 0, 0, 0.5)',

  // Focus & interaction
  '--focus-ring': '0 0 0 4px rgba(10, 132, 255, 0.3)',
  '--glow-accent': '0 0 20px rgba(10, 132, 255, 0.4)',

  // Blur for glassmorphism
  '--blur-sm': 'blur(10px)',
  '--blur-md': 'blur(20px)',
  '--blur-lg': 'blur(40px)',

  // Typography scale (same as light)
  '--font-xs': '11px',
  '--font-sm': '13px',
  '--font-base': '15px',
  '--font-md': '17px',
  '--font-lg': '20px',
  '--font-xl': '24px',
  '--font-2xl': '28px',
  '--font-3xl': '32px',
  '--font-4xl': '40px',

  // Spacing (same as light)
  '--space-xs': '4px',
  '--space-sm': '8px',
  '--space-md': '12px',
  '--space-base': '16px',
  '--space-lg': '24px',
  '--space-xl': '32px',
  '--space-2xl': '48px',
  '--space-3xl': '64px',

  // Border radius (same as light)
  '--radius-sm': '8px',
  '--radius-md': '12px',
  '--radius-lg': '16px',
  '--radius-xl': '20px',
  '--radius-2xl': '24px',
  '--radius-full': '9999px',

  // Timing functions (same as light)
  '--ease-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
  '--ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  '--ease-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',

  // Duration (same as light)
  '--duration-fast': '200ms',
  '--duration-base': '250ms',
  '--duration-slow': '320ms',
  '--duration-slower': '400ms'
};

/**
 * Converts a token dictionary into CSS variable declarations.
 */
export function tokensToCSSVars(tokens: ThemeTokens): string {
  return Object.entries(tokens)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');
}
