'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getUpcomingReminders } from '@/lib/api/reminders'
import type { Reminder } from '@/lib/types/database.types'
import { format } from 'date-fns'

interface UpcomingRemindersProps {
  userId: string
}

export default function UpcomingReminders({ userId }: UpcomingRemindersProps) {
  const router = useRouter()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReminders = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getUpcomingReminders(userId)
        // Take only first 5 reminders
        setReminders(data.slice(0, 5))
      } catch (err) {
        setError('Failed to load reminders')
        console.error('Failed to fetch upcoming reminders:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchReminders()
  }, [userId])

  const handleReminderClick = (reminder: Reminder) => {
    if (reminder.application_id) {
      router.push(`/applications/${reminder.application_id}`)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, h:mm a')
    } catch {
      return dateString
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Reminders</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Reminders</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Reminders</CardTitle>
      </CardHeader>
      <CardContent>
        {reminders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming reminders</p>
        ) : (
          <div className="space-y-2">
            {reminders.map(reminder => (
              <Button
                key={reminder.id}
                variant="ghost"
                className="w-full justify-start h-auto py-2 px-3"
                onClick={() => handleReminderClick(reminder)}
                aria-label={`${reminder.title} - ${formatDate(reminder.reminder_date)}`}
              >
                <div className="flex flex-col items-start gap-1 w-full">
                  <p className="font-medium text-sm">{reminder.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(reminder.reminder_date)}
                  </p>
                </div>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
