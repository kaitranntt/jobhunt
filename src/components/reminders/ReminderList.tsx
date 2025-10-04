'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import ReminderForm from './ReminderForm'
import ReminderCard from './ReminderCard'
import { getRemindersByApplication, deleteReminder, markReminderComplete } from '@/lib/api/reminders'
import type { Reminder } from '@/lib/types/database.types'

interface ReminderListProps {
  applicationId: string
}

export default function ReminderList({ applicationId }: ReminderListProps) {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | undefined>()

  const fetchReminders = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getRemindersByApplication(applicationId)

      // Sort reminders: upcoming first (sorted by date), then past
      const sorted = data.sort((a, b) => {
        const dateA = new Date(a.reminder_date).getTime()
        const dateB = new Date(b.reminder_date).getTime()
        const now = Date.now()

        const aIsUpcoming = dateA >= now
        const bIsUpcoming = dateB >= now

        if (aIsUpcoming && !bIsUpcoming) return -1
        if (!aIsUpcoming && bIsUpcoming) return 1

        return dateA - dateB
      })

      setReminders(sorted)
    } catch (err) {
      setError('Failed to load reminders')
      console.error('Failed to fetch reminders:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReminders()
  }, [applicationId])

  const handleAddClick = () => {
    setEditingReminder(undefined)
    setIsDialogOpen(true)
  }

  const handleEditClick = (reminder: Reminder) => {
    setEditingReminder(reminder)
    setIsDialogOpen(true)
  }

  const handleDeleteClick = async (reminderId: string) => {
    try {
      await deleteReminder(reminderId)
      await fetchReminders()
    } catch (err) {
      console.error('Failed to delete reminder:', err)
    }
  }

  const handleCompleteClick = async (reminderId: string) => {
    try {
      await markReminderComplete(reminderId)
      await fetchReminders()
    } catch (err) {
      console.error('Failed to mark reminder complete:', err)
    }
  }

  const handleFormSuccess = async () => {
    setIsDialogOpen(false)
    setEditingReminder(undefined)
    await fetchReminders()
  }

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading reminders...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-destructive">{error}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Reminders</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddClick}>Add Reminder</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingReminder ? 'Edit Reminder' : 'Add Reminder'}
              </DialogTitle>
            </DialogHeader>
            <ReminderForm
              applicationId={applicationId}
              onSuccess={handleFormSuccess}
              initialData={editingReminder}
            />
          </DialogContent>
        </Dialog>
      </div>

      {reminders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No reminders set
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map(reminder => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onEdit={() => handleEditClick(reminder)}
              onDelete={() => handleDeleteClick(reminder.id)}
              onComplete={() => handleCompleteClick(reminder.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
