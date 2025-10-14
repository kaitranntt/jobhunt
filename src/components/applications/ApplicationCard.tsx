'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { MoreVertical, Eye, Edit2, Trash2, MapPin, GripVertical } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Application, ApplicationStatus } from '@/lib/types/database.types'

interface ApplicationCardProps {
  application: Application
  onEdit?: () => void
  onDelete?: () => void
  onClick?: () => void
  isDragging?: boolean
  dragHandleProps?: Record<string, unknown>
}

const getStatusColor = (status: ApplicationStatus): string => {
  const statusColorMap: Record<ApplicationStatus, string> = {
    wishlist: 'glass-ultra text-label-secondary',
    applied:
      'glass-light bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-300/40 dark:border-blue-600/40',
    phone_screen:
      'glass-light bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-300/40 dark:border-yellow-600/40',
    assessment:
      'glass-light bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-300/40 dark:border-yellow-600/40',
    take_home:
      'glass-light bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-300/40 dark:border-yellow-600/40',
    interviewing:
      'glass-light bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-300/40 dark:border-purple-600/40',
    final_round:
      'glass-light bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-300/40 dark:border-purple-600/40',
    offered:
      'glass-light bg-green-500/10 text-green-700 dark:text-green-300 border-green-300/40 dark:border-green-600/40',
    accepted:
      'glass-light bg-green-500/10 text-green-700 dark:text-green-300 border-green-300/40 dark:border-green-600/40',
    rejected:
      'glass-light bg-red-500/10 text-red-700 dark:text-red-300 border-red-300/40 dark:border-red-600/40',
    withdrawn:
      'glass-light bg-red-500/10 text-red-700 dark:text-red-300 border-red-300/40 dark:border-red-600/40',
    ghosted:
      'glass-light bg-red-500/10 text-red-700 dark:text-red-300 border-red-300/40 dark:border-red-600/40',
  }

  return statusColorMap[status]
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
}: ApplicationCardProps) {
  const statusColor = getStatusColor(application.status)

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger onClick if clicking on dropdown, drag handle, or their children
    const target = e.target as HTMLElement
    if (
      target.closest('[role="menu"]') ||
      target.closest('button[aria-haspopup]') ||
      target.closest('[data-testid="drag-handle"]')
    ) {
      return
    }
    onClick?.()
  }

  return (
    <Card
      role="article"
      aria-label={`${application.company_name} - ${application.job_title}`}
      data-testid="application-card"
      onClick={handleCardClick}
      className={cn(
        'glass-light rounded-glass shadow-glass-soft transition-all duration-300',
        onClick && 'cursor-pointer glass-interactive',
        isDragging && 'opacity-50 rotate-2'
      )}
    >
      <CardHeader className="pb-3 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div
                data-testid="drag-handle"
                className="cursor-grab active:cursor-grabbing glass-ultra rounded-full p-1.5 hover:glass-light transition-all"
                {...dragHandleProps}
              >
                <GripVertical className="h-4 w-4 text-label-secondary" />
              </div>
              <h3 className="font-semibold text-lg truncate text-label-primary">
                {application.company_name}
              </h3>
            </div>
            <p className="text-base font-medium text-label-secondary truncate mb-2 ml-11">
              {application.job_title}
            </p>
            {application.location && (
              <div className="flex items-center gap-2 text-sm text-label-tertiary ml-11">
                <div className="glass-ultra rounded-full p-1">
                  <MapPin data-testid="map-pin-icon" className="h-3 w-3" />
                </div>
                <span>{application.location}</span>
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 glass-ultra rounded-full hover:glass-light"
                aria-label="Application actions"
              >
                <MoreVertical className="h-4 w-4 text-label-secondary" />
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
      </CardHeader>
      <CardContent className="pt-0 pb-6 px-6">
        <div className="flex items-center justify-between gap-4">
          <Badge
            className={cn(
              'text-xs font-medium px-3 py-1 rounded-glass-sm transition-all',
              statusColor
            )}
          >
            {application.status.replace('_', ' ')}
          </Badge>
          <span className="text-xs text-label-tertiary">
            {formatDate(application.date_applied)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

ApplicationCard.displayName = 'ApplicationCard'
