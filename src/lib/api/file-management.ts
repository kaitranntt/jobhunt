/**
 * File Management API
 *
 * Handles database operations for file relationships and metadata
 * in the JobHunt application.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { StoredFile } from '@/lib/storage/storage-client'
import { withErrorHandling } from '@/lib/errors/handlers'

export interface ApplicationResume {
  id: string
  application_id: string
  file_id: string
  is_primary: boolean
  notes?: string | null
  created_at: string
  updated_at: string
  file?: StoredFile
}

export interface CompanyLogo {
  id: string
  company_id: string
  file_id: string
  is_active: boolean
  created_at: string
  updated_at: string
  file?: StoredFile
}

export interface ApplicationDocument {
  id: string
  application_id: string
  file_id: string
  document_type: string
  description?: string | null
  is_private: boolean
  created_at: string
  updated_at: string
  file?: StoredFile
}

export interface FileWithMetadata {
  id: string
  file_id: string
  file: StoredFile
  relationship_type: string
  is_primary?: boolean | null
  description?: string | null
}

/**
 * Create file metadata in database
 */
export const createFileMetadata = withErrorHandling(
  async (
    supabase: SupabaseClient,
    fileData: Omit<StoredFile, 'id' | 'downloadCount' | 'createdAt' | 'updatedAt'>
  ): Promise<StoredFile> => {
    const userId = await getUserId(supabase)

    const { data, error } = await supabase
      .from('files')
      .insert({
        ...fileData,
        user_id: userId,
        download_count: 0,
        tags: JSON.stringify(fileData.tags || []),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create file metadata: ${error.message}`)
    }

    return {
      ...data,
      tags: Array.isArray(data.tags) ? data.tags : [],
    } as StoredFile
  },
  { context: { operation: 'createFileMetadata' } }
)

/**
 * Attach a resume to an application
 */
export const attachResumeToApplication = withErrorHandling(
  async (
    supabase: SupabaseClient,
    applicationId: string,
    fileId: string,
    options: {
      isPrimary?: boolean
      notes?: string
    } = {}
  ): Promise<ApplicationResume> => {
    const { data, error } = await supabase
      .from('application_resumes')
      .insert({
        application_id: applicationId,
        file_id: fileId,
        is_primary: options.isPrimary || false,
        notes: options.notes || null,
      })
      .select(
        `
        *,
        files (
          id,
          original_name,
          file_name,
          file_path,
          file_size,
          mime_type,
          file_type,
          bucket_name,
          is_public,
          download_count,
          created_at,
          updated_at
        )
      `
      )
      .single()

    if (error) {
      throw new Error(`Failed to attach resume to application: ${error.message}`)
    }

    return {
      ...data,
      file: data.files
        ? {
            id: data.files.id,
            originalName: data.files.original_name,
            fileName: data.files.file_name,
            filePath: data.files.file_path,
            fileSize: data.files.file_size,
            mimeType: data.files.mime_type,
            fileType: data.files.file_type,
            bucketName: data.files.bucket_name,
            isPublic: data.files.is_public,
            downloadCount: data.files.download_count,
            createdAt: data.files.created_at,
            updatedAt: data.files.updated_at,
            tags: [],
            description: undefined,
          }
        : undefined,
    } as ApplicationResume
  },
  { context: { operation: 'attachResumeToApplication' } }
)

/**
 * Attach a logo to a company
 */
export const attachLogoToCompany = withErrorHandling(
  async (
    supabase: SupabaseClient,
    companyId: string,
    fileId: string,
    options: {
      isActive?: boolean
    } = {}
  ): Promise<CompanyLogo> => {
    // If this is the new active logo, deactivate previous logos
    if (options.isActive !== false) {
      await supabase.from('company_logos').update({ is_active: false }).eq('company_id', companyId)
    }

    const { data, error } = await supabase
      .from('company_logos')
      .insert({
        company_id: companyId,
        file_id: fileId,
        is_active: options.isActive !== false,
      })
      .select(
        `
        *,
        files (
          id,
          original_name,
          file_name,
          file_path,
          file_size,
          mime_type,
          file_type,
          bucket_name,
          is_public,
          download_count,
          created_at,
          updated_at
        )
      `
      )
      .single()

    if (error) {
      throw new Error(`Failed to attach logo to company: ${error.message}`)
    }

    return {
      ...data,
      file: data.files
        ? {
            id: data.files.id,
            originalName: data.files.original_name,
            fileName: data.files.file_name,
            filePath: data.files.file_path,
            fileSize: data.files.file_size,
            mimeType: data.files.mime_type,
            fileType: data.files.file_type,
            bucketName: data.files.bucket_name,
            isPublic: data.files.is_public,
            downloadCount: data.files.download_count,
            createdAt: data.files.created_at,
            updatedAt: data.files.updated_at,
            tags: [],
            description: undefined,
          }
        : undefined,
    } as CompanyLogo
  },
  { context: { operation: 'attachLogoToCompany' } }
)

/**
 * Attach a document to an application
 */
export const attachDocumentToApplication = withErrorHandling(
  async (
    supabase: SupabaseClient,
    applicationId: string,
    fileId: string,
    documentType: string,
    options: {
      description?: string
      isPrivate?: boolean
    } = {}
  ): Promise<ApplicationDocument> => {
    const { data, error } = await supabase
      .from('application_documents')
      .insert({
        application_id: applicationId,
        file_id: fileId,
        document_type: documentType,
        description: options.description || null,
        is_private: options.isPrivate !== false,
      })
      .select(
        `
        *,
        files (
          id,
          original_name,
          file_name,
          file_path,
          file_size,
          mime_type,
          file_type,
          bucket_name,
          is_public,
          download_count,
          created_at,
          updated_at
        )
      `
      )
      .single()

    if (error) {
      throw new Error(`Failed to attach document to application: ${error.message}`)
    }

    return {
      ...data,
      file: data.files
        ? {
            id: data.files.id,
            originalName: data.files.original_name,
            fileName: data.files.file_name,
            filePath: data.files.file_path,
            fileSize: data.files.file_size,
            mimeType: data.files.mime_type,
            fileType: data.files.file_type,
            bucketName: data.files.bucket_name,
            isPublic: data.files.is_public,
            downloadCount: data.files.download_count,
            createdAt: data.files.created_at,
            updatedAt: data.files.updated_at,
            tags: [],
            description: undefined,
          }
        : undefined,
    } as ApplicationDocument
  },
  { context: { operation: 'attachDocumentToApplication' } }
)

/**
 * Get all files for an application
 */
export const getApplicationFiles = withErrorHandling(
  async (supabase: SupabaseClient, applicationId: string): Promise<FileWithMetadata[]> => {
    const { data, error } = await supabase
      .from('application_files')
      .select('*')
      .eq('application_id', applicationId)
      .order('file_created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get application files: ${error.message}`)
    }

    return data as FileWithMetadata[]
  },
  { context: { operation: 'getApplicationFiles' } }
)

/**
 * Get primary resume for an application
 */
export const getPrimaryResume = withErrorHandling(
  async (supabase: SupabaseClient, applicationId: string): Promise<ApplicationResume | null> => {
    const { data, error } = await supabase
      .from('application_resumes')
      .select(
        `
        *,
        files (
          id,
          original_name,
          file_name,
          file_path,
          file_size,
          mime_type,
          file_type,
          bucket_name,
          is_public,
          download_count,
          created_at,
          updated_at
        )
      `
      )
      .eq('application_id', applicationId)
      .eq('is_primary', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get primary resume: ${error.message}`)
    }

    if (!data) return null

    return {
      ...data,
      file: data.files
        ? {
            id: data.files.id,
            originalName: data.files.original_name,
            fileName: data.files.file_name,
            filePath: data.files.file_path,
            fileSize: data.files.file_size,
            mimeType: data.files.mime_type,
            fileType: data.files.file_type,
            bucketName: data.files.bucket_name,
            isPublic: data.files.is_public,
            downloadCount: data.files.download_count,
            createdAt: data.files.created_at,
            updatedAt: data.files.updated_at,
            tags: [],
            description: undefined,
          }
        : undefined,
    } as ApplicationResume
  },
  { context: { operation: 'getPrimaryResume' } }
)

/**
 * Get active logo for a company
 */
export const getCompanyLogo = withErrorHandling(
  async (supabase: SupabaseClient, companyId: string): Promise<CompanyLogo | null> => {
    const { data, error } = await supabase
      .from('company_files')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get company logo: ${error.message}`)
    }

    if (!data) return null

    return {
      ...data,
      file: {
        id: data.file_id,
        originalName: data.original_name,
        fileName: data.file_name,
        filePath: data.file_path,
        fileSize: data.file_size,
        mimeType: data.mime_type,
        fileType: data.file_type,
        bucketName: data.bucket_name,
        isPublic: true, // Company logos should be public
        downloadCount: 0,
        createdAt: data.file_created_at,
        updatedAt: data.file_created_at,
        tags: [],
        description: undefined,
      },
    } as CompanyLogo
  },
  { context: { operation: 'getCompanyLogo' } }
)

/**
 * Delete application file relationship
 */
export const removeApplicationFile = withErrorHandling(
  async (
    supabase: SupabaseClient,
    relationshipId: string,
    relationshipType: 'resume' | 'document'
  ): Promise<void> => {
    const table = relationshipType === 'resume' ? 'application_resumes' : 'application_documents'

    const { error } = await supabase.from(table).delete().eq('id', relationshipId)

    if (error) {
      throw new Error(`Failed to remove application file: ${error.message}`)
    }
  },
  { context: { operation: 'removeApplicationFile' } }
)

/**
 * Update file relationship metadata
 */
export const updateApplicationFileMetadata = withErrorHandling(
  async (
    supabase: SupabaseClient,
    relationshipId: string,
    relationshipType: 'resume' | 'document',
    updates: {
      isPrimary?: boolean
      description?: string
      isPrivate?: boolean
      isActive?: boolean
    }
  ): Promise<void> => {
    const table = relationshipType === 'resume' ? 'application_resumes' : 'application_documents'

    const { error } = await supabase.from(table).update(updates).eq('id', relationshipId)

    if (error) {
      throw new Error(`Failed to update file metadata: ${error.message}`)
    }
  },
  { context: { operation: 'updateApplicationFileMetadata' } }
)

// Helper function to get user ID (reused from other modules)
async function getUserId(supabase: SupabaseClient): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }
  return user.id
}
