'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { MoreHorizontal, Eye, Edit2, Trash2, GripVertical } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CompanyLogo } from '@/components/ui/company-logo'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Application } from '@/lib/types/database.types'

interface ApplicationCardProps {
  application: Application
  onEdit?: () => void
  onDelete?: () => void
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
  onEdit,
  onDelete,
  onClick,
  isDragging = false,
  dragHandleProps,
  attributes,
  listeners,
  setNodeRef,
}: ApplicationCardProps) {
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger onClick if clicking on dropdown or its children
    const target = e.target as HTMLElement
    if (target.closest('[role="menu"]') || target.closest('button[aria-haspopup]')) {
      return
    }
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
        'glass-light rounded-glass shadow-glass-soft transition-all duration-300 group',
        onClick &&
          'cursor-pointer glass-interactive hover:shadow-glass-medium hover:-translate-y-1',
        isDragging && 'opacity-50 rotate-2 shadow-xl'
      )}
      {...attributes}
      {...listeners}
    >
      <CardHeader className="pb-4 p-6">
        <div className="flex items-center gap-4">
          {/* Company Logo */}
          <CompanyLogo companyName={application.company_name} size="lg" className="flex-shrink-0" />

          {/* Job Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-xl truncate text-label-primary mb-1">
              {application.job_title}
            </h3>
            <p className="text-base font-medium text-label-secondary truncate">
              {application.company_name}
            </p>
          </div>

          {/* Actions Dropdown */}
          <div className="flex items-center gap-2">
            {/* Drag Indicator */}
            <div
              data-testid="drag-indicator"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 glass-ultra rounded-full p-1.5"
              {...dragHandleProps}
            >
              <GripVertical className="h-4 w-4 text-label-tertiary" />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 glass-ultra rounded-full hover:glass-light transition-all duration-200"
                  aria-label="Application actions"
                >
                  <MoreHorizontal className="h-4 w-4 text-label-secondary" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-medium rounded-glass-sm border-0">
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={onDelete}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-6 px-6">
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
