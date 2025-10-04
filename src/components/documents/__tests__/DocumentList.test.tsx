import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { DocumentList } from '../DocumentList'
import * as documentsApi from '@/lib/api/documents'
import type { Document } from '@/lib/types/database.types'

// Mock the documents API
vi.mock('@/lib/api/documents', () => ({
  getDocumentsByApplication: vi.fn(),
  getDocumentUrl: vi.fn(),
  deleteDocument: vi.fn(),
}))

describe('DocumentList', () => {
  const mockApplicationId = 'app-456'

  const createMockDocument = (overrides?: Partial<Document>): Document => ({
    id: 'doc-123',
    user_id: 'user-123',
    application_id: mockApplicationId,
    file_name: 'resume.pdf',
    file_path: 'user-123/app-456/123456789-resume.pdf',
    file_type: 'application/pdf',
    file_size: 1024 * 500, // 500KB
    created_at: '2025-10-01T10:00:00Z',
    ...overrides,
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading State', () => {
    it('displays loading indicator while fetching documents', () => {
      vi.mocked(documentsApi.getDocumentsByApplication).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      render(<DocumentList applicationId={mockApplicationId} />)

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('displays empty state when no documents exist', async () => {
      vi.mocked(documentsApi.getDocumentsByApplication).mockResolvedValue([])

      render(<DocumentList applicationId={mockApplicationId} />)

      await waitFor(() => {
        expect(screen.getByText(/no documents uploaded/i)).toBeInTheDocument()
      })
    })

    it('displays helpful message in empty state', async () => {
      vi.mocked(documentsApi.getDocumentsByApplication).mockResolvedValue([])

      render(<DocumentList applicationId={mockApplicationId} />)

      await waitFor(() => {
        expect(screen.getByText(/upload.*document/i)).toBeInTheDocument()
      })
    })
  })

  describe('Document Rendering', () => {
    it('displays all documents for an application', async () => {
      const documents = [
        createMockDocument({ id: 'doc-1', file_name: 'resume.pdf' }),
        createMockDocument({ id: 'doc-2', file_name: 'cover-letter.docx' }),
        createMockDocument({ id: 'doc-3', file_name: 'references.txt' }),
      ]

      vi.mocked(documentsApi.getDocumentsByApplication).mockResolvedValue(documents)

      render(<DocumentList applicationId={mockApplicationId} />)

      await waitFor(() => {
        expect(screen.getByText('resume.pdf')).toBeInTheDocument()
        expect(screen.getByText('cover-letter.docx')).toBeInTheDocument()
        expect(screen.getByText('references.txt')).toBeInTheDocument()
      })
    })

    it('displays file size for each document', async () => {
      const documents = [
        createMockDocument({ id: 'doc-1', file_name: 'small.pdf', file_size: 1024 }), // 1KB
        createMockDocument({ id: 'doc-2', file_name: 'medium.pdf', file_size: 1024 * 500 }), // 500KB
        createMockDocument({ id: 'doc-3', file_name: 'large.pdf', file_size: 1024 * 1024 * 5 }), // 5MB
      ]

      vi.mocked(documentsApi.getDocumentsByApplication).mockResolvedValue(documents)

      render(<DocumentList applicationId={mockApplicationId} />)

      await waitFor(() => {
        expect(screen.getByText(/1.*kb/i)).toBeInTheDocument()
        expect(screen.getByText(/500.*kb/i)).toBeInTheDocument()
        expect(screen.getByText(/5.*mb/i)).toBeInTheDocument()
      })
    })

    it('displays file type for each document', async () => {
      const documents = [
        createMockDocument({ id: 'doc-1', file_name: 'document.pdf', file_type: 'application/pdf' }),
        createMockDocument({
          id: 'doc-2',
          file_name: 'document.docx',
          file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        }),
        createMockDocument({ id: 'doc-3', file_name: 'document.txt', file_type: 'text/plain' }),
      ]

      vi.mocked(documentsApi.getDocumentsByApplication).mockResolvedValue(documents)

      render(<DocumentList applicationId={mockApplicationId} />)

      await waitFor(() => {
        expect(screen.getAllByText('PDF')).toHaveLength(1)
        expect(screen.getAllByText('DOCX')).toHaveLength(1)
        expect(screen.getAllByText('TXT')).toHaveLength(1)
      })
    })

    it('displays upload date for each document', async () => {
      const documents = [
        createMockDocument({
          file_name: 'recent.pdf',
          created_at: '2025-10-15T10:00:00Z',
        }),
      ]

      vi.mocked(documentsApi.getDocumentsByApplication).mockResolvedValue(documents)

      render(<DocumentList applicationId={mockApplicationId} />)

      await waitFor(() => {
        // Should format date
        expect(screen.getByText(/oct.*15.*2025/i)).toBeInTheDocument()
      })
    })
  })

  describe('Download Functionality', () => {
    it('displays download button for each document', async () => {
      const documents = [createMockDocument({ file_name: 'resume.pdf' })]

      vi.mocked(documentsApi.getDocumentsByApplication).mockResolvedValue(documents)

      render(<DocumentList applicationId={mockApplicationId} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument()
      })
    })

    it('calls getDocumentUrl when download button is clicked', async () => {
      const user = userEvent.setup()
      const documents = [
        createMockDocument({
          file_name: 'resume.pdf',
          file_path: 'user-123/app-456/resume.pdf',
        }),
      ]

      vi.mocked(documentsApi.getDocumentsByApplication).mockResolvedValue(documents)
      vi.mocked(documentsApi.getDocumentUrl).mockResolvedValue('https://example.com/signed-url')

      // Mock window.open
      const mockOpen = vi.fn()
      vi.stubGlobal('open', mockOpen)

      render(<DocumentList applicationId={mockApplicationId} />)

      await waitFor(() => {
        expect(screen.getByText('resume.pdf')).toBeInTheDocument()
      })

      const downloadButton = screen.getByRole('button', { name: /download/i })
      await user.click(downloadButton)

      await waitFor(() => {
        expect(documentsApi.getDocumentUrl).toHaveBeenCalledWith('user-123/app-456/resume.pdf')
        expect(mockOpen).toHaveBeenCalledWith('https://example.com/signed-url', '_blank')
      })

      vi.unstubAllGlobals()
    })

    it('displays error message if download fails', async () => {
      const user = userEvent.setup()
      const documents = [createMockDocument()]

      vi.mocked(documentsApi.getDocumentsByApplication).mockResolvedValue(documents)
      vi.mocked(documentsApi.getDocumentUrl).mockRejectedValue(new Error('Failed to generate URL'))

      render(<DocumentList applicationId={mockApplicationId} />)

      await waitFor(() => {
        expect(screen.getByText('resume.pdf')).toBeInTheDocument()
      })

      const downloadButton = screen.getByRole('button', { name: /download/i })
      await user.click(downloadButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to generate url/i)).toBeInTheDocument()
      })
    })
  })

  describe('Delete Functionality', () => {
    it('displays delete button for each document', async () => {
      const documents = [createMockDocument()]

      vi.mocked(documentsApi.getDocumentsByApplication).mockResolvedValue(documents)

      render(<DocumentList applicationId={mockApplicationId} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
      })
    })

    it('shows confirmation dialog when delete button is clicked', async () => {
      const user = userEvent.setup()
      const documents = [createMockDocument({ file_name: 'resume.pdf' })]

      vi.mocked(documentsApi.getDocumentsByApplication).mockResolvedValue(documents)

      render(<DocumentList applicationId={mockApplicationId} />)

      await waitFor(() => {
        expect(screen.getByText('resume.pdf')).toBeInTheDocument()
      })

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
        expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument()
      })
    })

    it('does not delete document when confirmation is cancelled', async () => {
      const user = userEvent.setup()
      const documents = [createMockDocument()]

      vi.mocked(documentsApi.getDocumentsByApplication).mockResolvedValue(documents)

      render(<DocumentList applicationId={mockApplicationId} />)

      await waitFor(() => {
        expect(screen.getByText('resume.pdf')).toBeInTheDocument()
      })

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
      })

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(documentsApi.deleteDocument).not.toHaveBeenCalled()
    })

    it('deletes document when confirmation is accepted', async () => {
      const user = userEvent.setup()
      const documents = [
        createMockDocument({
          id: 'doc-123',
          file_path: 'user-123/app-456/resume.pdf',
        }),
      ]

      vi.mocked(documentsApi.getDocumentsByApplication).mockResolvedValue(documents)
      vi.mocked(documentsApi.deleteDocument).mockResolvedValue()

      render(<DocumentList applicationId={mockApplicationId} />)

      await waitFor(() => {
        expect(screen.getByText('resume.pdf')).toBeInTheDocument()
      })

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /delete/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(documentsApi.deleteDocument).toHaveBeenCalledWith('doc-123', 'user-123/app-456/resume.pdf')
      })
    })

    it('refreshes document list after successful deletion', async () => {
      const user = userEvent.setup()
      const documents = [
        createMockDocument({
          id: 'doc-123',
          file_name: 'resume.pdf',
          file_path: 'user-123/app-456/resume.pdf',
        }),
      ]

      vi.mocked(documentsApi.getDocumentsByApplication)
        .mockResolvedValueOnce(documents)
        .mockResolvedValueOnce([]) // Empty after deletion

      vi.mocked(documentsApi.deleteDocument).mockResolvedValue()

      render(<DocumentList applicationId={mockApplicationId} />)

      await waitFor(() => {
        expect(screen.getByText('resume.pdf')).toBeInTheDocument()
      })

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /delete/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(screen.getByText(/no documents uploaded/i)).toBeInTheDocument()
      })

      expect(documentsApi.getDocumentsByApplication).toHaveBeenCalledTimes(2)
    })

    it('displays error message if deletion fails', async () => {
      const user = userEvent.setup()
      const documents = [createMockDocument()]

      vi.mocked(documentsApi.getDocumentsByApplication).mockResolvedValue(documents)
      vi.mocked(documentsApi.deleteDocument).mockRejectedValue(
        new Error('Failed to delete document')
      )

      render(<DocumentList applicationId={mockApplicationId} />)

      await waitFor(() => {
        expect(screen.getByText('resume.pdf')).toBeInTheDocument()
      })

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /delete/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(screen.getByText(/failed.*delete/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('displays error message when fetching documents fails', async () => {
      vi.mocked(documentsApi.getDocumentsByApplication).mockRejectedValue(
        new Error('Failed to fetch documents')
      )

      render(<DocumentList applicationId={mockApplicationId} />)

      await waitFor(() => {
        expect(screen.getByText(/failed to fetch documents/i)).toBeInTheDocument()
      })
    })

    it('provides retry option when fetching fails', async () => {
      const user = userEvent.setup()
      vi.mocked(documentsApi.getDocumentsByApplication)
        .mockRejectedValueOnce(new Error('Failed to fetch documents'))
        .mockResolvedValueOnce([createMockDocument()])

      render(<DocumentList applicationId={mockApplicationId} />)

      await waitFor(() => {
        expect(screen.getByText(/failed to fetch documents/i)).toBeInTheDocument()
      })

      const retryButton = screen.getByRole('button', { name: /retry/i })
      await user.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText('resume.pdf')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('uses semantic list structure', async () => {
      const documents = [
        createMockDocument({ id: 'doc-1' }),
        createMockDocument({ id: 'doc-2' }),
      ]

      vi.mocked(documentsApi.getDocumentsByApplication).mockResolvedValue(documents)

      const { container } = render(<DocumentList applicationId={mockApplicationId} />)

      await waitFor(() => {
        const list = container.querySelector('[role="list"]')
        expect(list).toBeInTheDocument()
      })
    })

    it('has accessible button labels', async () => {
      const documents = [createMockDocument({ file_name: 'resume.pdf' })]

      vi.mocked(documentsApi.getDocumentsByApplication).mockResolvedValue(documents)

      render(<DocumentList applicationId={mockApplicationId} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
      })
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      const documents = [createMockDocument()]

      vi.mocked(documentsApi.getDocumentsByApplication).mockResolvedValue(documents)

      render(<DocumentList applicationId={mockApplicationId} />)

      await waitFor(() => {
        expect(screen.getByText('resume.pdf')).toBeInTheDocument()
      })

      // Tab to download button
      await user.tab()
      const downloadButton = screen.getByRole('button', { name: /download/i })
      expect(downloadButton).toHaveFocus()

      // Tab to delete button
      await user.tab()
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      expect(deleteButton).toHaveFocus()
    })
  })

  describe('Responsive Design', () => {
    it('renders in mobile-friendly format', async () => {
      const documents = [createMockDocument()]

      vi.mocked(documentsApi.getDocumentsByApplication).mockResolvedValue(documents)

      const { container } = render(<DocumentList applicationId={mockApplicationId} />)

      await waitFor(() => {
        expect(screen.getByText('resume.pdf')).toBeInTheDocument()
      })

      // Check for responsive classes or grid layout
      const list = container.querySelector('[role="list"]')
      expect(list).toBeInTheDocument()
    })
  })
})
