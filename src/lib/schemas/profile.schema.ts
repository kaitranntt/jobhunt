import { z } from 'zod'

/**
 * URL validation helper
 */
const urlSchema = z.string().url('Must be a valid URL').optional().nullable().or(z.literal(''))

/**
 * Base user profile schema for form validation
 */
export const profileFormSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Full name is required')
    .max(255, 'Full name must be less than 255 characters'),

  phone: z
    .string()
    .max(50, 'Phone must be less than 50 characters')
    .optional()
    .nullable()
    .or(z.literal('')),

  location: z
    .string()
    .max(255, 'Location must be less than 255 characters')
    .optional()
    .nullable()
    .or(z.literal('')),

  job_role: z
    .string()
    .max(255, 'Current role must be less than 255 characters')
    .optional()
    .nullable()
    .or(z.literal('')),

  desired_roles: z
    .array(z.string())
    .max(50, 'Maximum 50 desired roles allowed')
    .optional()
    .nullable(),

  desired_industries: z
    .array(z.string())
    .max(50, 'Maximum 50 desired industries allowed')
    .optional()
    .nullable(),

  experience_years: z
    .number()
    .int('Experience years must be an integer')
    .min(0, 'Experience years cannot be negative')
    .max(100, 'Experience years cannot exceed 100')
    .optional()
    .nullable(),

  linkedin_url: urlSchema,

  portfolio_url: urlSchema,
})

/**
 * Schema for creating a new user profile (insert)
 */
export const createProfileSchema = profileFormSchema.extend({
  user_id: z.string().uuid('Invalid user ID'),
})

/**
 * Schema for updating an existing user profile
 */
export const updateProfileSchema = profileFormSchema.partial()

/**
 * Type exports inferred from schemas
 */
export type ProfileFormData = z.infer<typeof profileFormSchema>
export type CreateProfileData = z.infer<typeof createProfileSchema>
export type UpdateProfileData = z.infer<typeof updateProfileSchema>
