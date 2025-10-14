import { z } from 'zod'

/**
 * Base contact schema for form validation
 */
export const contactFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Contact name is required')
    .max(255, 'Contact name must be less than 255 characters'),

  email: z.string().email('Must be a valid email address').optional().nullable().or(z.literal('')),

  phone: z
    .string()
    .max(50, 'Phone number must be less than 50 characters')
    .optional()
    .nullable()
    .or(z.literal('')),

  role: z
    .string()
    .max(100, 'Role must be less than 100 characters')
    .optional()
    .nullable()
    .or(z.literal('')),

  notes: z
    .string()
    .max(5000, 'Notes must be less than 5000 characters')
    .optional()
    .nullable()
    .or(z.literal('')),

  application_id: z.string().uuid('Invalid application ID').optional().nullable(),
})

/**
 * Schema for creating a new contact (insert)
 */
export const createContactSchema = contactFormSchema.extend({
  user_id: z.string().uuid('Invalid user ID'),
})

/**
 * Schema for updating an existing contact
 */
export const updateContactSchema = contactFormSchema.partial().omit({
  // user_id cannot be updated
})

/**
 * Type exports inferred from schemas
 */
export type ContactFormData = z.infer<typeof contactFormSchema>
export type CreateContactData = z.infer<typeof createContactSchema>
export type UpdateContactData = z.infer<typeof updateContactSchema>
