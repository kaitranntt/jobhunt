# JobHunt Design Guidelines

This document outlines the design system, patterns, and guidelines for the JobHunt application.

## Design System Overview

### Design Philosophy

JobHunt uses **macOS 26 "Liquid Glass"** - a modern glass-morphism design system inspired by Apple's aesthetics. The design emphasizes:

- **Clarity and Simplicity**: Clean, uncluttered interfaces
- **Depth and Dimension**: Realistic glass materials with proper blur and lighting
- **Fluid Interactions**: Smooth animations and micro-interactions
- **Accessibility**: WCAG 2.1 AA compliance for all users
- **Responsive Design**: Mobile-first approach with seamless scaling

## Visual Design System

### Glass Morphism Materials

#### Glass Variants

- **Glass Ultra** (`glass-ultra`): Most transparent, minimal blur (15px)
- **Glass Light** (`glass-light`): Light glass with medium blur (20px)
- **Glass Medium** (`glass-medium`): Standard glass with blur (30px)
- **Glass Heavy** (`glass-heavy`): Most opaque, heavy blur (40px)

#### Usage Guidelines

- **Glass Ultra**: Backgrounds, subtle overlays, secondary content
- **Glass Light**: Cards, buttons, interactive elements
- **Glass Medium**: Modal backgrounds, panels, dropdowns
- **Glass Heavy**: Main overlays, critical dialogs, headers

### Color System

#### Semantic Colors

```css
--macos-label-primary: rgba(0, 0, 0, 0.847) /* Main text */
  --macos-label-secondary: rgba(0, 0, 0, 0.498) /* Secondary text */
  --macos-label-tertiary: rgba(0, 0, 0, 0.259) /* Tertiary text */
  --macos-label-quaternary: rgba(0, 0, 0, 0.098) /* Disabled text */;
```

#### Brand Colors

```css
--copper: 25 95% 53% /* Primary brand color */ --copper-light: 25 85% 65% /* Light variant */
  --copper-dark: 25 100% 45% /* Dark variant */;
```

#### Column Color Palette

Custom columns support 10 predefined colors:

- **Blue**: Primary actions, information
- **Purple**: Creative, premium features
- **Pink**: Social, community features
- **Red**: Destructive actions, errors
- **Orange**: Warnings, attention required
- **Yellow**: Highlights, important info
- **Green**: Success, completion
- **Teal**: Alternative primary
- **Indigo**: Premium, advanced features
- **Slate**: Neutral, archival content

### Typography

#### Type Scale (4pt baseline grid)

```css
--text-xs: 11px / 1.4 /* Labels, metadata */ --text-sm: 13px / 1.4 /* Body text, captions */
  --text-base: 15px / 1.5 /* Standard body */ --text-lg: 17px / 1.5 /* Large body */
  --text-xl: 19px / 1.5 /* Subheadings */ --text-2xl: 23px / 1.4 /* Headings */ --text-3xl: 27px /
  1.3 /* Large headings */;
```

#### Font Families

- **Primary**: Inter, system-ui, sans-serif
- **Monospace**: SF Mono, Monaco, monospace
- **Vietnamese Support**: Ensure fonts support Vietnamese diacritics

### Spacing System

#### 8pt Grid System

```css
--space-1: 4px /* Micro spacing */ --space-2: 8px /* Small spacing */ --space-3: 12px
  /* Medium spacing */ --space-4: 16px /* Standard spacing */ --space-6: 24px /* Large spacing */
  --space-8: 32px /* Extra large */ --space-12: 48px /* Section spacing */ --space-16: 64px
  /* Page sections */;
```

## Component Patterns

### Cards

#### Glass Card Pattern

```jsx
<div className="glass-light rounded-glass p-6 shadow-glass-soft border border-label-quaternary/20">
  {/* Card content */}
</div>
```

#### Card Variants

- **Standard**: `glass-light` with `shadow-glass-soft`
- **Interactive**: Add hover effects with `hover:shadow-glass-dramatic`
- **Selected**: `glass-medium` with `ring-2 ring-copper/50`

### Buttons

#### Primary Button

```jsx
<Button className="bg-copper hover:bg-copper/90 text-white">Action</Button>
```

#### Secondary Button

```jsx
<Button variant="outline" className="glass-ultra border-0 hover:glass-light">
  Secondary
</Button>
```

#### Button States

- **Default**: Glass material with subtle border
- **Hover**: Increased opacity, shadow enhancement
- **Active**: Scale animation (95%), deeper glass
- **Disabled**: 50% opacity, no interactions

### Forms

#### Input Fields

```jsx
<Input className="glass-light border-label-quaternary/20 focus:border-copper/50" />
```

#### Form Validation

- **Success**: Green border, checkmark icon
- **Error**: Red border, error message below
- **Warning**: Yellow border, warning icon

### Modals

#### Modal Pattern

```jsx
<Dialog>
  <DialogContent className="glass-heavy rounded-glass shadow-glass-dramatic">
    {/* Modal content */}
  </DialogContent>
</Dialog>
```

#### Modal Backdrop

- Use `glass-heavy` for modal content
- Semi-transparent backdrop with blur
- Proper z-index layering

## Custom Column Design Patterns

### Column Colors

Each custom column uses the established color palette:

```css
.column-blue   { glass-light bg-blue-500/5 border-blue-300/20 }
.column-purple { glass-light bg-purple-500/5 border-purple-300/20 }
.column-green  { glass-light bg-green-500/5 border-green-300/20 }
/* ... other colors */
```

### Column Icons

Use emoji icons for visual recognition:

- **Core Columns**: Predefined icons (💾, 📝, 🎯, 🎉, ❌)
- **Custom Columns**: User-selectable from curated set
- **Icon Guidelines**: Simple, recognizable, professional

### Column Management Interface

#### Modal Layout

```jsx
<ColumnManageModal>
  {/* Core Columns Section */}
  <Section title="Core Columns">
    <DraggableColumnList columns={coreColumns} />
  </Section>

  {/* Custom Columns Section */}
  <Section title="Custom Columns">
    <AddColumnForm />
    <DraggableColumnList columns={customColumns} />
  </Section>
</ColumnManageModal>
```

#### Reordering Pattern

- Drag handle appears on hover
- Visual feedback during drag
- Smooth animations on drop
- Order persistence

## Animation Guidelines

### Spring Physics

Use consistent spring animations for natural movement:

```css
/* Standard spring */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* Quick interactions */
transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);

/* Large movements */
transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
```

### Micro-interactions

#### Button Press

```css
button:active {
  transform: scale(0.95);
}
```

#### Card Hover

```css
.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-glass-dramatic);
}
```

#### Loading States

```css
@keyframes pulse-glass {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

## Accessibility Guidelines

### Color Contrast

- **Normal Text**: 4.5:1 minimum contrast ratio
- **Large Text**: 3:1 minimum contrast ratio
- **Interactive Elements**: Enhanced contrast for focus states

### Focus Management

- Visible focus indicators on all interactive elements
- Logical tab order through interface
- Skip navigation for screen readers
- ARIA labels and descriptions

### Screen Reader Support

```jsx
<button aria-label="Manage kanban board columns">
  <Settings className="h-4 w-4" />
</button>
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Responsive Design

### Breakpoints

```css
/* Mobile */
@media (max-width: 767px) {
  /* Mobile styles */
}

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) {
  /* Tablet styles */
}

/* Desktop */
@media (min-width: 1024px) {
  /* Desktop styles */
}
```

### Mobile Considerations

- Minimum touch targets: 44x44px
- Adequate spacing between interactive elements
- Optimized glass effects for performance
- Simplified interactions for touch interfaces

## Performance Guidelines

### Glass Effects Optimization

- Use `backdrop-filter: blur()` sparingly
- Prefer CSS transforms over layout changes
- Implement `will-change` judiciously
- Test performance on lower-end devices

### Animation Performance

- Use `transform` and `opacity` for smooth animations
- Avoid animating layout properties (width, height, margin)
- Implement proper cleanup for animation listeners
- Use `requestAnimationFrame` for complex animations

## Error Handling & Edge Cases

### Loading States

- Skeleton screens with glass morphism
- Progressive content loading
- Graceful degradation for slow connections

### Error States

- Clear error messaging in glass containers
- Retry mechanisms with proper feedback
- Fallback content for failed operations

### Empty States

- Helpful guidance in glass containers
- Call-to-action buttons when appropriate
- Visual hierarchy with proper spacing

## Implementation Guidelines

### CSS Architecture

- Use CSS custom properties for theming
- Implement utility-first approach with Tailwind
- Maintain consistent naming conventions
- Document custom CSS classes

### Component Development

- Follow single responsibility principle
- Implement proper TypeScript types
- Include comprehensive testing
- Document props and usage examples

### Code Quality

- ESLint and TypeScript strict mode
- Comprehensive test coverage (80%+)
- Component documentation
- Performance monitoring

## Design Tokens

### Colors

- All colors defined as CSS custom properties
- Light/dark mode variants
- Semantic naming conventions
- Consistent opacity values

### Typography

- Responsive type scaling
- Proper line height for readability
- Consistent font weights
- Vietnamese character support

### Spacing

- 8pt grid system
- Consistent margin/padding usage
- Responsive spacing adjustments
- Logical spacing for components

## Future Considerations

### Design System Evolution

- Component library documentation
- Design token management
- Automated accessibility testing
- Performance monitoring

### User Experience Enhancements

- Advanced animation systems
- Personalization options
- Adaptive interfaces
- Voice interaction support

### Technical Improvements

- Web Component adoption
- Design system automation
- Cross-platform consistency
- Advanced theming capabilities

---

**Last Updated**: 2025-10-26
**Version**: 2.0 - Enhanced Kanban Board with Custom Columns
**Maintainer**: JobHunt Design Team

## Kanban Board V2 Design System

### Overview

The JobHunt kanban board has been redesigned to provide a more intuitive and powerful job application tracking experience. The new design features a 5-column layout with full viewport height usage and custom column functionality.

### Core Columns

The board includes 5 core columns that cannot be deleted or renamed:

1. **💾 Saved (Blue)** - Wishlist and saved positions
2. **📝 Applied (Purple)** - Applications submitted
3. **🎯 Interview (Orange)** - Phone screens, technical interviews, final rounds
4. **🎉 Offers (Green)** - Received offers
5. **❌ Closed (Gray)** - Rejected, withdrawn, ghosted

### Full Viewport Height Layout

- Board height: `calc(100vh - 144px)` (full screen minus header/footer)
- Responsive column widths: 320px (desktop), 280px (tablet), auto (mobile)
- Horizontal scrolling on mobile devices
- Flexible column count with custom columns support

### Custom Column System

Users can create unlimited custom columns with:

- Custom names and descriptions
- 10 color options from the design system
- 20 emoji icons for visual identification
- Drag-and-drop reordering
- Edit and delete capabilities (except core columns)

### Enhanced Drag & Drop

- Visual feedback during drag operations
- Drop zone indicators for empty columns
- Smooth animations with spring physics
- Proper accessibility announcements
- Mobile-optimized touch interactions

### Implementation Notes

- Maintains existing data structure and API compatibility
- Backward compatible with current application statuses
- Uses localStorage for custom column persistence
- Comprehensive TypeScript typing throughout
- Glass morphism design system preserved
