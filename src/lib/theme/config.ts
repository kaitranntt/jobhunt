/**
 * Unified Theme Configuration
 *
 * Maps existing color systems (macOS 26, Shadcn UI, template-inspired)
 * into a single, coherent theme configuration.
 */

import type {
  SemanticColors,
  ThemeConfig,
  ThemeModes,
  ThemeMode,
  ResolvedThemeMode,
  CSSVariableMapping,
} from '@/lib/types/theme.types'

// CSS Variable mappings from globals.css
const cssVariableMapping: CSSVariableMapping = {
  // Shadcn UI compatibility
  '--background': {
    light: 'hsl(0 0% 100%)',
    dark: 'hsl(222 47% 11%)',
  },
  '--foreground': {
    light: 'hsl(240 10% 3.9%)',
    dark: 'hsl(210 40% 98%)',
  },
  '--card': {
    light: 'hsl(0 0% 100%)',
    dark: 'hsl(222 47% 13%)',
  },
  '--card-foreground': {
    light: 'hsl(240 10% 3.9%)',
    dark: 'hsl(210 40% 98%)',
  },
  '--popover': {
    light: 'hsl(0 0% 100%)',
    dark: 'hsl(222 47% 15%)',
  },
  '--popover-foreground': {
    light: 'hsl(240 10% 3.9%)',
    dark: 'hsl(210 40% 98%)',
  },
  '--primary': {
    light: 'hsl(240 5.9% 10%)',
    dark: 'hsl(210 40% 96%)',
  },
  '--primary-foreground': {
    light: 'hsl(0 0% 98%)',
    dark: 'hsl(222 47% 11%)',
  },
  '--secondary': {
    light: 'hsl(240 4.8% 95.9%)',
    dark: 'hsl(217 33% 22%)',
  },
  '--secondary-foreground': {
    light: 'hsl(240 5.9% 10%)',
    dark: 'hsl(210 40% 98%)',
  },
  '--muted': {
    light: 'hsl(240 4.8% 95.9%)',
    dark: 'hsl(217 33% 17%)',
  },
  '--muted-foreground': {
    light: 'hsl(240 3.8% 46.1%)',
    dark: 'hsl(215 20% 65%)',
  },
  '--accent': {
    light: 'hsl(240 4.8% 95.9%)',
    dark: 'hsl(217 33% 24%)',
  },
  '--accent-foreground': {
    light: 'hsl(240 5.9% 10%)',
    dark: 'hsl(210 40% 98%)',
  },
  '--destructive': {
    light: 'hsl(0 72% 51%)',
    dark: 'hsl(0 62.8% 30.6%)',
  },
  '--destructive-foreground': {
    light: 'hsl(0 0% 98%)',
    dark: 'hsl(210 40% 98%)',
  },
  '--border': {
    light: 'hsl(240 5.9% 90%)',
    dark: 'hsl(217 33% 21%)',
  },
  '--input': {
    light: 'hsl(240 5.9% 90%)',
    dark: 'hsl(217 33% 21%)',
  },
  '--ring': {
    light: 'hsl(240 5% 64.9%)',
    dark: 'hsl(224 76% 48%)',
  },
  '--success': {
    light: 'hsl(142 71% 45%)',
    dark: 'hsl(142 76% 36%)',
  },
  '--success-foreground': {
    light: 'hsl(0 0% 98%)',
    dark: 'hsl(210 40% 98%)',
  },
  '--warning': {
    light: 'hsl(38 92% 50%)',
    dark: 'hsl(38 92% 50%)',
  },
  '--warning-foreground': {
    light: 'hsl(0 0% 98%)',
    dark: 'hsl(222 47% 11%)',
  },
  '--info': {
    light: 'hsl(217 91% 60%)',
    dark: 'hsl(217 91% 60%)',
  },
  '--info-foreground': {
    light: 'hsl(0 0% 98%)',
    dark: 'hsl(210 40% 98%)',
  },

  // Template-inspired colors
  '--bg-primary': {
    light: '#fffcf5',
    dark: '#1a1a1a',
  },
  '--bg-secondary': {
    light: '#e2d8c3',
    dark: '#2d2d2d',
  },
  '--bg-card': {
    light: '#ffffff',
    dark: '#252525',
  },
  '--text-primary': {
    light: '#5c4d3f',
    dark: '#f0f0f0',
  },
  '--text-secondary': {
    light: '#757575',
    dark: '#b0b0b0',
  },
  '--text-light': {
    light: '#f0f0f0',
    dark: '#f0f0f0',
  },
  '--accent-primary': {
    light: '#5c6bc0',
    dark: '#7986cb',
  },
  '--accent-secondary': {
    light: '#26a69a',
    dark: '#4db6ac',
  },
  '--border-color': {
    light: '#e2d8c3',
    dark: '#404040',
  },
  '--shadow-color': {
    light: 'rgba(0,0,0,0.05)',
    dark: 'rgba(0,0,0,0.2)',
  },
  '--hover-bg': {
    light: '#d4c9b2',
    dark: '#333333',
  },
  '--saved-color': {
    light: '#9e9e9e',
    dark: '#757575',
  },
  '--applied-color': {
    light: '#5c6bc0',
    dark: '#7986cb',
  },
  '--interviewing-color': {
    light: '#ffb300',
    dark: '#ffa000',
  },
  '--offer-color': {
    light: '#66bb6a',
    dark: '#66bb6a',
  },
  '--rejected-color': {
    light: '#ef5350',
    dark: '#e53935',
  },
}

// Light mode semantic colors
const lightColors: SemanticColors = {
  primary: cssVariableMapping['--primary'].light,
  primaryForeground: cssVariableMapping['--primary-foreground'].light,
  secondary: cssVariableMapping['--secondary'].light,
  secondaryForeground: cssVariableMapping['--secondary-foreground'].light,
  background: cssVariableMapping['--background'].light,
  foreground: cssVariableMapping['--foreground'].light,
  card: cssVariableMapping['--card'].light,
  cardForeground: cssVariableMapping['--card-foreground'].light,
  popover: cssVariableMapping['--popover'].light,
  popoverForeground: cssVariableMapping['--popover-foreground'].light,
  muted: cssVariableMapping['--muted'].light,
  mutedForeground: cssVariableMapping['--muted-foreground'].light,
  accent: cssVariableMapping['--accent'].light,
  accentForeground: cssVariableMapping['--accent-foreground'].light,
  input: cssVariableMapping['--input'].light,
  border: cssVariableMapping['--border'].light,
  ring: cssVariableMapping['--ring'].light,
  destructive: cssVariableMapping['--destructive'].light,
  destructiveForeground: cssVariableMapping['--destructive-foreground'].light,
  success: cssVariableMapping['--success'].light,
  successForeground: cssVariableMapping['--success-foreground'].light,
  warning: cssVariableMapping['--warning'].light,
  warningForeground: cssVariableMapping['--warning-foreground'].light,
  info: cssVariableMapping['--info'].light,
  infoForeground: cssVariableMapping['--info-foreground'].light,
  textPrimary: cssVariableMapping['--text-primary'].light,
  textSecondary: cssVariableMapping['--text-secondary'].light,
  textLight: cssVariableMapping['--text-light'].light,
  borderCustom: cssVariableMapping['--border-color'].light,
  shadowColor: cssVariableMapping['--shadow-color'].light,
  hoverBg: cssVariableMapping['--hover-bg'].light,
  savedColor: cssVariableMapping['--saved-color'].light,
  appliedColor: cssVariableMapping['--applied-color'].light,
  interviewingColor: cssVariableMapping['--interviewing-color'].light,
  offerColor: cssVariableMapping['--offer-color'].light,
  rejectedColor: cssVariableMapping['--rejected-color'].light,
}

// Dark mode semantic colors
const darkColors: SemanticColors = {
  primary: cssVariableMapping['--primary'].dark,
  primaryForeground: cssVariableMapping['--primary-foreground'].dark,
  secondary: cssVariableMapping['--secondary'].dark,
  secondaryForeground: cssVariableMapping['--secondary-foreground'].dark,
  background: cssVariableMapping['--background'].dark,
  foreground: cssVariableMapping['--foreground'].dark,
  card: cssVariableMapping['--card'].dark,
  cardForeground: cssVariableMapping['--card-foreground'].dark,
  popover: cssVariableMapping['--popover'].dark,
  popoverForeground: cssVariableMapping['--popover-foreground'].dark,
  muted: cssVariableMapping['--muted'].dark,
  mutedForeground: cssVariableMapping['--muted-foreground'].dark,
  accent: cssVariableMapping['--accent'].dark,
  accentForeground: cssVariableMapping['--accent-foreground'].dark,
  input: cssVariableMapping['--input'].dark,
  border: cssVariableMapping['--border'].dark,
  ring: cssVariableMapping['--ring'].dark,
  destructive: cssVariableMapping['--destructive'].dark,
  destructiveForeground: cssVariableMapping['--destructive-foreground'].dark,
  success: cssVariableMapping['--success'].dark,
  successForeground: cssVariableMapping['--success-foreground'].dark,
  warning: cssVariableMapping['--warning'].dark,
  warningForeground: cssVariableMapping['--warning-foreground'].dark,
  info: cssVariableMapping['--info'].dark,
  infoForeground: cssVariableMapping['--info-foreground'].dark,
  textPrimary: cssVariableMapping['--text-primary'].dark,
  textSecondary: cssVariableMapping['--text-secondary'].dark,
  textLight: cssVariableMapping['--text-light'].dark,
  borderCustom: cssVariableMapping['--border-color'].dark,
  shadowColor: cssVariableMapping['--shadow-color'].dark,
  hoverBg: cssVariableMapping['--hover-bg'].dark,
  savedColor: cssVariableMapping['--saved-color'].dark,
  appliedColor: cssVariableMapping['--applied-color'].dark,
  interviewingColor: cssVariableMapping['--interviewing-color'].dark,
  offerColor: cssVariableMapping['--offer-color'].dark,
  rejectedColor: cssVariableMapping['--rejected-color'].dark,
}

// Base theme configuration
const createThemeConfig = (
  mode: ThemeMode,
  resolvedMode: ResolvedThemeMode,
  colors: SemanticColors
): ThemeConfig => ({
  mode,
  resolvedMode,
  colors,
  components: {
    button: {
      primary: colors,
      secondary: colors,
      destructive: colors,
      outline: colors,
      ghost: colors,
      link: colors,
    },
    card: {
      default: colors,
      elevated: colors,
      outlined: colors,
    },
    input: {
      default: colors,
      error: colors,
      focus: colors,
    },
  },
  borderRadius: '0.5rem',
  fontFamily: {
    sans: ['var(--font-inter)', 'Arial', 'Helvetica', 'sans-serif'],
    serif: ['var(--font-libre-baskerville)', 'Georgia', 'serif'],
    mono: ['var(--font-ibm-plex-mono)', 'Monaco', 'monospace'],
  },
  shadows: {
    subtle: '0 2px 8px var(--shadow-color)',
    medium: '0 8px 32px var(--shadow-color)',
    strong: '0 16px 64px var(--shadow-color)',
  },
})

// Theme modes configuration
export const themeModes: ThemeModes = {
  light: createThemeConfig('light', 'light', lightColors),
  dark: createThemeConfig('dark', 'dark', darkColors),
}

// Get theme configuration by mode
export const getThemeConfig = (mode: ThemeMode, resolvedMode: ResolvedThemeMode): ThemeConfig => {
  return themeModes[resolvedMode] ?? themeModes.light
}

// Get CSS variable name for semantic token
export const getCSSVariableName = (token: keyof SemanticColors): string => {
  const tokenMap: Record<keyof SemanticColors, string> = {
    primary: '--primary',
    primaryForeground: '--primary-foreground',
    secondary: '--secondary',
    secondaryForeground: '--secondary-foreground',
    background: '--background',
    foreground: '--foreground',
    card: '--card',
    cardForeground: '--card-foreground',
    popover: '--popover',
    popoverForeground: '--popover-foreground',
    muted: '--muted',
    mutedForeground: '--muted-foreground',
    accent: '--accent',
    accentForeground: '--accent-foreground',
    input: '--input',
    border: '--border',
    ring: '--ring',
    destructive: '--destructive',
    destructiveForeground: '--destructive-foreground',
    success: '--success',
    successForeground: '--success-foreground',
    warning: '--warning',
    warningForeground: '--warning-foreground',
    info: '--info',
    infoForeground: '--info-foreground',
    textPrimary: '--text-primary',
    textSecondary: '--text-secondary',
    textLight: '--text-light',
    borderCustom: '--border-color',
    shadowColor: '--shadow-color',
    hoverBg: '--hover-bg',
    savedColor: '--saved-color',
    appliedColor: '--applied-color',
    interviewingColor: '--interviewing-color',
    offerColor: '--offer-color',
    rejectedColor: '--rejected-color',
  }

  return tokenMap[token] || `--${token}`
}

// Export CSS variables mapping for backward compatibility
export { cssVariableMapping }
