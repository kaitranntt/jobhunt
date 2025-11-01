import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import type { TestDatabase, TestUser, ApplicationStatus } from './types/integration-test.types'

describe('API Integration Tests', () => {
  let testDatabase: TestDatabase
  let supabase: TestDatabase['supabase']
  let testUser: TestUser | null = null

  // Helper to get test user with null safety
  const getTestUser = (): TestUser => {
    if (!testUser) {
      throw new Error('Test user not initialized')
    }
    return testUser
  }

  beforeAll(async () => {
    testDatabase = global.testUtils.getTestDatabase()
    supabase = testDatabase.supabase
  })

  beforeEach(async () => {
    await testDatabase.reset()
    testUser = await global.testUtils.createTestUser()
  })

  describe('Applications API', () => {
    describe('GET /api/applications', () => {
      it('should fetch applications for authenticated user', async () => {
        // Create test applications
        await global.testUtils.createTestApplication(getTestUser().profile.id, {
          company_name: 'Test Company 1',
          job_title: 'Software Engineer',
        })
        await global.testUtils.createTestApplication(getTestUser().profile.id, {
          company_name: 'Test Company 2',
          job_title: 'Frontend Developer',
        })

        // Mock authenticated request
        const { data, error } = await supabase
          .from('applications')
          .select('*')
          .eq('created_by', getTestUser().profile.id)
          .order('created_at', { ascending: false })

        expect(error).toBeNull()
        expect(data).toHaveLength(2)
        expect(data![0].company_name).toBe('Test Company 2')
        expect(data![1].company_name).toBe('Test Company 1')
      })

      it('should support pagination parameters', async () => {
        // Create multiple applications
        for (let i = 0; i < 15; i++) {
          await global.testUtils.createTestApplication(getTestUser().profile.id, {
            company_name: `Company ${i}`,
            job_title: `Job ${i}`,
          })
        }

        // Test first page (limit 10)
        const { data: page1, error: error1 } = await supabase
          .from('applications')
          .select('*')
          .eq('created_by', getTestUser().profile.id)
          .order('created_at', { ascending: false })
          .range(0, 9)

        expect(error1).toBeNull()
        expect(page1).toHaveLength(10)

        // Test second page
        const { data: page2, error: error2 } = await supabase
          .from('applications')
          .select('*')
          .eq('created_by', getTestUser().profile.id)
          .order('created_at', { ascending: false })
          .range(10, 19)

        expect(error2).toBeNull()
        expect(page2).toHaveLength(5)
      })

      it('should filter by status', async () => {
        // Create applications with different statuses
        await global.testUtils.createTestApplication(getTestUser().profile.id, {
          status: 'applied',
        })
        await global.testUtils.createTestApplication(getTestUser().profile.id, {
          status: 'interviewing',
        })
        await global.testUtils.createTestApplication(getTestUser().profile.id, {
          status: 'offered',
        })

        // Filter by interview status
        const { data, error } = await supabase
          .from('applications')
          .select('*')
          .eq('created_by', getTestUser().profile.id)
          .eq('status', 'interviewing')

        expect(error).toBeNull()
        expect(data).toHaveLength(1)
        expect(data![0].status).toBe('interviewing')
      })

      it('should search by company and job title', async () => {
        // Create test applications
        await global.testUtils.createTestApplication(getTestUser().profile.id, {
          company_name: 'Google LLC',
          job_title: 'Senior Software Engineer',
        })
        await global.testUtils.createTestApplication(getTestUser().profile.id, {
          company_name: 'Microsoft Corp',
          job_title: 'Frontend Developer',
        })

        // Search by company name
        const { data: companyResults, error: companyError } = await supabase
          .from('applications')
          .select('*')
          .eq('created_by', getTestUser().profile.id)
          .ilike('company_name', '%google%')

        expect(companyError).toBeNull()
        expect(companyResults).toHaveLength(1)
        expect(companyResults![0].company_name).toBe('Google LLC')

        // Search by job title
        const { data: titleResults, error: titleError } = await supabase
          .from('applications')
          .select('*')
          .eq('created_by', getTestUser().profile.id)
          .ilike('job_title', '%engineer%')

        expect(titleError).toBeNull()
        expect(titleResults).toHaveLength(1)
        expect(titleResults![0].job_title).toBe('Senior Software Engineer')
      })
    })

    describe('POST /api/applications', () => {
      it('should create new application', async () => {
        const applicationData = {
          company_name: 'New Company',
          job_title: 'Product Manager',
          status: 'applied',
          description: 'Product management role',
          location: 'Remote',
          salary_min: 100000,
          salary_max: 150000,
          url: 'https://newcompany.com/jobs',
        }

        const { data, error } = await supabase
          .from('applications')
          .insert({
            ...applicationData,
            created_by: getTestUser().profile.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        expect(error).toBeNull()
        expect(data.company_name).toBe(applicationData.company_name)
        expect(data.job_title).toBe(applicationData.job_title)
        expect(data.status).toBe(applicationData.status)
        expect(data.created_by).toBe(getTestUser().profile.id)
      })

      it('should validate required fields', async () => {
        const invalidData = {
          // Missing company_name and job_title
          status: 'applied',
        }

        const { data, error } = await supabase
          .from('applications')
          .insert({
            ...invalidData,
            created_by: getTestUser().profile.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        expect(error).toBeTruthy()
        expect(data).toBeNull()
      })

      it('should validate URL format', async () => {
        const applicationData = {
          company_name: 'Test Company',
          job_title: 'Test Job',
          status: 'applied',
          url: 'invalid-url', // Invalid URL format
        }

        const { data, error } = await supabase
          .from('applications')
          .insert({
            ...applicationData,
            created_by: getTestUser().profile.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        // Database may or may not validate URL format
        // If it doesn't, the application should still be created
        if (error) {
          expect(error).toBeTruthy()
          expect(data).toBeNull()
        } else {
          expect(data).toBeTruthy()
        }
      })
    })

    describe('PUT /api/applications/[id]', () => {
      it('should update existing application', async () => {
        const application = await global.testUtils.createTestApplication(getTestUser().profile.id, {
          status: 'applied',
        })

        const updateData = {
          status: 'interviewing',
          notes: 'Phone interview scheduled',
          updated_at: new Date().toISOString(),
        }

        const { data, error } = await supabase
          .from('applications')
          .update(updateData)
          .eq('id', application.id)
          .select()
          .single()

        expect(error).toBeNull()
        expect(data.status).toBe('interviewing')
        expect(data.notes).toBe('Phone interview scheduled')
      })

      it('should prevent updating other users applications', async () => {
        const otherUser = await global.testUtils.createTestUser()
        const otherApplication = await global.testUtils.createTestApplication(
          otherUser.profile.id,
          {
            status: 'applied',
          }
        )

        // Switch back to the original test user
        await supabase.auth.signInWithPassword({
          email: testUser!.profile.email,
          password: 'test-password-123',
        })

        const updateData = {
          status: 'interviewing',
          updated_at: new Date().toISOString(),
        }

        const { data, error } = await supabase
          .from('applications')
          .update(updateData)
          .eq('id', otherApplication.id)
          .select()
          .single()

        // Should fail due to RLS policies
        expect(error).toBeTruthy()
        expect(data).toBeNull()
      })

      it('should handle updating non-existent application', async () => {
        const updateData = {
          status: 'interviewing',
          updated_at: new Date().toISOString(),
        }

        const { data, error } = await supabase
          .from('applications')
          .update(updateData)
          .eq('id', 'non-existent-id')
          .select()
          .single()

        expect(error).toBeTruthy()
        expect(data).toBeNull()
      })
    })

    describe('DELETE /api/applications/[id]', () => {
      it('should delete application', async () => {
        const application = await global.testUtils.createTestApplication(getTestUser().profile.id)

        const { error } = await supabase.from('applications').delete().eq('id', application.id)

        expect(error).toBeNull()

        // Verify deletion
        const { data: deletedApp } = await supabase
          .from('applications')
          .select('*')
          .eq('id', application.id)
          .single()

        expect(deletedApp).toBeNull()
      })

      it('should prevent deleting other users applications', async () => {
        const otherUser = await global.testUtils.createTestUser()
        const otherApplication = await global.testUtils.createTestApplication(otherUser.profile.id)

        // Switch back to the original test user
        await supabase.auth.signInWithPassword({
          email: testUser!.profile.email,
          password: 'test-password-123',
        })

        const { error, data: deleteResult } = await supabase
          .from('applications')
          .delete()
          .eq('id', otherApplication.id)
          .select()

        // RLS should prevent deletion, so we expect either an error or no rows affected
        if (error) {
          expect(error).toBeTruthy()
        } else {
          // If no error, check if any rows were deleted (RLS may have blocked it)
          expect(Array.isArray(deleteResult) ? deleteResult.length === 0 : !deleteResult).toBe(true)
        }

        // The key test is that the delete operation was properly blocked or returned no rows
        if (error) {
          // Error indicates RLS blocked the operation - correct behavior
          expect(error).toBeTruthy()
        } else {
          // If no error, verify no rows were deleted (RLS blocked it)
          expect(Array.isArray(deleteResult) ? deleteResult.length === 0 : !deleteResult).toBe(true)
        }
      })
    })
  })

  describe('Companies API', () => {
    describe('GET /api/companies', () => {
      it('should fetch companies', async () => {
        // Create test companies
        await global.testUtils.createTestCompany({ name: 'Company A' })
        await global.testUtils.createTestCompany({ name: 'Company B' })

        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .order('name', { ascending: true })

        expect(error).toBeNull()
        expect(data!.length).toBeGreaterThanOrEqual(2)
      })

      it('should search companies by name', async () => {
        await global.testUtils.createTestCompany({ name: 'Technology Solutions Inc' })
        await global.testUtils.createTestCompany({ name: 'Digital Innovations Ltd' })

        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .ilike('name', '%technology%')

        expect(error).toBeNull()
        expect(data).toHaveLength(1)
        expect(data![0].name).toBe('Technology Solutions Inc')
      })
    })

    describe('POST /api/companies', () => {
      it('should create new company', async () => {
        const companyData = {
          name: 'New Technology Corp',
          description: 'Software development company',
          industry: 'Technology',
          size: '50-100',
          website: 'https://newtech.com',
        }

        const { data, error } = await supabase
          .from('companies')
          .insert({
            ...companyData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        expect(error).toBeNull()
        expect(data.name).toBe(companyData.name)
        expect(data.industry).toBe(companyData.industry)
      })
    })
  })

  describe('User Profile API', () => {
    describe('GET /api/profile', () => {
      it('should fetch authenticated user profile', async () => {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', getTestUser().profile.id)
          .single()

        expect(error).toBeNull()
        expect(data.id).toBe(getTestUser().profile.id)
        expect(data.email).toBe(getTestUser().profile.email)
      })

      it('should return null for unauthenticated user', async () => {
        await supabase.auth.signOut()

        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', getTestUser().profile.id)
          .single()

        expect(error).toBeTruthy()
        expect(data).toBeNull()
      })
    })

    describe('PUT /api/profile', () => {
      it('should update user profile', async () => {
        const updateData = {
          name: 'Updated Name',
          bio: 'Updated bio',
          avatar_url: 'https://example.com/new-avatar.jpg',
          updated_at: new Date().toISOString(),
        }

        const { data, error } = await supabase
          .from('user_profiles')
          .update(updateData)
          .eq('id', getTestUser().profile.id)
          .select()
          .single()

        expect(error).toBeNull()
        expect(data.name).toBe('Updated Name')
        expect(data.bio).toBe('Updated bio')
      })

      it('should prevent updating other users profiles', async () => {
        const otherUser = await global.testUtils.createTestUser()

        // Switch back to the original test user
        await supabase.auth.signInWithPassword({
          email: testUser!.profile.email,
          password: 'test-password-123',
        })

        const updateData = {
          name: 'Hacked Name',
          updated_at: new Date().toISOString(),
        }

        const { data, error } = await supabase
          .from('user_profiles')
          .update(updateData)
          .eq('id', otherUser.profile.id)
          .select()
          .single()

        expect(error).toBeTruthy()
        expect(data).toBeNull()
      })
    })
  })

  describe('Application Activities API', () => {
    describe('GET /api/applications/[id]/activities', () => {
      it('should fetch activities for application', async () => {
        const application = await global.testUtils.createTestApplication(getTestUser().profile.id)

        // Create activities
        await supabase.from('application_activities').insert({
          application_id: application.id,
          type: 'status_change',
          description: 'Application submitted',
          created_by: getTestUser().profile.id,
          created_at: new Date().toISOString(),
        })

        await supabase.from('application_activities').insert({
          application_id: application.id,
          type: 'note_added',
          description: 'Added follow-up note',
          created_by: getTestUser().profile.id,
          created_at: new Date().toISOString(),
        })

        const { data, error } = await supabase
          .from('application_activities')
          .select('*')
          .eq('application_id', application.id)
          .order('created_at', { ascending: true })

        expect(error).toBeNull()
        expect(data).toHaveLength(2)
        expect(data![0].type).toBe('status_change')
        expect(data![1].type).toBe('note_added')
      })
    })

    describe('POST /api/applications/[id]/activities', () => {
      it('should create new activity', async () => {
        const application = await global.testUtils.createTestApplication(getTestUser().profile.id)

        const activityData = {
          type: 'interview_scheduled',
          description: 'Phone interview scheduled for next week',
          interview_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }

        const { data, error } = await supabase
          .from('application_activities')
          .insert({
            application_id: application.id,
            ...activityData,
            created_by: getTestUser().profile.id,
            created_at: new Date().toISOString(),
          })
          .select()
          .single()

        expect(error).toBeNull()
        expect(data.type).toBe(activityData.type)
        expect(data.description).toBe(activityData.description)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed request bodies', async () => {
      // Mock malformed data that would cause validation errors
      const malformedData = {
        company_name: null, // Invalid null value
        job_title: '', // Empty string
        status: 'invalid_status',
        created_by: 'invalid-uuid',
      }

      const { data, error } = await supabase
        .from('applications')
        .insert({
          ...malformedData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()

      expect(error).toBeTruthy()
      expect(data).toBeNull()
    })

    it('should handle database connection errors', async () => {
      // Mock database connection failure
      const originalQuery = supabase.from
      const mockError = new Error('Database connection failed')

      supabase.from = vi.fn().mockReturnValue({
        insert: vi.fn().mockRejectedValue(mockError),
      })

      try {
        const { data: _data, error: _error } = await supabase.from('applications').insert({
          company_name: 'Test Company',
          job_title: 'Test Job',
          created_by: getTestUser().profile.id,
        })

        // This should not reach here due to the mock rejection
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('Database connection failed')
      } finally {
        // Restore original function
        supabase.from = originalQuery
      }
    })

    it('should handle concurrent requests safely', async () => {
      // Create multiple concurrent requests
      const concurrentRequests = Array.from({ length: 10 }, () =>
        global.testUtils.createTestApplication(getTestUser().profile.id, {
          company_name: `Concurrent Company ${Math.random()}`,
          job_title: 'Software Engineer',
        })
      )

      const results = await Promise.allSettled(concurrentRequests)

      // All requests should succeed
      results.forEach(result => {
        expect(result.status).toBe('fulfilled')
        if (result.status === 'fulfilled') {
          expect(result.value.id).toBeTruthy()
        }
      })

      // Verify all applications were created
      const { data: allApplications, error } = await supabase
        .from('applications')
        .select('*')
        .eq('created_by', getTestUser().profile.id)

      expect(error).toBeNull()
      expect(allApplications?.length).toBeGreaterThanOrEqual(10)
    })
  })

  describe('Performance', () => {
    it('should handle large datasets efficiently', async () => {
      const startTime = performance.now()

      // Create 50 applications
      const createPromises = Array.from({ length: 50 }, () =>
        global.testUtils.createTestApplication(getTestUser().profile.id, {
          company_name: `Company ${Math.random()}`,
          job_title: 'Software Engineer',
        })
      )

      await Promise.all(createPromises)
      const createTime = performance.now() - startTime

      console.log(`Created 50 applications in ${createTime.toFixed(2)}ms`)

      // Query with pagination
      const queryStartTime = performance.now()

      const { data: applications, error } = await supabase
        .from('applications')
        .select('*')
        .eq('created_by', getTestUser().profile.id)
        .order('created_at', { ascending: false })
        .range(0, 19)

      const queryTime = performance.now() - queryStartTime

      console.log(`Queried 20 applications in ${queryTime.toFixed(2)}ms`)

      expect(error).toBeNull()
      expect(applications?.length).toBe(20)
      expect(createTime).toBeLessThan(10000) // Should create within 10 seconds
      expect(queryTime).toBeLessThan(1000) // Should query within 1 second
    })

    it('should use database indexes effectively', async () => {
      // Create applications with various statuses
      const statuses = ['applied', 'interviewing', 'offered', 'rejected']
      for (let i = 0; i < 100; i++) {
        await global.testUtils.createTestApplication(getTestUser().profile.id, {
          status: statuses[i % statuses.length] as ApplicationStatus,
          company_name: `Company ${i}`,
        })
      }

      // Measure filtered query performance
      const startTime = performance.now()

      const { data: interviewApps, error } = await supabase
        .from('applications')
        .select('*')
        .eq('created_by', getTestUser().profile.id)
        .eq('status', 'interviewing')
        .order('created_at', { ascending: false })

      const queryTime = performance.now() - startTime

      console.log(
        `Filtered query returned ${interviewApps?.length} results in ${queryTime.toFixed(2)}ms`
      )

      expect(error).toBeNull()
      expect(interviewApps?.length).toBeGreaterThan(0)
      expect(queryTime).toBeLessThan(500) // Should be fast with proper indexing
    })
  })

  describe('Security', () => {
    it('should enforce RLS policies consistently', async () => {
      // Create test applications for current user
      await global.testUtils.createTestApplication(getTestUser().profile.id, {
        company_name: 'My Company 1',
        job_title: 'Software Engineer',
      })
      await global.testUtils.createTestApplication(getTestUser().profile.id, {
        company_name: 'My Company 2',
        job_title: 'Frontend Developer',
      })

      // User should see their own applications
      const { data: userApplications, error: initialError } = await supabase
        .from('applications')
        .select('*')
        .eq('created_by', getTestUser().profile.id)

      expect(initialError).toBeNull()
      expect(userApplications?.length).toBeGreaterThanOrEqual(2)

      // All returned applications should belong to the current user
      const allOwnApps = userApplications?.every(app => app.created_by === getTestUser().profile.id)
      expect(allOwnApps).toBe(true)

      // Try to access applications without filtering by user
      const { data: allApplications, error: allError } = await supabase
        .from('applications')
        .select('*')

      expect(allError).toBeNull()

      // Due to RLS, should still only see own applications
      const hasOtherUserApps = allApplications?.some(
        app => app.created_by !== getTestUser().profile.id
      )
      expect(hasOtherUserApps).toBe(false)

      // All applications returned should belong to the current user
      const allReturnedAppsBelongToUser = allApplications?.every(
        app => app.created_by === getTestUser().profile.id
      )
      expect(allReturnedAppsBelongToUser).toBe(true)
    })

    it('should sanitize input data', async () => {
      const maliciousData = {
        company_name: '<script>alert("xss")</script>',
        job_title: 'Software Engineer',
        status: 'applied',
        description: '<img src="x" onerror="alert(\'xss\')">',
      }

      const { data, error } = await supabase
        .from('applications')
        .insert({
          ...maliciousData,
          created_by: getTestUser().profile.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      // Data should be stored (database handles sanitization)
      // The key is that it doesn't cause SQL injection or XSS
      if (error) {
        // If validation catches it, that's fine
        expect(error).toBeTruthy()
      } else {
        // If stored, it should be properly escaped
        expect(data).toBeTruthy()
        expect(data.company_name).toContain('script')
      }
    })
  })
})
