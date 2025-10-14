'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { applicationFormSchema } from '@/lib/schemas/application.schema'
import type { ApplicationFormData, ApplicationStatus } from '@/lib/schemas/application.schema'
import type { Application, ApplicationInsert, ApplicationUpdate } from '@/lib/types/database.types'
import {
  createApplication,
  updateApplication,
  deleteApplication,
  getApplications,
} from '@/lib/api/applications'
import { getUserProfile } from '@/lib/api/profiles'
import { createUserProfileAction } from '@/app/(auth)/signup/actions'

/**
 * Get all applications for the authenticated user
 */
export async function getApplicationsAction(): Promise<Application[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  try {
    const applications = await getApplications(supabase)
    return applications
  } catch (error) {
    console.error('Failed to fetch applications:', error)
    throw new Error('Failed to fetch applications')
  }
}

/**
 * Create a new application
 */
export async function createApplicationAction(formData: ApplicationFormData): Promise<Application> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Validate form data
  const validatedData = applicationFormSchema.parse(formData)

  const applicationData: ApplicationInsert = {
    user_id: user.id,
    company_name: validatedData.company_name,
    job_title: validatedData.job_title,
    job_url: validatedData.job_url || null,
    location: validatedData.location || null,
    salary_range: validatedData.salary_range || null,
    status: validatedData.status,
    date_applied: validatedData.date_applied,
    notes: validatedData.notes || null,
  }

  try {
    const newApplication = await createApplication(supabase, applicationData)
    revalidatePath('/dashboard')
    return newApplication
  } catch (error) {
    console.error('Failed to create application:', error)
    throw new Error('Failed to create application')
  }
}

/**
 * Update an existing application
 */
export async function updateApplicationAction(
  id: string,
  formData: ApplicationFormData
): Promise<Application> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Validate form data
  const validatedData = applicationFormSchema.parse(formData)

  const updates: ApplicationUpdate = {
    company_name: validatedData.company_name,
    job_title: validatedData.job_title,
    job_url: validatedData.job_url || null,
    location: validatedData.location || null,
    salary_range: validatedData.salary_range || null,
    status: validatedData.status,
    date_applied: validatedData.date_applied,
    notes: validatedData.notes || null,
    updated_at: new Date().toISOString(),
  }

  try {
    const updatedApplication = await updateApplication(supabase, id, updates)
    revalidatePath('/dashboard')
    return updatedApplication
  } catch (error) {
    console.error('Failed to update application:', error)
    throw new Error('Failed to update application')
  }
}

/**
 * Delete an application
 */
export async function deleteApplicationAction(id: string): Promise<void> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  try {
    await deleteApplication(supabase, id)
    revalidatePath('/dashboard')
  } catch (error) {
    console.error('Failed to delete application:', error)
    throw new Error('Failed to delete application')
  }
}

/**
 * Update application status (for drag-and-drop)
 */
export async function updateApplicationStatusAction(
  id: string,
  status: ApplicationStatus
): Promise<Application> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const updates: ApplicationUpdate = {
    status,
    updated_at: new Date().toISOString(),
  }

  try {
    const updatedApplication = await updateApplication(supabase, id, updates)
    revalidatePath('/dashboard')
    return updatedApplication
  } catch (error) {
    console.error('Failed to update application status:', error)
    throw new Error('Failed to update application status')
  }
}

/**
 * Server action to get user profile for dashboard
 * @param userId - User ID to fetch profile for
 * @returns User profile or null
 */
export async function getProfileAction(userId: string) {
  try {
    const profile = await getUserProfile(userId)
    return profile
  } catch (error) {
    console.error('Failed to get user profile:', error)
    return null
  }
}

/**
 * Server action to ensure user profile exists
 * Creates profile with basic info if it doesn't exist
 * @param userId - User ID
 * @param email - User email (for initial profile)
 * @returns User profile
 */
export async function ensureProfileExistsAction(userId: string, email: string) {
  try {
    // Try to get existing profile first
    const existingProfile = await getProfileAction(userId)
    if (existingProfile) {
      return existingProfile
    }

    // Create basic profile with email as name if no profile exists
    const basicProfileData = {
      user_id: userId,
      full_name: email.split('@')[0] || 'User',
      phone: null,
      location: null,
      job_role: null,
      desired_roles: null,
      desired_industries: null,
      experience_years: null,
      linkedin_url: null,
      portfolio_url: null,
    }

    const result = await createUserProfileAction(basicProfileData)

    if (result.success && result.data) {
      return result.data
    } else {
      throw new Error(result.error || 'Failed to create profile')
    }
  } catch (error) {
    console.error('Failed to ensure profile exists:', error)
    throw error
  }
}
