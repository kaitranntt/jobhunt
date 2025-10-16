export type ApplicationStatus =
  | 'wishlist'
  | 'applied'
  | 'phone_screen'
  | 'assessment'
  | 'take_home'
  | 'interviewing'
  | 'final_round'
  | 'offered'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'
  | 'ghosted'

export interface Application {
  id: string
  user_id: string
  company_name: string
  job_title: string
  job_url: string | null
  location: string | null
  salary_range: string | null
  status: ApplicationStatus
  date_applied: string
  notes: string | null
  created_at: string
  updated_at: string
}

export type ApplicationInsert = Omit<Application, 'id' | 'created_at' | 'updated_at'>
export type ApplicationUpdate = Partial<Omit<Application, 'id' | 'user_id'>>

export interface Reminder {
  id: string
  user_id: string
  application_id: string | null
  title: string
  description: string | null
  reminder_date: string
  is_completed: boolean
  created_at: string
  updated_at: string
}

export type ReminderInsert = Omit<Reminder, 'id' | 'created_at' | 'updated_at'>
export type ReminderUpdate = Partial<Omit<Reminder, 'id' | 'user_id'>>

export interface Contact {
  id: string
  user_id: string
  application_id: string | null
  name: string
  email: string | null
  phone: string | null
  role: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type ContactInsert = Omit<Contact, 'id' | 'created_at' | 'updated_at'>
export type ContactUpdate = Partial<Omit<Contact, 'id' | 'user_id'>>

export interface Document {
  id: string
  user_id: string
  application_id: string | null
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  created_at: string
}

export type DocumentInsert = Omit<Document, 'id' | 'created_at'>
export type DocumentUpdate = Partial<Omit<Document, 'id' | 'user_id' | 'created_at'>>

export interface UserProfile {
  id: string
  user_id: string
  full_name: string
  phone: string | null
  location: string | null
  job_role: string | null
  desired_roles: string[] | null
  desired_industries: string[] | null
  experience_years: number | null
  linkedin_url: string | null
  portfolio_url: string | null
  created_at: string
  updated_at: string
}

export type UserProfileInsert = Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>
export type UserProfileUpdate = Partial<Omit<UserProfile, 'id' | 'user_id'>>

// Enhanced Kanban Board Types
export interface Board {
  id: string
  user_id: string
  name: string
  description: string | null
  is_default: boolean
  is_archived: boolean
  created_at: string
  updated_at: string
}

export type BoardInsert = Omit<Board, 'id' | 'created_at' | 'updated_at'>
export type BoardUpdate = Partial<Omit<Board, 'id' | 'user_id'>>

export interface BoardColumn {
  id: string
  board_id: string
  user_id: string
  name: string
  color: string
  position: number
  wip_limit: number
  is_default: boolean
  is_archived: boolean
  created_at: string
  updated_at: string
}

export type BoardColumnInsert = Omit<BoardColumn, 'id' | 'created_at' | 'updated_at'>
export type BoardColumnUpdate = Partial<Omit<BoardColumn, 'id' | 'user_id'>>

export interface BoardSettings {
  id: string
  board_id: string
  user_id: string
  theme: string
  compact_mode: boolean
  show_empty_columns: boolean
  show_column_counts: boolean
  enable_animations: boolean
  auto_archive_days: number
  created_at: string
  updated_at: string
}

export type BoardSettingsInsert = Omit<BoardSettings, 'id' | 'created_at' | 'updated_at'>
export type BoardSettingsUpdate = Partial<Omit<BoardSettings, 'id' | 'user_id'>>

export interface BoardAnalytics {
  id: string
  board_id: string
  user_id: string
  column_id: string
  metric_date: string
  application_count: number
  created_at: string
}

export type BoardAnalyticsInsert = Omit<BoardAnalytics, 'id' | 'created_at'>
export type BoardAnalyticsUpdate = Partial<Omit<BoardAnalytics, 'id' | 'user_id'>>
