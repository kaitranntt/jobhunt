/**
 * macOS 26 "Liquid Glass" Design System
 * Central export file for all design tokens
 */

// Color System
export {
  labelColors,
  fillColors,
  systemGrays,
  systemBackgrounds,
  systemTints,
  liquidGlassMaterials,
  glassBorders,
  semanticColors,
  shadowColors,
  copperColors,
  copperTheme,
  copperGradients,
  generateCSSVariables,
  type ColorMode,
  type LabelColorKey,
  type FillColorKey,
  type SystemGrayKey,
  type SystemBackgroundKey,
  type TintColorKey,
  type GlassMaterialKey,
  type SemanticColorKey,
  type CopperColorKey,
  type CopperThemeKey,
} from './colors'

// Spacing System
export {
  BASE_UNIT,
  HALF_STEP,
  spacing,
  spacingValues,
  componentSpacing,
  borderRadius,
  tailwindSpacing,
  tailwindBorderRadius,
  generateSpacingCSSVariables,
  getSpacing,
  getTailwindSpacing,
  type SpacingKey,
  type ComponentSpacingKey,
  type BorderRadiusKey,
} from './spacing'

// Typography System
export {
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacing,
  typographyPresets,
  tailwindTypography,
  generateTypographyCSSVariables,
  type FontSizeKey,
  type FontWeightKey,
  type LineHeightKey,
  type LetterSpacingKey,
  type TypographyPresetKey,
} from './typography'

// Re-import the generator functions for the utility
import { generateCSSVariables } from './colors'
import { generateSpacingCSSVariables } from './spacing'
import { generateTypographyCSSVariables } from './typography'

// Utility: Generate all CSS variables for both modes
export function generateAllCSSVariables(mode: 'light' | 'dark'): Record<string, string> {
  return {
    ...generateCSSVariables(mode),
    ...generateSpacingCSSVariables(),
    ...generateTypographyCSSVariables(),
  }
}
