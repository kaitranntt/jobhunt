/**
 * Storage Client Type Definitions
 *
 * Provides proper typing for storage operations without using any types
 */

/**
 * File upload options
 */
export interface FileUploadOptions {
  file: File
  bucket: string
  path?: string
  metadata?: Record<string, string>
  upsert?: boolean
}

/**
 * File metadata structure
 */
export interface FileMetadata {
  originalName: string
  fileName: string
  fileSize: number
  mimeType: string
  fileType: string
  bucketName: string
  description?: string
  tags?: string[]
  isPublic?: boolean
}

/**
 * Complete stored file information
 */
export interface StoredFile {
  id: string
  originalName: string
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  fileType: string
  bucketName: string
  description?: string
  tags: string[]
  isPublic: boolean
  downloadCount: number
  createdAt: string
  updatedAt: string
}

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean
  error?: string
}

/**
 * File update data structure
 */
export interface FileUpdateData {
  description?: string
  tags?: string[]
  isPublic?: boolean
}

/**
 * File query options for getUserFiles
 */
export interface FileQueryOptions {
  fileType?: string
  bucket?: string
  isPublic?: boolean
  limit?: number
  offset?: number
  search?: string
}

/**
 * User files query result
 */
export interface UserFilesResult {
  files: StoredFile[]
  total: number
}

/**
 * Storage metadata for Supabase
 */
export interface StorageMetadata {
  originalName: string
  fileType: string
  uploadedAt: string
  description?: string
  tags?: string
}

/**
 * File upload result
 */
export interface FileUploadResult {
  path: string
  url: string
}

/**
 * Supported file type categories
 */
export type SupportedFileTypeCategory = 'resumes' | 'images' | 'documents'

/**
 * File type configuration
 */
export interface FileTypeConfig {
  maxSize: number
  allowedTypes: readonly string[]
}

/**
 * File path generation parameters
 */
export interface FilePathParams {
  bucket: string
  userId: string
  originalName: string
  fileType: string
}
