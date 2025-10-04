import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  uploadDocument,
  getDocumentsByApplication,
  getDocumentUrl,
  deleteDocument,
} from '../documents'
import type { Document } from '@/lib/types/database.types'

// Mock Supabase client with storage API
const mockStorageUpload = vi.fn()
const mockStorageGetPublicUrl = vi.fn()
const mockStorageRemove = vi.fn()
const mockDatabaseInsert = vi.fn()
const mockDatabaseSelect = vi.fn()
const mockDatabaseDelete = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        upload: mockStorageUpload,
        getPublicUrl: mockStorageGetPublicUrl,
        remove: mockStorageRemove,
        createSignedUrl: vi.fn(() => ({
          data: { signedUrl: 'https://example.com/signed-url' },
          error: null,
        })),
      })),
    },
    from: vi.fn(() => ({
      insert: mockDatabaseInsert,
      select: mockDatabaseSelect,
      delete: mockDatabaseDelete,
    })),
  })),
}))

const mockDocument: Document = {
  id: 'doc-1',
  user_id: 'user-1',
  application_id: 'app-1',
  file_name: 'resume.pdf',
  file_path: 'user-1/app-1/1234567890-resume.pdf',
  file_type: 'application/pdf',
  file_size: 1024000,
  created_at: '2025-10-04T10:00:00Z',
}

describe('Documents API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('uploadDocument', () => {
    it('should successfully upload a PDF file', async () => {
      const mockFile = new File(['test content'], 'resume.pdf', {
        type: 'application/pdf',
      })

      mockStorageUpload.mockResolvedValue({
        data: { path: 'user-1/app-1/1234567890-resume.pdf' },
        error: null,
      })

      mockDatabaseInsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockDocument,
            error: null,
          }),
        }),
      })

      const result = await uploadDocument(mockFile, 'app-1', 'user-1')

      expect(result).toEqual(mockDocument)
      expect(mockStorageUpload).toHaveBeenCalledWith(
        expect.stringContaining('user-1/app-1/'),
        mockFile,
        {
          cacheControl: '3600',
          upsert: false,
        }
      )
    })

    it('should successfully upload a DOCX file', async () => {
      const mockFile = new File(['test content'], 'cover-letter.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })

      mockStorageUpload.mockResolvedValue({
        data: { path: 'user-1/app-1/1234567890-cover-letter.docx' },
        error: null,
      })

      mockDatabaseInsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              ...mockDocument,
              file_name: 'cover-letter.docx',
              file_type:
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            },
            error: null,
          }),
        }),
      })

      const result = await uploadDocument(mockFile, 'app-1', 'user-1')

      expect(result.file_type).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      )
    })

    it('should successfully upload a TXT file', async () => {
      const mockFile = new File(['test content'], 'notes.txt', {
        type: 'text/plain',
      })

      mockStorageUpload.mockResolvedValue({
        data: { path: 'user-1/app-1/1234567890-notes.txt' },
        error: null,
      })

      mockDatabaseInsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              ...mockDocument,
              file_name: 'notes.txt',
              file_type: 'text/plain',
            },
            error: null,
          }),
        }),
      })

      const result = await uploadDocument(mockFile, 'app-1', 'user-1')

      expect(result.file_type).toBe('text/plain')
    })

    it('should reject unsupported file types', async () => {
      const mockFile = new File(['test content'], 'image.jpg', {
        type: 'image/jpeg',
      })

      await expect(uploadDocument(mockFile, 'app-1', 'user-1')).rejects.toThrow(
        'Unsupported file type. Only PDF, DOCX, and TXT files are allowed.'
      )

      expect(mockStorageUpload).not.toHaveBeenCalled()
    })

    it('should reject files larger than 10MB', async () => {
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', {
        type: 'application/pdf',
      })

      await expect(uploadDocument(largeFile, 'app-1', 'user-1')).rejects.toThrow(
        'File size exceeds 10MB limit.'
      )

      expect(mockStorageUpload).not.toHaveBeenCalled()
    })

    it('should handle storage upload errors', async () => {
      const mockFile = new File(['test content'], 'resume.pdf', {
        type: 'application/pdf',
      })

      mockStorageUpload.mockResolvedValue({
        data: null,
        error: { message: 'Storage error' },
      })

      await expect(uploadDocument(mockFile, 'app-1', 'user-1')).rejects.toThrow(
        'Failed to upload file to storage: Storage error'
      )
    })

    it('should handle database insert errors', async () => {
      const mockFile = new File(['test content'], 'resume.pdf', {
        type: 'application/pdf',
      })

      mockStorageUpload.mockResolvedValue({
        data: { path: 'user-1/app-1/1234567890-resume.pdf' },
        error: null,
      })

      mockDatabaseInsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      })

      await expect(uploadDocument(mockFile, 'app-1', 'user-1')).rejects.toThrow(
        'Failed to save document metadata: Database error'
      )
    })
  })

  describe('getDocumentsByApplication', () => {
    it('should fetch documents for an application', async () => {
      mockDatabaseSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [mockDocument],
            error: null,
          }),
        }),
      })

      const result = await getDocumentsByApplication('app-1')

      expect(result).toEqual([mockDocument])
      expect(mockDatabaseSelect).toHaveBeenCalledWith('*')
    })

    it('should return empty array when no documents found', async () => {
      mockDatabaseSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      })

      const result = await getDocumentsByApplication('app-1')

      expect(result).toEqual([])
    })

    it('should handle database errors', async () => {
      mockDatabaseSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      })

      await expect(getDocumentsByApplication('app-1')).rejects.toThrow(
        'Failed to fetch documents: Database error'
      )
    })
  })

  describe('getDocumentUrl', () => {
    it('should generate a signed URL for a document', async () => {
      const result = await getDocumentUrl('user-1/app-1/1234567890-resume.pdf')

      expect(result).toBe('https://example.com/signed-url')
    })
  })

  describe('deleteDocument', () => {
    it('should delete both storage file and database record', async () => {
      mockStorageRemove.mockResolvedValue({
        data: null,
        error: null,
      })

      mockDatabaseDelete.mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      })

      await expect(
        deleteDocument('doc-1', 'user-1/app-1/1234567890-resume.pdf')
      ).resolves.toBeUndefined()

      expect(mockStorageRemove).toHaveBeenCalledWith([
        'user-1/app-1/1234567890-resume.pdf',
      ])
      expect(mockDatabaseDelete).toHaveBeenCalled()
    })

    it('should handle storage deletion errors', async () => {
      mockStorageRemove.mockResolvedValue({
        data: null,
        error: { message: 'Storage deletion error' },
      })

      await expect(
        deleteDocument('doc-1', 'user-1/app-1/1234567890-resume.pdf')
      ).rejects.toThrow('Failed to delete file from storage: Storage deletion error')

      expect(mockDatabaseDelete).not.toHaveBeenCalled()
    })

    it('should handle database deletion errors', async () => {
      mockStorageRemove.mockResolvedValue({
        data: null,
        error: null,
      })

      mockDatabaseDelete.mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: { message: 'Database deletion error' },
        }),
      })

      await expect(
        deleteDocument('doc-1', 'user-1/app-1/1234567890-resume.pdf')
      ).rejects.toThrow('Failed to delete document record: Database deletion error')
    })
  })
})
