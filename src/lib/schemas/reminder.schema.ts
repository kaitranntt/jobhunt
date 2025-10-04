import { z } from 'zod'

/**
 * Base reminder schema for form validation
 */
export const reminderFormSchema = z.object({
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
    .datetime('Invalid date format')
    .refine(
      date => new Date(date) > new Date(),
      'Reminder date must be in the future'
    ),

  is_completed: z.boolean().default(false),
})

/**
 * Schema for creating a new reminder (insert)
 */
export const createReminderSchema = reminderFormSchema.extend({
  user_id: z.string().uuid('Invalid user ID'),
  application_id: z
    .string()
    .uuid('Invalid application ID')
    .optional()
    .nullable()
    .or(z.literal('')),
})

/**
 * Schema for updating an existing reminder
 */
export const updateReminderSchema = reminderFormSchema.partial().omit({
  // user_id cannot be updated
})

/**
 * Type exports inferred from schemas
 */
export type ReminderFormData = z.infer<typeof reminderFormSchema>
export type CreateReminderData = z.infer<typeof createReminderSchema>
export type UpdateReminderData = z.infer<typeof updateReminderSchema>
