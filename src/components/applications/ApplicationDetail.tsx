'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { X, Edit2, Trash2, ExternalLink } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Application, ApplicationStatus } from '@/lib/types/database.types'
import type { ApplicationFormData } from '@/lib/schemas/application.schema'
import ApplicationForm from './ApplicationForm'

interface ApplicationDetailProps {
  application: Application
  onUpdate: (id: string, data: ApplicationFormData) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onClose: () => void
  isOpen: boolean
}

const getStatusColor = (status: ApplicationStatus): string => {
  const statusColorMap: Record<ApplicationStatus, string> = {
    wishlist: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100',
    applied: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    phone_screen: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    assessment: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    take_home: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    interviewing: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
    final_round: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
    offered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    accepted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    withdrawn: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    ghosted: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  }

  return statusColorMap[status]
}

const formatDate = (dateString: string): string => {
  try {
    return format(new Date(dateString), 'MMM dd, yyyy')
  } catch {
    return dateString
  }
}

const formatFieldValue = (value: string | null | undefined): string => {
  if (!value || value === '') {
    return 'N/A'
  }
  return value
}

export function ApplicationDetail({
  application,
  onUpdate,
  onDelete,
  onClose,
  isOpen,
}: ApplicationDetailProps) {
  const [isEditMode, setIsEditMode] = React.useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const statusColor = getStatusColor(application.status)

  const handleEditClick = () => {
    setIsEditMode(true)
    setError(null)
  }

  const handleCancelEdit = () => {
    setIsEditMode(false)
    setError(null)
  }

  const handleFormSubmit = async (data: ApplicationFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      await onUpdate(application.id, data)
      setIsEditMode(false)
    } catch (err) {
      setError('Failed to update application. Please try again.')
      console.error('Update error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      await onDelete(application.id)
      setIsDeleteDialogOpen(false)
      onClose()
    } catch (err) {
      setError('Failed to delete application. Please try again.')
      setIsDeleteDialogOpen(false)
      console.error('Delete error:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false)
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-2xl font-bold mb-2">
                  {application.company_name}
                </SheetTitle>
                <SheetDescription className="text-lg">
                  {application.job_title}
                </SheetDescription>
                <div className="mt-2">
                  <Badge className={cn('text-sm', statusColor)}>{application.status}</Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close"
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-800 dark:text-red-200">
                {error}
              </div>
            )}

            {isEditMode ? (
              <div className="space-y-6">
                <ApplicationForm
                  onSubmit={handleFormSubmit}
                  initialData={{
                    company_name: application.company_name,
                    job_title: application.job_title,
                    job_url: application.job_url ?? '',
                    location: application.location ?? '',
                    salary_range: application.salary_range ?? '',
                    status: application.status,
                    date_applied: application.date_applied,
                    notes: application.notes ?? '',
                  }}
                  isLoading={isSubmitting}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Company Name</h3>
                  <p className="text-base">{application.company_name}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Job Title</h3>
                  <p className="text-base">{application.job_title}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Job URL</h3>
                  {application.job_url ? (
                    <a
                      href={application.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                    >
                      View Job Posting
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="text-base text-muted-foreground">{formatFieldValue(null)}</p>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Location</h3>
                  <p className="text-base">{formatFieldValue(application.location)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Salary Range</h3>
                  <p className="text-base">{formatFieldValue(application.salary_range)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                  <p className="text-base capitalize">{application.status.replace('_', ' ')}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Date Applied</h3>
                  <p className="text-base">{formatDate(application.date_applied)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Notes</h3>
                  <p className="text-base whitespace-pre-wrap">
                    {formatFieldValue(application.notes)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 pt-6 border-t">
            {isEditMode ? (
              <Button variant="outline" onClick={handleCancelEdit} disabled={isSubmitting}>
                Cancel
              </Button>
            ) : (
              <Button variant="outline" onClick={handleEditClick}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}

            <Button
              variant="destructive"
              onClick={handleDeleteClick}
              disabled={isDeleting || isSubmitting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the application for{' '}
              <strong>{application.company_name}</strong>.
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
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

ApplicationDetail.displayName = 'ApplicationDetail'
