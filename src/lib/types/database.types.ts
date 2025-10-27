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
  job_description?: string | null
  company_logo_url?: string | null
  source?: string | null
  status: ApplicationStatus
  date_applied: string
  notes: string | null
  created_at: string
  updated_at: string
}

export type ApplicationInsert = Omit<Application, 'id' | 'created_at' | 'updated_at' | 'user_id'>
export type ApplicationUpdate = Partial<Omit<Application, 'id' | 'user_id'>>
