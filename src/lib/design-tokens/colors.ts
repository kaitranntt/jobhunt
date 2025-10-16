/**
 * macOS 26 "Liquid Glass" Color System
 * RGBA-based semantic colors for light and dark modes
 */

// ============================================================================
// macOS 26 System Label Colors (RGBA)
// ============================================================================

export const labelColors = {
  light: {
    primary: 'rgba(0, 0, 0, 0.847)', // labelColor
    secondary: 'rgba(0, 0, 0, 0.498)', // secondaryLabelColor
    tertiary: 'rgba(0, 0, 0, 0.259)', // tertiaryLabelColor
    quaternary: 'rgba(0, 0, 0, 0.098)', // quaternaryLabelColor
  },
  dark: {
    primary: 'rgba(255, 255, 255, 0.847)', // labelColor
    secondary: 'rgba(255, 255, 255, 0.549)', // secondaryLabelColor
    tertiary: 'rgba(255, 255, 255, 0.251)', // tertiaryLabelColor
    quaternary: 'rgba(255, 255, 255, 0.098)', // quaternaryLabelColor
  },
} as const

// ============================================================================
// macOS 26 System Fill Colors (RGBA)
// ============================================================================

export const fillColors = {
  light: {
    primary: 'rgba(120, 120, 128, 0.2)', // systemFill
    secondary: 'rgba(120, 120, 128, 0.16)', // secondarySystemFill
    tertiary: 'rgba(118, 118, 128, 0.12)', // tertiarySystemFill
    quaternary: 'rgba(116, 116, 128, 0.08)', // quaternarySystemFill
  },
  dark: {
    primary: 'rgba(120, 120, 128, 0.36)', // systemFill
    secondary: 'rgba(120, 120, 128, 0.32)', // secondarySystemFill
    tertiary: 'rgba(118, 118, 128, 0.24)', // tertiarySystemFill
    quaternary: 'rgba(116, 116, 128, 0.18)', // quaternarySystemFill
  },
} as const

// ============================================================================
// macOS 26 System Gray Colors (RGBA)
// ============================================================================

export const systemGrays = {
  light: {
    gray1: 'rgba(142, 142, 147, 1)',
    gray2: 'rgba(174, 174, 178, 1)',
    gray3: 'rgba(199, 199, 204, 1)',
    gray4: 'rgba(209, 209, 214, 1)',
    gray5: 'rgba(229, 229, 234, 1)',
    gray6: 'rgba(242, 242, 247, 1)',
  },
  dark: {
    gray1: 'rgba(142, 142, 147, 1)',
    gray2: 'rgba(99, 99, 102, 1)',
    gray3: 'rgba(72, 72, 74, 1)',
    gray4: 'rgba(58, 58, 60, 1)',
    gray5: 'rgba(44, 44, 46, 1)',
    gray6: 'rgba(28, 28, 30, 1)',
  },
} as const

// ============================================================================
// System Background Colors (RGBA)
// ============================================================================

export const systemBackgrounds = {
  light: {
    primary: 'rgba(255, 255, 255, 1)', // systemBackground
    secondary: 'rgba(242, 242, 247, 1)', // secondarySystemBackground
    tertiary: 'rgba(255, 255, 255, 1)', // tertiarySystemBackground
    grouped: 'rgba(242, 242, 247, 1)', // systemGroupedBackground
    groupedSecondary: 'rgba(255, 255, 255, 1)', // secondarySystemGroupedBackground
    groupedTertiary: 'rgba(242, 242, 247, 1)', // tertiarySystemGroupedBackground
  },
  dark: {
    primary: 'rgba(0, 0, 0, 1)', // systemBackground
    secondary: 'rgba(28, 28, 30, 1)', // secondarySystemBackground
    tertiary: 'rgba(44, 44, 46, 1)', // tertiarySystemBackground
    grouped: 'rgba(0, 0, 0, 1)', // systemGroupedBackground
    groupedSecondary: 'rgba(28, 28, 30, 1)', // secondarySystemGroupedBackground
    groupedTertiary: 'rgba(44, 44, 46, 1)', // tertiarySystemGroupedBackground
  },
} as const

// ============================================================================
// System Tint Colors (Brand/Accent)
// ============================================================================

export const systemTints = {
  blue: {
    light: 'rgba(0, 122, 255, 1)',
    dark: 'rgba(10, 132, 255, 1)',
  },
  purple: {
    light: 'rgba(175, 82, 222, 1)',
    dark: 'rgba(191, 90, 242, 1)',
  },
  pink: {
    light: 'rgba(255, 45, 85, 1)',
    dark: 'rgba(255, 55, 95, 1)',
  },
  red: {
    light: 'rgba(255, 59, 48, 1)',
    dark: 'rgba(255, 69, 58, 1)',
  },
  orange: {
    light: 'rgba(255, 149, 0, 1)',
    dark: 'rgba(255, 159, 10, 1)',
  },
  yellow: {
    light: 'rgba(255, 204, 0, 1)',
    dark: 'rgba(255, 214, 10, 1)',
  },
  green: {
    light: 'rgba(52, 199, 89, 1)',
    dark: 'rgba(48, 209, 88, 1)',
  },
  teal: {
    light: 'rgba(90, 200, 250, 1)',
    dark: 'rgba(100, 210, 255, 1)',
  },
  indigo: {
    light: 'rgba(88, 86, 214, 1)',
    dark: 'rgba(94, 92, 230, 1)',
  },
} as const

// ============================================================================
// Liquid Glass Material Colors (with Alpha Channels)
// ============================================================================

export const liquidGlassMaterials = {
  light: {
    ultra: 'rgba(255, 255, 255, 0.15)', // Ultra-light glass (15px blur, 5% tint)
    light: 'rgba(255, 255, 255, 0.25)', // Light glass (20px blur, 8% tint)
    medium: 'rgba(255, 255, 255, 0.35)', // Medium glass (30px blur, 15% tint)
    heavy: 'rgba(255, 255, 255, 0.45)', // Heavy glass (40px blur, 25% tint)
  },
  dark: {
    ultra: 'rgba(18, 18, 18, 0.4)', // Ultra-light glass dark
    light: 'rgba(18, 18, 18, 0.5)', // Light glass dark
    medium: 'rgba(18, 18, 18, 0.65)', // Medium glass dark
    heavy: 'rgba(18, 18, 18, 0.8)', // Heavy glass dark
  },
} as const

// ============================================================================
// Glass Border Colors (for Liquid Glass effect)
// ============================================================================

export const glassBorders = {
  light: {
    subtle: 'rgba(255, 255, 255, 0.4)', // Subtle border
    medium: 'rgba(255, 255, 255, 0.6)', // Medium border
    strong: 'rgba(255, 255, 255, 0.8)', // Strong border
  },
  dark: {
    subtle: 'rgba(255, 255, 255, 0.1)', // Subtle border
    medium: 'rgba(255, 255, 255, 0.15)', // Medium border
    strong: 'rgba(255, 255, 255, 0.25)', // Strong border
  },
} as const

// ============================================================================
// Semantic State Colors
// ============================================================================

export const semanticColors = {
  success: {
    light: 'rgba(52, 199, 89, 1)',
    dark: 'rgba(48, 209, 88, 1)',
  },
  warning: {
    light: 'rgba(255, 204, 0, 1)',
    dark: 'rgba(255, 214, 10, 1)',
  },
  error: {
    light: 'rgba(255, 59, 48, 1)',
    dark: 'rgba(255, 69, 58, 1)',
  },
  info: {
    light: 'rgba(0, 122, 255, 1)',
    dark: 'rgba(10, 132, 255, 1)',
  },
} as const

// ============================================================================
// Shadow Colors for Depth
// ============================================================================

export const shadowColors = {
  light: {
    subtle: 'rgba(0, 0, 0, 0.05)', // Subtle elevation
    soft: 'rgba(0, 0, 0, 0.1)', // Soft shadow
    medium: 'rgba(0, 0, 0, 0.15)', // Medium shadow
    strong: 'rgba(0, 0, 0, 0.2)', // Strong shadow
    specular: 'rgba(255, 255, 255, 0.3)', // Specular highlight (inset)
  },
  dark: {
    subtle: 'rgba(0, 0, 0, 0.2)', // Subtle elevation
    soft: 'rgba(0, 0, 0, 0.3)', // Soft shadow
    medium: 'rgba(0, 0, 0, 0.4)', // Medium shadow
    strong: 'rgba(0, 0, 0, 0.6)', // Strong shadow
    specular: 'rgba(255, 255, 255, 0.1)', // Specular highlight (inset)
  },
} as const

// ============================================================================
// Copper Brand Color System
// ============================================================================

export const copperColors = {
  primary: '25 95% 53%', // Main copper color #D97706
  light: '25 85% 65%', // Lighter copper variant
  dark: '25 100% 45%', // Darker copper variant
  glow: '25 95% 70%', // Glowing copper effect
  shimmer: '25 90% 75%', // Shimmer effect copper
} as const

// ============================================================================
// Copper Color Variants (Light/Dark)
// ============================================================================

export const copperTheme = {
  light: {
    primary: copperColors.primary,
    primaryLight: copperColors.light,
    primaryDark: copperColors.dark,
    primaryGlow: copperColors.glow,
    primaryShimmer: copperColors.shimmer,
    // Light mode specific variants
    background: '250 100% 99%', // Very light blue-white
    foreground: '20 14.3% 4.1%', // Near-black for text
    card: '0 0% 100%', // Pure white
    secondary: '20 14.3% 96.1%', // Light gray
  },
  dark: {
    primary: copperColors.primary,
    primaryLight: copperColors.light,
    primaryDark: copperColors.dark,
    primaryGlow: copperColors.glow,
    primaryShimmer: copperColors.shimmer,
    // Dark mode specific variants
    background: '20 8% 4%', // Very dark slate
    foreground: '25 20% 95%', // Near-white for text
    card: '20 10% 8%', // Dark gray-blue
    secondary: '20 10% 12%', // Medium dark
  },
} as const

// ============================================================================
// Copper Gradient System
// ============================================================================

export const copperGradients = {
  hero: 'linear-gradient(135deg, hsl(var(--copper) / 0.15) 0%, hsl(var(--background)) 30%, hsl(var(--copper-light) / 0.08) 60%, hsl(var(--background)) 100%)',
  buttonHero: 'linear-gradient(135deg, hsl(var(--copper)) 0%, hsl(var(--copper-dark)) 100%)',
  avatar:
    'linear-gradient(135deg, hsl(var(--copper)) 0%, hsl(var(--copper-light)) 50%, hsl(var(--copper-glow)) 100%)',
  buttonHover: 'linear-gradient(135deg, hsl(var(--copper-dark)) 0%, hsl(var(--copper)) 100%)',
} as const

// ============================================================================
// CSS Custom Properties Generator (Updated with Copper)
// ============================================================================

export function generateCSSVariables(mode: 'light' | 'dark'): Record<string, string> {
  return {
    // Label Colors
    '--macos-label-primary': labelColors[mode].primary,
    '--macos-label-secondary': labelColors[mode].secondary,
    '--macos-label-tertiary': labelColors[mode].tertiary,
    '--macos-label-quaternary': labelColors[mode].quaternary,

    // Fill Colors
    '--macos-fill-primary': fillColors[mode].primary,
    '--macos-fill-secondary': fillColors[mode].secondary,
    '--macos-fill-tertiary': fillColors[mode].tertiary,
    '--macos-fill-quaternary': fillColors[mode].quaternary,

    // System Grays
    '--macos-gray-1': systemGrays[mode].gray1,
    '--macos-gray-2': systemGrays[mode].gray2,
    '--macos-gray-3': systemGrays[mode].gray3,
    '--macos-gray-4': systemGrays[mode].gray4,
    '--macos-gray-5': systemGrays[mode].gray5,
    '--macos-gray-6': systemGrays[mode].gray6,

    // Backgrounds
    '--macos-bg-primary': systemBackgrounds[mode].primary,
    '--macos-bg-secondary': systemBackgrounds[mode].secondary,
    '--macos-bg-tertiary': systemBackgrounds[mode].tertiary,
    '--macos-bg-grouped': systemBackgrounds[mode].grouped,
    '--macos-bg-grouped-secondary': systemBackgrounds[mode].groupedSecondary,
    '--macos-bg-grouped-tertiary': systemBackgrounds[mode].groupedTertiary,

    // Liquid Glass Materials
    '--glass-ultra': liquidGlassMaterials[mode].ultra,
    '--glass-light': liquidGlassMaterials[mode].light,
    '--glass-medium': liquidGlassMaterials[mode].medium,
    '--glass-heavy': liquidGlassMaterials[mode].heavy,

    // Glass Borders
    '--glass-border-subtle': glassBorders[mode].subtle,
    '--glass-border-medium': glassBorders[mode].medium,
    '--glass-border-strong': glassBorders[mode].strong,

    // System Tints (using light/dark variants)
    '--tint-blue': systemTints.blue[mode],
    '--tint-purple': systemTints.purple[mode],
    '--tint-pink': systemTints.pink[mode],
    '--tint-red': systemTints.red[mode],
    '--tint-orange': systemTints.orange[mode],
    '--tint-yellow': systemTints.yellow[mode],
    '--tint-green': systemTints.green[mode],
    '--tint-teal': systemTints.teal[mode],
    '--tint-indigo': systemTints.indigo[mode],

    // Semantic Colors
    '--color-success': semanticColors.success[mode],
    '--color-warning': semanticColors.warning[mode],
    '--color-error': semanticColors.error[mode],
    '--color-info': semanticColors.info[mode],

    // Shadows
    '--shadow-subtle': shadowColors[mode].subtle,
    '--shadow-soft': shadowColors[mode].soft,
    '--shadow-medium': shadowColors[mode].medium,
    '--shadow-strong': shadowColors[mode].strong,
    '--shadow-specular': shadowColors[mode].specular,

    // Copper Color System
    '--copper': copperColors.primary,
    '--copper-light': copperColors.light,
    '--copper-dark': copperColors.dark,
    '--copper-glow': copperColors.glow,
    '--copper-shimmer': copperColors.shimmer,

    // Copper Theme Variants
    '--copper-bg': copperTheme[mode].background,
    '--copper-fg': copperTheme[mode].foreground,
    '--copper-card': copperTheme[mode].card,
    '--copper-secondary': copperTheme[mode].secondary,

    // Copper Gradients
    '--copper-hero-gradient': copperGradients.hero,
    '--copper-button-gradient': copperGradients.buttonHero,
    '--copper-avatar-gradient': copperGradients.avatar,
    '--copper-button-hover-gradient': copperGradients.buttonHover,
  }
}

// ============================================================================
// Type Exports for TypeScript
// ============================================================================

export type ColorMode = 'light' | 'dark'
export type LabelColorKey = keyof typeof labelColors.light
export type FillColorKey = keyof typeof fillColors.light
export type SystemGrayKey = keyof typeof systemGrays.light
export type SystemBackgroundKey = keyof typeof systemBackgrounds.light
export type TintColorKey = keyof typeof systemTints
export type GlassMaterialKey = keyof typeof liquidGlassMaterials.light
export type SemanticColorKey = keyof typeof semanticColors
export type CopperColorKey = keyof typeof copperColors
export type CopperThemeKey = keyof typeof copperTheme.light
