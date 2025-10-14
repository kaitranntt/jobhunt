'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import type { Reminder } from '@/lib/types/database.types'
import { format } from 'date-fns'

interface ReminderCardProps {
  reminder: Reminder
  onEdit: () => void
  onDelete: () => void
  onComplete: () => void
}

export default function ReminderCard({
  reminder,
  onEdit,
  onDelete,
  onComplete,
}: ReminderCardProps) {
  const isOverdue = new Date(reminder.reminder_date) < new Date() && !reminder.is_completed

  const truncateText = (text: string | null, maxLength: number) => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a')
    } catch {
      return dateString
    }
  }

  const getPriorityStyle = () => {
    if (isOverdue) {
      return {
        border: '1px solid var(--color-error)',
        background: 'var(--glass-ultra)',
      }
    }
    return {
      border: '1px solid var(--glass-border-medium)',
      background: 'var(--glass-ultra)',
    }
  }

  return (
    <Card
      className="rounded-glass-sm shadow-glass-subtle glass-interactive"
      style={getPriorityStyle()}
      data-overdue={isOverdue}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1">
            <Checkbox
              checked={reminder.is_completed}
              onCheckedChange={onComplete}
              aria-label={`Mark "${reminder.title}" as complete`}
              className="mt-1"
            />
            <div className="flex-1">
              <h3
                className={`font-semibold text-base ${reminder.is_completed ? 'line-through text-label-tertiary' : 'text-label-primary'}`}
              >
                {reminder.title}
              </h3>
              <p className="text-sm text-label-tertiary font-medium mt-1">
                {formatDate(reminder.reminder_date)}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              aria-label="Edit reminder"
              className="glass-ultra rounded-glass-sm text-label-primary hover:glass-light"
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              aria-label="Delete reminder"
              className="glass-ultra rounded-glass-sm text-label-primary hover:glass-light"
            >
              Delete
            </Button>
          </div>
        </div>
      </CardHeader>
      {(reminder.description || isOverdue) && (
        <CardContent className="pt-0">
          {isOverdue && (
            <Badge
              variant="destructive"
              className="mb-2 glass-medium rounded-glass-sm"
              style={{ background: 'var(--color-error)', color: 'white' }}
            >
              Overdue
            </Badge>
          )}
          {reminder.description && (
            <p className="text-sm text-label-secondary">
              {truncateText(reminder.description, 150)}
            </p>
          )}
        </CardContent>
      )}
    </Card>
  )
}
