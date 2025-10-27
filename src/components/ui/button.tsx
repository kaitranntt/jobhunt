import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-all duration-300",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 rounded-md',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 rounded-md',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 rounded-md',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md',
        ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 rounded-md',
        link: 'text-primary underline-offset-4 hover:underline rounded-md',
        glass:
          'rounded-glass-lg shadow-glass-soft hover:shadow-glass-medium active:shadow-glass-subtle backdrop-blur-[30px] [-webkit-backdrop-filter:blur(30px)] saturate-[180%] transition-all duration-300 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-px active:scale-[0.98] text-[var(--macos-label-primary)] bg-[var(--glass-medium)] border border-[var(--glass-border-strong)]',
      },
      size: {
        default: 'h-8 px-3 py-2 has-[>svg]:px-2.5',
        sm: 'h-7 gap-1.5 px-2.5 has-[>svg]:px-2',
        lg: 'h-9 px-5 has-[>svg]:px-3.5',
        icon: 'size-8',
        'icon-sm': 'size-7',
        'icon-lg': 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<'button'> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean
    }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = 'Button'

export { Button, buttonVariants }
