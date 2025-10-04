import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { DocumentUpload } from '../DocumentUpload'
import * as documentsApi from '@/lib/api/documents'

// Mock the documents API
vi.mock('@/lib/api/documents', () => ({
  uploadDocument: vi.fn(),
}))

describe('DocumentUpload', () => {
  const mockUserId = 'user-123'
  const mockApplicationId = 'app-456'
  let mockOnUploadComplete: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnUploadComplete = vi.fn()
  })

  describe('Basic Rendering', () => {
    it('renders file input with drag-and-drop area', () => {
      render(
        <DocumentUpload
          userId={mockUserId}
          applicationId={mockApplicationId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      expect(screen.getByText(/drag.*drop/i)).toBeInTheDocument()
      expect(screen.getByText(/browse/i)).toBeInTheDocument()
    })

    it('displays accepted file types', () => {
      render(
        <DocumentUpload
          userId={mockUserId}
          applicationId={mockApplicationId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      expect(screen.getByText(/pdf.*docx.*txt/i)).toBeInTheDocument()
    })

    it('displays maximum file size limit', () => {
      render(
        <DocumentUpload
          userId={mockUserId}
          applicationId={mockApplicationId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      expect(screen.getByText(/10\s*mb/i)).toBeInTheDocument()
    })
  })

  describe('File Selection', () => {
    it('accepts file selection through browse button', async () => {
      const user = userEvent.setup()
      render(
        <DocumentUpload
          userId={mockUserId}
          applicationId={mockApplicationId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      const input = screen.getByLabelText(/upload document/i)

      await user.upload(input, file)

      expect(screen.getByText('test.pdf')).toBeInTheDocument()
    })

    it('displays selected file name and size', async () => {
      const user = userEvent.setup()
      render(
        <DocumentUpload
          userId={mockUserId}
          applicationId={mockApplicationId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      const file = new File(['a'.repeat(1024)], 'document.pdf', { type: 'application/pdf' })
      const input = screen.getByLabelText(/upload document/i)

      await user.upload(input, file)

      expect(screen.getByText('document.pdf')).toBeInTheDocument()
      expect(screen.getByText(/1.*kb/i)).toBeInTheDocument()
    })
  })

  describe('File Type Validation', () => {
    it('accepts PDF files', async () => {
      const user = userEvent.setup()
      render(
        <DocumentUpload
          userId={mockUserId}
          applicationId={mockApplicationId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      const input = screen.getByLabelText(/upload document/i)

      await user.upload(input, file)

      expect(screen.getByText('test.pdf')).toBeInTheDocument()
      expect(screen.queryByText(/unsupported file type/i)).not.toBeInTheDocument()
    })

    it('accepts DOCX files', async () => {
      const user = userEvent.setup()
      render(
        <DocumentUpload
          userId={mockUserId}
          applicationId={mockApplicationId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      const file = new File(['test'], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })
      const input = screen.getByLabelText(/upload document/i)

      await user.upload(input, file)

      expect(screen.getByText('test.docx')).toBeInTheDocument()
      expect(screen.queryByText(/unsupported file type/i)).not.toBeInTheDocument()
    })

    it('accepts TXT files', async () => {
      const user = userEvent.setup()
      render(
        <DocumentUpload
          userId={mockUserId}
          applicationId={mockApplicationId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      const input = screen.getByLabelText(/upload document/i)

      await user.upload(input, file)

      expect(screen.getByText('test.txt')).toBeInTheDocument()
      expect(screen.queryByText(/unsupported file type/i)).not.toBeInTheDocument()
    })

    it('rejects image files with error message', async () => {
      const user = userEvent.setup()
      render(
        <DocumentUpload
          userId={mockUserId}
          applicationId={mockApplicationId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      const file = new File(['test'], 'test.png', { type: 'image/png' })
      const input = screen.getByLabelText(/upload document/i)

      await user.upload(input, file)

      await waitFor(() => {
        expect(screen.getByText(/unsupported file type/i)).toBeInTheDocument()
      })
      expect(screen.queryByText('test.png')).not.toBeInTheDocument()
    })

    it('rejects video files with error message', async () => {
      const user = userEvent.setup()
      render(
        <DocumentUpload
          userId={mockUserId}
          applicationId={mockApplicationId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      const file = new File(['test'], 'test.mp4', { type: 'video/mp4' })
      const input = screen.getByLabelText(/upload document/i)

      await user.upload(input, file)

      await waitFor(() => {
        expect(screen.getByText(/unsupported file type/i)).toBeInTheDocument()
      })
    })
  })

  describe('File Size Validation', () => {
    it('accepts files under 10MB', async () => {
      const user = userEvent.setup()
      render(
        <DocumentUpload
          userId={mockUserId}
          applicationId={mockApplicationId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      // 5MB file
      const file = new File(['a'.repeat(5 * 1024 * 1024)], 'small.pdf', {
        type: 'application/pdf',
      })
      const input = screen.getByLabelText(/upload document/i)

      await user.upload(input, file)

      expect(screen.getByText('small.pdf')).toBeInTheDocument()
      expect(screen.queryByText(/file size exceeds/i)).not.toBeInTheDocument()
    })

    it('rejects files over 10MB with error message', async () => {
      const user = userEvent.setup()
      render(
        <DocumentUpload
          userId={mockUserId}
          applicationId={mockApplicationId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      // 11MB file
      const file = new File(['a'.repeat(11 * 1024 * 1024)], 'large.pdf', {
        type: 'application/pdf',
      })
      const input = screen.getByLabelText(/upload document/i)

      await user.upload(input, file)

      await waitFor(() => {
        expect(screen.getByText(/file size exceeds.*10.*mb/i)).toBeInTheDocument()
      })
      expect(screen.queryByText('large.pdf')).not.toBeInTheDocument()
    })

    it('accepts files exactly at 10MB limit', async () => {
      const user = userEvent.setup()
      render(
        <DocumentUpload
          userId={mockUserId}
          applicationId={mockApplicationId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      // Exactly 10MB file
      const file = new File(['a'.repeat(10 * 1024 * 1024)], 'exact.pdf', {
        type: 'application/pdf',
      })
      const input = screen.getByLabelText(/upload document/i)

      await user.upload(input, file)

      expect(screen.getByText('exact.pdf')).toBeInTheDocument()
      expect(screen.queryByText(/file size exceeds/i)).not.toBeInTheDocument()
    })
  })

  describe('Upload Process', () => {
    it('shows progress indicator during upload', async () => {
      const user = userEvent.setup()
      vi.mocked(documentsApi.uploadDocument).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      render(
        <DocumentUpload
          userId={mockUserId}
          applicationId={mockApplicationId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      const input = screen.getByLabelText(/upload document/i)

      await user.upload(input, file)

      const uploadButton = screen.getByRole('button', { name: /upload/i })
      await user.click(uploadButton)

      expect(screen.getByText(/uploading/i)).toBeInTheDocument()
    })

    it('calls uploadDocument API with correct parameters', async () => {
      const user = userEvent.setup()
      const mockDocument = {
        id: 'doc-123',
        user_id: mockUserId,
        application_id: mockApplicationId,
        file_name: 'test.pdf',
        file_path: 'user-123/app-456/123456789-test.pdf',
        file_type: 'application/pdf',
        file_size: 4,
        created_at: new Date().toISOString(),
      }

      vi.mocked(documentsApi.uploadDocument).mockResolvedValue(mockDocument)

      render(
        <DocumentUpload
          userId={mockUserId}
          applicationId={mockApplicationId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      const input = screen.getByLabelText(/upload document/i)

      await user.upload(input, file)

      const uploadButton = screen.getByRole('button', { name: /upload/i })
      await user.click(uploadButton)

      await waitFor(() => {
        expect(documentsApi.uploadDocument).toHaveBeenCalledWith(file, mockApplicationId, mockUserId)
      })
    })

    it('calls onUploadComplete after successful upload', async () => {
      const user = userEvent.setup()
      const mockDocument = {
        id: 'doc-123',
        user_id: mockUserId,
        application_id: mockApplicationId,
        file_name: 'test.pdf',
        file_path: 'user-123/app-456/123456789-test.pdf',
        file_type: 'application/pdf',
        file_size: 4,
        created_at: new Date().toISOString(),
      }

      vi.mocked(documentsApi.uploadDocument).mockResolvedValue(mockDocument)

      render(
        <DocumentUpload
          userId={mockUserId}
          applicationId={mockApplicationId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      const input = screen.getByLabelText(/upload document/i)

      await user.upload(input, file)

      const uploadButton = screen.getByRole('button', { name: /upload/i })
      await user.click(uploadButton)

      await waitFor(() => {
        expect(mockOnUploadComplete).toHaveBeenCalledTimes(1)
      })
    })

    it('displays error message on upload failure', async () => {
      const user = userEvent.setup()

      // Ensure clean slate for this test
      vi.clearAllMocks()
      vi.mocked(documentsApi.uploadDocument).mockRejectedValue(
        new Error('Failed to upload file to storage')
      )

      render(
        <DocumentUpload
          userId={mockUserId}
          applicationId={mockApplicationId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      const input = screen.getByLabelText(/upload document/i)

      await user.upload(input, file)

      const uploadButton = screen.getByRole('button', { name: /upload/i })
      await user.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to upload/i)).toBeInTheDocument()
      })

      expect(mockOnUploadComplete).not.toHaveBeenCalled()
    })

    it('resets form after successful upload', async () => {
      const user = userEvent.setup()
      const mockDocument = {
        id: 'doc-123',
        user_id: mockUserId,
        application_id: mockApplicationId,
        file_name: 'test.pdf',
        file_path: 'user-123/app-456/123456789-test.pdf',
        file_type: 'application/pdf',
        file_size: 4,
        created_at: new Date().toISOString(),
      }

      vi.mocked(documentsApi.uploadDocument).mockResolvedValue(mockDocument)

      render(
        <DocumentUpload
          userId={mockUserId}
          applicationId={mockApplicationId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      const input = screen.getByLabelText(/upload document/i)

      await user.upload(input, file)

      const uploadButton = screen.getByRole('button', { name: /upload/i })
      await user.click(uploadButton)

      await waitFor(() => {
        expect(mockOnUploadComplete).toHaveBeenCalledTimes(1)
      })

      // File should be cleared from the form
      expect(screen.queryByText('test.pdf')).not.toBeInTheDocument()
    })
  })

  describe('Drag and Drop', () => {
    it('accepts files via drag and drop', async () => {
      render(
        <DocumentUpload
          userId={mockUserId}
          applicationId={mockApplicationId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      const file = new File(['test'], 'dragged.pdf', { type: 'application/pdf' })
      const dropZone = screen.getByText(/drag.*drop/i).parentElement

      const dataTransfer = {
        files: [file],
        types: ['Files'],
      }

      // Simulate drag and drop
      if (dropZone) {
        const dropEvent = new Event('drop', { bubbles: true })
        Object.defineProperty(dropEvent, 'dataTransfer', {
          value: dataTransfer,
        })
        dropZone.dispatchEvent(dropEvent)
      }

      await waitFor(() => {
        expect(screen.getByText('dragged.pdf')).toBeInTheDocument()
      })
    })

    it('validates file type on drag and drop', async () => {
      render(
        <DocumentUpload
          userId={mockUserId}
          applicationId={mockApplicationId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      const file = new File(['test'], 'image.jpg', { type: 'image/jpeg' })
      const dropZone = screen.getByText(/drag.*drop/i).parentElement

      const dataTransfer = {
        files: [file],
        types: ['Files'],
      }

      if (dropZone) {
        const dropEvent = new Event('drop', { bubbles: true })
        Object.defineProperty(dropEvent, 'dataTransfer', {
          value: dataTransfer,
        })
        dropZone.dispatchEvent(dropEvent)
      }

      await waitFor(() => {
        expect(screen.getByText(/unsupported file type/i)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has accessible file input with label', () => {
      render(
        <DocumentUpload
          userId={mockUserId}
          applicationId={mockApplicationId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      const input = screen.getByLabelText(/upload document/i)
      expect(input).toBeInTheDocument()
      expect(input.tagName).toBe('INPUT')
    })

    it('has keyboard accessible upload button', async () => {
      const user = userEvent.setup()
      render(
        <DocumentUpload
          userId={mockUserId}
          applicationId={mockApplicationId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      const input = screen.getByLabelText(/upload document/i)

      await user.upload(input, file)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument()
      })

      const uploadButton = screen.getByRole('button', { name: /upload/i })
      uploadButton.focus()
      expect(uploadButton).toHaveFocus()
    })

    it('announces upload status to screen readers', async () => {
      const user = userEvent.setup()

      // Mock a slow upload to catch the uploading state
      vi.mocked(documentsApi.uploadDocument).mockImplementation(
        () => new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              id: 'doc-123',
              user_id: mockUserId,
              application_id: mockApplicationId,
              file_name: 'test.pdf',
              file_path: 'user-123/app-456/123456789-test.pdf',
              file_type: 'application/pdf',
              file_size: 4,
              created_at: new Date().toISOString(),
            })
          }, 100)
        })
      )

      render(
        <DocumentUpload
          userId={mockUserId}
          applicationId={mockApplicationId}
          onUploadComplete={mockOnUploadComplete}
        />
      )

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      const input = screen.getByLabelText(/upload document/i)

      await user.upload(input, file)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument()
      })

      const uploadButton = screen.getByRole('button', { name: /upload/i })
      await user.click(uploadButton)

      // Should show uploading state
      await waitFor(() => {
        expect(screen.getByText(/uploading/i)).toBeInTheDocument()
      })
    })
  })
})
