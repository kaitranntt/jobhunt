import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps extends React.ComponentProps<"textarea"> {
  variant?: "default" | "glass"
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full px-3 py-2 text-base shadow-sm disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-y",
          variant === "default" &&
            "rounded-md border border-input bg-transparent placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          variant === "glass" &&
            "rounded-glass-sm bg-[var(--glass-ultra)] backdrop-blur-[15px] [-webkit-backdrop-filter:blur(15px)] border border-[var(--glass-border-medium)] placeholder:text-[var(--macos-label-tertiary)] focus-visible:outline-none focus-visible:border-[var(--glass-border-strong)] focus-visible:shadow-glass-soft transition-all duration-300",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
