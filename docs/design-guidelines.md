# JobHunt Design Guidelines

**Document Version:** 1.1
**Last Updated:** October 31, 2025
**Design System:** macOS 26 "Liquid Glass"
**UI Framework:** Shadcn UI + Radix UI
**CSS Framework:** Tailwind CSS 4

## Overview

This document defines the design principles, guidelines, and standards that govern the JobHunt user interface. The design system, "macOS 26 Liquid Glass," provides a modern, intuitive, and accessible user experience with glass-morphism aesthetics inspired by Apple's design language. Recent architectural improvements include a modular CSS system that enhances maintainability and component reusability.

## Design Philosophy

### Core Principles

#### 1. Clarity Over Density

- **Whitespace is intentional**: Use generous spacing to reduce cognitive load
- **Progressive disclosure**: Show information progressively, not all at once
- **Clear hierarchy**: Establish visual hierarchy through size, color, and spacing

#### 2. Fluid Interactions

- **Natural animations**: Use spring physics for organic motion
- **Responsive feedback**: Provide immediate visual feedback for all interactions
- **Smooth transitions**: Eliminate jarring changes between states

#### 3. Accessibility First

- **WCAG 2.1 AA compliance**: Ensure accessibility for all users
- **Keyboard navigation**: Full keyboard accessibility
- **Screen reader support**: Comprehensive ARIA labels and semantic HTML

#### 4. Consistency & Predictability

- **Design tokens**: Single source of truth for all design values
- **Component consistency**: Uniform behavior across similar components
- **Pattern reuse**: Leverage established UI patterns

## Design System Architecture

### Token-Based Design System

#### Color System (`src/lib/design-tokens/colors.ts`)

```typescript
// Primary color palette with RGBA transparency
export const colors = {
  // Semantic colors with light/dark mode support
  primary: {
    50: 'rgba(59, 130, 246, 0.05)', // Light mode primary
    500: 'rgba(59, 130, 246, 0.9)', // Standard primary
    900: 'rgba(30, 58, 138, 0.95)', // Dark mode primary
  },

  // Glass morphism variants
  glass: {
    ultra: 'rgba(255, 255, 255, 0.02)', // Ultra transparent
    light: 'rgba(255, 255, 255, 0.08)', // Light glass
    medium: 'rgba(255, 255, 255, 0.12)', // Medium glass
    heavy: 'rgba(255, 255, 255, 0.18)', // Heavy glass
    frosted: 'rgba(255, 255, 255, 0.25)', // Frosted glass
  },

  // System colors with dark mode variants
  surface: {
    background: 'rgba(248, 250, 252, 0.8)', // Light mode
    backgroundDark: 'rgba(15, 23, 42, 0.8)', // Dark mode
    card: 'rgba(255, 255, 255, 0.7)', // Card surface
    cardDark: 'rgba(30, 41, 59, 0.7)', // Dark card
  },
}
```

#### Typography Scale (`src/lib/design-tokens/typography.ts`)

```typescript
export const typography = {
  // 4pt baseline grid system
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }], // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
    base: ['1rem', { lineHeight: '1.5rem' }], // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }], // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }], // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
  },

  // Font weights following iOS guidelines
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // Font families optimized for readability
  fontFamily: {
    sans: [
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Oxygen',
      'Ubuntu',
      'Cantarell',
      'Fira Sans',
      'Droid Sans',
      'Helvetica Neue',
      'sans-serif',
    ],
    mono: ['SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', 'monospace'],
  },
}
```

#### Spacing System (`src/lib/design-tokens/spacing.ts`)

```typescript
// 8pt grid system with half-step support
export const spacing = {
  0: '0px',
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  8: '2rem', // 32px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
}
```

## Glass-Morphism Design System

### Glass Variants

#### 1. Ultra Glass

```css
.glass-ultra {
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}
```

#### 2. Light Glass

```css
.glass-light {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

#### 3. Medium Glass (Default)

```css
.glass-medium {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(30px);
  border: 1px solid rgba(255, 255, 255, 0.15);
}
```

#### 4. Heavy Glass

```css
.glass-heavy {
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(40px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

#### 5. Frosted Glass

```css
.glass-frosted {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(50px);
  border: 1px solid rgba(255, 255, 255, 0.25);
}
```

### Glass Component Usage

#### Card Component

```typescript
// components/ui/Card.tsx
export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    glassVariant?: 'ultra' | 'light' | 'medium' | 'heavy' | 'frosted'
  }
>(({ className, glassVariant = 'medium', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-xl border transition-all duration-300',
      {
        'glass-ultra': glassVariant === 'ultra',
        'glass-light': glassVariant === 'light',
        'glass-medium': glassVariant === 'medium',
        'glass-heavy': glassVariant === 'heavy',
        'glass-frosted': glassVariant === 'frosted',
      },
      className
    )}
    {...props}
  />
))
```

## Component Design Patterns

### 1. Application Cards (Kanban)

#### Design Specifications

```typescript
// Application Card Component Structure
interface ApplicationCardProps {
  application: Application
  onStatusChange: (newStatus: ApplicationStatus) => void
  onEdit: () => void
  onDelete: () => void
  draggable?: boolean
  compact?: boolean
}

// Visual Hierarchy
// 1. Company Name (bold, larger)
// 2. Job Title (medium, secondary color)
// 3. Status Badge (prominent, color-coded)
// 4. Application Date (subtle, small)
// 5. Notes (truncated, subtle)
```

#### Implementation

```typescript
export const ApplicationCard = ({
  application,
  onStatusChange,
  onEdit,
  onDelete
}: ApplicationCardProps) => {
  return (
    <Card className="glass-medium hover:glass-heavy transition-all duration-300 cursor-move">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg leading-tight">
              {application.company_name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {application.job_title}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={onEdit}>
                Edit Application
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete}>
                Delete Application
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          <StatusBadge status={application.status} />

          {application.notes && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {application.notes}
            </p>
          )}

          <div className="flex items-center text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 mr-1" />
            Applied {formatDate(application.application_date)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 2. Status Badge System

#### Status Design

```typescript
// Status color mapping
const statusColors = {
  wishlist: 'bg-slate-100 text-slate-800 border-slate-200',
  applied: 'bg-blue-100 text-blue-800 border-blue-200',
  phone_screen: 'bg-purple-100 text-purple-800 border-purple-200',
  assessment: 'bg-orange-100 text-orange-800 border-orange-200',
  interview: 'bg-green-100 text-green-800 border-green-200',
  final_round: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  offer: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  negotiation: 'bg-pink-100 text-pink-800 border-pink-200',
  accepted: 'bg-green-500 text-white border-green-600',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  withdrawn: 'bg-gray-100 text-gray-800 border-gray-200',
}

export const StatusBadge = ({ status }: { status: ApplicationStatus }) => (
  <Badge
    variant="outline"
    className={cn(
      'font-medium px-2.5 py-1 text-xs',
      statusColors[status]
    )}
  >
    {formatStatus(status)}
  </Badge>
)
```

### 3. Form Design Patterns

#### Form Structure

```typescript
// Application Form Layout
export const ApplicationForm = ({
  application,
  onSubmit,
  onCancel
}: ApplicationFormProps) => {
  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: application || {
      company_name: '',
      job_title: '',
      job_description: '',
      status: 'wishlist',
      application_date: new Date().toISOString().split('T')[0],
      notes: '',
    }
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Company Information Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Company Information</h3>

          <FormField
            control={form.control}
            name="company_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Apple Inc."
                    {...field}
                    className="glass-light"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="job_title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Senior Frontend Developer"
                    {...field}
                    className="glass-light"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Additional form sections... */}

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            {application ? 'Update Application' : 'Create Application'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
```

## Animation & Motion

### Spring Physics Configuration

#### Animation Settings

```typescript
// src/lib/animation.ts
export const animations = {
  // Gentle spring for most interactions
  gentle: {
    type: 'spring',
    stiffness: 100,
    damping: 15,
    mass: 0.5,
  },

  // Bouncy spring for delightful interactions
  bouncy: {
    type: 'spring',
    stiffness: 400,
    damping: 10,
    mass: 0.3,
  },

  // Smooth spring for transitions
  smooth: {
    type: 'spring',
    stiffness: 200,
    damping: 20,
    mass: 0.8,
  },

  // Quick spring for immediate feedback
  quick: {
    type: 'spring',
    stiffness: 600,
    damping: 25,
    mass: 0.2,
  },
}

// Usage with Framer Motion
export const cardHoverVariants = {
  initial: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -4,
    transition: animations.gentle,
  },
  tap: {
    scale: 0.98,
    transition: animations.quick,
  },
}
```

### Drag and Drop Animations

#### Kanban Drag Experience

```typescript
// Drag visual feedback
export const dragStyles = {
  // Card being dragged
  dragOverlay: {
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    transform: 'rotate(2deg)',
    transition: animations.gentle,
  },

  // Drop zone indicators
  dropZone: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    transition: animations.smooth,
  },

  // Invalid drop zone
  invalidDropZone: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    transition: animations.smooth,
  },
}
```

## Responsive Design

### Breakpoint System

```typescript
// Mobile-first responsive breakpoints
export const breakpoints = {
  sm: '640px', // Small tablets
  md: '768px', // Tablets
  lg: '1024px', // Small laptops
  xl: '1280px', // Laptops
  '2xl': '1536px', // Large screens
}

// Responsive design patterns
export const responsive = {
  // Card layouts
  cardGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',

  // Navigation
  navLayout: 'flex flex-col md:flex-row md:items-center md:space-x-6',

  // Forms
  formLayout: 'space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0',

  // Content
  contentMaxWidth: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
}
```

### Mobile Optimizations

#### Touch Targets

```typescript
// Minimum touch target: 44px × 44px
const touchTargets = {
  button: 'min-h-[44px] min-w-[44px]',
  interactive: 'p-3 sm:p-2',
  formElements: 'h-11 sm:h-10',
}
```

#### Mobile Navigation

```typescript
// Mobile-friendly navigation pattern
export const MobileNavigation = () => (
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="ghost" size="sm" className="md:hidden">
        <Menu className="h-5 w-5" />
      </Button>
    </SheetTrigger>
    <SheetContent side="left" className="w-80">
      <nav className="flex flex-col space-y-4 mt-8">
        {/* Navigation items */}
      </nav>
    </SheetContent>
  </Sheet>
)
```

## Accessibility Guidelines

### ARIA Implementation

#### Semantic HTML Structure

```typescript
// Proper semantic markup
export const ApplicationBoard = () => (
  <main role="main" aria-label="Job Application Board">
    <h1 className="sr-only">Job Application Kanban Board</h1>

    <section
      aria-label="Applications by status"
      role="region"
    >
      {applicationStatuses.map(status => (
        <div
          key={status}
          role="group"
          aria-labelledby={`status-${status}`}
        >
          <h2
            id={`status-${status}`}
            className="font-semibold text-lg mb-4"
          >
            {formatStatus(status)}
          </h2>

          <div
            role="list"
            aria-label={`${formatStatus(status)} applications`}
          >
            {applications
              .filter(app => app.status === status)
              .map(app => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  role="listitem"
                  aria-label={`Application at ${app.company_name} for ${app.job_title}`}
                />
              ))}
          </div>
        </div>
      ))}
    </section>
  </main>
)
```

### Keyboard Navigation

#### Focus Management

```typescript
// Focus trap for modals
export const useFocusTrap = (isOpen: boolean) => {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )

      if (!focusableElements?.length) return

      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)
    return () => document.removeEventListener('keydown', handleTabKey)
  }, [isOpen])

  return modalRef
}
```

### Screen Reader Support

#### Live Regions

```typescript
// Announce important changes
export const useAnnouncer = () => {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.createElement('div')
    announcer.setAttribute('aria-live', priority)
    announcer.setAttribute('aria-atomic', 'true')
    announcer.className = 'sr-only'
    announcer.textContent = message

    document.body.appendChild(announcer)
    setTimeout(() => document.body.removeChild(announcer), 1000)
  }

  return { announce }
}

// Usage in drag and drop
const { announce } = useAnnouncer()

const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event

  if (over) {
    announce(`Moved application to ${formatStatus(over.id as ApplicationStatus)}`)
  }
}
```

## Dark Mode Implementation

### Theme Configuration

```typescript
// CSS Variables for theming
:root {
  --background: 248 250 252;
  --foreground: 15 23 42;
  --card: 255 255 255;
  --card-foreground: 15 23 42;
  --popover: 255 255 255;
  --popover-foreground: 15 23 42;
  --primary: 59 130 246;
  --primary-foreground: 248 250 252;
  --secondary: 241 245 249;
  --secondary-foreground: 15 23 42;
  --muted: 241 245 249;
  --muted-foreground: 100 116 139;
  --accent: 241 245 249;
  --accent-foreground: 15 23 42;
  --destructive: 239 68 68;
  --destructive-foreground: 248 250 252;
  --border: 226 232 240;
  --input: 226 232 240;
  --ring: 59 130 246;
  --radius: 0.75rem;
}

.dark {
  --background: 15 23 42;
  --foreground: 248 250 252;
  --card: 30 41 59;
  --card-foreground: 248 250 252;
  --popover: 30 41 59;
  --popover-foreground: 248 250 252;
  --primary: 96 165 250;
  --primary-foreground: 15 23 42;
  --secondary: 30 41 59;
  --secondary-foreground: 248 250 252;
  --muted: 30 41 59;
  --muted-foreground: 148 163 184;
  --accent: 30 41 59;
  --accent-foreground: 248 250 252;
  --destructive: 220 38 38;
  --destructive-foreground: 248 250 252;
  --border: 30 41 59;
  --input: 30 41 59;
  --ring: 96 165 250;
}
```

### Theme Provider

```typescript
// src/components/providers/theme-provider.tsx
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark'
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

    setTheme(savedTheme || systemTheme)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
```

## Performance Optimization

### Image Optimization

```typescript
// Optimized image usage
export const CompanyLogo = ({
  company,
  size = 'medium'
}: {
  company: string
  size?: 'small' | 'medium' | 'large'
}) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  }

  return (
    <div className={cn(
      'rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold',
      sizeClasses[size]
    )}>
      {company.charAt(0).toUpperCase()}
    </div>
  )
}
```

### Animation Performance

```typescript
// GPU-accelerated animations
export const animatedCard = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
      // Use transform for better performance
      layout: true,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
}
```

## Component Library Standards

### Component Structure

```typescript
// Standard component template
export interface ComponentProps {
  // Required props
  children: React.ReactNode

  // Optional props with defaults
  variant?: 'default' | 'secondary' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean

  // Event handlers
  onClick?: () => void
  onFocus?: () => void
  onBlur?: () => void

  // Accessibility props
  'aria-label'?: string
  'aria-describedby'?: string
}

export const Component = React.forwardRef<HTMLDivElement, ComponentProps>(
  ({ children, variant = 'default', size = 'md', disabled, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          'rounded-lg border transition-all duration-200',

          // Variant styles
          {
            'glass-medium': variant === 'default',
            'glass-light': variant === 'secondary',
            'glass-heavy border-red-200': variant === 'destructive',
          },

          // Size styles
          {
            'p-2 text-sm': size === 'sm',
            'p-4 text-base': size === 'md',
            'p-6 text-lg': size === 'lg',
          },

          // State styles
          {
            'opacity-50 cursor-not-allowed': disabled,
            'hover:glass-heavy cursor-pointer': !disabled,
          }
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Component.displayName = 'Component'
```

## Design Review Process

### Component Review Checklist

#### Visual Design

- [ ] Follows design system tokens
- [ ] Proper glass morphism implementation
- [ ] Consistent spacing and typography
- [ ] Appropriate color usage
- [ ] Proper visual hierarchy

#### Interaction Design

- [ ] Smooth animations and transitions
- [ ] Appropriate hover and focus states
- [ ] Loading states handled
- [ ] Error states designed
- [ ] Success feedback provided

#### Accessibility

- [ ] Semantic HTML structure
- [ ] Proper ARIA labels
- [ ] Keyboard navigation support
- [ ] Screen reader compatibility
- [ ] Sufficient color contrast

#### Performance

- [ ] Optimized images and assets
- [ ] Efficient animations
- [ ] Minimal re-renders
- [ ] Lazy loading implemented
- [ ] Bundle size considerations

### Design Approval Workflow

1. **Design Creation**: Designer creates component mockups
2. **Implementation Review**: Developer implements component
3. **Design Review**: Designer reviews implementation
4. **Accessibility Review**: Accessibility specialist reviews
5. **Performance Review**: Performance optimization check
6. **Final Approval**: Design lead approves for merge

## Tools and Resources

### Design Tools

- **Figma**: Design mockups and prototypes
- **Storybook**: Component documentation and testing
- **Chrome DevTools**: Performance debugging
- **Axe DevTools**: Accessibility testing

### Resources

- **Design Tokens**: `src/lib/design-tokens/`
- **Component Library**: `src/components/ui/`
- **Style Guide**: This document
- **Figma Design System**: [Link to Figma]

---

**Last Updated:** October 29, 2025
**Document Version:** 1.0
**Design System Version:** macOS 26 "Liquid Glass"

For the most up-to-date design guidelines, visit: https://docs.jobhunt.kaitran.ca/design
