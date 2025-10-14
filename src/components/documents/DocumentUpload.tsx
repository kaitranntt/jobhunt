'use client'

import * as React from 'react'
import { Upload, X, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { uploadDocument } from '@/lib/api/documents'

interface DocumentUploadProps {
  applicationId: string
  userId: string
  onUploadComplete: () => void
}

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]

const MAX_SIZE = 10 * 1024 * 1024 // 10MB

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentUpload({ applicationId, userId, onUploadComplete }: DocumentUploadProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [error, setError] = React.useState<string>('')
  const [isUploading, setIsUploading] = React.useState(false)
  const [isDragging, setIsDragging] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Unsupported file type. Only PDF, DOCX, and TXT files are allowed.'
    }
    if (file.size > MAX_SIZE) {
      return 'File size exceeds 10 MB limit.'
    }
    return null
  }

  const handleFileSelection = (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      setSelectedFile(null)
      return
    }

    setError('')
    setSelectedFile(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelection(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelection(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setError('')

    try {
      await uploadDocument(selectedFile, applicationId, userId)

      // Reset form
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Notify parent component
      onUploadComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'glass-medium rounded-glass p-8 text-center transition-all shadow-glass-soft',
          isDragging && 'glass-heavy',
          !isDragging && 'glass-medium hover:glass-light'
        )}
        style={{
          border: isDragging
            ? '2px dashed var(--tint-blue)'
            : '2px dashed var(--glass-border-medium)',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          id="document-upload"
          onChange={handleFileInputChange}
          className="sr-only"
          aria-label="Upload document"
        />

        <div className="flex flex-col items-center gap-2">
          <Upload
            className="h-10 w-10"
            style={{ color: isDragging ? 'var(--tint-blue)' : 'var(--macos-label-tertiary)' }}
          />
          <div className="space-y-1">
            <p className="text-sm font-medium text-label-primary">
              Drag and drop your file here, or{' '}
              <label
                htmlFor="document-upload"
                className="cursor-pointer font-semibold hover:underline"
                style={{ color: 'var(--tint-blue)' }}
              >
                browse
              </label>
            </p>
            <p className="text-xs text-label-tertiary font-medium">
              Supported formats: PDF, DOCX, TXT (max 10 MB)
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="glass-light rounded-glass p-3 text-sm shadow-glass-soft"
          style={{ border: '1px solid var(--color-error)', color: 'var(--color-error)' }}
        >
          {error}
        </div>
      )}

      {/* Selected File */}
      {selectedFile && !error && (
        <div
          className="glass-light rounded-glass p-4 shadow-glass-soft"
          style={{ border: '1px solid var(--glass-border-medium)' }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-glass-sm glass-medium shadow-glass-subtle"
                style={{ border: '1px solid var(--glass-border-medium)' }}
              >
                <FileText className="h-5 w-5" style={{ color: 'var(--tint-purple)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-label-primary truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-label-tertiary font-medium">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            {!isUploading && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleRemoveFile}
                aria-label="Remove file"
                className="glass-ultra rounded-full hover:glass-light"
              >
                <X className="h-4 w-4 text-label-secondary" />
              </Button>
            )}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="mt-3 space-y-2">
              <Progress value={undefined} className="h-2 glass-light" />
              <p className="text-xs text-label-secondary font-medium">Uploading...</p>
            </div>
          )}

          {/* Upload Button */}
          {!isUploading && (
            <Button
              onClick={handleUpload}
              className="w-full mt-3 btn-glass font-semibold"
              disabled={isUploading}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

DocumentUpload.displayName = 'DocumentUpload'
