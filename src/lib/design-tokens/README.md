# macOS 26 "Liquid Glass" Design System

Production-ready design tokens for JobHunt's macOS 26-inspired UI redesign.

## Overview

This design system implements the "Liquid Glass" aesthetic with:

- **RGBA-based color system** for proper alpha channel support
- **8pt grid spacing system** for consistent layouts
- **Responsive typography scale** following 4pt baseline grid
- **Spring physics animations** for natural motion
- **Depth-based shadow system** with specular highlights

## Quick Start

### TypeScript/React Usage

```typescript
import {
  labelColors,
  spacing,
  fontSizes,
  systemTints,
  liquidGlassMaterials
} from '@/lib/design-tokens';

// Use in components
const MyComponent = () => (
  <div style={{
    color: labelColors.light.primary,
    padding: spacing[3], // 24px
    fontSize: fontSizes.body, // 16px
    background: liquidGlassMaterials.light.medium,
  }}>
    Content
  </div>
);
```

### CSS/Tailwind Usage

```css
/* Use CSS custom properties */
.my-element {
  color: var(--macos-label-primary);
  padding: var(--spacing-3);
  font-size: var(--font-size-body);
  background: var(--glass-medium);
}

/* Or use utility classes */
.my-glass-card {
  @apply glass-medium rounded-glass-lg shadow-glass-medium;
  @apply text-label-primary;
  @apply animate-spring-bounce-in;
}
```

## Design Token Files

### `colors.ts`

macOS 26 semantic color system with RGBA values for both light and dark modes.

**Available exports:**

- `labelColors` - Text colors (primary, secondary, tertiary, quaternary)
- `fillColors` - Background fill colors
- `systemGrays` - Gray scale (gray1-gray6)
- `systemBackgrounds` - Surface backgrounds
- `systemTints` - Accent colors (blue, purple, pink, etc.)
- `liquidGlassMaterials` - Glass material backgrounds (ultra, light, medium, heavy)
- `glassBorders` - Glass border colors (subtle, medium, strong)
- `semanticColors` - Success, warning, error, info
- `shadowColors` - Shadow colors for depth

**CSS Variables:**

```css
/* Label Colors */
--macos-label-primary
--macos-label-secondary
--macos-label-tertiary
--macos-label-quaternary

/* Liquid Glass */
--glass-ultra
--glass-light
--glass-medium
--glass-heavy

/* System Tints */
--tint-blue
--tint-purple
--tint-green
/* ... and more */
```

### `spacing.ts`

8pt grid system with semantic component spacing.

**Available exports:**

- `spacing` - Base spacing scale (0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 16, 20, 24)
- `componentSpacing` - Semantic spacing (containerPadding, cardPadding, stack, inline, section, gap)
- `borderRadius` - Border radius values (sm: 4px, default: 8px, md: 12px, lg: 20px, xl: 32px)

**Examples:**

```typescript
import { spacing, componentSpacing } from '@/lib/design-tokens'

// Base spacing
padding: spacing[3] // 24px

// Component spacing
padding: componentSpacing.cardPaddingDefault // 24px
gap: componentSpacing.stackMd // 24px
```

### `typography.ts`

Responsive typography scale with proper line heights and letter spacing.

**Available exports:**

- `fontSizes` - Display, title, heading, body, UI sizes
- `fontWeights` - regular (400), medium (500), semibold (600), bold (700)
- `lineHeights` - display, title, heading, body, ui
- `letterSpacing` - tighter, tight, normal, wide, wider, widest
- `typographyPresets` - Complete style presets

**Examples:**

```typescript
import { typographyPresets } from '@/lib/design-tokens'

// Use complete preset
const TitleText = styled.h1({
  ...typographyPresets.titleLg,
})

// Or individual tokens
fontSize: fontSizes.titleLg.desktop // 48px on desktop
fontWeight: fontWeights.semibold // 600
lineHeight: lineHeights.title // 1.2
```

## CSS Utility Classes

### Liquid Glass Materials

```html
<!-- Glass variants -->
<div class="glass-ultra">Ultra-light glass (15px blur)</div>
<div class="glass-light">Light glass (20px blur)</div>
<div class="glass-medium">Medium glass (30px blur)</div>
<div class="glass-heavy">Heavy glass (40px blur)</div>
<div class="glass-frosted">Frosted glass (40px blur + brightness)</div>

<!-- Default liquid glass -->
<div class="liquid-glass">Default liquid glass effect</div>
```

### Border Radius

```html
<div class="rounded-glass-sm">12px radius</div>
<div class="rounded-glass">20px radius (default)</div>
<div class="rounded-glass-lg">32px radius</div>
<div class="rounded-glass-xl">40px radius</div>
```

### Shadows

```html
<!-- Glass shadows (with specular highlights) -->
<div class="shadow-glass-subtle">Subtle glass shadow</div>
<div class="shadow-glass-soft">Soft glass shadow</div>
<div class="shadow-glass-medium">Medium glass shadow</div>
<div class="shadow-glass-strong">Strong glass shadow</div>
<div class="shadow-glass-dramatic">Dramatic glass shadow</div>

<!-- Depth shadows (without specular) -->
<div class="shadow-depth-1">Depth layer 1</div>
<div class="shadow-depth-2">Depth layer 2</div>
<div class="shadow-depth-3">Depth layer 3</div>
<div class="shadow-depth-4">Depth layer 4</div>
<div class="shadow-depth-5">Depth layer 5</div>

<!-- Special effects -->
<div class="shadow-refraction">Refraction shadow</div>
```

### Spring Animations

```html
<!-- Spring physics animations -->
<div class="animate-spring-bounce">Spring bounce</div>
<div class="animate-spring-bounce-in">Spring bounce in</div>
<div class="animate-glass-shimmer">Glass shimmer effect</div>
<div class="animate-depth-float">Floating with depth</div>
<div class="animate-refraction">Refraction shift</div>
<div class="animate-specular-glint">Specular glint</div>
```

### Interactive States

```html
<!-- Interactive glass element -->
<button class="glass-interactive rounded-glass-lg">Hover me for spring physics</button>

<!-- Glass button -->
<button class="btn-glass rounded-glass">Glass Button</button>
```

### Surface Treatments

```html
<!-- macOS system backgrounds -->
<div class="surface-primary">Primary background</div>
<div class="surface-secondary">Secondary background</div>
<div class="surface-tertiary">Tertiary background</div>

<!-- macOS fill colors -->
<div class="surface-fill-primary">Primary fill</div>
<div class="surface-fill-secondary">Secondary fill</div>
<div class="surface-fill-tertiary">Tertiary fill</div>
```

### Typography Colors

```html
<!-- macOS label colors -->
<p class="text-label-primary">Primary label (highest contrast)</p>
<p class="text-label-secondary">Secondary label</p>
<p class="text-label-tertiary">Tertiary label</p>
<p class="text-label-quaternary">Quaternary label (lowest contrast)</p>
```

## Complete Component Example

```tsx
import { spacing, borderRadius } from '@/lib/design-tokens'

export const GlassCard = ({ children }: { children: React.ReactNode }) => (
  <div
    className="
      glass-medium
      rounded-glass-lg
      shadow-glass-medium
      glass-interactive
      animate-spring-bounce-in
    "
    style={{
      padding: spacing[4], // 32px
      borderRadius: borderRadius.lg, // 20px
    }}
  >
    <h2 className="text-label-primary" style={{ fontSize: '24px', fontWeight: 600 }}>
      Card Title
    </h2>
    <p className="text-label-secondary" style={{ fontSize: '16px', marginTop: spacing[2] }}>
      {children}
    </p>
  </div>
)
```

## Color Modes

All design tokens support both light and dark modes automatically via CSS custom properties.

**Light Mode:** Uses lighter backgrounds with darker text
**Dark Mode:** Uses darker backgrounds with lighter text

The `.dark` class on the root element switches to dark mode tokens.

## Best Practices

1. **Use CSS Variables in CSS:** `var(--macos-label-primary)` for dynamic theming
2. **Use TypeScript Tokens in React:** Import from `@/lib/design-tokens` for type safety
3. **Follow 8pt Grid:** Use spacing scale values (0.5, 1, 1.5, 2, 3, 4, etc.)
4. **Responsive Typography:** Use responsive font size objects for titles/displays
5. **Glass Materials:** Match blur intensity to content importance (heavy blur = more separation)
6. **Shadows:** Combine glass shadows with proper border radius for cohesive look
7. **Animations:** Use spring animations for interactive elements only

## Accessibility

- **Label Colors:** Follow macOS contrast ratios (primary: 0.847 alpha meets WCAG AA)
- **Focus States:** Use `--tint-blue` for focus rings
- **Semantic Colors:** success (green), warning (yellow), error (red), info (blue)
- **Reduced Motion:** Consider adding `prefers-reduced-motion` media queries for animations

## Migration from Old System

```diff
- background: hsl(var(--background))
+ background: var(--macos-bg-primary)

- color: hsl(var(--foreground))
+ color: var(--macos-label-primary)

- className="glass"
+ className="glass-medium rounded-glass shadow-glass-medium"

- padding: "1rem"
+ padding: spacing[2] // 16px
```

## Browser Support

- Modern browsers with backdrop-filter support (Chrome 76+, Safari 9+, Firefox 103+)
- Fallback: background colors work without backdrop-filter
- Spring animations: All modern browsers with CSS animations support

## Resources

- [macOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/macos)
- [SF Pro Font](https://developer.apple.com/fonts/)
- [Spring Physics in CSS](https://www.joshwcomeau.com/animation/css-transitions/)
