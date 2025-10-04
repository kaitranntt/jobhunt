export type TimelineActivityType = 'application' | 'contact' | 'document' | 'reminder'

export type TimelineActivityAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'completed'
  | 'uploaded'
  | 'status_changed'

export interface TimelineActivity {
  id: string
  type: TimelineActivityType
  action: TimelineActivityAction
  title: string
  description: string
  application_name?: string
  created_at: string
  metadata?: Record<string, string | number | boolean | null>
}

export interface TimelineFilters {
  types?: TimelineActivityType[]
  dateFrom?: string
  dateTo?: string
}

export type TimelineSortOrder = 'newest' | 'oldest'
