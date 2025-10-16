import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Board,
  BoardInsert,
  BoardUpdate,
  BoardColumn,
  BoardColumnInsert,
  BoardColumnUpdate,
  BoardSettings,
  BoardSettingsInsert,
  BoardSettingsUpdate,
  BoardAnalytics,
  Application,
} from '@/lib/types/database.types'

// Board CRUD operations
export async function getBoards(supabase: SupabaseClient): Promise<Board[]> {
  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .eq('is_archived', false)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch boards: ${error.message}`)

  return data
}

export async function getBoard(supabase: SupabaseClient, id: string): Promise<Board> {
  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .eq('id', id)
    .eq('is_archived', false)
    .single()

  if (error) throw new Error(`Failed to fetch board: ${error.message}`)

  return data
}

export async function getOrCreateDefaultBoard(supabase: SupabaseClient): Promise<Board> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // Call the database function to get or create default board
  const { data, error } = await supabase
    .rpc('get_or_create_default_board', { target_user_id: user.id })
    .single()

  if (error) throw new Error(`Failed to get or create default board: ${error.message}`)

  // Fetch the complete board data
  return getBoard(supabase, data as string)
}

export async function createBoard(supabase: SupabaseClient, board: BoardInsert): Promise<Board> {
  const { data, error } = await supabase.from('boards').insert(board).select().single()

  if (error) throw new Error(`Failed to create board: ${error.message}`)

  return data
}

export async function updateBoard(
  supabase: SupabaseClient,
  id: string,
  updates: BoardUpdate
): Promise<Board> {
  const { data, error } = await supabase
    .from('boards')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Failed to update board: ${error.message}`)

  return data
}

export async function archiveBoard(supabase: SupabaseClient, id: string): Promise<Board> {
  return updateBoard(supabase, id, { is_archived: true })
}

export async function deleteBoard(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('boards').delete().eq('id', id)

  if (error) throw new Error(`Failed to delete board: ${error.message}`)
}

// Board Column CRUD operations
export async function getBoardColumns(
  supabase: SupabaseClient,
  boardId: string
): Promise<BoardColumn[]> {
  const { data, error } = await supabase
    .from('board_columns')
    .select('*')
    .eq('board_id', boardId)
    .eq('is_archived', false)
    .order('position', { ascending: true })

  if (error) throw new Error(`Failed to fetch board columns: ${error.message}`)

  return data
}

export async function getBoardColumn(supabase: SupabaseClient, id: string): Promise<BoardColumn> {
  const { data, error } = await supabase
    .from('board_columns')
    .select('*')
    .eq('id', id)
    .eq('is_archived', false)
    .single()

  if (error) throw new Error(`Failed to fetch board column: ${error.message}`)

  return data
}

export async function createBoardColumn(
  supabase: SupabaseClient,
  column: BoardColumnInsert
): Promise<BoardColumn> {
  const { data, error } = await supabase.from('board_columns').insert(column).select().single()

  if (error) throw new Error(`Failed to create board column: ${error.message}`)

  return data
}

export async function updateBoardColumn(
  supabase: SupabaseClient,
  id: string,
  updates: BoardColumnUpdate
): Promise<BoardColumn> {
  const { data, error } = await supabase
    .from('board_columns')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Failed to update board column: ${error.message}`)

  return data
}

export async function archiveBoardColumn(
  supabase: SupabaseClient,
  id: string
): Promise<BoardColumn> {
  return updateBoardColumn(supabase, id, { is_archived: true })
}

export async function deleteBoardColumn(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('board_columns').delete().eq('id', id)

  if (error) throw new Error(`Failed to delete board column: ${error.message}`)
}

export async function reorderBoardColumns(
  supabase: SupabaseClient,
  boardId: string,
  columnOrders: Array<{ id: string; position: number }>
): Promise<BoardColumn[]> {
  const updates = columnOrders.map(({ id, position }) => ({
    id,
    position,
  }))

  const { data, error } = await supabase
    .from('board_columns')
    .upsert(updates, { onConflict: 'id' })
    .select()

  if (error) throw new Error(`Failed to reorder board columns: ${error.message}`)

  return data
    .filter((column: BoardColumn) => column.board_id === boardId)
    .sort((a: BoardColumn, b: BoardColumn) => a.position - b.position)
}

// WIP Limit validation
export async function validateWIPLimit(
  supabase: SupabaseClient,
  columnId: string,
  currentApplicationsCount: number = 0
): Promise<{ valid: boolean; currentCount: number; limit: number }> {
  const column = await getBoardColumn(supabase, columnId)

  // If WIP limit is 0, it means no limit
  if (column.wip_limit === 0) {
    return { valid: true, currentCount: currentApplicationsCount, limit: 0 }
  }

  // Get current application count for this column
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // Count applications in this column based on status mapping
  const applicationCount = currentApplicationsCount

  return {
    valid: applicationCount < column.wip_limit,
    currentCount: applicationCount,
    limit: column.wip_limit,
  }
}

// Board Settings operations
export async function getBoardSettings(
  supabase: SupabaseClient,
  boardId: string
): Promise<BoardSettings> {
  const { data, error } = await supabase
    .from('board_settings')
    .select('*')
    .eq('board_id', boardId)
    .single()

  if (error) {
    // If no settings exist, create default settings
    if (error.code === 'PGRST116') {
      return createBoardSettings(supabase, {
        board_id: boardId,
        user_id: '',
        theme: 'default',
        compact_mode: false,
        show_empty_columns: true,
        show_column_counts: true,
        enable_animations: true,
        auto_archive_days: 30,
      })
    }
    throw new Error(`Failed to fetch board settings: ${error.message}`)
  }

  return data
}

export async function createBoardSettings(
  supabase: SupabaseClient,
  settings: BoardSettingsInsert
): Promise<BoardSettings> {
  // Get user_id if not provided
  if (!settings.user_id) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')
    settings.user_id = user.id
  }

  const { data, error } = await supabase.from('board_settings').insert(settings).select().single()

  if (error) throw new Error(`Failed to create board settings: ${error.message}`)

  return data
}

export async function updateBoardSettings(
  supabase: SupabaseClient,
  boardId: string,
  updates: BoardSettingsUpdate
): Promise<BoardSettings> {
  const { data, error } = await supabase
    .from('board_settings')
    .update(updates)
    .eq('board_id', boardId)
    .select()
    .single()

  if (error) throw new Error(`Failed to update board settings: ${error.message}`)

  return data
}

// Board Analytics operations
export async function getBoardAnalytics(
  supabase: SupabaseClient,
  boardId: string,
  startDate?: string,
  endDate?: string
): Promise<BoardAnalytics[]> {
  let query = supabase
    .from('board_analytics')
    .select('*')
    .eq('board_id', boardId)
    .order('metric_date', { ascending: true })

  if (startDate) {
    query = query.gte('metric_date', startDate)
  }
  if (endDate) {
    query = query.lte('metric_date', endDate)
  }

  const { data, error } = await query

  if (error) throw new Error(`Failed to fetch board analytics: ${error.message}`)

  return data
}

export async function updateBoardAnalytics(
  supabase: SupabaseClient,
  boardId: string,
  columnId: string,
  applicationCount: number,
  metricDate: string = new Date().toISOString().split('T')[0]
): Promise<BoardAnalytics> {
  const { data, error } = await supabase
    .from('board_analytics')
    .upsert(
      {
        board_id: boardId,
        column_id: columnId,
        metric_date: metricDate,
        application_count: applicationCount,
      },
      {
        onConflict: 'board_id,column_id,metric_date',
      }
    )
    .select()
    .single()

  if (error) throw new Error(`Failed to update board analytics: ${error.message}`)

  return data
}

// Export functionality
export async function exportBoardData(
  supabase: SupabaseClient,
  boardId: string,
  format: 'json' | 'csv'
): Promise<string> {
  // Get board with columns and applications
  const [board, columns, applicationsResponse] = await Promise.all([
    getBoard(supabase, boardId),
    getBoardColumns(supabase, boardId),
    supabase.from('applications').select('*').order('created_at', { ascending: false }),
  ])

  const applications = applicationsResponse.data || []

  const exportData = {
    board,
    columns,
    applications,
    exported_at: new Date().toISOString(),
  }

  if (format === 'json') {
    return JSON.stringify(exportData, null, 2)
  }

  // CSV format
  const csvHeaders = [
    'Company Name',
    'Job Title',
    'Location',
    'Salary Range',
    'Status',
    'Date Applied',
    'Notes',
    'Created At',
    'Updated At',
  ]

  const csvRows = applications.map((app: Application) => [
    app.company_name,
    app.job_title,
    app.location || '',
    app.salary_range || '',
    app.status,
    app.date_applied,
    app.notes || '',
    app.created_at,
    app.updated_at,
  ])

  const csvContent = [
    csvHeaders.join(','),
    ...csvRows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(',')),
  ].join('\n')

  return csvContent
}

// Helper function to map application status to board column
export function mapStatusToColumn(
  status: Application['status'],
  columns: BoardColumn[]
): BoardColumn | null {
  // For backward compatibility, try to find a matching column based on status
  const statusColumnMap: Record<Application['status'], string> = {
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

  const columnName = statusColumnMap[status]
  return columns.find(col => col.name === columnName) || null
}

// Helper function to map board column to application status (for backward compatibility)
export function mapColumnToStatus(columnName: string): Application['status'] | null {
  const columnStatusMap: Record<string, Application['status']> = {
    Wishlist: 'wishlist',
    Applied: 'applied',
    'Phone Screen': 'phone_screen',
    Assessment: 'assessment',
    'Take Home': 'take_home',
    Interviewing: 'interviewing',
    'Final Round': 'final_round',
    Offered: 'offered',
    Accepted: 'accepted',
    Rejected: 'rejected',
    Withdrawn: 'withdrawn',
    Ghosted: 'ghosted',
  }

  return columnStatusMap[columnName] || null
}
