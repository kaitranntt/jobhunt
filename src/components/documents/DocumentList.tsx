'use client'

import * as React from 'react'
import { Download, Trash2, FileText, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { getDocumentsByApplication, getDocumentUrl, deleteDocument } from '@/lib/api/documents'
import type { Document } from '@/lib/types/database.types'

interface DocumentListProps {
  applicationId: string
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const getFileTypeLabel = (mimeType: string): string => {
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    return 'DOCX'
  if (mimeType === 'text/plain') return 'TXT'
  return 'File'
}

const formatDate = (dateString: string): string => {
  try {
    return format(new Date(dateString), 'MMM dd, yyyy')
  } catch {
    return dateString
  }
}

export function DocumentList({ applicationId }: DocumentListProps) {
  const [documents, setDocuments] = React.useState<Document[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string>('')
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [documentToDelete, setDocumentToDelete] = React.useState<Document | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const fetchDocuments = React.useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const docs = await getDocumentsByApplication(applicationId)
      setDocuments(docs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents')
    } finally {
      setIsLoading(false)
    }
  }, [applicationId])

  React.useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleDownload = async (document: Document) => {
    try {
      const url = await getDocumentUrl(document.file_path)
      window.open(url, '_blank')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download document')
    }
  }

  const handleDeleteClick = (document: Document) => {
    setDocumentToDelete(document)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return

    setIsDeleting(true)
    setError('')

    try {
      await deleteDocument(documentToDelete.id, documentToDelete.file_path)
      setDeleteDialogOpen(false)
      setDocumentToDelete(null)
      // Refresh the list
      await fetchDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setDocumentToDelete(null)
  }

  // Loading State
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 glass-ultra rounded-glass">
        <Loader2 className="h-6 w-6 animate-spin text-label-tertiary" />
        <span className="ml-2 text-sm text-label-secondary">Loading documents...</span>
      </div>
    )
  }

  // Error State
  if (error && documents.length === 0) {
    return (
      <div className="glass-light rounded-glass p-6 text-center shadow-glass-soft" style={{ border: '1px solid var(--color-error)' }}>
        <p className="text-sm mb-3" style={{ color: 'var(--color-error)' }}>{error}</p>
        <Button variant="outline" size="sm" onClick={fetchDocuments} className="btn-glass">
          Retry
        </Button>
      </div>
    )
  }

  // Empty State
  if (documents.length === 0) {
    return (
      <div className="glass-ultra rounded-glass p-8 text-center" style={{ border: '1px dashed var(--glass-border-medium)' }}>
        <FileText className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--tint-purple)' }} />
        <h3 className="text-sm font-semibold text-label-primary mb-1">No documents uploaded</h3>
        <p className="text-xs text-label-secondary">
          Upload a document to get started
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Error Message (when documents exist but action failed) */}
      {error && documents.length > 0 && (
        <div className="glass-light rounded-glass p-3 text-sm mb-4 shadow-glass-soft" style={{ border: '1px solid var(--color-error)', color: 'var(--color-error)' }}>
          {error}
        </div>
      )}

      {/* Documents List */}
      <div role="list" className="space-y-4">
        {documents.map((document) => (
          <div
            key={document.id}
            role="listitem"
            className="glass-light rounded-glass-sm p-4 shadow-glass-soft glass-interactive"
            style={{ border: '1px solid var(--glass-border-medium)' }}
          >
            <div className="flex items-start gap-3">
              {/* File Icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-glass-sm glass-medium shadow-glass-subtle mt-1"
                style={{ border: '1px solid var(--glass-border-medium)' }}
              >
                <FileText className="h-5 w-5" style={{ color: 'var(--tint-purple)' }} />
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-label-primary truncate mb-1">{document.file_name}</h4>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-label-tertiary font-medium">
                  <span>{getFileTypeLabel(document.file_type)}</span>
                  <span>•</span>
                  <span>{formatFileSize(document.file_size)}</span>
                  <span>•</span>
                  <span>{formatDate(document.created_at)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDownload(document)}
                  aria-label="Download document"
                  className="glass-ultra rounded-full hover:glass-light"
                >
                  <Download className="h-4 w-4 text-label-secondary" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDeleteClick(document)}
                  aria-label="Delete document"
                  className="glass-ultra rounded-full hover:glass-light"
                >
                  <Trash2 className="h-4 w-4 text-label-secondary" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass-heavy rounded-glass shadow-glass-strong" style={{ border: '1px solid var(--glass-border-strong)' }}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold text-label-primary">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-label-secondary">
              This will permanently delete "{documentToDelete?.file_name}". This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel} disabled={isDeleting} className="btn-glass">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="btn-glass"
              style={{ background: 'var(--color-error)', color: 'white' }}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

DocumentList.displayName = 'DocumentList'
