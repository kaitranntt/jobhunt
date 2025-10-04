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
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading documents...</span>
      </div>
    )
  }

  // Error State
  if (error && documents.length === 0) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <p className="text-sm text-destructive mb-3">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchDocuments}>
          Retry
        </Button>
      </div>
    )
  }

  // Empty State
  if (documents.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <h3 className="text-sm font-medium mb-1">No documents uploaded</h3>
        <p className="text-xs text-muted-foreground">
          Upload a document to get started
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Error Message (when documents exist but action failed) */}
      {error && documents.length > 0 && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive mb-4">
          {error}
        </div>
      )}

      {/* Documents List */}
      <div role="list" className="space-y-3">
        {documents.map((document) => (
          <div
            key={document.id}
            role="listitem"
            className="rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start gap-3">
              {/* File Icon */}
              <FileText className="h-8 w-8 text-muted-foreground flex-shrink-0 mt-1" />

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium truncate mb-1">{document.file_name}</h4>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>{getFileTypeLabel(document.file_type)}</span>
                  <span>•</span>
                  <span>{formatFileSize(document.file_size)}</span>
                  <span>•</span>
                  <span>{formatDate(document.created_at)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDownload(document)}
                  aria-label="Download document"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDeleteClick(document)}
                  aria-label="Delete document"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{documentToDelete?.file_name}". This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel} disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
