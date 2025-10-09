/**
 * Unified Theme Configuration for JobHunt
 *
 * This file defines the centralized theme system that consolidates
 * macOS 26 "Liquid Glass", Shadcn UI, and template-inspired colors
 * into a single, type-safe theming API.
 */

// Base theme modes
export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedThemeMode = 'light' | 'dark'

// Backward compatibility aliases
export type Theme = ThemeMode
export type ResolvedTheme = ResolvedThemeMode

// Semantic color tokens for consistent theming
export interface SemanticColors {
  // Primary brand colors
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string

  // Background colors
  background: string
  foreground: string
  card: string
  cardForeground: string
  popover: string
  popoverForeground: string

  // Muted colors
  muted: string
  mutedForeground: string

  // Accent colors
  accent: string
  accentForeground: string

  // Input and borders
  input: string
  border: string
  ring: string

  // Status colors
  destructive: string
  destructiveForeground: string
  success: string
  successForeground: string
  warning: string
  warningForeground: string
  info: string
  infoForeground: string

  // Custom application colors
  textPrimary: string
  textSecondary: string
  textLight: string
  borderCustom: string
  shadowColor: string
  hoverBg: string

  // Status pipeline colors
  savedColor: string
  appliedColor: string
  interviewingColor: string
  offerColor: string
  rejectedColor: string
}

// Component-specific tokens
export interface ComponentTokens {
  button: {
    primary: SemanticColors
    secondary: SemanticColors
    destructive: SemanticColors
    outline: SemanticColors
    ghost: SemanticColors
    link: SemanticColors
  }
  card: {
    default: SemanticColors
    elevated: SemanticColors
    outlined: SemanticColors
  }
  input: {
    default: SemanticColors
    error: SemanticColors
    focus: SemanticColors
  }
}

// Complete theme configuration
export interface ThemeConfig {
  mode: ThemeMode
  resolvedMode: ResolvedThemeMode
  colors: SemanticColors
  components: ComponentTokens
  borderRadius: string
  fontFamily: {
    sans: string[]
    serif: string[]
    mono: string[]
  }
  shadows: {
    subtle: string
    medium: string
    strong: string
  }
}

// Theme configuration for each mode
export interface ThemeModes {
  light: ThemeConfig
  dark: ThemeConfig
}

// Theme validation result
export interface ThemeValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// Theme utility function types
export interface ThemeUtilities {
  getColor: (token: keyof SemanticColors) => string
  getComponentColors: (component: keyof ComponentTokens, variant: string) => SemanticColors
  getCSSVariable: (token: keyof SemanticColors) => string
  generateCSSClass: (styles: Record<string, keyof SemanticColors>) => string
}

// Legacy context value for backward compatibility
export interface ThemeContextValue {
  theme: ThemeMode
  resolvedTheme: ResolvedThemeMode
  setTheme: (theme: ThemeMode) => void
}

// Enhanced theme context value
export interface EnhancedThemeContextValue {
  theme: ThemeMode
  resolvedTheme: ResolvedThemeMode
  config: ThemeConfig
  setTheme: (theme: ThemeMode) => void
  utilities: ThemeUtilities
  isValid: boolean
  validationErrors: string[]
}

// CSS variable mapping
export interface CSSVariableMapping {
  [key: string]: {
    light: string
    dark: string
  }
}

// Theme initialization options
export interface ThemeInitOptions {
  defaultTheme?: ThemeMode
  enableSystemDetection?: boolean
  enableValidation?: boolean
  storageKey?: string
}
