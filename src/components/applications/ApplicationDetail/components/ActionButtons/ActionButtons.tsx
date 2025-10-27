'use client'

import * as React from 'react'
import { Edit2, Trash2, ExternalLink, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Application } from '@/lib/types/database.types'

interface ActionButtonsProps {
  application: Application
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
  isDisabled?: boolean
}

export function ActionButtons({
  application,
  onEdit,
  onDelete,
  onClose,
  isDisabled = false,
}: ActionButtonsProps) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      {/* View Job Link */}
      {application.job_url && (
        <a
          href={application.job_url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'inline-flex items-center gap-2 px-3 py-2 rounded-glass-sm text-sm font-medium',
            'text-copper hover:text-copper/80 hover:bg-copper/10',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-copper/50',
            isDisabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <ExternalLink className="w-4 h-4" />
          <span className="hidden sm:inline">View Job</span>
        </a>
      )}

      {/* Edit Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onEdit}
        disabled={isDisabled}
        className={cn(
          'glass-ultra border-copper/30 text-copper',
          'hover:bg-copper/10 hover:border-copper/50',
          'transition-all duration-200'
        )}
      >
        <Edit2 className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline">Edit</span>
      </Button>

      {/* Delete Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onDelete}
        disabled={isDisabled}
        className={cn(
          'glass-light bg-red-500/10 text-red-700 dark:text-red-300',
          'border-red-300/40 dark:border-red-600/40',
          'hover:bg-red-500/20 transition-all duration-200'
        )}
      >
        <Trash2 className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline">Delete</span>
      </Button>

      {/* Close Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onClose}
        className={cn(
          'glass-ultra border-label-quaternary/30 text-label-secondary hover:text-label-primary',
          'hover:bg-label-quaternary/20 transition-all duration-200',
          'min-w-[36px] px-2' // Ensure consistent width with other buttons
        )}
      >
        <X className="w-4 h-4" />
        <span className="sr-only">Close</span>
      </Button>
    </div>
  )
}
