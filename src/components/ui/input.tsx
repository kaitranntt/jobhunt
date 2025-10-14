import * as React from 'react'

import { cn } from '@/lib/utils'

export interface InputProps extends React.ComponentProps<'input'> {
  variant?: 'default' | 'glass'
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = 'default', ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          variant === 'default' &&
            'rounded-md border border-input bg-transparent placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          variant === 'glass' &&
            'rounded-glass-sm bg-[var(--glass-ultra)] backdrop-blur-[15px] [-webkit-backdrop-filter:blur(15px)] border border-[var(--glass-border-medium)] placeholder:text-[var(--macos-label-tertiary)] focus-visible:outline-none focus-visible:border-[var(--glass-border-strong)] focus-visible:shadow-glass-soft transition-all duration-300',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
