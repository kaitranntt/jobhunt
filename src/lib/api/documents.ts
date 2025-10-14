import { createClient } from '@/lib/supabase/client'
import type { Document, DocumentInsert } from '@/lib/types/database.types'

// Allowed MIME types for document upload
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  'text/plain',
]

// Maximum file size: 10MB in bytes
const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * Validates file type against allowed MIME types
 */
function validateFileType(fileType: string): void {
  if (!ALLOWED_MIME_TYPES.includes(fileType)) {
    throw new Error('Unsupported file type. Only PDF, DOCX, and TXT files are allowed.')
  }
}

/**
 * Validates file size against maximum allowed size
 */
function validateFileSize(fileSize: number): void {
  if (fileSize > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 10MB limit.')
  }
}

/**
 * Generates a unique file path for storage
 * Format: {userId}/{applicationId}/{timestamp}-{filename}
 */
function generateFilePath(userId: string, applicationId: string, fileName: string): string {
  const timestamp = Date.now()
  return `${userId}/${applicationId}/${timestamp}-${fileName}`
}

/**
 * Uploads a document file to Supabase Storage and saves metadata to database
 * @param file - The file to upload
 * @param applicationId - The application ID to associate the document with
 * @param userId - The user ID who owns the document
 * @returns The created document record
 * @throws Error if validation fails or upload/database operations fail
 */
export async function uploadDocument(
  file: File,
  applicationId: string,
  userId: string
): Promise<Document> {
  const supabase = createClient()

  // Validate file type
  validateFileType(file.type)

  // Validate file size
  validateFileSize(file.size)

  // Generate unique file path
  const filePath = generateFilePath(userId, applicationId, file.name)

  // Upload file to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`Failed to upload file to storage: ${uploadError.message}`)
  }

  // Prepare document metadata for database
  const documentInsert: DocumentInsert = {
    user_id: userId,
    application_id: applicationId,
    file_name: file.name,
    file_path: uploadData.path,
    file_type: file.type,
    file_size: file.size,
  }

  // Save document metadata to database
  const { data: documentData, error: dbError } = await supabase
    .from('documents')
    .insert(documentInsert)
    .select()
    .single()

  if (dbError) {
    throw new Error(`Failed to save document metadata: ${dbError.message}`)
  }

  return documentData
}

/**
 * Retrieves all documents associated with a specific application
 * @param applicationId - The application ID to fetch documents for
 * @returns Array of documents for the application
 * @throws Error if database query fails
 */
export async function getDocumentsByApplication(applicationId: string): Promise<Document[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch documents: ${error.message}`)
  }

  return data
}

/**
 * Generates a signed URL for downloading/viewing a document
 * @param filePath - The storage path of the document
 * @returns A signed URL valid for 1 hour
 * @throws Error if URL generation fails
 */
export async function getDocumentUrl(filePath: string): Promise<string> {
  const supabase = createClient()

  const { data, error } = await supabase.storage.from('documents').createSignedUrl(filePath, 3600) // 1 hour expiry

  if (error) {
    throw new Error(`Failed to generate signed URL: ${error.message}`)
  }

  return data.signedUrl
}

/**
 * Deletes a document from both storage and database
 * @param id - The document ID to delete
 * @param filePath - The storage path of the file to delete
 * @throws Error if deletion from storage or database fails
 */
export async function deleteDocument(id: string, filePath: string): Promise<void> {
  const supabase = createClient()

  // Delete from storage first
  const { error: storageError } = await supabase.storage.from('documents').remove([filePath])

  if (storageError) {
    throw new Error(`Failed to delete file from storage: ${storageError.message}`)
  }

  // Then delete database record
  const { error: dbError } = await supabase.from('documents').delete().eq('id', id)

  if (dbError) {
    throw new Error(`Failed to delete document record: ${dbError.message}`)
  }
}
