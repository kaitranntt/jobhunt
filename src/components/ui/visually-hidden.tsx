'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

const VisuallyHidden = React.forwardRef<
  React.ElementRef<'span'>,
  React.ComponentPropsWithoutRef<'span'>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      'sr-only',
      'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0',
      className
    )}
    {...props}
  />
))
VisuallyHidden.displayName = 'VisuallyHidden'

export { VisuallyHidden }
