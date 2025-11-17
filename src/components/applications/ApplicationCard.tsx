'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { GripVertical } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { CompanyLogo } from '@/components/ui/company-logo'
import { cn } from '@/lib/utils'
import type { Application } from '@/lib/types/database.types'

interface ApplicationCardProps {
  application: Application
  onClick?: () => void
  isDragging?: boolean
  dragHandleProps?: Record<string, unknown>
  attributes?: Record<string, unknown>
  listeners?: Record<string, unknown>
  setNodeRef?: (element: HTMLElement | null) => void
}

const formatDate = (dateString: string): string => {
  try {
    return format(new Date(dateString), 'MMM dd, yyyy')
  } catch {
    return dateString
  }
}

export function ApplicationCard({
  application,
  onClick,
  isDragging = false,
  dragHandleProps,
  attributes,
  listeners,
  setNodeRef,
}: ApplicationCardProps) {
  const handleCardClick = () => {
    onClick?.()
  }

  return (
    <Card
      ref={setNodeRef}
      role="article"
      aria-label={`${application.job_title} at ${application.company_name}`}
      data-testid="application-card"
      onClick={handleCardClick}
      className={cn(
        'glass-light rounded-glass shadow-glass-soft transition-all duration-300 ease-in-out group',
        onClick &&
          'cursor-pointer transition-all duration-300 ease-in-out hover:border-copper-light hover:ring-1 hover:ring-copper-light',
        isDragging && 'opacity-50 rotate-2 shadow-xl'
      )}
      {...attributes}
      {...listeners}
    >
      <CardHeader className="pb-3 p-4">
        <div className="flex items-center gap-3">
          {/* Company Logo */}
          <CompanyLogo companyName={application.company_name} size="md" className="flex-shrink-0" />

          {/* Job Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate text-label-primary mb-1">
              {application.job_title}
            </h3>
            <p className="text-sm font-medium text-label-secondary truncate">
              {application.company_name}
            </p>
          </div>

          {/* Drag Indicator */}
          <div
            data-testid="drag-indicator"
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 glass-ultra rounded-full p-1"
            {...dragHandleProps}
          >
            <GripVertical className="h-3 w-3 text-label-tertiary" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-4 px-4">
        <div className="flex items-center justify-between">
          {/* Additional info can go here in the future */}
          <div />

          {/* Application Date */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-label-secondary font-medium">Applied</span>
            <span className="text-sm text-label-secondary">
              {formatDate(application.date_applied)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

ApplicationCard.displayName = 'ApplicationCard'
