import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ApplicationStatus } from '@/lib/types/database.types'
import type { TestDatabase, TestUser, TestApplicationOptions } from './types/e2e-test.types'
import type { ApplicationInsert } from '@/lib/types/database.types'

describe('End-to-End User Workflow Tests', () => {
  let testDatabase: TestDatabase
  let supabase: SupabaseClient
  let testUser: TestUser | null = null

  beforeAll(async () => {
    testDatabase = global.testUtils.getTestDatabase()
    supabase = testDatabase.supabase
  })

  beforeEach(async () => {
    await testDatabase.reset()
    testUser = await global.testUtils.createTestUser()
  })

  afterEach(async () => {
    await supabase.auth.signOut()
    // Clear any simulated network errors
    ;(global as Record<string, unknown>)._simulateNetworkError = false
  })

  describe('Complete User Registration and Onboarding Workflow', () => {
    it('should guide user through complete registration process', async () => {
      // Step 1: User Registration
      const registrationData = {
        email: 'newuser.workflow@example.com',
        password: 'SecurePassword123!',
        options: {
          data: {
            name: 'New Workflow User',
            avatar_url: null,
          },
        },
      }

      const { data: authData, error: registrationError } =
        await supabase.auth.signUp(registrationData)
      expect(registrationError).toBeNull()
      expect(authData.user).toBeTruthy()
      expect(authData.user!.email).toBe(registrationData.email)

      // Step 2: Automatic Profile Creation - create profile manually for test
      const profileData = await global.testUtils.createTestUser({
        email: registrationData.email,
        name: registrationData.options.data.name,
        avatar_url: registrationData.options.data.avatar_url,
      })

      expect(profileData.profile).toBeTruthy()
      expect(profileData.profile.name).toBe(registrationData.options.data.name)

      // Step 3: Initial Login
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: registrationData.email,
        password: registrationData.password,
      })

      expect(loginError).toBeNull()
      expect(loginData.user!.email).toBe(registrationData.email)
      expect(loginData.session).toBeTruthy()

      // Step 4: Dashboard Initial Load
      const { data: applications, error: appError } = await supabase
        .from('applications')
        .select('*')
        .eq('created_by', profileData.profile.id)
        .order('created_at', { ascending: false })

      expect(appError).toBeNull()
      expect(Array.isArray(applications)).toBe(true)
      expect(applications).toHaveLength(0) // New user should have no applications

      // Step 5: User should see empty state with onboarding prompts
      const hasApplications = applications!.length > 0
      expect(hasApplications).toBe(false)

      console.log('✅ Complete registration workflow successful')
    })

    it('should handle profile completion after registration', async () => {
      // Create test user directly
      const profileData = await global.testUtils.createTestUser({
        email: 'profile.complete@example.com',
        name: 'Profile Complete User',
      })

      // Login
      await supabase.auth.signInWithPassword({
        email: 'profile.complete@example.com',
        password: 'test-password-123',
      })

      // Update profile with additional information
      const profileUpdate = {
        bio: 'Software developer passionate about creating amazing user experiences',
        avatar_url: 'https://example.com/avatar.jpg',
        location: 'San Francisco, CA',
        website: 'https://example.com',
        updated_at: new Date().toISOString(),
      }

      const { data: updatedProfile, error: updateError } = await supabase
        .from('user_profiles')
        .update(profileUpdate)
        .eq('id', profileData.profile.id)
        .select()
        .single()

      expect(updateError).toBeNull()
      expect(updatedProfile.bio).toBe(profileUpdate.bio)
      expect(updatedProfile.avatar_url).toBe(profileUpdate.avatar_url)

      // Verify profile completion
      const { data: finalProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', profileData.profile.id)
        .single()

      expect(finalProfile.bio).toBeTruthy()
      expect(finalProfile.avatar_url).toBeTruthy()

      console.log('✅ Profile completion workflow successful')
    })
  })

  describe('Complete Application Management Workflow', () => {
    it('should handle full application lifecycle from creation to hire', async () => {
      // Login user
      await supabase.auth.signInWithPassword({
        email: testUser!.profile.email,
        password: 'test-password-123',
      })

      // Step 1: Create New Application
      const applicationData = {
        company_name: 'Tech Corp Solutions',
        job_title: 'Senior Full Stack Developer',
        status: 'applied',
        description: 'Exciting opportunity to work on cutting-edge web applications',
        location: 'Remote',
        salary_min: 120000,
        salary_max: 180000,
        url: 'https://techcorp.com/careers/senior-developer',
        notes: 'Found through LinkedIn referral',
      }

      const { data: application, error: createError } = await supabase
        .from('applications')
        .insert({
          ...applicationData,
          created_by: testUser!.profile.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      expect(createError).toBeNull()
      expect(application.id).toBeTruthy()
      expect(application.status).toBe('applied')

      // Step 2: Initial Application Activity
      const { error: activityError } = await supabase.from('application_activities').insert({
        application_id: application.id,
        type: 'status_change',
        description: 'Application submitted via company website',
        created_by: testUser!.profile.id,
        created_at: new Date().toISOString(),
      })

      expect(activityError).toBeNull()

      // Step 3: Update Status to Screening
      const { data: screeningApp, error: screeningError } = await supabase
        .from('applications')
        .update({
          status: 'screening',
          notes: 'Received automated email confirmation',
          updated_at: new Date().toISOString(),
        })
        .eq('id', application.id)
        .select()
        .single()

      expect(screeningError).toBeNull()
      expect(screeningApp.status).toBe('screening')

      // Add screening activity
      await supabase.from('application_activities').insert({
        application_id: application.id,
        type: 'status_change',
        description: 'Application moved to screening',
        created_by: testUser!.profile.id,
        created_at: new Date().toISOString(),
      })

      // Step 4: Schedule Interview
      const interviewDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
      const { data: interviewApp, error: interviewError } = await supabase
        .from('applications')
        .update({
          status: 'interviewing',
          notes: 'Phone interview scheduled for ' + interviewDate.toLocaleDateString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', application.id)
        .select()
        .single()

      expect(interviewError).toBeNull()
      expect(interviewApp.status).toBe('interviewing')

      // Step 5: Add Interview Activity
      await supabase.from('application_activities').insert({
        application_id: application.id,
        type: 'interview_scheduled',
        description: 'Phone interview with hiring manager',
        interview_date: interviewDate.toISOString(),
        created_by: testUser!.profile.id,
        created_at: new Date().toISOString(),
      })

      // Step 6: Update to Offer
      const { data: offerApp, error: offerError } = await supabase
        .from('applications')
        .update({
          status: 'offered',
          notes: 'Received verbal offer! Details to follow via email',
          salary_min: 140000,
          salary_max: 160000,
          updated_at: new Date().toISOString(),
        })
        .eq('id', application.id)
        .select()
        .single()

      expect(offerError).toBeNull()
      expect(offerApp.status).toBe('offered')
      expect(offerApp.salary_min).toBe(140000)

      // Add offer activity
      await supabase.from('application_activities').insert({
        application_id: application.id,
        type: 'status_change',
        description: 'Offer received!',
        created_by: testUser!.profile.id,
        created_at: new Date().toISOString(),
      })

      // Step 7: Accept Offer and Complete Workflow
      const { data: hiredApp, error: hiredError } = await supabase
        .from('applications')
        .update({
          status: 'hired',
          notes: 'Accepted offer! Start date: 2024-03-01',
          updated_at: new Date().toISOString(),
        })
        .eq('id', application.id)
        .select()
        .single()

      expect(hiredError).toBeNull()
      expect(hiredApp.status).toBe('hired')

      // Add hired activity
      await supabase.from('application_activities').insert({
        application_id: application.id,
        type: 'status_change',
        description: 'Offer accepted! Starting new role.',
        created_by: testUser!.profile.id,
        created_at: new Date().toISOString(),
      })

      // Step 8: Verify Complete Activity History
      const { data: activities, error: activitiesError } = await supabase
        .from('application_activities')
        .select('*')
        .eq('application_id', application.id)
        .order('created_at', { ascending: true })

      expect(activitiesError).toBeNull()
      expect(activities!.length).toBeGreaterThan(2) // Should have multiple activities
      expect(activities!.some(a => a.type === 'status_change')).toBe(true)
      expect(activities!.some(a => a.type === 'interview_scheduled')).toBe(true)

      // Step 9: Verify Final Application State
      const { data: finalApplication } = await supabase
        .from('applications')
        .select('*')
        .eq('id', application.id)
        .single()

      expect(finalApplication.status).toBe('hired')
      expect(finalApplication.notes).toContain('Accepted offer')

      console.log('✅ Complete application lifecycle workflow successful')
    })
  })

  describe('Search and Filter Workflow', () => {
    it('should handle complex search and filter scenarios', async () => {
      // Login user
      await supabase.auth.signInWithPassword({
        email: testUser!.profile.email,
        password: 'test-password-123',
      })

      // Create diverse test data
      const companies = [
        'Google LLC',
        'Microsoft Corporation',
        'Apple Inc.',
        'Amazon.com Inc.',
        'Meta Platforms Inc.',
        'Netflix Inc.',
        'Tesla Inc.',
        'Adobe Inc.',
      ]

      const statuses = [
        'applied',
        'phone_screen',
        'interviewing',
        'offered',
        'rejected',
        'withdrawn',
      ]
      const locations = ['Remote', 'San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA']

      // Create multiple applications
      const applications = []
      for (let i = 0; i < 20; i++) {
        const salaryMin = 80000 + i * 5000
        const salaryMax = 120000 + i * 5000
        const appOptions: TestApplicationOptions = {
          company_name: companies[i % companies.length],
          status: statuses[i % statuses.length] as ApplicationStatus,
          location: locations[i % locations.length],
          job_title: i % 2 === 0 ? 'Software Engineer' : 'Product Manager',
          salary_min: salaryMin,
          salary_max: salaryMax,
          salary_range: '$' + salaryMin.toLocaleString() + ' - $' + salaryMax.toLocaleString(),
        }
        const app = await global.testUtils.createTestApplication(
          testUser!.profile.id,
          appOptions as Partial<ApplicationInsert>
        )
        applications.push(app)
      }

      // Search Test 1: Filter by company name
      const { data: googleResults, error: googleError } = await supabase
        .from('applications')
        .select('*')
        .eq('created_by', testUser!.profile.id)
        .ilike('company_name', '%google%')

      expect(googleError).toBeNull()
      expect(googleResults!.length).toBeGreaterThan(0)
      expect(googleResults!.every(app => app.company_name.includes('Google'))).toBe(true)

      // Search Test 2: Filter by status
      const { data: interviewResults, error: interviewError } = await supabase
        .from('applications')
        .select('*')
        .eq('created_by', testUser!.profile.id)
        .eq('status', 'interviewing')

      expect(interviewError).toBeNull()
      expect(interviewResults!.length).toBeGreaterThan(0)
      expect(interviewResults!.every(app => app.status === 'interviewing')).toBe(true)

      // Search Test 3: Filter by location
      const { data: remoteResults, error: remoteError } = await supabase
        .from('applications')
        .select('*')
        .eq('created_by', testUser!.profile.id)
        .eq('location', 'Remote')

      expect(remoteError).toBeNull()
      expect(remoteResults!.length).toBeGreaterThan(0)
      expect(remoteResults!.every(app => app.location === 'Remote')).toBe(true)

      // Search Test 4: Multiple filters
      const { data: multiFilterResults, error: multiError } = await supabase
        .from('applications')
        .select('*')
        .eq('created_by', testUser!.profile.id)
        .eq('job_title', 'Software Engineer')
        .in('status', ['applied', 'interviewing', 'offered'])
        .gte('salary_min', 100000)

      expect(multiError).toBeNull()
      expect(multiFilterResults!.length).toBeGreaterThan(0)
      expect(
        multiFilterResults!.every(
          app =>
            app.job_title === 'Software Engineer' &&
            ['applied', 'interviewing', 'offered'].includes(app.status) &&
            app.salary_min >= 100000
        )
      ).toBe(true)

      // Search Test 5: Pagination with filters
      const { data: pagedResults, error: pageError } = await supabase
        .from('applications')
        .select('*')
        .eq('created_by', testUser!.profile.id)
        .order('created_at', { ascending: false })
        .range(0, 9) // First 10 results

      expect(pageError).toBeNull()
      expect(pagedResults).toHaveLength(10)

      console.log('✅ Search and filter workflow successful')
    })
  })

  describe('Data Export and Analytics Workflow', () => {
    it('should handle application data export and analytics', async () => {
      // Login user
      await supabase.auth.signInWithPassword({
        email: testUser!.profile.email,
        password: 'test-password-123',
      })

      // Create applications with varied data
      const statuses = ['applied', 'interviewing', 'offered', 'accepted', 'rejected']
      const companies = ['TechCorp', 'DataSoft', 'CloudSystems', 'AI Solutions']

      for (let i = 0; i < 15; i++) {
        const salaryMin = 80000 + i * 3000
        const salaryMax = 120000 + i * 3000
        await global.testUtils.createTestApplication(testUser!.profile.id, {
          company_name: companies[i % companies.length],
          status: statuses[i % statuses.length] as ApplicationStatus,
          job_title: 'Software Engineer',
          salary_min: salaryMin,
          salary_max: salaryMax,
          salary_range: `$${salaryMin.toLocaleString()} - $${salaryMax.toLocaleString()}`,
        } as Partial<ApplicationInsert>)
      }

      // Analytics Test 1: Status distribution
      const { data: statusCounts, error: statusError } = await supabase
        .from('applications')
        .select('status')
        .eq('created_by', testUser!.profile.id)

      expect(statusError).toBeNull()

      const statusDistribution = statusCounts!.reduce(
        (acc, app) => {
          acc[app.status] = (acc[app.status] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )

      expect(Object.keys(statusDistribution).length).toBeGreaterThan(0)

      // Analytics Test 2: Salary range analysis
      const { data: salaryData, error: salaryError } = await supabase
        .from('applications')
        .select('salary_min, salary_max')
        .eq('created_by', testUser!.profile.id)
        .not('salary_min', 'is', null)

      expect(salaryError).toBeNull()

      const salaryStats = salaryData!.reduce(
        (acc, app) => {
          const avgSalary = (app.salary_min + app.salary_max) / 2
          acc.total += avgSalary
          acc.count += 1
          acc.min = Math.min(acc.min || avgSalary, avgSalary)
          acc.max = Math.max(acc.max || avgSalary, avgSalary)
          return acc
        },
        { total: 0, count: 0, min: 0, max: 0 }
      )

      const averageSalary = salaryStats.total / salaryStats.count
      expect(averageSalary).toBeGreaterThan(0)

      // Analytics Test 3: Application timeline
      const { data: timelineData, error: timelineError } = await supabase
        .from('applications')
        .select('created_at, status')
        .eq('created_by', testUser!.profile.id)
        .order('created_at', { ascending: true })

      expect(timelineError).toBeNull()
      expect(timelineData!.length).toBe(15)

      // Verify chronological order
      for (let i = 1; i < timelineData!.length; i++) {
        expect(new Date(timelineData![i].created_at).getTime()).toBeGreaterThanOrEqual(
          new Date(timelineData![i - 1].created_at).getTime()
        )
      }

      // Export Test 1: Prepare CSV export data
      const { data: exportData, error: exportError } = await supabase
        .from('applications')
        .select(
          'id, company_name, job_title, status, location, salary_min, salary_max, url, created_at, updated_at'
        )
        .eq('created_by', testUser!.profile.id)
        .order('created_at', { ascending: false })

      expect(exportError).toBeNull()
      expect(exportData!.length).toBe(15)

      // Verify export data structure
      const exportRecord = exportData![0]
      expect(exportRecord).toHaveProperty('company_name')
      expect(exportRecord).toHaveProperty('status')
      expect(exportRecord).toHaveProperty('created_at')

      console.log('✅ Analytics and export workflow successful')
    })
  })

  describe('Multi-Device Sync Workflow', () => {
    it('should handle data synchronization across devices', async () => {
      // Simulate desktop session
      const desktopSession = await supabase.auth.signInWithPassword({
        email: testUser!.profile.email,
        password: 'test-password-123',
      })

      expect(desktopSession.data.session).toBeTruthy()

      // Create application on desktop
      const desktopApp = await global.testUtils.createTestApplication(testUser!.profile.id, {
        company_name: 'Desktop Created Company',
        job_title: 'Software Engineer',
        status: 'applied',
        notes: 'Created on desktop device',
      } as Partial<ApplicationInsert>)

      // Simulate mobile session (sign out and sign back in)
      await supabase.auth.signOut()

      const mobileSession = await supabase.auth.signInWithPassword({
        email: testUser!.profile.email,
        password: 'test-password-123',
      })

      expect(mobileSession.data.session).toBeTruthy()

      // Verify mobile sees desktop-created application
      const { data: mobileApps, error: mobileError } = await supabase
        .from('applications')
        .select('*')
        .eq('created_by', testUser!.profile.id)

      expect(mobileError).toBeNull()
      expect(mobileApps!.some(app => app.id === desktopApp.id)).toBe(true)

      // Update application on mobile
      const { data: mobileUpdatedApp, error: mobileUpdateError } = await supabase
        .from('applications')
        .update({
          status: 'interviewing',
          notes: 'Updated on mobile device',
          updated_at: new Date().toISOString(),
        })
        .eq('id', desktopApp.id)
        .select()
        .single()

      expect(mobileUpdateError).toBeNull()
      expect(mobileUpdatedApp.status).toBe('interviewing')

      // Simulate desktop refresh and verify sync
      const { data: desktopRefreshedApps, error: desktopError } = await supabase
        .from('applications')
        .select('*')
        .eq('id', desktopApp.id)
        .single()

      expect(desktopError).toBeNull()
      expect(desktopRefreshedApps.status).toBe('interviewing')
      expect(desktopRefreshedApps.notes).toBe('Updated on mobile device')

      console.log('✅ Multi-device sync workflow successful')
    })
  })

  describe('Error Recovery Workflow', () => {
    it('should handle network errors and data recovery', async () => {
      // Login user
      await supabase.auth.signInWithPassword({
        email: testUser!.profile.email,
        password: 'test-password-123',
      })

      // Create application successfully
      const application = await global.testUtils.createTestApplication(testUser!.profile.id, {
        company_name: 'Error Recovery Test Company',
        job_title: 'Software Engineer',
        status: 'applied',
      } as Partial<ApplicationInsert>)

      // Simulate network error during update
      ;(global as Record<string, unknown>)._simulateNetworkError = true

      let failedUpdate: { error: Error | null } | null = null
      let fetchError: Error | null = null

      try {
        failedUpdate = await supabase
          .from('applications')
          .update({
            status: 'interviewing',
            updated_at: new Date().toISOString(),
          })
          .eq('id', application.id)
          .select()
          .single()
      } catch (error) {
        fetchError = error as Error
      }

      expect(fetchError).toBeTruthy()
      expect(failedUpdate).toBeNull()

      // Restore network and retry
      ;(global as Record<string, unknown>)._simulateNetworkError = false

      const { data: retryUpdate, error: retryError } = await supabase
        .from('applications')
        .update({
          status: 'interviewing',
          updated_at: new Date().toISOString(),
        })
        .eq('id', application.id)
        .select()
        .single()

      expect(retryError).toBeNull()
      expect(retryUpdate.status).toBe('interviewing')

      // Verify data integrity after error recovery
      const { data: finalState, error: finalError } = await supabase
        .from('applications')
        .select('*')
        .eq('id', application.id)
        .single()

      expect(finalError).toBeNull()
      expect(finalState.status).toBe('interviewing')
      expect(finalState.company_name).toBe('Error Recovery Test Company')

      console.log('✅ Error recovery workflow successful')
    })
  })

  describe('Performance Under Load Workflow', () => {
    it('should maintain performance with large datasets', async () => {
      // Login user
      await supabase.auth.signInWithPassword({
        email: testUser!.profile.email,
        password: 'test-password-123',
      })

      // Create large dataset
      const startTime = performance.now()
      const batchSize = 50

      for (let i = 0; i < batchSize; i++) {
        const perfAppOptions = {
          company_name: 'Performance Test Company ' + i,
          job_title: 'Software Engineer',
          status: (['applied', 'interviewing', 'offered', 'rejected'] as ApplicationStatus[])[
            i % 4
          ],
          job_description: 'x'.repeat(500), // Add some data size
          notes: 'Performance test notes ' + i,
        } as Partial<ApplicationInsert>
        await global.testUtils.createTestApplication(
          testUser!.profile.id,
          perfAppOptions as Partial<ApplicationInsert>
        )
      }

      const createTime = performance.now() - startTime
      console.log('Created ' + batchSize + ' applications in ' + createTime.toFixed(2) + 'ms')

      // Test query performance
      const queryStart = performance.now()

      const { data: allApplications, error: queryError } = await supabase
        .from('applications')
        .select('*')
        .eq('created_by', testUser!.profile.id)
        .order('created_at', { ascending: false })

      const queryTime = performance.now() - queryStart
      console.log(
        'Queried ' +
          (allApplications?.length || 0) +
          ' applications in ' +
          queryTime.toFixed(2) +
          'ms'
      )

      expect(queryError).toBeNull()
      expect(allApplications?.length).toBe(batchSize)
      expect(createTime).toBeLessThan(10000) // Should create within 10 seconds
      expect(queryTime).toBeLessThan(2000) // Should query within 2 seconds

      // Test pagination performance
      const paginationStart = performance.now()

      const { data: pagedResults, error: pageError } = await supabase
        .from('applications')
        .select('*')
        .eq('created_by', testUser!.profile.id)
        .order('created_at', { ascending: false })
        .range(0, 19) // First 20

      const paginationTime = performance.now() - paginationStart
      console.log('Paginated query completed in ' + paginationTime.toFixed(2) + 'ms')

      expect(pageError).toBeNull()
      expect(pagedResults).toHaveLength(20)
      expect(paginationTime).toBeLessThan(500) // Pagination should be fast

      console.log('✅ Performance under load workflow successful')
    })
  })

  describe('Security and Privacy Workflow', () => {
    it('should maintain data isolation between users', async () => {
      // Create multiple users
      const user1 = testUser!
      const user2 = await global.testUtils.createTestUser({ email: 'security2@example.com' })
      const _user3 = await global.testUtils.createTestUser({ email: 'security3@example.com' })

      // Login as user1 and create applications
      await supabase.auth.signInWithPassword({
        email: user1.profile.email,
        password: 'test-password-123',
      })

      for (let i = 0; i < 5; i++) {
        await global.testUtils.createTestApplication(user1.profile.id, {
          company_name: 'User1 Company ' + i,
          job_title: 'Software Engineer',
        } as Partial<ApplicationInsert>)
      }

      // Login as user2 and create applications
      await supabase.auth.signInWithPassword({
        email: user2.profile.email,
        password: 'test-password-123',
      })

      for (let i = 0; i < 3; i++) {
        await global.testUtils.createTestApplication(user2.profile.id, {
          company_name: 'User2 Company ' + i,
          job_title: 'Product Manager',
        } as Partial<ApplicationInsert>)
      }

      // User2 should only see their own applications
      const { data: user2Apps, error: user2Error } = await supabase.from('applications').select('*')

      expect(user2Error).toBeNull()
      if (Array.isArray(user2Apps)) {
        expect(user2Apps.every(app => app.created_by === user2.profile.id)).toBe(true)
        expect(user2Apps.some(app => app.company_name.includes('User1'))).toBe(false)
      }

      // User2 should not be able to access User1's applications by ID
      // Create user1 app while user1 is still logged in
      await supabase.auth.signOut()
      await supabase.auth.signInWithPassword({
        email: user1!.profile.email,
        password: 'test-password-123',
      })

      const user1App = await global.testUtils.createTestApplication(user1!.profile.id, {
        company_name: 'User1 Secret Company',
      } as Partial<ApplicationInsert>)

      // Switch back to user2
      await supabase.auth.signOut()
      await supabase.auth.signInWithPassword({
        email: user2.profile.email,
        password: 'test-password-123',
      })

      const { data: unauthorizedAccess, error: accessError } = await supabase
        .from('applications')
        .select('*')
        .eq('id', user1App.id)
        .single()

      // Should fail due to RLS policies
      expect(accessError).toBeTruthy()
      expect(unauthorizedAccess).toBeNull()

      console.log('✅ Security and privacy workflow successful')
    })
  })

  describe('Real-time Updates Workflow', () => {
    it('should handle real-time updates across application states', async () => {
      // This would test real-time functionality
      // For now, we'll simulate the workflow without actual WebSocket connections

      // Login user
      await supabase.auth.signInWithPassword({
        email: testUser!.profile.email,
        password: 'test-password-123',
      })

      // Create application
      const application = await global.testUtils.createTestApplication(testUser!.profile.id, {
        company_name: 'Real-time Test Company',
        status: 'applied',
      } as Partial<ApplicationInsert>)

      // Simulate real-time update by checking state changes
      const updatePromises = [
        { status: 'screening', notes: 'Application received' },
        { status: 'interviewing', notes: 'Interview scheduled' },
        { status: 'offered', notes: 'Offer received!' },
      ]

      for (const update of updatePromises) {
        // Simulate delay for real-time effect
        await new Promise(resolve => setTimeout(resolve, 50))

        const { data: updatedApp, error } = await supabase
          .from('applications')
          .update({
            ...update,
            updated_at: new Date().toISOString(),
          })
          .eq('id', application.id)
          .select()
          .single()

        expect(error).toBeNull()
        expect(updatedApp.status).toBe(update.status)

        // Verify "real-time" state is current
        const { data: currentState } = await supabase
          .from('applications')
          .select('*')
          .eq('id', application.id)
          .single()

        expect(currentState.status).toBe(update.status)
      }

      console.log('✅ Real-time updates workflow successful')
    })
  })
})
