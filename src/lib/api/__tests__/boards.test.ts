import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getBoards,
  getBoard,
  createBoard,
  updateBoard,
  archiveBoard,
  deleteBoard,
  getBoardColumns,
  createBoardColumn,
  reorderBoardColumns,
  validateWIPLimit,
  getBoardSettings,
  updateBoardSettings,
  getBoardAnalytics,
  updateBoardAnalytics,
  exportBoardData,
  mapStatusToColumn,
  mapColumnToStatus,
} from '../boards'
import type { Board, BoardColumn, BoardSettings, Application } from '@/lib/types/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

const mockBoards: Board[] = [
  {
    id: 'board-1',
    user_id: 'user-1',
    name: 'Job Applications',
    description: 'Main job application board',
    is_default: true,
    is_archived: false,
    created_at: '2025-10-01T10:00:00Z',
    updated_at: '2025-10-01T10:00:00Z',
  },
]

const mockBoardColumns: BoardColumn[] = [
  {
    id: 'col-1',
    board_id: 'board-1',
    user_id: 'user-1',
    name: 'Applied',
    color: '#3b82f6',
    position: 1,
    wip_limit: 5,
    is_default: true,
    is_archived: false,
    created_at: '2025-10-01T10:00:00Z',
    updated_at: '2025-10-01T10:00:00Z',
  },
  {
    id: 'col-2',
    board_id: 'board-1',
    user_id: 'user-1',
    name: 'Interviewing',
    color: '#10b981',
    position: 2,
    wip_limit: 3,
    is_default: false,
    is_archived: false,
    created_at: '2025-10-01T10:00:00Z',
    updated_at: '2025-10-01T10:00:00Z',
  },
]

const mockBoardSettings: BoardSettings = {
  id: 'settings-1',
  board_id: 'board-1',
  user_id: 'user-1',
  theme: 'default',
  compact_mode: false,
  show_empty_columns: true,
  show_column_counts: true,
  enable_animations: true,
  auto_archive_days: 30,
  created_at: '2025-10-01T10:00:00Z',
  updated_at: '2025-10-01T10:00:00Z',
}

const mockApplications: Application[] = [
  {
    id: 'app-1',
    user_id: 'user-1',
    company_name: 'Tech Corp',
    job_title: 'Software Engineer',
    status: 'applied',
    job_url: 'https://techcorp.com/jobs/123',
    location: 'San Francisco, CA',
    salary_range: '$120k - $180k',
    notes: 'Great company culture',
    date_applied: '2025-10-01',
    created_at: '2025-10-01T10:00:00Z',
    updated_at: '2025-10-01T10:00:00Z',
  },
]

// Create mock Supabase client
const createMockSupabaseClient = () => {
  const mockData = {
    data: mockBoards,
    error: null,
  }

  const mockSingleData = {
    data: mockBoards[0],
    error: null,
  }

  const mockColumnsData = {
    data: mockBoardColumns,
    error: null,
  }

  const mockSettingsData = {
    data: mockBoardSettings,
    error: null,
  }

  const mockAnalyticsData = {
    data: [],
    error: null,
  }

  return {
    from: vi.fn((table: string) => {
      switch (table) {
        case 'boards':
          const boardsQuery = {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockReturnValue(mockSingleData),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockReturnValue(mockSingleData),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockReturnValue(mockSingleData),
                }),
              }),
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({ error: null }),
            }),
          }
          // Override the second order call to return mockData for getBoards
          let orderCallCount = 0
          boardsQuery.order = vi.fn(() => {
            orderCallCount++
            if (orderCallCount === 2) {
              return mockData
            }
            return boardsQuery
          })
          return boardsQuery
        case 'board_columns':
          return {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnValue(mockColumnsData),
            eq: vi.fn((field, value) => {
              if (field === 'id') {
                const column = mockBoardColumns.find(col => col.id === value)
                return {
                  select: vi.fn().mockReturnThis(),
                  eq: vi.fn().mockReturnThis(),
                  single: vi.fn().mockReturnValue({ data: column, error: null }),
                }
              }
              return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnValue(mockColumnsData),
              }
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockReturnValue({ data: mockBoardColumns[0], error: null }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockReturnValue({ data: mockBoardColumns[0], error: null }),
                }),
              }),
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({ error: null }),
            }),
            upsert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue(mockColumnsData),
            }),
          }
        case 'board_settings':
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockReturnValue(mockSettingsData),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockReturnValue(mockSettingsData),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockReturnValue(mockSettingsData),
                }),
              }),
            }),
          }
        case 'board_analytics':
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnValue(mockAnalyticsData),
            upsert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockReturnValue({ data: mockBoardColumns[0], error: null }),
              }),
            }),
          }
        case 'applications':
          return {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnValue({ data: mockApplications, error: null }),
          }
        default:
          return {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnValue({ data: [], error: null }),
          }
      }
    }),
    rpc: vi.fn().mockResolvedValue({ data: 'board-1', error: null }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
    },
  } as unknown as SupabaseClient
}

describe('Board API', () => {
  let mockSupabase: SupabaseClient

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    vi.clearAllMocks()
  })

  describe('getBoards', () => {
    it('should fetch all boards for a user', async () => {
      const result = await getBoards(mockSupabase)

      expect(mockSupabase.from).toHaveBeenCalledWith('boards')
      expect(result).toEqual(mockBoards)
    })

    it('should throw error when fetch fails', async () => {
      const errorClient = createMockSupabaseClient()
      const errorQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      }
      // Override the second order call to return error
      let orderCallCount = 0
      errorQuery.order = vi.fn(() => {
        orderCallCount++
        if (orderCallCount === 2) {
          return { data: null, error: new Error('Fetch failed') }
        }
        return errorQuery
      })
      vi.mocked(errorClient.from).mockReturnValue(errorQuery as any)

      await expect(getBoards(errorClient)).rejects.toThrow('Failed to fetch boards: Fetch failed')
    })
  })

  describe('getBoard', () => {
    it('should fetch a specific board by ID', async () => {
      const result = await getBoard(mockSupabase, 'board-1')

      expect(mockSupabase.from).toHaveBeenCalledWith('boards')
      expect(result).toEqual(mockBoards[0])
    })

    it('should throw error when board not found', async () => {
      const errorClient = createMockSupabaseClient()
      vi.mocked(errorClient.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnValue({ data: null, error: new Error('Board not found') }),
      } as any)

      await expect(getBoard(errorClient, 'invalid-id')).rejects.toThrow(
        'Failed to fetch board: Board not found'
      )
    })
  })

  describe('createBoard', () => {
    it('should create a new board', async () => {
      const newBoard = {
        user_id: 'user-1',
        name: 'Test Board',
        description: 'Test description',
        is_default: false,
        is_archived: false,
      }

      const result = await createBoard(mockSupabase, newBoard)

      expect(mockSupabase.from).toHaveBeenCalledWith('boards')
      expect(result).toEqual(mockBoards[0])
    })
  })

  describe('updateBoard', () => {
    it('should update an existing board', async () => {
      const updates = { name: 'Updated Board Name' }

      const result = await updateBoard(mockSupabase, 'board-1', updates)

      expect(mockSupabase.from).toHaveBeenCalledWith('boards')
      expect(result).toEqual(mockBoards[0])
    })
  })

  describe('archiveBoard', () => {
    it('should archive a board', async () => {
      const result = await archiveBoard(mockSupabase, 'board-1')

      expect(mockSupabase.from).toHaveBeenCalledWith('boards')
      expect(result).toEqual(mockBoards[0])
    })
  })

  describe('deleteBoard', () => {
    it('should delete a board', async () => {
      await expect(deleteBoard(mockSupabase, 'board-1')).resolves.not.toThrow()

      expect(mockSupabase.from).toHaveBeenCalledWith('boards')
    })
  })

  describe('Board Columns', () => {
    describe('getBoardColumns', () => {
      it('should fetch columns for a board', async () => {
        const result = await getBoardColumns(mockSupabase, 'board-1')

        expect(mockSupabase.from).toHaveBeenCalledWith('board_columns')
        expect(result).toEqual(mockBoardColumns)
      })
    })

    describe('createBoardColumn', () => {
      it('should create a new column', async () => {
        const newColumn = {
          board_id: 'board-1',
          user_id: 'user-1',
          name: 'New Column',
          color: '#ef4444',
          position: 3,
          wip_limit: 10,
          is_default: false,
          is_archived: false,
        }

        const result = await createBoardColumn(mockSupabase, newColumn)

        expect(mockSupabase.from).toHaveBeenCalledWith('board_columns')
        expect(result).toEqual(mockBoardColumns[0])
      })
    })

    describe('reorderBoardColumns', () => {
      it('should reorder columns', async () => {
        const columnOrders = [
          { id: 'col-1', position: 2 },
          { id: 'col-2', position: 1 },
        ]

        const result = await reorderBoardColumns(mockSupabase, 'board-1', columnOrders)

        expect(mockSupabase.from).toHaveBeenCalledWith('board_columns')
        expect(result).toEqual(mockBoardColumns)
      })
    })

    describe('validateWIPLimit', () => {
      it('should return valid for no WIP limit', async () => {
        const result = await validateWIPLimit(mockSupabase, 'col-1', 3)

        expect(result).toEqual({
          valid: true,
          currentCount: 3,
          limit: 5,
        })
      })

      it('should return valid when under WIP limit', async () => {
        const result = await validateWIPLimit(mockSupabase, 'col-2', 2)

        expect(result).toEqual({
          valid: true,
          currentCount: 2,
          limit: 3,
        })
      })

      it('should return invalid when over WIP limit', async () => {
        const result = await validateWIPLimit(mockSupabase, 'col-2', 5)

        expect(result).toEqual({
          valid: false,
          currentCount: 5,
          limit: 3,
        })
      })
    })
  })

  describe('Board Settings', () => {
    describe('getBoardSettings', () => {
      it('should fetch board settings', async () => {
        const result = await getBoardSettings(mockSupabase, 'board-1')

        expect(mockSupabase.from).toHaveBeenCalledWith('board_settings')
        expect(result).toEqual(mockBoardSettings)
      })
    })

    describe('updateBoardSettings', () => {
      it('should update board settings', async () => {
        const updates = { theme: 'dark', compact_mode: true }

        const result = await updateBoardSettings(mockSupabase, 'board-1', updates)

        expect(mockSupabase.from).toHaveBeenCalledWith('board_settings')
        expect(result).toEqual(mockBoardSettings)
      })
    })
  })

  describe('Board Analytics', () => {
    describe('getBoardAnalytics', () => {
      it('should fetch board analytics', async () => {
        const result = await getBoardAnalytics(mockSupabase, 'board-1')

        expect(mockSupabase.from).toHaveBeenCalledWith('board_analytics')
        expect(result).toEqual([])
      })
    })

    describe('updateBoardAnalytics', () => {
      it('should update board analytics', async () => {
        const result = await updateBoardAnalytics(mockSupabase, 'board-1', 'col-1', 5)

        expect(mockSupabase.from).toHaveBeenCalledWith('board_analytics')
        expect(result).toEqual(mockBoardColumns[0])
      })
    })
  })

  describe('Export Functionality', () => {
    describe('exportBoardData', () => {
      it('should export board data as JSON', async () => {
        const result = await exportBoardData(mockSupabase, 'board-1', 'json')

        expect(result).toContain('"board"')
        expect(result).toContain('"columns"')
        expect(result).toContain('"applications"')
        expect(result).toContain('"exported_at"')
      })

      it('should export board data as CSV', async () => {
        const result = await exportBoardData(mockSupabase, 'board-1', 'csv')

        expect(result).toContain('Company Name')
        expect(result).toContain('Job Title')
        expect(result).toContain('Status')
        expect(result).toContain('Tech Corp')
        expect(result).toContain('Software Engineer')
      })
    })
  })

  describe('Helper Functions', () => {
    describe('mapStatusToColumn', () => {
      it('should map application status to column', () => {
        const result = mapStatusToColumn('applied', mockBoardColumns)

        expect(result).toEqual(mockBoardColumns[0])
      })

      it('should return null for unmapped status', () => {
        const result = mapStatusToColumn(
          'unknown_status' as Application['status'],
          mockBoardColumns
        )

        expect(result).toBeNull()
      })
    })

    describe('mapColumnToStatus', () => {
      it('should map column name to application status', () => {
        const result = mapColumnToStatus('Applied')

        expect(result).toBe('applied')
      })

      it('should return null for unmapped column name', () => {
        const result = mapColumnToStatus('Unknown Column')

        expect(result).toBeNull()
      })
    })
  })
})
