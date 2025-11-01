import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import type { ApplicationStatus } from '@/lib/types/database.types'
import type { MockSupabaseResponse } from '@/types/test'
import type {
  PerformanceTestDatabase,
  PerformanceMonitor,
  PerformanceTestUser,
  PerformanceApplication,
  PaginationTestConfig,
  SearchTestConfig,
  ApplicationCreationData,
  CompanyCreationData,
  UserProfileUpdateData,
  CriticalPathTest,
} from '@/types/performance-test'

describe('API Performance Benchmarks', () => {
  let testDatabase: PerformanceTestDatabase
  let performanceMonitor: PerformanceMonitor
  let testUser: PerformanceTestUser | null = null

  beforeAll(async () => {
    testDatabase = global.testUtils.getTestDatabase() as unknown as PerformanceTestDatabase
    performanceMonitor = global.performanceTestSuite as unknown as PerformanceMonitor
    performanceMonitor.startMeasurement('api-performance-suite')
    testUser = (await global.testUtils.createTestUser()) as unknown as PerformanceTestUser
  })

  afterAll(async () => {
    performanceMonitor.endMeasurement('api-performance-suite')
    console.log('API Performance Report:', performanceMonitor.getReport())
  })

  beforeEach(async () => {
    performanceMonitor.reset()
  })

  describe('Response Time Benchmarks', () => {
    it('should handle simple GET requests quickly', async () => {
      // Create test data
      await global.testUtils.createTestApplication(testUser!.profile.id, {
        company_name: 'Performance Test Company',
      })

      const { result, duration } = await global.performanceUtils.measureAsync(
        'simple-get-request',
        async () => {
          return (await testDatabase.supabase
            .from('applications')
            .select('*')
            .eq('created_by', testUser!.profile.id)
            .single()) as MockSupabaseResponse<any>
        }
      )

      expect(result.error).toBeNull()
      expect(result.data).toBeTruthy()
      expect(duration).toBeLessThan(100) // Should complete within 100ms

      global.performanceUtils.assertPerformanceThreshold('simple-get-request', 150)
    })

    it('should handle paginated requests efficiently', async () => {
      // Create test data
      for (let i = 0; i < 50; i++) {
        await global.testUtils.createTestApplication(testUser!.profile.id, {
          company_name: `Company ${i}`,
        })
      }

      const paginationTests: PaginationTestConfig[] = [
        { page: 1, limit: 10, expectedMaxTime: 80 },
        { page: 3, limit: 10, expectedMaxTime: 80 },
        { page: 5, limit: 10, expectedMaxTime: 80 },
      ]

      for (const test of paginationTests) {
        const { result, duration } = await global.performanceUtils.measureAsync(
          `paginated-request-page-${test.page}`,
          async () => {
            const offset = (test.page - 1) * test.limit
            return (await testDatabase.supabase
              .from('applications')
              .select('*')
              .eq('created_by', testUser!.profile.id)
              .order('created_at', { ascending: false })
              .range(offset, offset + test.limit - 1)) as MockSupabaseResponse<any[]>
          }
        )

        expect(result.error).toBeNull()
        expect(result.data).toHaveLength(test.limit)
        expect(duration).toBeLessThan(test.expectedMaxTime)
      }
    })

    it('should handle search/filter requests efficiently', async () => {
      // Create diverse test data
      const companies = ['Google', 'Microsoft', 'Apple', 'Amazon', 'Meta']
      const statuses: ApplicationStatus[] = ['applied', 'interviewing', 'offered', 'rejected']

      for (let i = 0; i < 100; i++) {
        await global.testUtils.createTestApplication(testUser!.profile.id, {
          company_name: companies[i % companies.length],
          status: statuses[i % statuses.length],
          job_title: i % 2 === 0 ? 'Software Engineer' : 'Product Manager',
        })
      }

      const searchTests: SearchTestConfig[] = [
        {
          name: 'company-filter',
          operation: async () => {
            return (await testDatabase.supabase
              .from('applications')
              .select('*')
              .eq('created_by', testUser!.profile.id)
              .ilike('company_name', '%g%')) as MockSupabaseResponse<any[]>
          },
          expectedMaxTime: 100,
        },
        {
          name: 'status-filter',
          operation: async () => {
            return (await testDatabase.supabase
              .from('applications')
              .select('*')
              .eq('created_by', testUser!.profile.id)
              .eq('status', 'interviewing')) as MockSupabaseResponse<any[]>
          },
          expectedMaxTime: 50,
        },
        {
          name: 'combined-filter',
          operation: async () => {
            return (await testDatabase.supabase
              .from('applications')
              .select('*')
              .eq('created_by', testUser!.profile.id)
              .eq('status', 'interviewing')
              .ilike('job_title', '%engineer%')) as MockSupabaseResponse<any[]>
          },
          expectedMaxTime: 100,
        },
      ]

      for (const test of searchTests) {
        const { result, duration } = await global.performanceUtils.measureAsync(
          test.name,
          test.operation
        )

        expect(result.error).toBeNull()
        expect(duration).toBeLessThan(test.expectedMaxTime)
        global.performanceUtils.assertPerformanceThreshold(test.name, test.expectedMaxTime * 1.5)
      }
    })
  })

  describe('POST Request Performance', () => {
    it('should handle application creation quickly', async () => {
      const applicationData: ApplicationCreationData = {
        company_name: 'POST Performance Test',
        job_title: 'Software Engineer',
        status: 'applied',
        description: 'Test application for POST performance',
        location: 'Remote',
        salary_min: 80000,
        salary_max: 120000,
      }

      const { result, duration } = await global.performanceUtils.measureAsync(
        'create-application',
        async () => {
          return (await testDatabase.supabase
            .from('applications')
            .insert({
              ...applicationData,
              created_by: testUser!.profile.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single()) as MockSupabaseResponse<any>
        }
      )

      expect(result.error).toBeNull()
      expect(result.data!.company_name).toBe(applicationData.company_name)
      expect(duration).toBeLessThan(150)

      global.performanceUtils.assertPerformanceThreshold('create-application', 200)
    })

    it('should handle batch creation efficiently', async () => {
      const batchSize = 20
      const batchData = Array.from({ length: batchSize }, (_, i) => ({
        company_name: `Batch Company ${i}`,
        job_title: 'Software Engineer',
        status: 'applied',
        created_by: testUser!.profile.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))

      const { result, duration } = await global.performanceUtils.measureAsync(
        'batch-create-applications',
        async () => {
          return (await testDatabase.supabase
            .from('applications')
            .insert(batchData)
            .select()) as MockSupabaseResponse<any[]>
        }
      )

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(batchSize)
      expect(duration).toBeLessThan(800) // Should complete within 800ms

      const avgTimePerItem = duration / batchSize
      expect(avgTimePerItem).toBeLessThan(50) // Less than 50ms per item
    })

    it('should handle company creation quickly', async () => {
      const companyData: CompanyCreationData = {
        name: 'Company Performance Test',
        description: 'Test company for performance benchmarks',
        industry: 'Technology',
        size: '100-500',
        website: 'https://performancetest.com',
      }

      const { result, duration } = await global.performanceUtils.measureAsync(
        'create-company',
        async () => {
          return (await testDatabase.supabase
            .from('companies')
            .insert({
              ...companyData,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single()) as MockSupabaseResponse<any>
        }
      )

      expect(result.error).toBeNull()
      expect(result.data!.name).toBe(companyData.name)
      expect(duration).toBeLessThan(100)

      global.performanceUtils.assertPerformanceThreshold('create-company', 150)
    })
  })

  describe('PUT Request Performance', () => {
    it('should handle application updates quickly', async () => {
      const application = await global.testUtils.createTestApplication(testUser!.profile.id)

      const updateData: Record<string, unknown> = {
        status: 'interviewing',
        notes: 'Updated via performance test',
        updated_at: new Date().toISOString(),
      }

      const { result, duration } = await global.performanceUtils.measureAsync(
        'update-application',
        async () => {
          return (await testDatabase.supabase
            .from('applications')
            .update(updateData)
            .eq('id', application.id)
            .select()
            .single()) as MockSupabaseResponse<any>
        }
      )

      expect(result.error).toBeNull()
      expect(result.data!.status).toBe('interviewing')
      expect(result.data!.notes).toBe('Updated via performance test')
      expect(duration).toBeLessThan(100)

      global.performanceUtils.assertPerformanceThreshold('update-application', 150)
    })

    it('should handle user profile updates quickly', async () => {
      const updateData: UserProfileUpdateData = {
        name: 'Updated Performance User',
        bio: 'Updated bio for performance testing',
        updated_at: new Date().toISOString(),
      }

      const { result, duration } = await global.performanceUtils.measureAsync(
        'update-user-profile',
        async () => {
          return (await testDatabase.supabase
            .from('user_profiles')
            .update(updateData as unknown as Record<string, unknown>)
            .eq('id', testUser!.profile.id)
            .select()
            .single()) as MockSupabaseResponse<any>
        }
      )

      expect(result.error).toBeNull()
      expect(result.data!.name).toBe('Updated Performance User')
      expect(duration).toBeLessThan(80)

      global.performanceUtils.assertPerformanceThreshold('update-user-profile', 120)
    })

    it('should handle batch updates efficiently', async () => {
      // Create multiple applications
      const applications: PerformanceApplication[] = []
      for (let i = 0; i < 10; i++) {
        const app = await global.testUtils.createTestApplication(testUser!.profile.id, {
          status: 'applied',
        })
        applications.push(app as unknown as PerformanceApplication)
      }

      const { result, duration } = await global.performanceUtils.measureAsync(
        'batch-update-applications',
        async () => {
          const updatePromises = applications.map(
            app =>
              testDatabase.supabase
                .from('applications')
                .update({
                  status: 'interviewing',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', app.id) as unknown as MockSupabaseResponse<any>
          )
          return await Promise.all(updatePromises)
        }
      )

      expect(result.every((r: MockSupabaseResponse<unknown>) => !r.error)).toBe(true)
      expect(duration).toBeLessThan(500) // Should complete within 500ms

      const avgTimePerUpdate = duration / applications.length
      expect(avgTimePerUpdate).toBeLessThan(80) // Less than 80ms per update
    })
  })

  describe('DELETE Request Performance', () => {
    it('should handle application deletion quickly', async () => {
      const application = await global.testUtils.createTestApplication(testUser!.profile.id)

      const { result, duration } = await global.performanceUtils.measureAsync(
        'delete-application',
        async () => {
          return (await testDatabase.supabase
            .from('applications')
            .delete()
            .eq('id', application.id)) as MockSupabaseResponse<any>
        }
      )

      expect(result.error).toBeNull()
      expect(duration).toBeLessThan(80)

      global.performanceUtils.assertPerformanceThreshold('delete-application', 120)
    })

    it('should handle batch deletion efficiently', async () => {
      // Create multiple applications
      const applications: PerformanceApplication[] = []
      for (let i = 0; i < 15; i++) {
        const app = await global.testUtils.createTestApplication(testUser!.profile.id, {
          company_name: `Delete Company ${i}`,
        })
        applications.push(app as unknown as PerformanceApplication)
      }

      const { result, duration } = await global.performanceUtils.measureAsync(
        'batch-delete-applications',
        async () => {
          return (await testDatabase.supabase
            .from('applications')
            .delete()
            .in(
              'id',
              applications.map(app => app.id)
            )) as MockSupabaseResponse<any>
        }
      )

      expect(result.error).toBeNull()
      expect(duration).toBeLessThan(300) // Should complete within 300ms

      const avgTimePerDelete = duration / applications.length
      expect(avgTimePerDelete).toBeLessThan(30) // Less than 30ms per delete
    })
  })

  describe('Concurrent Request Performance', () => {
    it('should handle concurrent GET requests efficiently', async () => {
      // Create test data
      for (let i = 0; i < 20; i++) {
        await global.testUtils.createTestApplication(testUser!.profile.id, {
          company_name: `Concurrent Company ${i}`,
        })
      }

      const concurrentRequests = 25
      const { result, duration } = await global.performanceUtils.measureAsync(
        'concurrent-get-requests',
        async () => {
          const requests = Array.from({ length: concurrentRequests }, () =>
            testDatabase.supabase
              .from('applications')
              .select('*')
              .eq('created_by', testUser!.profile.id)
              .order('random()')
              .limit(5)
          )
          return await Promise.all(requests)
        }
      )

      expect(result.every((r: MockSupabaseResponse<unknown>) => !r.error)).toBe(true)
      expect(duration).toBeLessThan(2000) // Should complete within 2 seconds

      const avgTimePerRequest = duration / concurrentRequests
      expect(avgTimePerRequest).toBeLessThan(120) // Less than 120ms per concurrent request
    })

    it('should handle concurrent POST requests efficiently', async () => {
      const concurrentRequests = 15

      const { result, duration } = await global.performanceUtils.measureAsync(
        'concurrent-post-requests',
        async () => {
          const requests = Array.from({ length: concurrentRequests }, (_, i) =>
            testDatabase.supabase
              .from('applications')
              .insert({
                company_name: `Concurrent POST Company ${i}`,
                job_title: 'Software Engineer',
                status: 'applied',
                created_by: testUser!.profile.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select()
              .single()
          )
          return await Promise.all(requests)
        }
      )

      expect(result.every((r: MockSupabaseResponse<unknown>) => !r.error)).toBe(true)
      expect(duration).toBeLessThan(3000) // Should complete within 3 seconds

      const avgTimePerRequest = duration / concurrentRequests
      expect(avgTimePerRequest).toBeLessThan(250) // Less than 250ms per concurrent POST
    })

    it('should handle mixed concurrent operations efficiently', async () => {
      // Create initial data
      const applications: PerformanceApplication[] = []
      for (let i = 0; i < 10; i++) {
        const app = await global.testUtils.createTestApplication(testUser!.profile.id, {
          company_name: `Mixed Operation Company ${i}`,
        })
        applications.push(app as unknown as PerformanceApplication)
      }

      const { result, duration } = await global.performanceUtils.measureAsync(
        'mixed-concurrent-operations',
        async () => {
          const operations = [
            // GET operations
            ...Array.from({ length: 10 }, () =>
              testDatabase.supabase
                .from('applications')
                .select('*')
                .eq('created_by', testUser!.profile.id)
                .limit(5)
            ),
            // POST operations
            ...Array.from({ length: 5 }, (_, i) =>
              testDatabase.supabase
                .from('applications')
                .insert({
                  company_name: `Mixed POST Company ${i}`,
                  job_title: 'Software Engineer',
                  status: 'applied',
                  created_by: testUser!.profile.id,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .select()
                .single()
            ),
            // PUT operations
            ...applications.slice(0, 3).map(app =>
              testDatabase.supabase
                .from('applications')
                .update({
                  notes: 'Updated in mixed operation',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', app.id)
            ),
          ]

          return await Promise.all(operations)
        }
      )

      const successCount = result.filter((r: MockSupabaseResponse<unknown>) => !r.error).length
      expect(successCount).toBeGreaterThan(result.length * 0.9) // At least 90% success rate
      expect(duration).toBeLessThan(4000) // Should complete within 4 seconds
    })
  })

  describe('Payload Size Performance', () => {
    it('should handle large payloads efficiently', async () => {
      const largePayload = {
        company_name: 'Large Payload Company',
        job_title: 'Senior Software Engineer',
        status: 'applied',
        description: 'x'.repeat(5000), // 5KB description
        notes: 'x'.repeat(2000), // 2KB notes
        requirements: 'x'.repeat(3000), // 3KB requirements
        responsibilities: 'x'.repeat(3000), // 3KB responsibilities
        benefits: 'x'.repeat(2000), // 2KB benefits
      }

      const { result, duration } = await global.performanceUtils.measureAsync(
        'large-payload-create',
        async () => {
          return await testDatabase.supabase
            .from('applications')
            .insert({
              ...largePayload,
              created_by: testUser!.profile.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single()
        }
      )

      expect(result.error).toBeNull()
      expect((result.data as { description?: string })?.description).toHaveLength(5000)
      expect(duration).toBeLessThan(300) // Should handle large payloads within 300ms

      global.performanceUtils.assertPerformanceThreshold('large-payload-create', 400)
    })

    it('should handle large response payloads efficiently', async () => {
      // Create applications with large data
      const largeDataApplications: PerformanceApplication[] = []
      for (let i = 0; i < 20; i++) {
        const app = await global.testUtils.createTestApplication(testUser!.profile.id, {
          company_name: `Large Response Company ${i}`,
          job_description: 'x'.repeat(1000), // 1KB each
          notes: 'x'.repeat(500), // 500B each
        })
        largeDataApplications.push(app as PerformanceApplication)
      }

      const { result, duration } = await global.performanceUtils.measureAsync(
        'large-response-fetch',
        async () => {
          return (await testDatabase.supabase
            .from('applications')
            .select('*')
            .eq('created_by', testUser!.profile.id)
            .in(
              'id',
              largeDataApplications.map(app => app.id)
            )) as MockSupabaseResponse<any[]>
        }
      )

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(20)
      expect(duration).toBeLessThan(400) // Should fetch large response within 400ms

      // Calculate total payload size
      const totalSize = result.data!.reduce(
        (sum: number, app: PerformanceApplication) =>
          sum + (app.job_description?.length || 0) + (app.notes?.length || 0),
        0
      )
      expect(totalSize).toBeGreaterThan(25000) // At least 25KB total

      global.performanceUtils.assertPerformanceThreshold('large-response-fetch', 500)
    })
  })

  describe('Memory Usage During API Operations', () => {
    it('should manage memory efficiently during API operations', async () => {
      // Take initial memory snapshot
      global.performanceUtils.takeMemorySnapshot()

      // Perform memory-intensive operations
      const operations = []
      for (let i = 0; i < 50; i++) {
        operations.push(
          // Create with large data
          testDatabase.supabase.from('applications').insert({
            company_name: `Memory Test Company ${i}`,
            description: 'x'.repeat(2000), // 2KB each
            created_by: testUser!.profile.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        )
      }

      await Promise.all(operations)

      // Fetch all data
      await testDatabase.supabase
        .from('applications')
        .select('*')
        .eq('created_by', testUser!.profile.id)

      // Take final memory snapshot
      global.performanceUtils.takeMemorySnapshot()

      // Check memory growth
      const report = global.performanceUtils.getPerformanceReport()
      if (report.memory) {
        expect(report.memory.growth).toBeLessThan(20 * 1024 * 1024) // Less than 20MB growth
      }

      global.performanceUtils.assertMemoryThreshold(30 * 1024 * 1024) // 30MB threshold
    })
  })

  describe('API Error Handling Performance', () => {
    it('should handle error responses quickly', async () => {
      const { result, duration } = await global.performanceUtils.measureAsync(
        'error-response-handling',
        async () => {
          // Try to access non-existent resource
          return (await testDatabase.supabase
            .from('applications')
            .select('*')
            .eq('id', 'non-existent-id')
            .single()) as MockSupabaseResponse<any>
        }
      )

      expect(result.error).toBeTruthy()
      expect(duration).toBeLessThan(100) // Error responses should be very fast

      global.performanceUtils.assertPerformanceThreshold('error-response-handling', 150)
    })

    it('should handle validation errors quickly', async () => {
      const invalidData = {
        // Missing required fields
        job_title: 'Software Engineer',
        created_by: testUser!.profile.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { result, duration } = await global.performanceUtils.measureAsync(
        'validation-error-handling',
        async () => {
          return (await testDatabase.supabase
            .from('applications')
            .insert(invalidData)
            .select()
            .single()) as MockSupabaseResponse<any>
        }
      )

      expect(result.error).toBeTruthy()
      expect(duration).toBeLessThan(50) // Validation should be very fast

      global.performanceUtils.assertPerformanceThreshold('validation-error-handling', 100)
    })
  })

  describe('API Performance Regression Testing', () => {
    it('should maintain performance in critical API paths', async () => {
      const criticalPaths: CriticalPathTest[] = [
        {
          name: 'dashboard-data-load',
          threshold: 500,
          operation: async () => {
            // Simulate dashboard data loading
            await Promise.all([
              testDatabase.supabase
                .from('applications')
                .select('*')
                .eq('created_by', testUser!.profile.id)
                .order('created_at', { ascending: false })
                .limit(10),
              testDatabase.supabase
                .from('applications')
                .select('status, count')
                .eq('created_by', testUser!.profile.id),
            ])
          },
        },
        {
          name: 'application-full-crud',
          threshold: 1000,
          operation: async () => {
            // Complete CRUD cycle
            const { data: created } = (await testDatabase.supabase
              .from('applications')
              .insert({
                company_name: 'Regression Test Company',
                job_title: 'Software Engineer',
                status: 'applied',
                created_by: testUser!.profile.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select()
              .single()) as MockSupabaseResponse<any>

            if (created.data) {
              const createdId = (created.data as { id: string }).id
              ;(await testDatabase.supabase
                .from('applications')
                .select('*')
                .eq('id', createdId)
                .single()) as MockSupabaseResponse<any>

              ;(await testDatabase.supabase
                .from('applications')
                .update({ status: 'interviewing' })
                .eq('id', createdId)) as MockSupabaseResponse<any>

              ;(await testDatabase.supabase
                .from('applications')
                .delete()
                .eq('id', createdId)) as MockSupabaseResponse<any>
            }
          },
        },
        {
          name: 'user-profile-operations',
          threshold: 300,
          operation: async () => {
            // User profile read and update
            await testDatabase.supabase
              .from('user_profiles')
              .select('*')
              .eq('id', testUser!.profile.id)
              .single()

            await testDatabase.supabase
              .from('user_profiles')
              .update({
                bio: 'Updated during regression test',
                updated_at: new Date().toISOString(),
              })
              .eq('id', testUser!.profile.id)
          },
        },
      ]

      for (const path of criticalPaths) {
        const { duration } = await global.performanceUtils.measureAsync(path.name, path.operation)

        console.log(`${path.name}: ${duration.toFixed(2)}ms (threshold: ${path.threshold}ms)`)
        global.performanceUtils.assertPerformanceThreshold(path.name, path.threshold)
      }
    })
  })
})
