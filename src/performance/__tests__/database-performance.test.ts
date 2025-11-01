import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import type { ApplicationStatus } from '@/lib/types/database.types'
import type { MockSupabaseResponse } from '@/types/test'
import type {
  PerformanceTestDatabase,
  PerformanceMonitor,
  PerformanceApplication,
} from '@/types/performance-test'

describe('Database Performance Benchmarks', () => {
  let testDatabase: PerformanceTestDatabase
  let performanceMonitor: PerformanceMonitor

  beforeAll(async () => {
    // Get test database and performance monitor
    testDatabase = global.testUtils.getTestDatabase() as unknown as PerformanceTestDatabase
    performanceMonitor = global.performanceTestSuite as unknown as PerformanceMonitor

    // Start performance monitoring
    performanceMonitor.startMeasurement('database-performance-suite')
  })

  afterAll(async () => {
    performanceMonitor.endMeasurement('database-performance-suite')
    console.log('Database Performance Report:', performanceMonitor.getReport())
  })

  beforeEach(async () => {
    await testDatabase.reset()
    performanceMonitor.reset()
  })

  describe('Query Performance', () => {
    it('should handle simple queries within performance thresholds', async () => {
      const testUser = await global.testUtils.createTestUser()

      // Benchmark simple SELECT query
      const { result, duration } = await global.performanceUtils.measureAsync(
        'simple-select-query',
        async () => {
          return (await testDatabase.supabase
            .from('applications')
            .select('*')
            .eq('created_by', testUser.profile.id)) as MockSupabaseResponse<any[]>
        }
      )

      expect(result.error).toBeNull()
      expect(duration).toBeLessThan(100) // Should complete within 100ms

      // Assert performance threshold
      global.performanceUtils.assertPerformanceThreshold('simple-select-query', 200)
    })

    it('should handle complex JOIN queries efficiently', async () => {
      const testUser = await global.testUtils.createTestUser()
      const company = await global.testUtils.createTestCompany()
      const application = await global.testUtils.createTestApplication(testUser.profile.id, {
        company_id: company.id,
      })

      // Add activity data
      await testDatabase.supabase.from('application_activities').insert({
        application_id: application.id,
        type: 'status_change',
        description: 'Status updated',
        created_by: testUser.profile.id,
        created_at: new Date().toISOString(),
      })

      // Benchmark complex JOIN query
      const { result, duration } = await global.performanceUtils.measureAsync(
        'complex-join-query',
        async () => {
          return (await testDatabase.supabase
            .from('applications')
            .select(
              `
              *,
              companies (*),
              application_activities (*)
            `
            )
            .eq('id', application.id)
            .single()) as MockSupabaseResponse<any>
        }
      )

      expect(result.error).toBeNull()
      expect(result.data!.companies).toBeTruthy()
      expect(result.data!.application_activities).toBeTruthy()
      expect(duration).toBeLessThan(200) // Should complete within 200ms

      global.performanceUtils.assertPerformanceThreshold('complex-join-query', 300)
    })

    it('should handle pagination efficiently', async () => {
      const testUser = await global.testUtils.createTestUser()

      // Create 100 applications
      const applications: PerformanceApplication[] = []
      for (let i = 0; i < 100; i++) {
        const app = await global.testUtils.createTestApplication(testUser.profile.id, {
          company_name: `Company ${i}`,
          job_title: `Job ${i}`,
        })
        applications.push(app as unknown as PerformanceApplication)
      }

      // Benchmark pagination queries
      const paginationTests = [
        { page: 1, limit: 10, expectedTime: 50 },
        { page: 5, limit: 10, expectedTime: 50 },
        { page: 10, limit: 10, expectedTime: 50 },
      ]

      for (const test of paginationTests) {
        const { result, duration } = await global.performanceUtils.measureAsync(
          `pagination-page-${test.page}`,
          async () => {
            const offset = (test.page - 1) * test.limit
            return (await testDatabase.supabase
              .from('applications')
              .select('*')
              .eq('created_by', testUser.profile.id)
              .order('created_at', { ascending: false })
              .range(offset, offset + test.limit - 1)) as MockSupabaseResponse<any[]>
          }
        )

        expect(result.error).toBeNull()
        expect(result.data).toHaveLength(test.limit)
        expect(duration).toBeLessThan(test.expectedTime)
      }
    })

    it('should handle search queries efficiently', async () => {
      const testUser = await global.testUtils.createTestUser()

      // Create applications with searchable content
      const companies = [
        'Google LLC',
        'Microsoft Corporation',
        'Apple Inc.',
        'Amazon.com Inc.',
        'Meta Platforms Inc.',
        'Netflix Inc.',
        'Tesla Inc.',
        'Adobe Inc.',
        'Salesforce Inc.',
        'Oracle Corporation',
      ]

      for (const company of companies) {
        await global.testUtils.createTestApplication(testUser.profile.id, {
          company_name: company,
          job_title: 'Software Engineer',
        })
      }

      // Benchmark search queries
      const searchTests = [
        {
          query: '%Google%',
          expectedResults: 1,
          column: 'company_name',
          name: 'company-google',
        },
        {
          query: '%Inc.%',
          expectedResults: 7,
          column: 'company_name',
          name: 'company-inc',
        },
        {
          query: '%Software%',
          expectedResults: 10,
          column: 'job_title',
          name: 'job-software',
        },
      ]

      for (const test of searchTests) {
        const { result, duration } = await global.performanceUtils.measureAsync(
          `search-query-${test.name}`,
          async () => {
            return (await testDatabase.supabase
              .from('applications')
              .select('*')
              .eq('created_by', testUser.profile.id)
              .ilike(test.column, test.query)) as MockSupabaseResponse<any[]>
          }
        )

        expect(result.error).toBeNull()
        expect(result.data).toHaveLength(test.expectedResults)
        expect(duration).toBeLessThan(100)
      }
    })
  })

  describe('Write Performance', () => {
    it('should handle single inserts efficiently', async () => {
      const testUser = await global.testUtils.createTestUser()

      const { result, duration } = await global.performanceUtils.measureAsync(
        'single-insert',
        async () => {
          return (await testDatabase.supabase
            .from('applications')
            .insert({
              company_name: 'Performance Test Company',
              job_title: 'Performance Test Job',
              status: 'applied',
              created_by: testUser.profile.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single()) as MockSupabaseResponse<any>
        }
      )

      expect(result.error).toBeNull()
      expect(result.data!.id).toBeTruthy()
      expect(duration).toBeLessThan(150)

      global.performanceUtils.assertPerformanceThreshold('single-insert', 200)
    })

    it('should handle batch inserts efficiently', async () => {
      const testUser = await global.testUtils.createTestUser()

      const batchSize = 50
      const batchData = Array.from({ length: batchSize }, (_, i) => ({
        company_name: `Batch Company ${i}`,
        job_title: 'Software Engineer',
        status: 'applied',
        created_by: testUser.profile.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))

      const { result, duration } = await global.performanceUtils.measureAsync(
        'batch-insert',
        async () => {
          return (await testDatabase.supabase
            .from('applications')
            .insert(batchData)
            .select()) as MockSupabaseResponse<any[]>
        }
      )

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(batchSize)
      expect(duration).toBeLessThan(1000) // Should complete within 1 second

      // Calculate per-record insert time
      const avgTimePerRecord = duration / batchSize
      expect(avgTimePerRecord).toBeLessThan(50) // Less than 50ms per record
    })

    it('should handle concurrent writes efficiently', async () => {
      const testUser = await global.testUtils.createTestUser()
      const concurrentWrites = 20

      const { result, duration } = await global.performanceUtils.measureAsync(
        'concurrent-writes',
        async () => {
          const writePromises = Array.from({ length: concurrentWrites }, (_, i) =>
            testDatabase.supabase
              .from('applications')
              .insert({
                company_name: `Concurrent Company ${i}`,
                job_title: 'Software Engineer',
                status: 'applied',
                created_by: testUser.profile.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select()
              .single()
          )

          return await Promise.all(writePromises)
        }
      )

      expect(result).toHaveLength(concurrentWrites)
      expect(result.every(r => !r.error)).toBe(true)
      expect(duration).toBeLessThan(3000) // Should complete within 3 seconds

      const avgTimePerWrite = duration / concurrentWrites
      expect(avgTimePerWrite).toBeLessThan(200) // Less than 200ms per concurrent write
    })

    it('should handle updates efficiently', async () => {
      const testUser = await global.testUtils.createTestUser()
      const application = await global.testUtils.createTestApplication(testUser.profile.id)

      const { result, duration } = await global.performanceUtils.measureAsync(
        'single-update',
        async () => {
          return (await testDatabase.supabase
            .from('applications')
            .update({
              status: 'interviewing',
              notes: 'Updated via performance test',
              updated_at: new Date().toISOString(),
            })
            .eq('id', application.id)
            .select()
            .single()) as MockSupabaseResponse<any>
        }
      )

      expect(result.error).toBeNull()
      expect(result.data!.status).toBe('interviewing')
      expect(duration).toBeLessThan(100)

      global.performanceUtils.assertPerformanceThreshold('single-update', 150)
    })

    it('should handle deletes efficiently', async () => {
      const testUser = await global.testUtils.createTestUser()
      const applications: PerformanceApplication[] = []

      // Create multiple applications to delete
      for (let i = 0; i < 10; i++) {
        const app = await global.testUtils.createTestApplication(testUser.profile.id, {
          company_name: `Delete Company ${i}`,
        })
        applications.push(app as unknown as PerformanceApplication)
      }

      const { result, duration } = await global.performanceUtils.measureAsync(
        'batch-delete',
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
      expect(duration).toBeLessThan(200)

      // Verify deletions
      const { data: remainingApps } = (await testDatabase.supabase
        .from('applications')
        .select('*')
        .in(
          'id',
          applications.map(app => app.id)
        )) as MockSupabaseResponse<any[]>

      expect(remainingApps).toHaveLength(0)
    })
  })

  describe('Index Performance', () => {
    it('should utilize indexes for filtered queries', async () => {
      const testUser = await global.testUtils.createTestUser()

      // Create applications with different statuses
      const statuses: ApplicationStatus[] = ['applied', 'interviewing', 'offered', 'rejected']
      for (let i = 0; i < 200; i++) {
        await global.testUtils.createTestApplication(testUser.profile.id, {
          status: statuses[i % statuses.length],
          company_name: `Company ${i}`,
        })
      }

      // Test index usage for status filtering
      const { result, duration } = await global.performanceUtils.measureAsync(
        'indexed-filter-query',
        async () => {
          return (await testDatabase.supabase
            .from('applications')
            .select('*')
            .eq('created_by', testUser.profile.id)
            .eq('status', 'interviewing')
            .order('created_at', { ascending: false })) as MockSupabaseResponse<any[]>
        }
      )

      expect(result.error).toBeNull()
      expect(result.data!.length).toBeGreaterThan(0)
      expect(duration).toBeLessThan(50) // Should be very fast with proper indexing

      global.performanceUtils.assertPerformanceThreshold('indexed-filter-query', 100)
    })

    it('should handle ORDER BY with indexes efficiently', async () => {
      const testUser = await global.testUtils.createTestUser()

      // Create applications with timestamps
      const baseTime = new Date()
      for (let i = 0; i < 100; i++) {
        const _timestamp = new Date(baseTime.getTime() + i * 60000) // 1 minute apart
        await global.testUtils.createTestApplication(testUser.profile.id, {
          company_name: `Company ${i}`,
        })
      }

      // Test ordered query performance
      const { result, duration } = await global.performanceUtils.measureAsync(
        'ordered-query',
        async () => {
          return (await testDatabase.supabase
            .from('applications')
            .select('*')
            .eq('created_by', testUser.profile.id)
            .order('created_at', { ascending: false })
            .limit(20)) as MockSupabaseResponse<any[]>
        }
      )

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(20)
      expect(duration).toBeLessThan(80) // Should be fast with timestamp indexing

      // Verify ordering
      const data = result.data as Array<{ created_at: string }>
      for (let i = 1; i < data.length; i++) {
        const prevTimestamp = data[i - 1].created_at
        const currTimestamp = data[i].created_at
        expect(new Date(prevTimestamp).getTime()).toBeGreaterThanOrEqual(
          new Date(currTimestamp).getTime()
        )
      }
    })
  })

  describe('Memory and Resource Usage', () => {
    it('should handle large result sets without memory leaks', async () => {
      const testUser = await global.testUtils.createTestUser()

      // Create a large dataset
      const largeDataSetSize = 500
      for (let i = 0; i < largeDataSetSize; i++) {
        await global.testUtils.createTestApplication(testUser.profile.id, {
          company_name: `Large Dataset Company ${i}`,
          job_description: 'x'.repeat(1000), // 1KB description each
        })
      }

      // Take initial memory snapshot
      global.performanceUtils.takeMemorySnapshot()

      // Fetch large dataset
      const { result, duration } = await global.performanceUtils.measureAsync(
        'large-dataset-fetch',
        async () => {
          return (await testDatabase.supabase
            .from('applications')
            .select('*')
            .eq('created_by', testUser.profile.id)) as MockSupabaseResponse<any[]>
        }
      )

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(largeDataSetSize)
      expect(duration).toBeLessThan(2000) // Should complete within 2 seconds

      // Take final memory snapshot
      global.performanceUtils.takeMemorySnapshot()

      // Check memory growth
      const report = global.performanceUtils.getPerformanceReport()
      if (report.memory) {
        expect(report.memory.growth).toBeLessThan(50 * 1024 * 1024) // Less than 50MB growth
      }
    })

    it('should manage connection pooling efficiently', async () => {
      const testUser = await global.testUtils.createTestUser()

      // Simulate multiple rapid database operations
      const operationCount = 100
      const operations = Array.from({ length: operationCount }, (_, i) =>
        global.performanceUtils.measureAsync(`pooled-operation-${i}`, async () => {
          return await testDatabase.supabase
            .from('applications')
            .select('id')
            .eq('created_by', testUser.profile.id)
            .limit(1)
        })
      )

      const results = await Promise.all(operations)

      // All operations should succeed
      expect(results.every(r => !r.result.error)).toBe(true)

      // Check overall performance
      const totalTime = results.reduce((sum, r) => sum + r.duration, 0)
      const avgTime = totalTime / operationCount

      expect(avgTime).toBeLessThan(50) // Average less than 50ms per operation
      expect(totalTime).toBeLessThan(5000) // Total less than 5 seconds
    })
  })

  describe('Stress Testing', () => {
    it('should handle high load scenarios', async () => {
      const users = await Promise.all(
        Array.from({ length: 10 }, () => global.testUtils.createTestUser())
      )

      const operationsPerUser = 20
      const totalOperations = users.length * operationsPerUser

      // Create concurrent operations for multiple users
      const startTime = performance.now()

      const userOperations = users.map(async user => {
        const userOps = []
        for (let i = 0; i < operationsPerUser; i++) {
          userOps.push(
            global.testUtils.createTestApplication(user.profile.id, {
              company_name: `Stress Test Company ${user.profile.id}-${i}`,
              job_title: 'Software Engineer',
            })
          )
        }
        return await Promise.all(userOps)
      })

      await Promise.all(userOperations)

      const endTime = performance.now()
      const totalDuration = endTime - startTime

      console.log(`Completed ${totalOperations} operations in ${totalDuration.toFixed(2)}ms`)
      console.log(`Average time per operation: ${(totalDuration / totalOperations).toFixed(2)}ms`)

      expect(totalDuration).toBeLessThan(15000) // Should complete within 15 seconds
      expect(totalDuration / totalOperations).toBeLessThan(100) // Less than 100ms per operation
    })

    it('should maintain performance under sustained load', async () => {
      const testUser = await global.testUtils.createTestUser()

      // Sustained load test - multiple rounds of operations
      const rounds = 5
      const operationsPerRound = 50
      const performanceMetrics: number[] = []

      for (let round = 0; round < rounds; round++) {
        const roundStart = performance.now()

        // Create operations
        const createOps = Array.from({ length: operationsPerRound }, (_, i) =>
          testDatabase.supabase.from('applications').insert({
            company_name: `Sustained Load Company ${round}-${i}`,
            job_title: 'Software Engineer',
            status: 'applied',
            created_by: testUser.profile.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        )

        await Promise.all(createOps)

        // Query operations
        const queryOps = Array.from({ length: operationsPerRound }, () =>
          testDatabase.supabase
            .from('applications')
            .select('*')
            .eq('created_by', testUser.profile.id)
            .limit(10)
        )

        await Promise.all(queryOps)

        const roundEnd = performance.now()
        const roundDuration = roundEnd - roundStart
        performanceMetrics.push(roundDuration)

        console.log(`Round ${round + 1}: ${roundDuration.toFixed(2)}ms`)
      }

      // Analyze performance consistency
      const avgPerformance =
        performanceMetrics.reduce((sum, time) => sum + time, 0) / performanceMetrics.length
      const maxPerformance = Math.max(...performanceMetrics)
      const minPerformance = Math.min(...performanceMetrics)
      const performanceVariance = maxPerformance - minPerformance

      console.log(`Average round time: ${avgPerformance.toFixed(2)}ms`)
      console.log(`Performance variance: ${performanceVariance.toFixed(2)}ms`)

      expect(avgPerformance).toBeLessThan(3000) // Average less than 3 seconds per round
      expect(performanceVariance).toBeLessThan(1000) // Variance less than 1 second
    })
  })

  describe('Regression Testing', () => {
    it('should not have performance regressions in critical paths', async () => {
      const testUser = await global.testUtils.createTestUser()

      // Define critical path benchmarks
      const criticalPaths = [
        {
          name: 'user-login-flow',
          threshold: 500, // 500ms
          operation: async () => {
            // Simulate login flow operations
            await testDatabase.supabase
              .from('user_profiles')
              .select('*')
              .eq('id', testUser.profile.id)
              .single()
          },
        },
        {
          name: 'application-crud',
          threshold: 300, // 300ms
          operation: async () => {
            // Create, read, update, delete
            const { data: created } = (await testDatabase.supabase
              .from('applications')
              .insert({
                company_name: 'Regression Test',
                job_title: 'Test Job',
                status: 'applied',
                created_by: testUser.profile.id,
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
          name: 'dashboard-load',
          threshold: 800, // 800ms
          operation: async () => {
            // Simulate dashboard loading
            await Promise.all([
              testDatabase.supabase
                .from('applications')
                .select('*')
                .eq('created_by', testUser.profile.id)
                .order('created_at', { ascending: false })
                .limit(10),
              testDatabase.supabase
                .from('applications')
                .select('status')
                .eq('created_by', testUser.profile.id),
            ])
          },
        },
      ]

      // Run critical path benchmarks
      for (const path of criticalPaths) {
        const { duration } = await global.performanceUtils.measureAsync(path.name, path.operation)

        console.log(`${path.name}: ${duration.toFixed(2)}ms (threshold: ${path.threshold}ms)`)

        // Assert performance threshold
        global.performanceUtils.assertPerformanceThreshold(path.name, path.threshold)
      }
    })
  })
})
