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
  company_id: string | null
  company_name: string
  job_title: string
  job_url: string | null
  location: string | null
  salary_range: string | null
  job_description: string | null
  company_logo_url: string | null
  source: string
  status: ApplicationStatus
  date_applied: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  user_id: string
  name: string
  website: string | null
  logo_url: string | null
  industry: string | null
  created_at: string
  updated_at: string
}

export interface ApplicationWithCompany extends Omit<Application, 'company_id'> {
  company?: Company
}

export type ApplicationInsert = Omit<Application, 'id' | 'created_at' | 'updated_at' | 'user_id'>
export type ApplicationUpdate = Partial<Omit<Application, 'id' | 'user_id'>>

export type CompanyInsert = Omit<Company, 'id' | 'created_at' | 'updated_at' | 'user_id'>
export type CompanyUpdate = Partial<Omit<Company, 'id' | 'user_id'>>
