# JobHunt Styling Guide

**Centralized styling system for easy theme management**

## 📍 Single Source of Truth: CSS Files

All styling in this project is defined in CSS files. To change themes or styling, edit these files:

```
src/app/
├── globals.css                 # Main entry point (imports all below)
├── styles/
│   ├── theme/
│   │   ├── base-colors.css           # macOS system colors & brand colors
│   │   ├── semantic-colors.css       # Labels, fills, glass, shadows
│   │   ├── legacy-shadcn.css         # Shadcn UI compatibility
│   │   └── tailwind-theme.css        # ⭐ Tailwind utility mappings
│   ├── animations/
│   │   ├── keyframes.css             # Animation definitions
│   │   └── animation-classes.css     # Animation utilities
│   ├── components/
│   │   ├── glass-effects.css         # Glass material styles
│   │   ├── avatars.css               # Avatar glass effects
│   │   ├── scrollbars.css            # Custom scrollbars
│   │   └── surfaces.css              # Surface treatments
│   └── utilities/
│       ├── gradients.css             # Gradient utilities
│       ├── shadows.css               # Shadow system
│       ├── typography.css            # Text color utilities
│       └── border-radius.css         # Border radius utilities
```

## 🎨 How to Change Themes

### Changing Colors

**Edit `/src/app/styles/theme/base-colors.css`:**

```css
:root {
  /* Brand colors */
  --copper: 25 95% 53%;           /* Change your brand color */
  --copper-light: 25 85% 65%;

  /* System tints */
  --tint-blue: 0, 122, 255;       /* Accent colors */
  --tint-purple: 175, 82, 222;
  /* ... */
}

.dark {
  /* Dark mode overrides */
  --tint-blue: 10, 132, 255;      /* Brighter in dark mode */
  /* ... */
}
```

### Changing Glass Effects

**Edit `/src/app/styles/theme/semantic-colors.css`:**

```css
:root {
  --glass-ultra: color-mix(in srgb, rgb(var(--glass-base-light)) 15%, transparent);
  --glass-light: color-mix(in srgb, rgb(var(--glass-base-light)) 25%, transparent);
  --glass-medium: color-mix(in srgb, rgb(var(--glass-base-light)) 35%, transparent);
  --glass-heavy: color-mix(in srgb, rgb(var(--glass-base-light)) 45%, transparent);
}
```

### Changing Shadows

**Edit `/src/app/styles/utilities/shadows.css`:**

```css
.shadow-glass-soft {
  box-shadow: var(--shadow-glass-soft);
}
/* Adjust in semantic-colors.css: */
/* --shadow-glass-soft: 0 6px 20px var(--shadow-soft), inset 0 3px 12px var(--shadow-specular); */
```

## 🛠️ Using Styles in Components

### ✅ Recommended: Tailwind Utilities

```tsx
<div className="
  bg-glass-medium
  border-glass-border-strong
  text-label-primary
  shadow-glass-soft
  rounded-glass-lg
">
  Content
</div>
```

### ✅ Recommended: CSS Variables

```tsx
<div style={{
  background: 'var(--glass-medium)',
  border: '1px solid var(--glass-border-strong)',
  color: 'var(--macos-label-primary)',
}}>
  Content
</div>
```

### ❌ Don't: Hardcoded Values

```tsx
// ❌ BAD - not theme-aware
<div style={{ background: '#ffffff', color: '#000000' }}>

// ❌ BAD - duplicate definitions
const colors = { primary: '#FF6B35' }
```

## 📋 Available Tailwind Utilities

All CSS variables are available as Tailwind utilities via `/src/app/styles/theme/tailwind-theme.css`:

### Colors

```html
<!-- Glass backgrounds -->
<div class="bg-glass-ultra">
<div class="bg-glass-light">
<div class="bg-glass-medium">
<div class="bg-glass-heavy">

<!-- Glass borders -->
<div class="border-glass-border-subtle">
<div class="border-glass-border-medium">
<div class="border-glass-border-strong">

<!-- Label text colors -->
<p class="text-label-primary">
<p class="text-label-secondary">
<p class="text-label-tertiary">
<p class="text-label-quaternary">

<!-- Brand colors -->
<div class="bg-copper">
<div class="text-copper-light">
<div class="border-copper-dark">

<!-- System tints -->
<div class="bg-tint-blue">
<div class="text-tint-purple">
<div class="border-tint-green">

<!-- Fill colors -->
<div class="bg-fill-primary">
<div class="bg-fill-secondary">

<!-- Semantic colors -->
<div class="text-success">
<div class="text-error">
<div class="text-warning">
<div class="text-info">
```

### Shadows

```html
<div class="shadow-glass-subtle">
<div class="shadow-glass-soft">
<div class="shadow-glass-medium">
<div class="shadow-glass-strong">
```

### Border Radius

```html
<div class="rounded-glass-sm">
<div class="rounded-glass">
<div class="rounded-glass-lg">
<div class="rounded-glass-xl">
```

## 🎯 Design System Values

### Colors (RGB format)

```css
--tint-blue: 0, 122, 255
--tint-purple: 175, 82, 222
--tint-pink: 255, 45, 85
--tint-red: 255, 59, 48
--tint-orange: 255, 149, 0
--tint-yellow: 255, 204, 0
--tint-green: 52, 199, 89
--tint-teal: 90, 200, 250
--tint-indigo: 88, 86, 214
```

Use as: `rgb(var(--tint-blue))`

### Brand Colors (HSL format)

```css
--copper: 25 95% 53%
--copper-light: 25 85% 65%
--copper-dark: 25 100% 45%
--copper-glow: 25 95% 70%
--copper-shimmer: 25 90% 75%
```

Use as: `hsl(var(--copper))`

## 🔄 Light & Dark Modes

Colors automatically switch based on `.dark` class:

```css
:root {
  --macos-label-primary: color-mix(in srgb, rgb(var(--macos-base-black)) 84.7%, transparent);
}

.dark {
  --macos-label-primary: color-mix(in srgb, rgb(var(--macos-base-white)) 84.7%, transparent);
}
```

## 📝 Adding New Colors

1. **Define in base-colors.css:**
   ```css
   --custom-color: 180, 100, 200; /* RGB format */
   ```

2. **Add to tailwind-theme.css:**
   ```css
   @theme inline {
     --color-custom: rgb(var(--custom-color));
   }
   ```

3. **Use in components:**
   ```tsx
   <div className="bg-custom text-custom border-custom">
   ```

## 🚫 What NOT to Do

1. ❌ **Don't create separate TypeScript color definitions**
2. ❌ **Don't hardcode colors in components**
3. ❌ **Don't use hex colors for theme values**
4. ❌ **Don't bypass CSS variables with inline styles**
5. ❌ **Don't create component-specific color files**

## ✅ Best Practices

1. ✅ **Always use CSS variables or Tailwind utilities**
2. ✅ **Keep all colors in theme CSS files**
3. ✅ **Use semantic names (e.g., `--glass-medium` not `--bg-35-opacity`)**
4. ✅ **Test in both light and dark modes**
5. ✅ **Use RGB/HSL formats for dynamic color manipulation**

## 🔍 Finding Where to Edit

| What to Change | File to Edit |
|----------------|--------------|
| Brand color | `styles/theme/base-colors.css` |
| Glass opacity | `styles/theme/semantic-colors.css` |
| Shadow intensity | `styles/theme/semantic-colors.css` |
| Button hover effect | `components/ui/button.tsx` (component) |
| New color utility | `styles/theme/tailwind-theme.css` |
| Animation timing | `styles/animations/keyframes.css` |
| Typography colors | `styles/utilities/typography.css` |

## 🎓 Learning Resources

- **Tailwind v4 Docs**: https://tailwindcss.com/docs
- **CSS Custom Properties**: https://developer.mozilla.org/en-US/docs/Web/CSS/--*
- **Color-mix()**: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix

---

**Remember**: All theme changes should be made in CSS files only. This ensures a single source of truth and makes the project easy to maintain and customize.
