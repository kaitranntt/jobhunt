# JobHunt Design Guidelines

This document outlines the design system, patterns, and guidelines for the JobHunt application.

## Design Philosophy

**Simplicity First**: JobHunt uses a clean, minimal design approach focused on usability and early-stage MVP functionality. The design emphasizes:

- **Clarity and Simplicity**: Clean, uncluttered interfaces
- **Mobile-First**: Responsive design optimized for all devices
- **Accessibility**: WCAG 2.1 AA compliance for all users
- **Fast Performance**: Lightweight components and interactions

## Visual Design System

### Color System

#### Primary Colors (Shadcn UI)

We use the default Shadcn UI color system with custom accent colors for job application states:

```css
/* Status Colors */
--wishlist: blue --applied: purple --interview: orange --offered: green --rejected: red
  --withdrawn: gray;
```

#### Neutral Colors

- **Primary Text**: `foreground` (Shaden UI default)
- **Secondary Text**: `muted-foreground`
- **Backgrounds**: `background`, `card`, `muted`
- **Borders**: `border`, `input`

### Typography

#### Type System

- **Primary**: Inter, system-ui, sans-serif (Shadcn UI default)
- **Scale**: Standard Tailwind CSS typography scale
- **Weights**: Normal (400), Medium (500), Semibold (600)

### Spacing System

#### Tailwind CSS Spacing

We use the standard Tailwind CSS spacing system (4px base unit):

- `p-2`: 8px (small padding)
- `p-4`: 16px (standard padding)
- `p-6`: 24px (large padding)
- `p-8`: 32px (extra large)

## Component Patterns

### Cards

#### Standard Card Pattern

```jsx
<Card className="p-6">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>{/* Card content */}</CardContent>
</Card>
```

### Buttons

#### Primary Button

```jsx
<Button>Primary Action</Button>
```

#### Secondary Button

```jsx
<Button variant="outline">Secondary Action</Button>
```

#### Button States

- **Default**: Standard appearance
- **Hover**: Subtle color change
- **Active**: Scale animation (98%)
- **Disabled**: 50% opacity, no interactions

### Forms

#### Input Fields

```jsx
<Input placeholder="Enter text..." />
```

#### Form Validation

- **Success**: Green border focus
- **Error**: Red border focus with error message
- **Warning**: Orange border focus

### Application Status Display

#### Status Badges

```jsx
<Badge variant="secondary" className="bg-blue-100 text-blue-800">
  Applied
</Badge>
```

#### Status Colors

- **Wishlist**: Blue (`bg-blue-100 text-blue-800`)
- **Applied**: Purple (`bg-purple-100 text-purple-800`)
- **Interview**: Orange (`bg-orange-100 text-orange-800`)
- **Offered**: Green (`bg-green-100 text-green-800`)
- **Rejected**: Red (`bg-red-100 text-red-800`)
- **Withdrawn**: Gray (`bg-gray-100 text-gray-800`)

## Layout Patterns

### Dashboard Layout

```jsx
<div className="container mx-auto px-4 py-8">
  <div className="grid gap-6">
    {/* Main content area */}
    <div className="space-y-6">{/* Content sections */}</div>
  </div>
</div>
```

### Application List

```jsx
<div className="space-y-4">
  {applications.map(app => (
    <Card key={app.id} className="p-6">
      {/* Application content */}
    </Card>
  ))}
</div>
```

## Responsive Design

### Breakpoints

- **Mobile**: `sm:` (640px and up)
- **Tablet**: `md:` (768px and up)
- **Desktop**: `lg:` (1024px and up)
- **Large Desktop**: `xl:` (1280px and up)

### Mobile Considerations

- Minimum touch targets: 44x44px
- Adequate spacing between interactive elements
- Optimized layouts for touch interfaces
- Simple navigation patterns

## Accessibility Guidelines

### Color Contrast

- **Normal Text**: 4.5:1 minimum contrast ratio
- **Large Text**: 3:1 minimum contrast ratio
- **Interactive Elements**: Enhanced contrast for focus states

### Focus Management

- Visible focus indicators on all interactive elements
- Logical tab order through interface
- ARIA labels and descriptions where needed

### Screen Reader Support

```jsx
<button aria-label="Edit application">
  <Edit className="h-4 w-4" />
</button>
```

## Performance Guidelines

### Component Optimization

- Use React.memo for expensive components
- Implement proper loading states
- Optimize images and assets
- Use proper key props for lists

### Animation Performance

- Use CSS transforms for smooth animations
- Avoid animating layout properties
- Implement `will-change` judiciously
- Test performance on mobile devices

## Implementation Guidelines

### Component Development

- Follow single responsibility principle
- Implement proper TypeScript types
- Include comprehensive testing
- Document props and usage

### Code Quality

- ESLint and TypeScript strict mode
- Comprehensive test coverage
- Component documentation
- Performance monitoring

## Brand Elements

### Logo and Icons

- Use consistent icon sizing (16px, 20px, 24px)
- Maintain proper spacing around icons
- Use Lucide React icons (Shadcn UI default)

### Brand Colors

- **Primary**: Default Shadcn UI primary
- **Accent**: Status-based colors for application states

## Error Handling

### Loading States

- Skeleton screens for content loading
- Spinner components for actions
- Progressive content loading

### Error States

- Clear error messaging in containers
- Retry mechanisms with proper feedback
- Fallback content for failed operations

### Empty States

- Helpful guidance in empty states
- Call-to-action buttons when appropriate
- Visual hierarchy with proper spacing

---

**Last Updated**: 2025-10-26
**Version**: 1.0 - Simplified MVP Design
**Focus**: Early-stage development with minimal complexity
