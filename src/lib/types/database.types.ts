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
