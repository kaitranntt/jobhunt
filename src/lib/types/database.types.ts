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
