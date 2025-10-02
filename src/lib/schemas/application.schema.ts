import { z } from 'zod'

/**
 * Application status enum schema
 */
export const applicationStatusSchema = z.enum([
  'wishlist',
  'applied',
  'phone_screen',
  'assessment',
  'take_home',
  'interviewing',
  'final_round',
  'offered',
  'accepted',
  'rejected',
  'withdrawn',
  'ghosted',
])

/**
 * Base application schema for form validation
 */
export const applicationFormSchema = z.object({
  company_name: z
    .string()
    .min(1, 'Company name is required')
    .max(255, 'Company name must be less than 255 characters'),

  job_title: z
    .string()
    .min(1, 'Job title is required')
    .max(255, 'Job title must be less than 255 characters'),

  job_url: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .nullable()
    .or(z.literal('')),

  location: z
    .string()
    .max(255, 'Location must be less than 255 characters')
    .optional()
    .nullable()
    .or(z.literal('')),

  salary_range: z
    .string()
    .max(100, 'Salary range must be less than 100 characters')
    .optional()
    .nullable()
    .or(z.literal('')),

  status: applicationStatusSchema.default('wishlist'),

  date_applied: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .default(() => new Date().toISOString().split('T')[0]),

  notes: z
    .string()
    .max(5000, 'Notes must be less than 5000 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
})

/**
 * Schema for creating a new application (insert)
 */
export const createApplicationSchema = applicationFormSchema.extend({
  user_id: z.string().uuid('Invalid user ID'),
})

/**
 * Schema for updating an existing application
 */
export const updateApplicationSchema = applicationFormSchema.partial().omit({
  // user_id cannot be updated
})

/**
 * Type exports inferred from schemas
 */
export type ApplicationFormData = z.infer<typeof applicationFormSchema>
export type CreateApplicationData = z.infer<typeof createApplicationSchema>
export type UpdateApplicationData = z.infer<typeof updateApplicationSchema>
export type ApplicationStatus = z.infer<typeof applicationStatusSchema>
