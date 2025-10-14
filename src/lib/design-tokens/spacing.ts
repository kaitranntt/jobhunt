/**
 * macOS 26 "Liquid Glass" Spacing System
 * 8pt grid system with half-step support
 */

// ============================================================================
// Base Spacing Units
// ============================================================================

export const BASE_UNIT = 8 // 8px base
export const HALF_STEP = 4 // 4px half-step

// ============================================================================
// Spacing Scale (8pt Grid System)
// ============================================================================

export const spacing = {
  0: '0px', // 0
  0.5: '4px', // 0.5 * 8 = 4px (half-step)
  1: '8px', // 1 * 8 = 8px
  1.5: '12px', // 1.5 * 8 = 12px
  2: '16px', // 2 * 8 = 16px
  3: '24px', // 3 * 8 = 24px
  4: '32px', // 4 * 8 = 32px
  5: '40px', // 5 * 8 = 40px
  6: '48px', // 6 * 8 = 48px
  7: '56px', // 7 * 8 = 56px
  8: '64px', // 8 * 8 = 64px
  9: '72px', // 9 * 8 = 72px
  10: '80px', // 10 * 8 = 80px
  12: '96px', // 12 * 8 = 96px
  16: '128px', // 16 * 8 = 128px
  20: '160px', // 20 * 8 = 160px
  24: '192px', // 24 * 8 = 192px
} as const

// ============================================================================
// Numeric Spacing Values (for calculations)
// ============================================================================

export const spacingValues = {
  0: 0,
  0.5: 4,
  1: 8,
  1.5: 12,
  2: 16,
  3: 24,
  4: 32,
  5: 40,
  6: 48,
  7: 56,
  8: 64,
  9: 72,
  10: 80,
  12: 96,
  16: 128,
  20: 160,
  24: 192,
} as const

// ============================================================================
// Semantic Spacing (Component-Level)
// ============================================================================

export const componentSpacing = {
  // Container Padding
  containerPaddingXs: spacing[2], // 16px - Mobile
  containerPaddingSm: spacing[4], // 32px - Tablet
  containerPaddingMd: spacing[6], // 48px - Desktop
  containerPaddingLg: spacing[8], // 64px - Large screens

  // Card Padding
  cardPaddingCompact: spacing[2], // 16px
  cardPaddingDefault: spacing[3], // 24px
  cardPaddingComfortable: spacing[4], // 32px

  // Stack Spacing (Vertical)
  stackXs: spacing[1], // 8px
  stackSm: spacing[2], // 16px
  stackMd: spacing[3], // 24px
  stackLg: spacing[4], // 32px
  stackXl: spacing[6], // 48px

  // Inline Spacing (Horizontal)
  inlineXs: spacing[0.5], // 4px
  inlineSm: spacing[1], // 8px
  inlineMd: spacing[2], // 16px
  inlineLg: spacing[3], // 24px
  inlineXl: spacing[4], // 32px

  // Section Spacing
  sectionXs: spacing[4], // 32px
  sectionSm: spacing[6], // 48px
  sectionMd: spacing[8], // 64px
  sectionLg: spacing[10], // 80px
  sectionXl: spacing[12], // 96px

  // Component Gaps
  gapXs: spacing[0.5], // 4px
  gapSm: spacing[1], // 8px
  gapMd: spacing[2], // 16px
  gapLg: spacing[3], // 24px
  gapXl: spacing[4], // 32px
} as const

// ============================================================================
// Border Radius (Following 4pt Baseline Grid)
// ============================================================================

export const borderRadius = {
  none: '0px',
  sm: '4px', // 4px - Subtle rounding
  default: '8px', // 8px - Standard rounding
  md: '12px', // 12px - Liquid Glass small
  lg: '20px', // 20px - Liquid Glass default
  xl: '32px', // 32px (2rem) - Liquid Glass large
  '2xl': '40px', // 40px - Extra large
  full: '9999px', // Full rounded (pills)
} as const

// ============================================================================
// Tailwind-Compatible Spacing Configuration
// ============================================================================

export const tailwindSpacing = {
  0: '0px',
  0.5: '4px',
  1: '8px',
  1.5: '12px',
  2: '16px',
  3: '24px',
  4: '32px',
  5: '40px',
  6: '48px',
  7: '56px',
  8: '64px',
  9: '72px',
  10: '80px',
  12: '96px',
  16: '128px',
  20: '160px',
  24: '192px',
}

// ============================================================================
// Tailwind-Compatible Border Radius Configuration
// ============================================================================

export const tailwindBorderRadius = {
  none: '0px',
  sm: '4px',
  DEFAULT: '8px',
  md: '12px',
  lg: '20px',
  xl: '32px',
  '2xl': '40px',
  full: '9999px',
  'glass-sm': '12px', // Liquid Glass small
  glass: '20px', // Liquid Glass default
  'glass-lg': '32px', // Liquid Glass large
}

// ============================================================================
// CSS Custom Properties Generator
// ============================================================================

export function generateSpacingCSSVariables(): Record<string, string> {
  return {
    // Base Spacing
    '--spacing-0': spacing[0],
    '--spacing-0-5': spacing[0.5],
    '--spacing-1': spacing[1],
    '--spacing-1-5': spacing[1.5],
    '--spacing-2': spacing[2],
    '--spacing-3': spacing[3],
    '--spacing-4': spacing[4],
    '--spacing-5': spacing[5],
    '--spacing-6': spacing[6],
    '--spacing-7': spacing[7],
    '--spacing-8': spacing[8],
    '--spacing-9': spacing[9],
    '--spacing-10': spacing[10],
    '--spacing-12': spacing[12],
    '--spacing-16': spacing[16],
    '--spacing-20': spacing[20],
    '--spacing-24': spacing[24],

    // Container Padding
    '--container-padding-xs': componentSpacing.containerPaddingXs,
    '--container-padding-sm': componentSpacing.containerPaddingSm,
    '--container-padding-md': componentSpacing.containerPaddingMd,
    '--container-padding-lg': componentSpacing.containerPaddingLg,

    // Card Padding
    '--card-padding-compact': componentSpacing.cardPaddingCompact,
    '--card-padding-default': componentSpacing.cardPaddingDefault,
    '--card-padding-comfortable': componentSpacing.cardPaddingComfortable,

    // Stack Spacing
    '--stack-xs': componentSpacing.stackXs,
    '--stack-sm': componentSpacing.stackSm,
    '--stack-md': componentSpacing.stackMd,
    '--stack-lg': componentSpacing.stackLg,
    '--stack-xl': componentSpacing.stackXl,

    // Inline Spacing
    '--inline-xs': componentSpacing.inlineXs,
    '--inline-sm': componentSpacing.inlineSm,
    '--inline-md': componentSpacing.inlineMd,
    '--inline-lg': componentSpacing.inlineLg,
    '--inline-xl': componentSpacing.inlineXl,

    // Section Spacing
    '--section-xs': componentSpacing.sectionXs,
    '--section-sm': componentSpacing.sectionSm,
    '--section-md': componentSpacing.sectionMd,
    '--section-lg': componentSpacing.sectionLg,
    '--section-xl': componentSpacing.sectionXl,

    // Component Gaps
    '--gap-xs': componentSpacing.gapXs,
    '--gap-sm': componentSpacing.gapSm,
    '--gap-md': componentSpacing.gapMd,
    '--gap-lg': componentSpacing.gapLg,
    '--gap-xl': componentSpacing.gapXl,

    // Border Radius
    '--radius-none': borderRadius.none,
    '--radius-sm': borderRadius.sm,
    '--radius-default': borderRadius.default,
    '--radius-md': borderRadius.md,
    '--radius-lg': borderRadius.lg,
    '--radius-xl': borderRadius.xl,
    '--radius-2xl': borderRadius['2xl'],
    '--radius-full': borderRadius.full,
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate spacing value based on multiplier
 * @param multiplier - Number of base units (supports 0.5 increments)
 * @returns Spacing value in pixels
 */
export function getSpacing(multiplier: number): string {
  const value = multiplier * BASE_UNIT
  return `${value}px`
}

/**
 * Get spacing value for Tailwind classes
 * @param key - Spacing key from spacing scale
 * @returns Spacing value
 */
export function getTailwindSpacing(key: keyof typeof spacing): string {
  return spacing[key]
}

// ============================================================================
// Type Exports
// ============================================================================

export type SpacingKey = keyof typeof spacing
export type ComponentSpacingKey = keyof typeof componentSpacing
export type BorderRadiusKey = keyof typeof borderRadius
