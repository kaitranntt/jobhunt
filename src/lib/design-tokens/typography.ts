/**
 * macOS 26 "Liquid Glass" Typography System
 * Font sizes, weights, and line heights following 4pt baseline grid
 */

// ============================================================================
// Font Families
// ============================================================================

export const fontFamilies = {
  system: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", system-ui, sans-serif`,
  mono: `"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace`,
} as const

// ============================================================================
// Font Sizes (Responsive Scale)
// ============================================================================

export const fontSizes = {
  // Display Titles (Hero sections) - Aggressive 50% smaller
  displayLg: {
    mobile: '20px', // Mobile: 20px (↓50% from 40px)
    tablet: '28px', // Tablet: 28px (↓50% from 56px)
    desktop: '36px', // Desktop: 36px (↓50% from 72px)
  },
  displayMd: {
    mobile: '18px', // Mobile: 18px (↓44% from 32px)
    tablet: '24px', // Tablet: 24px (↓40% from 40px)
    desktop: '32px', // Desktop: 32px (↓43% from 56px)
  },
  displaySm: {
    mobile: '16px', // Mobile: 16px (↓43% from 28px)
    tablet: '20px', // Tablet: 20px (↓37% from 32px)
    desktop: '24px', // Desktop: 24px (↓40% from 40px)
  },

  // Page Titles - Aggressive 35% smaller
  titleLg: {
    mobile: '20px', // Mobile: 20px (↓38% from 32px)
    tablet: '24px', // Tablet: 24px (↓40% from 40px)
    desktop: '28px', // Desktop: 28px (↓42% from 48px)
  },
  titleMd: {
    mobile: '18px', // Mobile: 18px (↓36% from 28px)
    tablet: '22px', // Tablet: 22px (↓31% from 32px)
    desktop: '26px', // Desktop: 26px (↓35% from 40px)
  },
  titleSm: {
    mobile: '16px', // Mobile: 16px (↓33% from 24px)
    tablet: '20px', // Tablet: 20px (↓29% from 28px)
    desktop: '22px', // Desktop: 22px (↓31% from 32px)
  },

  // Section Headings
  headingLg: '24px', // 24px
  headingMd: '20px', // 20px
  headingSm: '18px', // 18px

  // Body Text
  bodyLg: '18px', // 18px - Large body text
  body: '16px', // 16px - Default body text
  bodySm: '14px', // 14px - Secondary body text
  bodyXs: '12px', // 12px - Tertiary body text

  // UI Elements
  uiLg: '16px', // 16px - Large UI text (buttons, inputs)
  ui: '14px', // 14px - Default UI text
  uiSm: '12px', // 12px - Small UI text (labels, captions)
  uiXs: '11px', // 11px - Tiny UI text (badges, tags)
} as const

// ============================================================================
// Font Weights
// ============================================================================

export const fontWeights = {
  regular: 400, // Regular body text
  medium: 500, // Medium UI elements, subheadings
  semibold: 600, // Semibold titles, important UI
  bold: 700, // Bold emphasis (rarely used in macOS)
} as const

// ============================================================================
// Line Heights (4pt Baseline Grid)
// ============================================================================

export const lineHeights = {
  // Display & Titles (Tighter)
  display: 1.1, // 110% - Display text
  title: 1.2, // 120% - Page titles
  heading: 1.3, // 130% - Section headings

  // Body Text (Standard)
  body: 1.5, // 150% - Body text (24px at 16px font)
  bodyRelaxed: 1.6, // 160% - Relaxed body text

  // UI Elements (Compact)
  ui: 1.4, // 140% - UI elements
  uiTight: 1.2, // 120% - Tight UI (buttons, inputs)

  // Special
  none: 1, // 100% - No extra line height
} as const

// ============================================================================
// Letter Spacing (Tracking)
// ============================================================================

export const letterSpacing = {
  tighter: '-0.02em', // -2% - Display titles
  tight: '-0.01em', // -1% - Titles
  normal: '0em', // 0% - Default
  wide: '0.01em', // 1% - UI elements
  wider: '0.02em', // 2% - All caps, small text
  widest: '0.05em', // 5% - Extra wide (labels, badges)
} as const

// ============================================================================
// Typography Presets (Complete Styles)
// ============================================================================

export const typographyPresets = {
  // Display
  displayLg: {
    fontSize: fontSizes.displayLg,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.display,
    letterSpacing: letterSpacing.tighter,
  },
  displayMd: {
    fontSize: fontSizes.displayMd,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.display,
    letterSpacing: letterSpacing.tighter,
  },
  displaySm: {
    fontSize: fontSizes.displaySm,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.display,
    letterSpacing: letterSpacing.tight,
  },

  // Titles
  titleLg: {
    fontSize: fontSizes.titleLg,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.title,
    letterSpacing: letterSpacing.tight,
  },
  titleMd: {
    fontSize: fontSizes.titleMd,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.title,
    letterSpacing: letterSpacing.tight,
  },
  titleSm: {
    fontSize: fontSizes.titleSm,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.title,
    letterSpacing: letterSpacing.normal,
  },

  // Headings
  headingLg: {
    fontSize: fontSizes.headingLg,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.heading,
    letterSpacing: letterSpacing.normal,
  },
  headingMd: {
    fontSize: fontSizes.headingMd,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.heading,
    letterSpacing: letterSpacing.normal,
  },
  headingSm: {
    fontSize: fontSizes.headingSm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.heading,
    letterSpacing: letterSpacing.normal,
  },

  // Body
  bodyLg: {
    fontSize: fontSizes.bodyLg,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.body,
    letterSpacing: letterSpacing.normal,
  },
  body: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.body,
    letterSpacing: letterSpacing.normal,
  },
  bodySm: {
    fontSize: fontSizes.bodySm,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.body,
    letterSpacing: letterSpacing.normal,
  },
  bodyXs: {
    fontSize: fontSizes.bodyXs,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.body,
    letterSpacing: letterSpacing.wide,
  },

  // UI
  uiLg: {
    fontSize: fontSizes.uiLg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.ui,
    letterSpacing: letterSpacing.normal,
  },
  ui: {
    fontSize: fontSizes.ui,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.ui,
    letterSpacing: letterSpacing.normal,
  },
  uiSm: {
    fontSize: fontSizes.uiSm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.ui,
    letterSpacing: letterSpacing.wide,
  },
  uiXs: {
    fontSize: fontSizes.uiXs,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.uiTight,
    letterSpacing: letterSpacing.wider,
  },
} as const

// ============================================================================
// Tailwind-Compatible Typography Configuration
// ============================================================================

export const tailwindTypography = {
  fontFamily: {
    sans: fontFamilies.system.split(', '),
    mono: fontFamilies.mono.split(', '),
  },
  fontSize: {
    // Display
    'display-lg': [
      fontSizes.displayLg.desktop,
      { lineHeight: lineHeights.display, letterSpacing: letterSpacing.tighter },
    ],
    'display-md': [
      fontSizes.displayMd.desktop,
      { lineHeight: lineHeights.display, letterSpacing: letterSpacing.tighter },
    ],
    'display-sm': [
      fontSizes.displaySm.desktop,
      { lineHeight: lineHeights.display, letterSpacing: letterSpacing.tight },
    ],

    // Titles
    'title-lg': [
      fontSizes.titleLg.desktop,
      { lineHeight: lineHeights.title, letterSpacing: letterSpacing.tight },
    ],
    'title-md': [
      fontSizes.titleMd.desktop,
      { lineHeight: lineHeights.title, letterSpacing: letterSpacing.tight },
    ],
    'title-sm': [
      fontSizes.titleSm.desktop,
      { lineHeight: lineHeights.title, letterSpacing: letterSpacing.normal },
    ],

    // Headings
    'heading-lg': [fontSizes.headingLg, { lineHeight: lineHeights.heading }],
    'heading-md': [fontSizes.headingMd, { lineHeight: lineHeights.heading }],
    'heading-sm': [fontSizes.headingSm, { lineHeight: lineHeights.heading }],

    // Body
    'body-lg': [fontSizes.bodyLg, { lineHeight: lineHeights.body }],
    body: [fontSizes.body, { lineHeight: lineHeights.body }],
    'body-sm': [fontSizes.bodySm, { lineHeight: lineHeights.body }],
    'body-xs': [fontSizes.bodyXs, { lineHeight: lineHeights.body }],

    // UI
    'ui-lg': [fontSizes.uiLg, { lineHeight: lineHeights.ui }],
    ui: [fontSizes.ui, { lineHeight: lineHeights.ui }],
    'ui-sm': [fontSizes.uiSm, { lineHeight: lineHeights.ui }],
    'ui-xs': [fontSizes.uiXs, { lineHeight: lineHeights.uiTight }],
  },
  fontWeight: {
    regular: fontWeights.regular,
    medium: fontWeights.medium,
    semibold: fontWeights.semibold,
    bold: fontWeights.bold,
  },
  lineHeight: {
    display: lineHeights.display,
    title: lineHeights.title,
    heading: lineHeights.heading,
    body: lineHeights.body,
    'body-relaxed': lineHeights.bodyRelaxed,
    ui: lineHeights.ui,
    'ui-tight': lineHeights.uiTight,
    none: lineHeights.none,
  },
  letterSpacing: {
    tighter: letterSpacing.tighter,
    tight: letterSpacing.tight,
    normal: letterSpacing.normal,
    wide: letterSpacing.wide,
    wider: letterSpacing.wider,
    widest: letterSpacing.widest,
  },
}

// ============================================================================
// CSS Custom Properties Generator
// ============================================================================

export function generateTypographyCSSVariables(): Record<string, string> {
  return {
    // Font Families
    '--font-sans': fontFamilies.system,
    '--font-mono': fontFamilies.mono,

    // Font Weights
    '--font-weight-regular': fontWeights.regular.toString(),
    '--font-weight-medium': fontWeights.medium.toString(),
    '--font-weight-semibold': fontWeights.semibold.toString(),
    '--font-weight-bold': fontWeights.bold.toString(),

    // Line Heights
    '--line-height-display': lineHeights.display.toString(),
    '--line-height-title': lineHeights.title.toString(),
    '--line-height-heading': lineHeights.heading.toString(),
    '--line-height-body': lineHeights.body.toString(),
    '--line-height-body-relaxed': lineHeights.bodyRelaxed.toString(),
    '--line-height-ui': lineHeights.ui.toString(),
    '--line-height-ui-tight': lineHeights.uiTight.toString(),

    // Letter Spacing
    '--letter-spacing-tighter': letterSpacing.tighter,
    '--letter-spacing-tight': letterSpacing.tight,
    '--letter-spacing-normal': letterSpacing.normal,
    '--letter-spacing-wide': letterSpacing.wide,
    '--letter-spacing-wider': letterSpacing.wider,
    '--letter-spacing-widest': letterSpacing.widest,

    // Font Sizes
    '--font-size-display-lg-mobile': fontSizes.displayLg.mobile,
    '--font-size-display-lg-tablet': fontSizes.displayLg.tablet,
    '--font-size-display-lg-desktop': fontSizes.displayLg.desktop,
    '--font-size-body': fontSizes.body,
    '--font-size-body-sm': fontSizes.bodySm,
    '--font-size-body-xs': fontSizes.bodyXs,
    '--font-size-ui': fontSizes.ui,
    '--font-size-ui-sm': fontSizes.uiSm,
    '--font-size-ui-xs': fontSizes.uiXs,
  }
}

// ============================================================================
// Type Exports
// ============================================================================

export type FontSizeKey = keyof typeof fontSizes
export type FontWeightKey = keyof typeof fontWeights
export type LineHeightKey = keyof typeof lineHeights
export type LetterSpacingKey = keyof typeof letterSpacing
export type TypographyPresetKey = keyof typeof typographyPresets
