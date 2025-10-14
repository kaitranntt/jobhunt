'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'

import { cn } from '@/lib/utils'

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  variant?: 'default' | 'glass'
}

const Progress = React.forwardRef<React.ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(
  ({ className, value, variant = 'default', ...props }, ref) => (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        'relative h-2 w-full overflow-hidden',
        variant === 'default' && 'rounded-full bg-primary/20',
        variant === 'glass' &&
          'rounded-glass bg-[var(--macos-fill-secondary)] backdrop-blur-[10px] [-webkit-backdrop-filter:blur(10px)]',
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          'h-full w-full flex-1 transition-all',
          variant === 'default' && 'bg-primary',
          variant === 'glass' &&
            'bg-gradient-to-r from-[var(--tint-blue)] to-[var(--tint-purple)] rounded-glass backdrop-blur-[10px] [-webkit-backdrop-filter:blur(10px)] shadow-glass-subtle'
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
)
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
