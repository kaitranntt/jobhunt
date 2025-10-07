'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const NonDimmingModal = DialogPrimitive.Root

const NonDimmingModalTrigger = DialogPrimitive.Trigger

const NonDimmingModalPortal = DialogPrimitive.Portal

const NonDimmingModalClose = DialogPrimitive.Close

const NonDimmingModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    className={cn(
      'fixed inset-0 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 pointer-events-none',
      className
    )}
    {...props}
    ref={ref}
  />
))
NonDimmingModalOverlay.displayName = DialogPrimitive.Overlay.displayName

const NonDimmingModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <NonDimmingModalPortal>
    <NonDimmingModalOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed z-50 gap-4 p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out',
        'left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-2xl max-h-[90vh] overflow-y-auto',
        'glass-light rounded-glass-lg shadow-glass-dramatic backdrop-blur-[20px] [-webkit-backdrop-filter:blur(20px)] saturate-[180%] border-[var(--glass-border-strong)]',
        '[transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]',
        className
      )}
      {...props}
    >
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-glass-sm bg-[var(--glass-ultra)] hover:bg-[var(--glass-light)] opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
      {children}
    </DialogPrimitive.Content>
  </NonDimmingModalPortal>
))
NonDimmingModalContent.displayName = DialogPrimitive.Content.displayName

const NonDimmingModalHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-2 text-center sm:text-left', className)} {...props} />
)
NonDimmingModalHeader.displayName = 'NonDimmingModalHeader'

const NonDimmingModalFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
)
NonDimmingModalFooter.displayName = 'NonDimmingModalFooter'

const NonDimmingModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold text-foreground', className)}
    {...props}
  />
))
NonDimmingModalTitle.displayName = DialogPrimitive.Title.displayName

const NonDimmingModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
NonDimmingModalDescription.displayName = DialogPrimitive.Description.displayName

export {
  NonDimmingModal,
  NonDimmingModalPortal,
  NonDimmingModalOverlay,
  NonDimmingModalTrigger,
  NonDimmingModalClose,
  NonDimmingModalContent,
  NonDimmingModalHeader,
  NonDimmingModalFooter,
  NonDimmingModalTitle,
  NonDimmingModalDescription,
}
