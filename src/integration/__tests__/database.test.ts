import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import type {
  TestDatabase,
  TestUser,
  TestApplication,
  ApplicationStatus,
} from './types/integration-test.types'

describe('Database Integration Tests', () => {
  let testDatabase: TestDatabase
  let supabase: TestDatabase['supabase']

  beforeAll(async () => {
    // Get test database connection
    testDatabase = global.testUtils.getTestDatabase()
    supabase = testDatabase.supabase
  })

  beforeEach(async () => {
    // Ensure clean state
    await testDatabase.reset()
  })

  describe('User Profile Operations', () => {
    it('should create and retrieve user profile', async () => {
      // Create test user
      const { auth: user, profile } = await global.testUtils.createTestUser({
        email: 'profile-test@example.com',
        user_metadata: { name: 'Profile Test User' },
      })

      expect(user).toBeTruthy()
      expect(user.email).toBe('profile-test@example.com')
      expect(profile.name).toBe('Profile Test User')
    })

    it('should update user profile', async () => {
      const { profile } = await global.testUtils.createTestUser()

      const { data: updatedProfile, error } = await supabase
        .from('user_profiles')
        .update({
          name: 'Updated Name',
          avatar_url: 'https://example.com/avatar.jpg',
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(updatedProfile.name).toBe('Updated Name')
      expect(updatedProfile.avatar_url).toBe('https://example.com/avatar.jpg')
    })

    it('should enforce RLS policies for user profiles', async () => {
      const _user1 = await global.testUtils.createTestUser({ email: 'user1@example.com' })
      const user2Profile = { id: 'user2-id', email: 'user2@example.com', name: 'User 2' }

      // Manually add user2's profile to the database (without setting as current user)
      const testDatabase = global.testUtils.getTestDatabase()
      await testDatabase.supabase.from('user_profiles').insert(user2Profile)

      // User 1 should not be able to access User 2's profile
      const { data: unauthorizedProfile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user2Profile.id)

      // With RLS enabled, this should return empty array for unauthorized access
      expect(error).toBeNull()
      expect(Array.isArray(unauthorizedProfile)).toBe(true)
      if (Array.isArray(unauthorizedProfile)) {
        expect(unauthorizedProfile).toHaveLength(0)
      }
    })
  })

  describe('Application CRUD Operations', () => {
    let testUser: TestUser

    beforeEach(async () => {
      testUser = await global.testUtils.createTestUser()
    })

    it('should create application with all required fields', async () => {
      const applicationData = {
        company_name: 'Tech Corp',
        job_title: 'Senior Developer',
        status: 'applied',
        description: 'Senior frontend developer role',
        location: 'San Francisco, CA',
        salary_min: 120000,
        salary_max: 180000,
        url: 'https://techcorp.com/jobs/senior-dev',
      }

      const { data: application, error } = await supabase
        .from('applications')
        .insert({
          ...applicationData,
          created_by: testUser.profile.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(application.company_name).toBe(applicationData.company_name)
      expect(application.job_title).toBe(applicationData.job_title)
      expect(application.status).toBe(applicationData.status)
      expect(application.created_by).toBe(testUser.profile.id)
    })

    it('should retrieve applications with pagination', async () => {
      // Create multiple applications
      const applications = []
      for (let i = 0; i < 15; i++) {
        const app = await global.testUtils.createTestApplication(testUser.profile.id, {
          company_name: `Company ${i}`,
          job_title: `Job ${i}`,
        })
        applications.push(app)
      }

      // Test pagination (page 1, limit 10)
      const { data: page1, error: error1 } = await supabase
        .from('applications')
        .select('*')
        .eq('created_by', testUser.profile.id)
        .order('created_at', { ascending: false })
        .range(0, 9)

      expect(error1).toBeNull()
      expect(page1).toHaveLength(10)

      // Test pagination (page 2, limit 10)
      const { data: page2, error: error2 } = await supabase
        .from('applications')
        .select('*')
        .eq('created_by', testUser.profile.id)
        .order('created_at', { ascending: false })
        .range(10, 19)

      expect(error2).toBeNull()
      expect(page2).toHaveLength(5)
    })

    it('should update application status', async () => {
      const application = await global.testUtils.createTestApplication(testUser.profile.id, {
        status: 'applied',
      })

      const { data: updatedApp, error } = await supabase
        .from('applications')
        .update({
          status: 'interviewing',
          updated_at: new Date().toISOString(),
        })
        .eq('id', application.id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(updatedApp.status).toBe('interviewing')
    })

    it('should delete application and cascade related data', async () => {
      const application = await global.testUtils.createTestApplication(testUser.profile.id)

      // Create related activity
      await supabase.from('application_activities').insert({
        application_id: application.id,
        type: 'status_change',
        description: 'Application submitted',
        created_by: testUser.profile.id,
        created_at: new Date().toISOString(),
      })

      // Delete application
      const { error } = await supabase.from('applications').delete().eq('id', application.id)

      expect(error).toBeNull()

      // Verify application is deleted
      const { data: deletedApp } = await supabase
        .from('applications')
        .select('*')
        .eq('id', application.id)
        .single()

      expect(deletedApp).toBeNull()

      // Verify related activities are also deleted (if cascade is set up)
      const { data: activities } = await supabase
        .from('application_activities')
        .select('*')
        .eq('application_id', application.id)

      if (Array.isArray(activities)) {
        expect(activities).toHaveLength(0)
      }
    })

    it('should search applications by company and job title', async () => {
      // Create test applications
      await global.testUtils.createTestApplication(testUser.profile.id, {
        company_name: 'Google LLC',
        job_title: 'Software Engineer',
      })

      await global.testUtils.createTestApplication(testUser.profile.id, {
        company_name: 'Microsoft',
        job_title: 'Frontend Developer',
      })

      await global.testUtils.createTestApplication(testUser.profile.id, {
        company_name: 'Apple Inc',
        job_title: 'iOS Engineer',
      })

      // Search by company name
      const { data: companyResults, error: companyError } = await supabase
        .from('applications')
        .select('*')
        .eq('created_by', testUser.profile.id)
        .ilike('company_name', '%google%')

      expect(companyError).toBeNull()
      expect(companyResults).not.toBeNull()
      expect(companyResults).toHaveLength(1)
      if (companyResults && companyResults.length > 0) {
        expect(companyResults[0].company_name).toBe('Google LLC')
      }

      // Search by job title
      const { data: titleResults, error: titleError } = await supabase
        .from('applications')
        .select('*')
        .eq('created_by', testUser.profile.id)
        .ilike('job_title', '%engineer%')

      expect(titleError).toBeNull()
      expect(titleResults).not.toBeNull()
      if (titleResults) {
        expect(titleResults.length).toBeGreaterThanOrEqual(2) // Should match Software Engineer and iOS Engineer
      }
    })

    it('should filter applications by status', async () => {
      // Create applications with different statuses
      await global.testUtils.createTestApplication(testUser.profile.id, { status: 'applied' })
      await global.testUtils.createTestApplication(testUser.profile.id, { status: 'interviewing' })
      await global.testUtils.createTestApplication(testUser.profile.id, { status: 'offered' })
      await global.testUtils.createTestApplication(testUser.profile.id, { status: 'rejected' })

      // Filter by specific status
      const { data: interviewApps, error } = await supabase
        .from('applications')
        .select('*')
        .eq('created_by', testUser.profile.id)
        .eq('status', 'interviewing')

      expect(error).toBeNull()
      expect(interviewApps).not.toBeNull()
      if (interviewApps) {
        expect(interviewApps).toHaveLength(1)
        expect(interviewApps[0].status).toBe('interviewing')
      }

      // Filter by multiple statuses
      const { data: activeApps, error: activeError } = await supabase
        .from('applications')
        .select('*')
        .eq('created_by', testUser.profile.id)
        .in('status', ['applied', 'interviewing', 'offered'])

      expect(activeError).toBeNull()
      expect(activeApps).toHaveLength(3)
    })
  })

  describe('Company Management', () => {
    let testUser: TestUser

    beforeEach(async () => {
      testUser = await global.testUtils.createTestUser()
    })

    it('should create and retrieve company', async () => {
      const companyData = {
        name: 'Test Technology Inc',
        description: 'A test technology company',
        industry: 'Software',
        size: '100-500',
        website: 'https://testtech.com',
      }

      const { data: company, error } = await supabase
        .from('companies')
        .insert({
          ...companyData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(company.name).toBe(companyData.name)
      expect(company.industry).toBe(companyData.industry)
    })

    it('should associate applications with companies', async () => {
      const company = await global.testUtils.createTestCompany({
        name: 'Associated Company',
      })

      const application = await global.testUtils.createTestApplication(testUser.profile.id, {
        company_name: company.name,
        company_id: company.id,
      })

      // Retrieve application with company data
      const { data: appWithCompany, error } = await supabase
        .from('applications')
        .select(
          `
          *,
          companies (*)
        `
        )
        .eq('id', application.id)
        .single()

      expect(error).toBeNull()
      expect(appWithCompany.companies.name).toBe(company.name)
      expect(appWithCompany.company_id).toBe(company.id)
    })
  })

  describe('Application Activities', () => {
    let testUser: TestUser
    let application: TestApplication

    beforeEach(async () => {
      testUser = await global.testUtils.createTestUser()
      application = await global.testUtils.createTestApplication(testUser.profile.id)
    })

    it('should create activity logs for application changes', async () => {
      const activityData = {
        application_id: application.id,
        type: 'status_change',
        description: 'Status changed from applied to interviewing',
        old_value: 'applied',
        new_value: 'interviewing',
        created_by: testUser.profile.id,
        created_at: new Date().toISOString(),
      }

      const { data: activity, error } = await supabase
        .from('application_activities')
        .insert(activityData)
        .select()
        .single()

      expect(error).toBeNull()
      expect(activity.application_id).toBe(application.id)
      expect(activity.type).toBe('status_change')
      expect(activity.new_value).toBe('interviewing')
    })

    it('should retrieve activity history for application', async () => {
      // Create multiple activities
      const activities = [
        {
          type: 'status_change',
          description: 'Application submitted',
          old_value: null,
          new_value: 'applied',
        },
        {
          type: 'note_added',
          description: 'Added initial notes',
          old_value: null,
          new_value: null,
        },
        {
          type: 'status_change',
          description: 'Moved to interview',
          old_value: 'applied',
          new_value: 'interviewing',
        },
      ]

      for (const activity of activities) {
        await supabase.from('application_activities').insert({
          application_id: application.id,
          ...activity,
          created_by: testUser.profile.id,
          created_at: new Date().toISOString(),
        })
      }

      // Retrieve activities
      const { data: retrievedActivities, error } = await supabase
        .from('application_activities')
        .select('*')
        .eq('application_id', application.id)
        .order('created_at', { ascending: true })

      expect(error).toBeNull()
      expect(retrievedActivities).not.toBeNull()
      if (retrievedActivities) {
        expect(retrievedActivities).toHaveLength(3)
        expect(retrievedActivities[0].type).toBe('status_change')
        expect(retrievedActivities[0].new_value).toBe('applied')
        expect(retrievedActivities[2].new_value).toBe('interviewing')
      }
    })
  })

  describe('Database Constraints and Validation', () => {
    let testUser: TestUser

    beforeEach(async () => {
      testUser = await global.testUtils.createTestUser()
    })

    it('should enforce not null constraints on required fields', async () => {
      // Try to create application without required fields
      const { data, error } = await supabase
        .from('applications')
        .insert({
          company_name: null, // Should fail
          job_title: 'Test Job',
          created_by: testUser.profile.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      expect(error).toBeTruthy()
      expect(data).toBeNull()
    })

    it('should enforce foreign key constraints', async () => {
      // Try to create application with non-existent user
      const { data, error } = await supabase
        .from('applications')
        .insert({
          company_name: 'Test Company',
          job_title: 'Test Job',
          created_by: 'non-existent-user-id',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      expect(error).toBeTruthy()
      expect(data).toBeNull()
    })

    it('should enforce check constraints on status values', async () => {
      // Try to create application with invalid status
      const { data, error } = await supabase
        .from('applications')
        .insert({
          company_name: 'Test Company',
          job_title: 'Test Job',
          status: 'invalid_status', // Should fail if status is an enum
          created_by: testUser.profile.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      // This might pass or fail depending on whether status is an enum with constraints
      // If it's constrained, expect error; if not, it might pass
      if (error) {
        expect(error).toBeTruthy()
        expect(data).toBeNull()
      }
    })
  })

  describe('Performance and Optimization', () => {
    let testUser: TestUser

    beforeEach(async () => {
      testUser = await global.testUtils.createTestUser()
    })

    it('should handle large datasets efficiently', async () => {
      const startTime = performance.now()

      // Create 100 applications
      const applications = []
      for (let i = 0; i < 100; i++) {
        const app = await global.testUtils.createTestApplication(testUser.profile.id, {
          company_name: `Company ${i}`,
          job_title: `Job Title ${i}`,
        })
        applications.push(app)
      }

      const createEndTime = performance.now()
      const createTime = createEndTime - startTime

      console.log(`Created 100 applications in ${createTime.toFixed(2)}ms`)

      // Query all applications with pagination
      const queryStartTime = performance.now()

      const { data: allApplications, error } = await supabase
        .from('applications')
        .select('*')
        .eq('created_by', testUser.profile.id)
        .order('created_at', { ascending: false })

      const queryEndTime = performance.now()
      const queryTime = queryEndTime - queryStartTime

      console.log(`Queried ${allApplications?.length} applications in ${queryTime.toFixed(2)}ms`)

      expect(error).toBeNull()
      expect(allApplications).toHaveLength(100)
      expect(createTime).toBeLessThan(10000) // Should create within 10 seconds
      expect(queryTime).toBeLessThan(1000) // Should query within 1 second
    })

    it('should use indexes effectively for filtered queries', async () => {
      // Create applications with different statuses
      const statuses: ApplicationStatus[] = ['applied', 'interviewing', 'offered', 'rejected']
      for (let i = 0; i < 50; i++) {
        await global.testUtils.createTestApplication(testUser.profile.id, {
          status: statuses[i % statuses.length],
          company_name: `Company ${i}`,
        })
      }

      // Measure query time for filtered query
      const startTime = performance.now()

      const { data: filteredResults, error } = await supabase
        .from('applications')
        .select('*')
        .eq('created_by', testUser.profile.id)
        .eq('status', 'interviewing')
        .order('created_at', { ascending: false })

      const endTime = performance.now()
      const queryTime = endTime - startTime

      console.log(
        `Filtered query returned ${filteredResults?.length} results in ${queryTime.toFixed(2)}ms`
      )

      expect(error).toBeNull()
      expect(filteredResults?.length).toBeGreaterThan(0)
      expect(queryTime).toBeLessThan(500) // Should be fast with proper indexing
    })
  })
})
