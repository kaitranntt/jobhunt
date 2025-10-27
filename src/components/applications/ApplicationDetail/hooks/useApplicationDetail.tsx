'use client'

import * as React from 'react'
import type { Application } from '@/lib/types/database.types'
import type { ApplicationFormData } from '@/lib/schemas/application.schema'
import type { ApplicationDetailState, TabType } from '../types'

interface UseApplicationDetailProps {
  application: Application
  onUpdate: (id: string, data: ApplicationFormData) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onClose: () => void
}

export function useApplicationDetail({
  application,
  onUpdate,
  onDelete,
  onClose,
}: UseApplicationDetailProps) {
  const [state, setState] = React.useState<ApplicationDetailState>({
    activeTab: 'overview',
    isStatusDropdownOpen: false,
    isEditMode: false,
    isDeleteDialogOpen: false,
    isSubmitting: false,
    isDeleting: false,
    error: null,
  })

  const setActiveTab = React.useCallback((tab: TabType) => {
    setState(prev => ({ ...prev, activeTab: tab }))
  }, [])

  const setStatusDropdownOpen = React.useCallback((open: boolean) => {
    setState(prev => ({ ...prev, isStatusDropdownOpen: open }))
  }, [])

  const setEditMode = React.useCallback((editMode: boolean) => {
    setState(prev => ({ ...prev, isEditMode: editMode, error: null }))
  }, [])

  const setDeleteDialogOpen = React.useCallback((open: boolean) => {
    setState(prev => ({ ...prev, isDeleteDialogOpen: open }))
  }, [])

  const setError = React.useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }))
  }, [])

  const handleEditClick = React.useCallback(() => {
    setEditMode(true)
  }, [setEditMode])

  const handleCancelEdit = React.useCallback(() => {
    setEditMode(false)
    setError(null)
  }, [setEditMode, setError])

  const handleFormSubmit = React.useCallback(
    async (data: ApplicationFormData) => {
      setState(prev => ({ ...prev, isSubmitting: true, error: null }))

      try {
        await onUpdate(application.id, data)
        setEditMode(false)
      } catch (err) {
        setError('Failed to update application. Please try again.')
        console.error('Update error:', err)
      } finally {
        setState(prev => ({ ...prev, isSubmitting: false }))
      }
    },
    [application.id, onUpdate, setEditMode, setError]
  )

  const handleDeleteClick = React.useCallback(() => {
    setDeleteDialogOpen(true)
  }, [setDeleteDialogOpen])

  const handleDeleteConfirm = React.useCallback(async () => {
    setState(prev => ({ ...prev, isDeleting: true, error: null }))

    try {
      await onDelete(application.id)
      setDeleteDialogOpen(false)
      onClose()
    } catch (err) {
      setError('Failed to delete application. Please try again.')
      setDeleteDialogOpen(false)
      console.error('Delete error:', err)
    } finally {
      setState(prev => ({ ...prev, isDeleting: false }))
    }
  }, [application.id, onDelete, onClose, setDeleteDialogOpen, setError])

  const handleDeleteCancel = React.useCallback(() => {
    setDeleteDialogOpen(false)
  }, [setDeleteDialogOpen])

  return {
    // State
    ...state,

    // Actions
    setActiveTab,
    setStatusDropdownOpen,
    setEditMode,
    setDeleteDialogOpen,
    setError,

    // Handlers
    handleEditClick,
    handleCancelEdit,
    handleFormSubmit,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
  }
}
