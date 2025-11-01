/**
 * Storage Client API
 *
 * Handles file upload, download, and management for Supabase Storage
 * with proper security and validation.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { withErrorHandling } from '@/lib/errors/handlers'
import type {
  FileUploadOptions,
  FileMetadata,
  StoredFile,
  FileQueryOptions,
  UserFilesResult,
} from './types'

// Re-export types for external use
export type { FileMetadata, StoredFile }

// File interfaces now imported from './types'

/**
 * Supported file types and their MIME types
 */
export const SUPPORTED_FILE_TYPES = {
  resumes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/rtf',
  ],
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
  ],
} as const

/**
 * Maximum file sizes (in bytes)
 */
export const MAX_FILE_SIZES = {
  resume: 5 * 1024 * 1024, // 5MB
  image: 2 * 1024 * 1024, // 2MB
  document: 10 * 1024 * 1024, // 10MB
}

/**
 * Generate a unique file path
 */
export function generateFilePath(
  bucket: string,
  userId: string,
  originalName: string,
  fileType: string
): string {
  const timestamp = Date.now()
  const extension = originalName.split('.').pop()
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 50)

  return `${bucket}/${userId}/${fileType}/${timestamp}_${sanitizedName}.${extension}`
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  allowedTypes: string[],
  maxSize: number
): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds maximum allowed size of ${(maxSize / 1024 / 1024).toFixed(1)}MB`,
    }
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not supported. Allowed types: ${allowedTypes.join(', ')}`,
    }
  }

  return { valid: true }
}

/**
 * Upload a file to Supabase Storage
 */
export const uploadFile = withErrorHandling(
  async (
    supabase: SupabaseClient,
    options: FileUploadOptions,
    metadata: FileMetadata
  ): Promise<{ path: string; url: string }> => {
    const { file, bucket, path, upsert = false } = options

    // Get current user ID
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const uploadPath =
      path || generateFilePath(bucket, user.id, metadata.originalName, metadata.fileType)

    // Validate file
    const maxSize =
      MAX_FILE_SIZES[metadata.fileType as keyof typeof MAX_FILE_SIZES] || MAX_FILE_SIZES.document
    const allowedTypes = [
      ...(SUPPORTED_FILE_TYPES[metadata.fileType as keyof typeof SUPPORTED_FILE_TYPES] ||
        SUPPORTED_FILE_TYPES.documents),
    ]

    const validation = validateFile(file, allowedTypes, maxSize)
    if (!validation.valid) {
      throw new Error(validation.error!)
    }

    // Prepare metadata for storage
    const storageMetadata = {
      originalName: metadata.originalName,
      fileType: metadata.fileType,
      uploadedAt: new Date().toISOString(),
      ...(metadata.description && { description: metadata.description }),
      ...(metadata.tags && metadata.tags.length > 0 && { tags: metadata.tags.join(',') }),
    }

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage.from(bucket).upload(uploadPath, file, {
      cacheControl: '3600',
      upsert,
      metadata: storageMetadata,
    })

    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`)
    }

    // Get public URL if file is public
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)

    return {
      path: data.path,
      url: urlData.publicUrl,
    }
  },
  { context: { operation: 'uploadFile' } }
)

/**
 * Download a file from Supabase Storage
 */
export const downloadFile = withErrorHandling(
  async (supabase: SupabaseClient, bucket: string, path: string): Promise<Blob> => {
    const { data, error } = await supabase.storage.from(bucket).download(path)

    if (error) {
      throw new Error(`Failed to download file: ${error.message}`)
    }

    return data as Blob
  },
  { context: { operation: 'downloadFile' } }
)

/**
 * Get public URL for a file
 */
export const getPublicUrl = (supabase: SupabaseClient, bucket: string, path: string): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)

  return data.publicUrl
}

/**
 * Get signed URL for private files
 */
export const getSignedUrl = withErrorHandling(
  async (
    supabase: SupabaseClient,
    bucket: string,
    path: string,
    expiresIn: number = 3600
  ): Promise<string> => {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn)

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`)
    }

    return data.signedUrl
  },
  { context: { operation: 'getSignedUrl' } }
)

/**
 * Delete a file from Supabase Storage
 */
export const deleteFile = withErrorHandling(
  async (supabase: SupabaseClient, bucket: string, path: string): Promise<void> => {
    const { error } = await supabase.storage.from(bucket).remove([path])

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`)
    }
  },
  { context: { operation: 'deleteFile' } }
)

/**
 * Get file information from database
 */
export const getFileMetadata = withErrorHandling(
  async (supabase: SupabaseClient, fileId: string): Promise<StoredFile | null> => {
    const { data, error } = await supabase.from('files').select('*').eq('id', fileId).single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get file metadata: ${error.message}`)
    }

    return data as StoredFile | null
  },
  { context: { operation: 'getFileMetadata' } }
)

/**
 * Update file metadata
 */
export const updateFileMetadata = withErrorHandling(
  async (
    supabase: SupabaseClient,
    fileId: string,
    updates: Partial<Pick<StoredFile, 'description' | 'tags' | 'isPublic'>>
  ): Promise<StoredFile> => {
    const updateData: Record<string, unknown> = { ...updates }

    if (updates.tags) {
      updateData.tags = JSON.stringify(updates.tags)
    }

    const { data, error } = await supabase
      .from('files')
      .update(updateData)
      .eq('id', fileId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update file metadata: ${error.message}`)
    }

    return data as StoredFile
  },
  { context: { operation: 'updateFileMetadata' } }
)

/**
 * Get files for a user with pagination and filtering
 */
export const getUserFiles = withErrorHandling(
  async (supabase: SupabaseClient, options: FileQueryOptions = {}): Promise<UserFilesResult> => {
    let query = supabase.from('files').select('*', { count: 'exact' })

    // Apply filters
    if (options.fileType) {
      query = query.eq('file_type', options.fileType)
    }

    if (options.bucket) {
      query = query.eq('bucket_name', options.bucket)
    }

    if (options.isPublic !== undefined) {
      query = query.eq('is_public', options.isPublic)
    }

    // Apply search filter
    if (options.search) {
      query = query.or(
        `original_name.ilike.%${options.search}%,file_name.ilike.%${options.search}%,description.ilike.%${options.search}%`
      )
    }

    // Apply sorting
    query = query.order('created_at', { ascending: false })

    // Apply pagination
    const limit = options.limit || 50
    const offset = options.offset || 0
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to get user files: ${error.message}`)
    }

    return {
      files: (data || []).map(file => ({
        ...file,
        tags: Array.isArray(file.tags) ? file.tags : [],
      })) as StoredFile[],
      total: count || 0,
    }
  },
  { context: { operation: 'getUserFiles' } }
)
