export type TabType = 'overview' | 'company' | 'documents'

export interface ApplicationDetailState {
  activeTab: TabType
  isStatusDropdownOpen: boolean
  isEditMode: boolean
  isDeleteDialogOpen: boolean
  isSubmitting: boolean
  isDeleting: boolean
  error: string | null
}

export interface TabNavigationItem {
  id: TabType
  label: string
  icon: React.ComponentType<{ className?: string }>
  disabled?: boolean
}

export interface TimelineEvent {
  id: string
  type: 'status_change' | 'note_added' | 'interview_scheduled' | 'document_added'
  title: string
  description: string
  timestamp: string
  metadata?: Record<string, any>
}
