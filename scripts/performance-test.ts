#!/usr/bin/env node

/**
 * Performance Test Script for Large Kanban Boards
 *
 * This script tests the performance of the kanban board system
 * when handling a large number of applications (1000+ cards).
 */

import { performance } from 'perf_hooks'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

interface PerformanceMetrics {
  operation: string
  startTime: number
  endTime: number
  duration: number
  itemCount?: number
  itemsPerSecond?: number
  memoryUsage?: NodeJS.MemoryUsage
}

class PerformanceTester {
  private metrics: PerformanceMetrics[] = []
  private testUserId: string

  constructor() {
    this.testUserId = '00000000-0000-0000-0000-000000000002'
  }

  private startTimer(operation: string): PerformanceMetrics {
    const metrics: PerformanceMetrics = {
      operation,
      startTime: performance.now(),
      endTime: 0,
      duration: 0,
      memoryUsage: process.memoryUsage(),
    }

    this.metrics.push(metrics)
    return metrics
  }

  private endTimer(metrics: PerformanceMetrics): void {
    metrics.endTime = performance.now()
    metrics.duration = metrics.endTime - metrics.startTime
  }

  private generateTestApplications(count: number): any[] {
    const applications = []
    const companies = [
      'TechCorp',
      'StartupXYZ',
      'DataFlow Inc',
      'CloudBase',
      'AI Solutions',
      'WebCraft',
      'MobileFirst',
      'DevOps Pro',
      'SecurityNow',
      'Database Masters',
      'Frontend Experts',
      'Backend Gurus',
      'FullStack Studios',
      'Agile Teams',
      'Digital Agency',
    ]

    const positions = [
      'Senior Software Engineer',
      'Frontend Developer',
      'Backend Developer',
      'Full Stack Engineer',
      'DevOps Engineer',
      'Data Engineer',
      'Machine Learning Engineer',
      'Mobile Developer',
      'QA Engineer',
      'Product Manager',
      'UX Designer',
      'Technical Lead',
      'Architect',
      'Senior Developer',
      'Junior Developer',
      'Intern Developer',
    ]

    const statuses = [
      'wishlist',
      'applied',
      'phone_screen',
      'assessment',
      'take_home',
      'interviewing',
      'final_round',
      'offered',
      'accepted',
      'rejected',
      'withdrawn',
      'ghosted',
    ]

    for (let i = 0; i < count; i++) {
      applications.push({
        id: `perf-test-${i}`,
        user_id: this.testUserId,
        company_name: companies[i % companies.length],
        job_title: positions[i % positions.length],
        status: statuses[i % statuses.length],
        job_url: `https://example.com/job/${i}`,
        location: ['San Francisco, CA', 'New York, NY', 'Remote', 'Austin, TX', 'Seattle, WA'][
          i % 5
        ],
        salary_range: ['$80k-$120k', '$100k-$150k', '$120k-$180k', '$150k-$200k', '$200k-$250k'][
          i % 5
        ],
        notes: `Performance test application ${i}`,
        date_applied: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
    }

    return applications
  }

  async cleanupTestData(): Promise<void> {
    console.log('🧹 Cleaning up test data...')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('⚠️  Supabase credentials not found, skipping cleanup')
      return
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Delete test applications
    const { error: appError } = await supabase
      .from('applications')
      .delete()
      .eq('user_id', this.testUserId)
      .like('id', 'perf-test-%')

    if (appError) {
      console.log('⚠️  Error cleaning applications:', appError.message)
    }

    // Delete test boards and related data
    const { data: boards } = await supabase
      .from('boards')
      .select('id')
      .eq('user_id', this.testUserId)
      .like('name', 'Performance Test Board')

    if (boards) {
      for (const board of boards) {
        await supabase.from('board_analytics').delete().eq('board_id', board.id)
        await supabase.from('board_settings').delete().eq('board_id', board.id)
        await supabase.from('board_columns').delete().eq('board_id', board.id)
        await supabase.from('boards').delete().eq('id', board.id)
      }
    }

    console.log('✅ Cleanup completed')
  }

  async testBoardCreation(): Promise<void> {
    console.log('\n🏗️  Testing Board Creation Performance')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('⚠️  Supabase credentials not found, skipping board creation test')
      return
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const metrics = this.startTimer('Create Board')

    const { data: board, error: boardError } = await supabase
      .from('boards')
      .insert({
        user_id: this.testUserId,
        name: 'Performance Test Board',
        description: 'Board for performance testing with large datasets',
        is_default: false,
        is_archived: false,
      })
      .select()
      .single()

    if (boardError) {
      console.log('❌ Board creation failed:', boardError.message)
      return
    }

    // Create board columns
    const columns = [
      { name: 'Wishlist', color: '#94a3b8', position: 1, wip_limit: 10 },
      { name: 'Applied', color: '#3b82f6', position: 2, wip_limit: 15 },
      { name: 'Interviewing', color: '#10b981', position: 3, wip_limit: 8 },
      { name: 'Offers', color: '#84cc16', position: 4, wip_limit: 5 },
      { name: 'Rejected', color: '#ef4444', position: 5, wip_limit: 0 },
    ]

    for (const column of columns) {
      await supabase.from('board_columns').insert({
        board_id: board.id,
        user_id: this.testUserId,
        ...column,
        is_default: false,
        is_archived: false,
      })
    }

    // Create board settings
    await supabase.from('board_settings').insert({
      board_id: board.id,
      user_id: this.testUserId,
      theme: 'default',
      compact_mode: false,
      show_empty_columns: true,
      show_column_counts: true,
      enable_animations: true,
      auto_archive_days: 30,
    })

    this.endTimer(metrics)
    console.log(`✅ Board created in ${metrics.duration.toFixed(2)}ms`)
  }

  async testApplicationInsertion(count: number): Promise<void> {
    console.log(`\n📝 Testing Application Insertion Performance (${count} applications)`)

    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('⚠️  Supabase credentials not found, skipping insertion test')
      return
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const applications = this.generateTestApplications(count)

    const metrics = this.startTimer(`Insert ${count} Applications`)

    // Batch insert applications (100 at a time to avoid timeouts)
    const batchSize = 100
    let inserted = 0

    for (let i = 0; i < applications.length; i += batchSize) {
      const batch = applications.slice(i, i + batchSize)
      const { error } = await supabase.from('applications').insert(batch)

      if (error) {
        console.log(`❌ Batch insertion failed at index ${i}:`, error.message)
        break
      }

      inserted += batch.length
      if (i % (batchSize * 5) === 0) {
        console.log(`   Progress: ${inserted}/${count} applications`)
      }
    }

    this.endTimer(metrics)
    metrics.itemCount = inserted
    metrics.itemsPerSecond = (inserted / metrics.duration) * 1000

    console.log(`✅ ${inserted} applications inserted in ${metrics.duration.toFixed(2)}ms`)
    console.log(`📊 Performance: ${metrics.itemsPerSecond.toFixed(2)} applications/second`)
  }

  async testBoardRendering(count: number): Promise<void> {
    console.log(`\n🖼️  Testing Board Rendering Performance (${count} applications)`)

    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('⚠️  Supabase credentials not found, skipping rendering test')
      return
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Test fetching applications
    const fetchMetrics = this.startTimer('Fetch Applications')
    const { data: applications, error: fetchError } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', this.testUserId)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.log('❌ Application fetch failed:', fetchError.message)
      return
    }

    this.endTimer(fetchMetrics)
    fetchMetrics.itemCount = applications?.length || 0

    console.log(
      `✅ ${fetchMetrics.itemCount} applications fetched in ${fetchMetrics.duration.toFixed(2)}ms`
    )

    // Test board data fetching
    const boardMetrics = this.startTimer('Fetch Board Data')

    const { data: boards } = await supabase
      .from('boards')
      .select('*')
      .eq('user_id', this.testUserId)

    const { data: columns } = await supabase
      .from('board_columns')
      .select('*')
      .eq('user_id', this.testUserId)
      .order('position', { ascending: true })

    const { data: settings } = await supabase
      .from('board_settings')
      .select('*')
      .eq('user_id', this.testUserId)
      .single()

    this.endTimer(boardMetrics)

    console.log(`✅ Board data fetched in ${boardMetrics.duration.toFixed(2)}ms`)
    console.log(
      `📊 Boards: ${boards?.length || 0}, Columns: ${columns?.length || 0}, Settings: ${settings ? 1 : 0}`
    )

    // Simulate rendering performance by processing data
    const renderMetrics = this.startTimer('Process Board Data (Simulated Rendering)')

    // Simulate the data processing that would happen during rendering
    const processedData = {
      applications: applications || [],
      board: boards?.[0] || null,
      columns: columns || [],
      settings: settings || null,
      applicationsByColumn: (columns || []).reduce((acc: any, column: any) => {
        acc[column.id] = (applications || []).filter((app: any) => {
          // Simulate status-to-column mapping
          const statusColumnMap: Record<string, string> = {
            wishlist: 'Wishlist',
            applied: 'Applied',
            phone_screen: 'Phone Screen',
            assessment: 'Assessment',
            take_home: 'Take Home',
            interviewing: 'Interviewing',
            final_round: 'Final Round',
            offered: 'Offered',
            accepted: 'Accepted',
            rejected: 'Rejected',
            withdrawn: 'Withdrawn',
            ghosted: 'Ghosted',
          }
          return statusColumnMap[app.status] === column.name
        })
        return acc
      }, {}),
    }

    this.endTimer(renderMetrics)

    console.log(`✅ Board data processed in ${renderMetrics.duration.toFixed(2)}ms`)

    // Calculate application distribution
    const distribution = Object.entries(processedData.applicationsByColumn)
      .map(([columnId, apps]: [string, unknown]) => ({
        columnId,
        count: Array.isArray(apps) ? apps.length : 0,
      }))
      .sort((a, b) => b.count - a.count)

    console.log('📊 Application Distribution:')
    distribution.forEach(({ columnId, count }) => {
      console.log(`   Column ${columnId}: ${count} applications`)
    })
  }

  async testMemoryUsage(): Promise<void> {
    console.log('\n💾 Memory Usage Analysis')

    const baselineMemory = process.memoryUsage()
    console.log('Baseline Memory:')
    console.log(`   RSS: ${(baselineMemory.rss / 1024 / 1024).toFixed(2)} MB`)
    console.log(`   Heap Used: ${(baselineMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`)
    console.log(`   Heap Total: ${(baselineMemory.heapTotal / 1024 / 1024).toFixed(2)} MB`)

    // Check memory usage after operations
    if (this.metrics.length > 0) {
      const latestMetrics = this.metrics[this.metrics.length - 1]
      if (latestMetrics.memoryUsage) {
        const memoryIncrease = {
          rss: latestMetrics.memoryUsage.rss - baselineMemory.rss,
          heapUsed: latestMetrics.memoryUsage.heapUsed - baselineMemory.heapUsed,
          heapTotal: latestMetrics.memoryUsage.heapTotal - baselineMemory.heapTotal,
        }

        console.log('Memory Increase:')
        console.log(`   RSS: ${(memoryIncrease.rss / 1024 / 1024).toFixed(2)} MB`)
        console.log(`   Heap Used: ${(memoryIncrease.heapUsed / 1024 / 1024).toFixed(2)} MB`)
        console.log(`   Heap Total: ${(memoryIncrease.heapTotal / 1024 / 1024).toFixed(2)} MB`)
      }
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc()
      const afterGCMemory = process.memoryUsage()
      console.log('After Garbage Collection:')
      console.log(`   RSS: ${(afterGCMemory.rss / 1024 / 1024).toFixed(2)} MB`)
      console.log(`   Heap Used: ${(afterGCMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`)
    }
  }

  generateReport(): void {
    console.log('\n📈 Performance Report')
    console.log('=================================================')

    this.metrics.forEach(metric => {
      console.log(`${metric.operation}:`)
      console.log(`   Duration: ${metric.duration.toFixed(2)}ms`)
      if (metric.itemCount) {
        console.log(`   Items: ${metric.itemCount}`)
      }
      if (metric.itemsPerSecond) {
        console.log(`   Throughput: ${metric.itemsPerSecond.toFixed(2)} items/sec`)
      }
      if (metric.memoryUsage) {
        console.log(`   Memory (RSS): ${(metric.memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`)
        console.log(
          `   Memory (Heap): ${(metric.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`
        )
      }
      console.log('')
    })

    // Performance recommendations
    console.log('📋 Performance Recommendations:')

    const slowOperations = this.metrics.filter(m => m.duration > 5000)
    if (slowOperations.length > 0) {
      console.log('⚠️  Slow operations detected (>5s):')
      slowOperations.forEach(op => {
        console.log(`   - ${op.operation}: ${op.duration.toFixed(2)}ms`)
      })
      console.log('   Consider optimizing these operations or adding caching.')
    }

    const memoryHeavy = this.metrics.filter(
      m => m.memoryUsage && m.memoryUsage.heapUsed > 100 * 1024 * 1024 // 100MB
    )
    if (memoryHeavy.length > 0) {
      console.log('⚠️  High memory usage detected:')
      memoryHeavy.forEach(op => {
        console.log(
          `   - ${op.operation}: ${(op.memoryUsage!.heapUsed / 1024 / 1024).toFixed(2)} MB`
        )
      })
      console.log('   Consider implementing memory optimization strategies.')
    }

    console.log('\n✅ Performance test completed!')
  }

  async runPerformanceTests(): Promise<void> {
    console.log('🚀 Starting Enhanced Kanban Board Performance Tests')
    console.log('=================================================')

    try {
      // Clean up any existing test data
      await this.cleanupTestData()

      // Test with different data sizes
      const testSizes = [100, 500, 1000]

      for (const size of testSizes) {
        console.log(`\n🎯 Testing with ${size} applications`)
        console.log('------------------------------------------------')

        await this.testBoardCreation()
        await this.testApplicationInsertion(size)
        await this.testBoardRendering(size)
        await this.testMemoryUsage()

        // Cleanup before next test
        await this.cleanupTestData()
      }

      this.generateReport()
    } catch (error) {
      console.error('❌ Performance test failed:', error)
      process.exit(1)
    } finally {
      // Final cleanup
      await this.cleanupTestData()
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new PerformanceTester()
  tester.runPerformanceTests().catch(error => {
    console.error('Performance test execution failed:', error)
    process.exit(1)
  })
}

export { PerformanceTester }
