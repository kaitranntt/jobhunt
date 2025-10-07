'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { Edit2, Trash2, ExternalLink, Users, FileText, Bell } from 'lucide-react'
import {
  NonDimmingModal,
  NonDimmingModalContent,
  NonDimmingModalDescription,
  NonDimmingModalHeader,
  NonDimmingModalTitle,
} from '@/components/ui/non-dimming-modal'
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
import ContactList from '@/components/contacts/ContactList'
import { DocumentList } from '@/components/documents/DocumentList'
import ReminderList from '@/components/reminders/ReminderList'

interface ApplicationDetailProps {
  application: Application
  onUpdate: (id: string, data: ApplicationFormData) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onClose: () => void
  isOpen: boolean
}

const getStatusColor = (status: ApplicationStatus): string => {
  const statusColorMap: Record<ApplicationStatus, string> = {
    wishlist: 'glass-ultra text-label-secondary',
    applied:
      'glass-light bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-300/40 dark:border-blue-600/40',
    phone_screen:
      'glass-light bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-300/40 dark:border-yellow-600/40',
    assessment:
      'glass-light bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-300/40 dark:border-yellow-600/40',
    take_home:
      'glass-light bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-300/40 dark:border-yellow-600/40',
    interviewing:
      'glass-light bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-300/40 dark:border-purple-600/40',
    final_round:
      'glass-light bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-300/40 dark:border-purple-600/40',
    offered:
      'glass-light bg-green-500/10 text-green-700 dark:text-green-300 border-green-300/40 dark:border-green-600/40',
    accepted:
      'glass-light bg-green-500/10 text-green-700 dark:text-green-300 border-green-300/40 dark:border-green-600/40',
    rejected:
      'glass-light bg-red-500/10 text-red-700 dark:text-red-300 border-red-300/40 dark:border-red-600/40',
    withdrawn:
      'glass-light bg-red-500/10 text-red-700 dark:text-red-300 border-red-300/40 dark:border-red-600/40',
    ghosted:
      'glass-light bg-red-500/10 text-red-700 dark:text-red-300 border-red-300/40 dark:border-red-600/40',
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
      <NonDimmingModal open={isOpen} onOpenChange={onClose}>
        <NonDimmingModalContent className="w-full sm:max-w-2xl overflow-y-auto">
          <NonDimmingModalHeader className="glass-ultra rounded-t-glass-lg -mx-6 -mt-6 px-6 pt-6 pb-6 mb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <NonDimmingModalTitle className="text-2xl font-bold mb-2 text-label-primary">
                  {application.company_name}
                </NonDimmingModalTitle>
                <NonDimmingModalDescription className="text-lg text-label-secondary font-medium">
                  {application.job_title}
                </NonDimmingModalDescription>
                <div className="mt-3">
                  <Badge className={cn('text-sm px-3 py-1 rounded-glass-sm', statusColor)}>
                    {application.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </div>
          </NonDimmingModalHeader>

          <div className="mt-6 space-y-6">
            {error && (
              <div className="glass-light bg-red-500/10 border border-red-300/40 dark:border-red-600/40 rounded-glass-sm p-4 text-sm text-red-700 dark:text-red-300">
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
              <div className="space-y-6">
                <div className="glass-ultra rounded-glass-sm p-4">
                  <h3 className="text-sm font-semibold text-label-secondary mb-2">Company Name</h3>
                  <p className="text-base text-label-primary font-medium">
                    {application.company_name}
                  </p>
                </div>

                <div className="glass-ultra rounded-glass-sm p-4">
                  <h3 className="text-sm font-semibold text-label-secondary mb-2">Job Title</h3>
                  <p className="text-base text-label-primary font-medium">
                    {application.job_title}
                  </p>
                </div>

                <div className="glass-ultra rounded-glass-sm p-4">
                  <h3 className="text-sm font-semibold text-label-secondary mb-2">Job URL</h3>
                  {application.job_url ? (
                    <a
                      href={application.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-2 font-medium"
                    >
                      View Job Posting
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    <p className="text-base text-label-tertiary">{formatFieldValue(null)}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-ultra rounded-glass-sm p-4">
                    <h3 className="text-sm font-semibold text-label-secondary mb-2">Location</h3>
                    <p className="text-base text-label-primary">
                      {formatFieldValue(application.location)}
                    </p>
                  </div>

                  <div className="glass-ultra rounded-glass-sm p-4">
                    <h3 className="text-sm font-semibold text-label-secondary mb-2">
                      Salary Range
                    </h3>
                    <p className="text-base text-label-primary">
                      {formatFieldValue(application.salary_range)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-ultra rounded-glass-sm p-4">
                    <h3 className="text-sm font-semibold text-label-secondary mb-2">Status</h3>
                    <p className="text-base text-label-primary capitalize">
                      {application.status.replace('_', ' ')}
                    </p>
                  </div>

                  <div className="glass-ultra rounded-glass-sm p-4">
                    <h3 className="text-sm font-semibold text-label-secondary mb-2">
                      Date Applied
                    </h3>
                    <p className="text-base text-label-primary">
                      {formatDate(application.date_applied)}
                    </p>
                  </div>
                </div>

                <div className="glass-ultra rounded-glass-sm p-4">
                  <h3 className="text-sm font-semibold text-label-secondary mb-2">Notes</h3>
                  <p className="text-base text-label-primary whitespace-pre-wrap">
                    {formatFieldValue(application.notes)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Phase 2 Features - Only show in view mode */}
          {!isEditMode && (
            <div className="mt-8 space-y-8 border-t border-label-quaternary pt-6">
              {/* Contacts Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-3 text-label-primary">
                  <div className="glass-ultra rounded-full p-2">
                    <Users className="h-5 w-5 text-label-secondary" />
                  </div>
                  Contacts
                </h3>
                <ContactList applicationId={application.id} />
              </div>

              {/* Documents Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-3 text-label-primary">
                  <div className="glass-ultra rounded-full p-2">
                    <FileText className="h-5 w-5 text-label-secondary" />
                  </div>
                  Documents
                </h3>
                <DocumentList applicationId={application.id} />
              </div>

              {/* Reminders Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-3 text-label-primary">
                  <div className="glass-ultra rounded-full p-2">
                    <Bell className="h-5 w-5 text-label-secondary" />
                  </div>
                  Reminders
                </h3>
                <ReminderList applicationId={application.id} />
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-4 pt-6 border-t border-label-quaternary">
            {isEditMode ? (
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isSubmitting}
                className="glass-ultra border-0"
              >
                Cancel
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleEditClick}
                className="glass-ultra border-0 hover:glass-light"
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}

            <Button
              variant="destructive"
              onClick={handleDeleteClick}
              disabled={isDeleting || isSubmitting}
              className="glass-light bg-red-500/10 text-red-700 dark:text-red-300 border-red-300/40 dark:border-red-600/40 hover:bg-red-500/20"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </NonDimmingModalContent>
      </NonDimmingModal>

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
