'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { applicationFormSchema } from '@/lib/schemas/application.schema'
import type { ApplicationFormData, ApplicationStatus } from '@/lib/schemas/application.schema'
import type { Application, ApplicationUpdate } from '@/lib/types/database.types'
import {
  createApplicationWithCompany,
  updateApplication as updateApplicationAPI,
  deleteApplication as deleteApplicationAPI,
  getApplications,
} from '@/lib/api/applications'
import { handleServerActionError, handleZodError } from '@/lib/errors/handlers'

/**
 * Get all applications for the authenticated user
 */
export async function getApplicationsAction(): Promise<Application[]> {
  try {
    const supabase = await createClient()

    // Authentication is now handled in getApplications with caching
    const applications = await getApplications(supabase)
    return applications
  } catch (error) {
    handleServerActionError(error)
  }
}

/**
 * Create a new application
 */
export async function createApplicationAction(formData: ApplicationFormData): Promise<Application> {
  try {
    const supabase = await createClient()

    // Validate form data
    const validatedData = applicationFormSchema.parse(formData)

    const applicationData = {
      company_name: validatedData.company_name,
      job_title: validatedData.job_title,
      job_url: validatedData.job_url || null,
      location: validatedData.location || null,
      salary_range: validatedData.salary_range || null,
      job_description: null,
      company_logo_url: null,
      status: validatedData.status,
      date_applied: validatedData.date_applied,
      notes: validatedData.notes || null,
      source: 'manual',
    }

    const newApplication = await createApplicationWithCompany(supabase, applicationData)
    revalidatePath('/dashboard')
    return newApplication
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      throw handleZodError(error)
    }
    handleServerActionError(error)
  }
}

/**
 * Update an existing application
 */
export async function updateApplicationAction(
  id: string,
  formData: ApplicationFormData
): Promise<Application> {
  try {
    const supabase = await createClient()

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

    const updatedApplication = await updateApplicationAPI(supabase, id, updates)
    revalidatePath('/dashboard')
    return updatedApplication
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      throw handleZodError(error)
    }
    handleServerActionError(error)
  }
}

/**
 * Delete an application
 */
export async function deleteApplicationAction(id: string): Promise<void> {
  try {
    const supabase = await createClient()

    await deleteApplicationAPI(supabase, id)
    revalidatePath('/dashboard')
  } catch (error) {
    handleServerActionError(error)
  }
}

/**
 * Update application status (for drag-and-drop)
 */
export async function updateApplicationStatusAction(
  id: string,
  status: ApplicationStatus
): Promise<Application> {
  try {
    const supabase = await createClient()

    const updates: ApplicationUpdate = {
      status,
      updated_at: new Date().toISOString(),
    }

    const updatedApplication = await updateApplicationAPI(supabase, id, updates)
    revalidatePath('/dashboard')
    return updatedApplication
  } catch (error) {
    handleServerActionError(error)
  }
}
