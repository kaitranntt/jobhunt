/**
 * Company Management API
 *
 * Handles company creation, retrieval, and relationship management
 * for proper data integrity between applications and companies.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Company, CompanyInsert, CompanyUpdate } from '@/lib/types/database.types'
import { withErrorHandling } from '@/lib/errors/handlers'

/**
 * Get a company by name for a specific user
 */
export const getCompanyByName = withErrorHandling(
  async (
    supabase: SupabaseClient,
    userId: string,
    companyName: string
  ): Promise<Company | null> => {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', userId)
      .eq('name', companyName)
      .single()

    if (error && error.code !== 'PGRST116') {
      // Not found error
      throw new Error(`Failed to fetch company: ${error.message}`)
    }

    return data as Company | null
  },
  { context: { operation: 'getCompanyByName' } }
)

/**
 * Get a company by ID
 */
export const getCompanyById = withErrorHandling(
  async (supabase: SupabaseClient, userId: string, companyId: string): Promise<Company | null> => {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', userId)
      .eq('id', companyId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // Not found error
      throw new Error(`Failed to fetch company: ${error.message}`)
    }

    return data as Company | null
  },
  { context: { operation: 'getCompanyById' } }
)

/**
 * Create a new company for a user
 */
export const createCompany = withErrorHandling(
  async (
    supabase: SupabaseClient,
    userId: string,
    companyData: CompanyInsert
  ): Promise<Company> => {
    const { data, error } = await supabase
      .from('companies')
      .insert({ ...companyData, user_id: userId })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create company: ${error.message}`)
    }

    return data as Company
  },
  { context: { operation: 'createCompany' } }
)

/**
 * Update an existing company
 */
export const updateCompany = withErrorHandling(
  async (
    supabase: SupabaseClient,
    userId: string,
    companyId: string,
    updates: CompanyUpdate
  ): Promise<Company> => {
    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('user_id', userId)
      .eq('id', companyId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update company: ${error.message}`)
    }

    return data as Company
  },
  { context: { operation: 'updateCompany' } }
)

/**
 * Get or create a company by name
 * This is a convenience function that handles the common pattern of:
 * 1. Check if company exists
 * 2. Create it if it doesn't
 * 3. Return the company object
 */
export const getOrCreateCompany = withErrorHandling(
  async (
    supabase: SupabaseClient,
    userId: string,
    companyName: string,
    companyData?: Partial<CompanyInsert>
  ): Promise<Company> => {
    // First, try to find existing company
    let company = await getCompanyByName(supabase, userId, companyName)

    if (!company) {
      // Create new company if not found
      company = await createCompany(supabase, userId, {
        name: companyName,
        website: companyData?.website || null,
        logo_url: companyData?.logo_url || null,
        industry: companyData?.industry || null,
      })
    }

    return company
  },
  { context: { operation: 'getOrCreateCompany' } }
)

/**
 * Get all companies for a user with pagination
 */
export const getUserCompanies = withErrorHandling(
  async (
    supabase: SupabaseClient,
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Company[]> => {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Failed to fetch companies: ${error.message}`)
    }

    return data as Company[]
  },
  { context: { operation: 'getUserCompanies' } }
)

/**
 * Search companies by name
 */
export const searchCompanies = withErrorHandling(
  async (
    supabase: SupabaseClient,
    userId: string,
    query: string,
    limit: number = 20
  ): Promise<Company[]> => {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', userId)
      .ilike('name', `%${query}%`)
      .order('name', { ascending: true })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to search companies: ${error.message}`)
    }

    return data as Company[]
  },
  { context: { operation: 'searchCompanies' } }
)

/**
 * Delete a company (only if no applications are associated)
 */
export const deleteCompany = withErrorHandling(
  async (supabase: SupabaseClient, userId: string, companyId: string): Promise<void> => {
    // First check if any applications are associated
    const { data: applications, error: checkError } = await supabase
      .from('applications')
      .select('id')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .limit(1)

    if (checkError) {
      throw new Error(`Failed to check company applications: ${checkError.message}`)
    }

    if (applications && applications.length > 0) {
      throw new Error('Cannot delete company with associated applications')
    }

    // Delete the company
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('user_id', userId)
      .eq('id', companyId)

    if (error) {
      throw new Error(`Failed to delete company: ${error.message}`)
    }
  },
  { context: { operation: 'deleteCompany' } }
)
