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

/**
 * Get all applications for the authenticated user
 */
export async function getApplicationsAction(): Promise<Application[]> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Authentication error in getApplicationsAction:', authError)
      }
      throw new Error(`Authentication failed: ${authError.message}`)
    }

    if (!user) {
      throw new Error('Unauthorized: No user session found. Please log in again.')
    }

    const applications = await getApplications(supabase)
    return applications
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to fetch applications in action:', error)
    }

    // Re-throw with more context
    if (error instanceof Error) {
      throw new Error(`Failed to fetch applications: ${error.message}`)
    }

    throw new Error('Failed to fetch applications: Unknown error occurred')
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
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to create application:', error)
    }
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
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to update application:', error)
    }
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
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to delete application:', error)
    }
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
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to update application status:', error)
    }
    throw new Error('Failed to update application status')
  }
}
