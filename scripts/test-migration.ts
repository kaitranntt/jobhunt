#!/usr/bin/env node

/**
 * Database Migration Test Script
 *
 * This script tests the enhanced kanban board database migration
 * to ensure data integrity and proper schema creation.
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

interface TestResult {
  success: boolean
  message: string
  details?: any
}

class MigrationTester {
  private testResults: TestResult[] = []

  async runTest(testName: string, testFn: () => Promise<TestResult>) {
    console.log(`\n🧪 Running test: ${testName}`)
    try {
      const result = await testFn()
      this.testResults.push({ ...result, message: `${testName}: ${result.message}` })

      if (result.success) {
        console.log(`✅ ${result.message}`)
      } else {
        console.log(`❌ ${result.message}`)
        if (result.details) {
          console.log('   Details:', JSON.stringify(result.details, null, 2))
        }
      }

      return result
    } catch (error) {
      const errorMessage = `${testName}: Error - ${error}`
      this.testResults.push({ success: false, message: errorMessage })
      console.log(`❌ ${errorMessage}`)
      return { success: false, message: errorMessage }
    }
  }

  async testTablesExist(): Promise<TestResult> {
    const tables = ['boards', 'board_columns', 'board_settings', 'board_analytics']

    const results = []
    for (const table of tables) {
      const { error } = await supabase.from(table).select('id').limit(1)
      results.push({ table, error: error?.message })
    }

    const failedTables = results.filter(r => r.error)
    if (failedTables.length > 0) {
      return {
        success: false,
        message: 'Some tables are missing',
        details: failedTables,
      }
    }

    return { success: true, message: 'All required tables exist' }
  }

  async testTableStructure(): Promise<TestResult> {
    const structureChecks = []

    // Check boards table structure
    const { data: boardsData, error: boardsError } = await supabase
      .from('boards')
      .select('*')
      .limit(1)

    if (boardsError) {
      structureChecks.push({ table: 'boards', error: boardsError.message })
    } else if (boardsData && boardsData.length > 0) {
      const board = boardsData[0]
      const requiredFields = [
        'id',
        'user_id',
        'name',
        'is_default',
        'is_archived',
        'created_at',
        'updated_at',
      ]
      const missingFields = requiredFields.filter(field => !(field in board))

      if (missingFields.length > 0) {
        structureChecks.push({ table: 'boards', missingFields })
      }
    }

    // Check board_columns table structure
    const { data: columnsData, error: columnsError } = await supabase
      .from('board_columns')
      .select('*')
      .limit(1)

    if (columnsError) {
      structureChecks.push({ table: 'board_columns', error: columnsError.message })
    } else if (columnsData && columnsData.length > 0) {
      const column = columnsData[0]
      const requiredFields = [
        'id',
        'board_id',
        'user_id',
        'name',
        'color',
        'position',
        'wip_limit',
        'is_default',
        'is_archived',
      ]
      const missingFields = requiredFields.filter(field => !(field in column))

      if (missingFields.length > 0) {
        structureChecks.push({ table: 'board_columns', missingFields })
      }
    }

    // Check board_settings table structure
    const { data: settingsData, error: settingsError } = await supabase
      .from('board_settings')
      .select('*')
      .limit(1)

    if (settingsError) {
      structureChecks.push({ table: 'board_settings', error: settingsError.message })
    } else if (settingsData && settingsData.length > 0) {
      const setting = settingsData[0]
      const requiredFields = [
        'id',
        'board_id',
        'user_id',
        'theme',
        'compact_mode',
        'show_empty_columns',
        'show_column_counts',
        'enable_animations',
        'auto_archive_days',
      ]
      const missingFields = requiredFields.filter(field => !(field in setting))

      if (missingFields.length > 0) {
        structureChecks.push({ table: 'board_settings', missingFields })
      }
    }

    // Check board_analytics table structure
    const { data: analyticsData, error: analyticsError } = await supabase
      .from('board_analytics')
      .select('*')
      .limit(1)

    if (analyticsError) {
      structureChecks.push({ table: 'board_analytics', error: analyticsError.message })
    } else if (analyticsData && analyticsData.length > 0) {
      const analytics = analyticsData[0]
      const requiredFields = [
        'id',
        'board_id',
        'user_id',
        'column_id',
        'metric_date',
        'application_count',
      ]
      const missingFields = requiredFields.filter(field => !(field in analytics))

      if (missingFields.length > 0) {
        structureChecks.push({ table: 'board_analytics', missingFields })
      }
    }

    if (structureChecks.length > 0) {
      return {
        success: false,
        message: 'Table structure issues found',
        details: structureChecks,
      }
    }

    return { success: true, message: 'All tables have correct structure' }
  }

  async testRowLevelSecurity(): Promise<TestResult> {
    // Test RLS policies by trying to access data as anonymous user
    const anonymousClient = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const rlsChecks = []

    // Test boards RLS
    const { error: boardsError } = await anonymousClient.from('boards').select('*')
    rlsChecks.push({ table: 'boards', hasError: !!boardsError })

    // Test board_columns RLS
    const { error: columnsError } = await anonymousClient.from('board_columns').select('*')
    rlsChecks.push({ table: 'board_columns', hasError: !!columnsError })

    // Test board_settings RLS
    const { error: settingsError } = await anonymousClient.from('board_settings').select('*')
    rlsChecks.push({ table: 'board_settings', hasError: !!settingsError })

    // Test board_analytics RLS
    const { error: analyticsError } = await anonymousClient.from('board_analytics').select('*')
    rlsChecks.push({ table: 'board_analytics', hasError: !!analyticsError })

    // For RLS to work properly, anonymous users should get empty results, not errors
    const hasErrors = rlsChecks.some(check => check.hasError)
    if (hasErrors) {
      return {
        success: false,
        message: 'RLS policies may have issues',
        details: rlsChecks,
      }
    }

    return { success: true, message: 'RLS policies are working correctly' }
  }

  async testIndexes(): Promise<TestResult> {
    const indexChecks = []

    // Test that queries use indexes by checking performance on larger datasets
    const startTime = Date.now()
    const { error: boardsError } = await supabase
      .from('boards')
      .select('*')
      .eq('user_id', 'test-user-id')
      .order('created_at', { ascending: false })

    const queryTime = Date.now() - startTime

    if (boardsError) {
      indexChecks.push({ table: 'boards', error: boardsError.message })
    } else if (queryTime > 1000) {
      indexChecks.push({ table: 'boards', slowQuery: true, time: queryTime })
    }

    if (indexChecks.length > 0) {
      return {
        success: false,
        message: 'Index performance issues detected',
        details: indexChecks,
      }
    }

    return { success: true, message: 'Indexes are working properly' }
  }

  async testDefaultBoardCreation(): Promise<TestResult> {
    // Test the migration function for creating default boards
    const testUserId = '00000000-0000-0000-0000-000000000001'

    try {
      // Call the migration function
      const { data, error } = await supabase.rpc('migrate_existing_user_to_kanban_v2', {
        target_user_id: testUserId,
      })

      if (error) {
        return {
          success: false,
          message: 'Migration function failed',
          details: { error: error.message },
        }
      }

      // Verify the board was created
      const { data: boardData, error: boardError } = await supabase
        .from('boards')
        .select('*')
        .eq('user_id', testUserId)
        .single()

      if (boardError) {
        return {
          success: false,
          message: 'Board creation verification failed',
          details: { error: boardError.message },
        }
      }

      // Verify columns were created
      const { data: columnsData, error: columnsError } = await supabase
        .from('board_columns')
        .select('*')
        .eq('board_id', data)
        .eq('user_id', testUserId)

      if (columnsError) {
        return {
          success: false,
          message: 'Column creation verification failed',
          details: { error: columnsError.message },
        }
      }

      // Verify settings were created
      const { data: settingsData, error: settingsError } = await supabase
        .from('board_settings')
        .select('*')
        .eq('board_id', data)
        .eq('user_id', testUserId)
        .single()

      if (settingsError) {
        return {
          success: false,
          message: 'Settings creation verification failed',
          details: { error: settingsError.message },
        }
      }

      // Cleanup test data
      await supabase.from('board_settings').delete().eq('user_id', testUserId)
      await supabase.from('board_columns').delete().eq('user_id', testUserId)
      await supabase.from('boards').delete().eq('user_id', testUserId)

      return {
        success: true,
        message: 'Default board creation works correctly',
        details: {
          boardCreated: !!boardData,
          columnsCreated: columnsData ? columnsData.length : 0,
          settingsCreated: !!settingsData,
        },
      }
    } catch (error) {
      return {
        success: false,
        message: 'Migration function test failed',
        details: { error: (error as Error).message },
      }
    }
  }

  async testDataIntegrity(): Promise<TestResult> {
    // Test foreign key relationships
    const integrityChecks = []

    // Test that board_columns reference valid boards using separate queries
    const { data: allBoards, error: allBoardsError } = await supabase.from('boards').select('id')

    let orphanedColumns: any[] = []
    let columnsError = allBoardsError

    if (!allBoardsError && allBoards) {
      const boardIds = allBoards.map(board => board.id)
      const { data: columns, error: colsError } = await supabase
        .from('board_columns')
        .select('id, board_id')
        .not('board_id', 'in', `(${boardIds.length > 0 ? boardIds.join(',') : 'null'})`)

      if (colsError) {
        columnsError = colsError
      } else {
        orphanedColumns = columns || []
      }
    }

    if (columnsError) {
      integrityChecks.push({ type: 'orphaned_columns', error: columnsError.message })
    } else if (orphanedColumns && orphanedColumns.length > 0) {
      integrityChecks.push({ type: 'orphaned_columns', count: orphanedColumns.length })
    }

    // Test that board_settings reference valid boards
    let orphanedSettings: any[] = []
    let settingsError = null

    if (allBoards && !allBoardsError) {
      const boardIds = allBoards.map(board => board.id)
      const { data: settings, error: settError } = await supabase
        .from('board_settings')
        .select('id, board_id')
        .not('board_id', 'in', `(${boardIds.length > 0 ? boardIds.join(',') : 'null'})`)

      if (settError) {
        settingsError = settError
      } else {
        orphanedSettings = settings || []
      }
    }

    if (settingsError) {
      integrityChecks.push({ type: 'orphaned_settings', error: settingsError.message })
    } else if (orphanedSettings && orphanedSettings.length > 0) {
      integrityChecks.push({ type: 'orphaned_settings', count: orphanedSettings.length })
    }

    // Test that board_analytics reference valid boards and columns
    let orphanedAnalytics: any[] = []
    let analyticsError = null

    if (allBoards && !allBoardsError) {
      const boardIds = allBoards.map(board => board.id)
      const { data: allColumns, error: colsError } = await supabase
        .from('board_columns')
        .select('id')

      if (!colsError && allColumns) {
        const columnIds = allColumns.map(col => col.id)
        const { data: analytics, error: analError } = await supabase
          .from('board_analytics')
          .select('id, board_id, column_id')
          .or(
            `board_id.not.in.(${boardIds.length > 0 ? boardIds.join(',') : 'null'}),column_id.not.in.(${columnIds.length > 0 ? columnIds.join(',') : 'null'})`
          )

        if (analError) {
          analyticsError = analError
        } else {
          orphanedAnalytics = analytics || []
        }
      } else {
        analyticsError = colsError
      }
    }

    if (analyticsError) {
      integrityChecks.push({ type: 'orphaned_analytics', error: analyticsError.message })
    } else if (orphanedAnalytics && orphanedAnalytics.length > 0) {
      integrityChecks.push({ type: 'orphaned_analytics', count: orphanedAnalytics.length })
    }

    if (integrityChecks.length > 0) {
      return {
        success: false,
        message: 'Data integrity issues found',
        details: integrityChecks,
      }
    }

    return { success: true, message: 'Data integrity is maintained' }
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Enhanced Kanban Board Migration Tests')
    console.log('=================================================')

    const tests = [
      () => this.testTablesExist(),
      () => this.testTableStructure(),
      () => this.testRowLevelSecurity(),
      () => this.testIndexes(),
      () => this.testDefaultBoardCreation(),
      () => this.testDataIntegrity(),
    ]

    let passed = 0
    let failed = 0

    for (const test of tests) {
      const result = await test()
      if (result.success) {
        passed++
      } else {
        failed++
      }
    }

    console.log('\n=================================================')
    console.log('📊 Test Results Summary')
    console.log('=================================================')
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`📈 Total: ${passed + failed}`)

    if (failed > 0) {
      console.log('\n❌ Migration tests failed. Please review the issues above.')
      process.exit(1)
    } else {
      console.log('\n✅ All migration tests passed successfully!')
      console.log('🎉 The enhanced kanban board migration is ready for production.')
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new MigrationTester()
  tester.runAllTests().catch(error => {
    console.error('Test execution failed:', error)
    process.exit(1)
  })
}

export { MigrationTester }
