'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Upload, X, File, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { FileMetadata } from '@/lib/storage/storage-client'
import { MAX_FILE_SIZES } from '@/lib/storage/storage-client'

interface FileUploadProps {
  accept?: string[]
  maxSize?: number
  bucket: string
  fileType: string
  isPublic?: boolean
  onUploadComplete?: (file: FileMetadata) => void
  onUploadError?: (error: string) => void
  disabled?: boolean
  className?: string
  multiple?: boolean
  description?: string
  allowedTypes?: string[]
}

interface UploadItem {
  file: File
  id: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  url?: string
  metadata?: FileMetadata
}

export function FileUpload({
  accept,
  maxSize = MAX_FILE_SIZES.document,
  bucket,
  fileType,
  isPublic = false,
  onUploadComplete,
  onUploadError,
  disabled = false,
  className,
  multiple = false,
  description,
  allowedTypes,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    (files: FileList) => {
      if (disabled) return

      const newItems: UploadItem[] = Array.from(files).map(file => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        progress: 0,
        status: 'pending',
      }))

      if (multiple) {
        setUploadItems(prev => [...prev, ...newItems])
      } else {
        setUploadItems(newItems)
      }
    },
    [disabled, multiple]
  )

  const uploadFile = useCallback(
    async (item: UploadItem) => {
      // Update status to uploading
      setUploadItems(prev =>
        prev.map(i => (i.id === item.id ? { ...i, status: 'uploading', progress: 0 } : i))
      )

      try {
        // Import storage client dynamically to avoid SSR issues
        const { uploadFile: uploadFileToStorage } = await import('@/lib/storage/storage-client')
        const { createFileMetadata } = await import('@/lib/api/file-management')
        const { getBrowserClient } = await import('@/lib/supabase/singleton')
        const supabase = getBrowserClient()

        // Prepare file metadata
        const metadata: FileMetadata = {
          originalName: item.file.name,
          fileName: item.file.name.replace(/[^a-zA-Z0-9.-]/g, '_'),
          fileSize: item.file.size,
          mimeType: item.file.type,
          fileType,
          bucketName: bucket,
          isPublic: isPublic ?? false,
          description: '',
        }

        // Upload file to storage
        const uploadResult = await uploadFileToStorage(
          supabase,
          {
            file: item.file,
            bucket,
            upsert: false,
          },
          metadata
        )

        // Update progress to 90%
        setUploadItems(prev => prev.map(i => (i.id === item.id ? { ...i, progress: 90 } : i)))

        // Create database record
        const storedFile = await createFileMetadata(supabase, {
          originalName: metadata.originalName,
          fileName: metadata.fileName,
          filePath: uploadResult.path,
          fileSize: metadata.fileSize,
          mimeType: metadata.mimeType,
          fileType: metadata.fileType,
          bucketName: metadata.bucketName,
          description: metadata.description,
          tags: metadata.tags || [],
          isPublic: metadata.isPublic ?? false,
        })

        // Update to success status
        setUploadItems(prev =>
          prev.map(i =>
            i.id === item.id
              ? {
                  ...i,
                  status: 'success',
                  progress: 100,
                  metadata: storedFile,
                  url: uploadResult.url,
                }
              : i
          )
        )

        onUploadComplete?.(storedFile)
      } catch (error) {
        console.error('Upload failed:', error)
        setUploadItems(prev =>
          prev.map(i =>
            i.id === item.id
              ? {
                  ...i,
                  status: 'error',
                  error: error instanceof Error ? error.message : 'Upload failed',
                }
              : i
          )
        )
        onUploadError?.(error instanceof Error ? error.message : 'Upload failed')
      }
    },
    [bucket, fileType, isPublic, onUploadComplete, onUploadError]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      if (disabled) return

      const files = e.dataTransfer.files
      if (files.length > 0) {
        handleFiles(files)
      }
    },
    [disabled, handleFiles]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleFiles(files)
      }
    },
    [handleFiles]
  )

  const handleRemoveFile = useCallback((id: string) => {
    setUploadItems(prev => prev.filter(item => item.id !== id))
  }, [])

  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      // Check file size
      if (file.size > maxSize) {
        return {
          valid: false,
          error: `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds maximum allowed size of ${(maxSize / 1024 / 1024).toFixed(1)}MB`,
        }
      }

      // Check file type if accept is specified
      if (accept && !accept.includes(file.type)) {
        return {
          valid: false,
          error: `File type ${file.type} is not supported`,
        }
      }

      return { valid: true }
    },
    [accept, maxSize]
  )

  const processUploads = useCallback(async () => {
    const pendingItems = uploadItems.filter(item => item.status === 'pending')

    for (const item of pendingItems) {
      const validation = validateFile(item.file)
      if (!validation.valid) {
        setUploadItems(prev =>
          prev.map(i => (i.id === item.id ? { ...i, status: 'error', error: validation.error } : i))
        )
        onUploadError?.(validation.error!)
        continue
      }

      await uploadFile(item)
    }
  }, [uploadItems, validateFile, onUploadError, uploadFile])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getIcon = (status: UploadItem['status']) => {
    switch (status) {
      case 'pending':
        return <File className="h-4 w-4 text-gray-400" />
      case 'uploading':
        return <Upload className="h-4 w-4 text-blue-500 animate-pulse" />
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <File className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-6">
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
            isDragOver && 'border-primary bg-primary/5',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept?.join(',')}
            multiple={multiple}
            onChange={handleFileSelect}
            disabled={disabled}
            className="hidden"
          />

          <div className="flex flex-col items-center space-y-4">
            <div
              className={cn(
                'p-3 rounded-full transition-colors',
                isDragOver ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-600'
              )}
            >
              <Upload className="h-6 w-6" />
            </div>

            <div className="space-y-2">
              <p className="text-lg font-medium">
                {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
              </p>
              <p className="text-sm text-muted-foreground">
                {description || `Upload ${fileType} files`}
              </p>
              {allowedTypes && (
                <p className="text-xs text-muted-foreground">
                  Allowed: {Array.isArray(allowedTypes) ? allowedTypes.join(', ') : allowedTypes}
                </p>
              )}
              <p className="text-xs text-muted-foreground">Max size: {formatFileSize(maxSize)}</p>
            </div>

            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
            >
              Choose Files
            </Button>
          </div>
        </div>

        {uploadItems.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Upload Queue ({uploadItems.length})</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={processUploads}
                disabled={disabled || !uploadItems.some(item => item.status === 'pending')}
              >
                Upload All
              </Button>
            </div>

            <div className="space-y-2">
              {uploadItems.map(item => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border bg-background',
                    item.status === 'error' && 'border-red-200 bg-red-50'
                  )}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    {getIcon(item.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.file.name}</p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(item.file.size)}</span>
                        {item.error && <span className="text-red-500 truncate">{item.error}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {item.status === 'uploading' && (
                      <Progress value={item.progress} className="w-20" />
                    )}
                    {item.status === 'success' && item.url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(item.url, '_blank')}
                      >
                        View
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveFile(item.id)}
                      disabled={item.status === 'uploading'}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
