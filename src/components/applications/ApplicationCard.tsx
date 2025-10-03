'use client'

import * as React from 'react'
import { format } from 'date-fns'
import {
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  MapPin,
  GripVertical,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card'
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
    wishlist: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100',
    applied: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    phone_screen: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    assessment: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    take_home: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    interviewing: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
    final_round: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
    offered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    accepted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    withdrawn: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    ghosted: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
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
        'transition-all duration-200 hover:shadow-md',
        onClick && 'cursor-pointer',
        isDragging && 'opacity-50 rotate-2'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div
                data-testid="drag-handle"
                className="cursor-grab active:cursor-grabbing"
                {...dragHandleProps}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg truncate">
                {application.company_name}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground truncate mb-2">
              {application.job_title}
            </p>
            {application.location && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin data-testid="map-pin-icon" className="h-3 w-3" />
                <span>{application.location}</span>
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Application actions"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
      <CardContent className="pt-0 pb-4">
        <div className="flex items-center justify-between gap-2">
          <Badge className={cn('text-xs', statusColor)}>
            {application.status}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatDate(application.date_applied)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

ApplicationCard.displayName = 'ApplicationCard'
