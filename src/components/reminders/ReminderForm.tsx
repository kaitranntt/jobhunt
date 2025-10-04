'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { createReminder, updateReminder } from '@/lib/api/reminders'
import type { Reminder } from '@/lib/types/database.types'
import { useState } from 'react'

interface ReminderFormProps {
  applicationId: string | null
  onSuccess: () => void
  initialData?: Reminder
}

// Form schema with datetime-local compatible validation
const formSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters'),

  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .nullable()
    .or(z.literal('')),

  reminder_date: z
    .string()
    .min(1, 'Reminder date is required')
    .refine(
      date => {
        // Check if it's a valid datetime-local format and can be parsed
        const parsed = new Date(date)
        return !isNaN(parsed.getTime())
      },
      'Invalid date format'
    )
    .refine(
      date => new Date(date) > new Date(),
      'Reminder date must be in the future'
    ),

  is_completed: z.boolean(),
})

type FormData = z.infer<typeof formSchema>

export default function ReminderForm({
  applicationId,
  onSuccess,
  initialData,
}: ReminderFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isEditMode = !!initialData

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title ?? '',
      description: initialData?.description ?? '',
      reminder_date: initialData?.reminder_date
        ? new Date(initialData.reminder_date).toISOString().slice(0, 16)
        : '',
      is_completed: initialData?.is_completed ?? false,
    },
  })

  const handleSubmit = async (data: FormData) => {
    try {
      setIsLoading(true)

      if (isEditMode && initialData) {
        await updateReminder(initialData.id, {
          title: data.title,
          description: data.description || null,
          reminder_date: new Date(data.reminder_date).toISOString(),
          is_completed: data.is_completed,
        })
      } else {
        // Get user_id from auth context (placeholder for now)
        const userId = 'user-placeholder' // TODO: Get from auth context

        await createReminder({
          user_id: userId,
          application_id: applicationId,
          title: data.title,
          description: data.description || null,
          reminder_date: new Date(data.reminder_date).toISOString(),
          is_completed: false,
        })
      }

      onSuccess()
      form.reset()
    } catch (error) {
      console.error('Failed to save reminder:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
        noValidate
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g., Follow up on application"
                  required
                  disabled={isLoading}
                  aria-required="true"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Additional details (optional)"
                  className="min-h-[80px] resize-y"
                  disabled={isLoading}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reminder_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reminder Date</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="datetime-local"
                  required
                  disabled={isLoading}
                  aria-required="true"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? 'Saving...'
              : isEditMode
                ? 'Update Reminder'
                : 'Create Reminder'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
