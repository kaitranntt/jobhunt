'use client'

import * as React from 'react'
import { Plus, Search, Rocket, Lightbulb } from 'lucide-react'
import { NavBar } from '@/components/layout/NavBar'
import { AnimatedBackground } from '@/components/layout/AnimatedBackground'
import { EnhancedKanbanBoard } from '@/components/applications/KanbanBoardV3'
import { SmartStatsPanel } from '@/components/applications/SmartStatsPanel'
import ApplicationForm from '@/components/applications/ApplicationForm'
import { ApplicationDetail } from '@/components/applications/ApplicationDetail'
import Timeline from '@/components/timeline/Timeline'
import UpcomingReminders from '@/components/reminders/UpcomingReminders'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Application, Board, BoardColumn, BoardSettings } from '@/lib/types/database.types'
import type { ApplicationFormData, ApplicationStatus } from '@/lib/schemas/application.schema'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import {
  createApplicationAction,
  updateApplicationAction,
  deleteApplicationAction,
  updateApplicationStatusAction,
  getApplicationsAction,
} from './actions'

export default function DashboardPage() {
  const [applications, setApplications] = React.useState<Application[]>([])
  const [filteredApplications, setFilteredApplications] = React.useState<Application[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState('')

  // Modal states
  const [isNewApplicationModalOpen, setIsNewApplicationModalOpen] = React.useState(false)
  const [selectedApplication, setSelectedApplication] = React.useState<Application | null>(null)

  // Operation loading states
  const [isCreating, setIsCreating] = React.useState(false)
  const [createError, setCreateError] = React.useState<string | null>(null)

  // User state for NavBar and Timeline
  const [user, setUser] = React.useState<User | null>(null)
  const [userId, setUserId] = React.useState<string>('')

  // Mock enhanced board data for now
  const [mockBoard, setMockBoard] = React.useState<Board>({
    id: 'default-board',
    user_id: '',
    name: 'Job Applications',
    description: 'Track your job search progress',
    is_default: true,
    is_archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  const [mockColumns, setMockColumns] = React.useState<BoardColumn[]>([
    {
      id: 'wishlist',
      board_id: 'default-board',
      user_id: '',
      name: 'Wishlist',
      color: '#94a3b8',
      position: 1,
      wip_limit: 20,
      is_default: false,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'applied',
      board_id: 'default-board',
      user_id: '',
      name: 'Applied',
      color: '#3b82f6',
      position: 2,
      wip_limit: 25,
      is_default: false,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'phone_screen',
      board_id: 'default-board',
      user_id: '',
      name: 'Phone Screen',
      color: '#8b5cf6',
      position: 3,
      wip_limit: 8,
      is_default: false,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'interviewing',
      board_id: 'default-board',
      user_id: '',
      name: 'Interviewing',
      color: '#10b981',
      position: 4,
      wip_limit: 5,
      is_default: false,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'offered',
      board_id: 'default-board',
      user_id: '',
      name: 'Offered',
      color: '#84cc16',
      position: 5,
      wip_limit: 3,
      is_default: false,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ])

  const [mockSettings, setMockSettings] = React.useState<BoardSettings>({
    id: 'default-settings',
    board_id: 'default-board',
    user_id: '',
    theme: 'default',
    compact_mode: false,
    show_empty_columns: true,
    show_column_counts: true,
    enable_animations: true,
    auto_archive_days: 30,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  // Load user session and applications on mount
  React.useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        setError(null)

        // Get authenticated user session
        const supabase = createClient()
        const {
          data: { user: currentUser },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !currentUser) {
          console.error('Authentication error:', authError)
          setError('Authentication required. Please log in.')
          return
        }

        // Set user information
        setUser(currentUser)
        setUserId(currentUser.id)

        // Update mock board data with user ID
        setMockBoard(prev => ({ ...prev, user_id: currentUser.id }))
        setMockColumns(prev => prev.map(col => ({ ...col, user_id: currentUser.id })))
        setMockSettings(prev => ({ ...prev, user_id: currentUser.id }))

        // Load applications
        const apps = await getApplicationsAction()
        setApplications(apps)
        setFilteredApplications(apps)
      } catch (err) {
        console.error('Failed to load data:', err)
        setError('Failed to load applications. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Filter applications when search query changes
  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredApplications(applications)
      return
    }

    const query = searchQuery.toLowerCase().trim()
    const filtered = applications.filter(
      app =>
        app.company_name.toLowerCase().includes(query) ||
        app.job_title.toLowerCase().includes(query)
    )
    setFilteredApplications(filtered)
  }, [searchQuery, applications])

  // Handle create application
  const handleCreateApplication = async (formData: ApplicationFormData) => {
    setIsCreating(true)
    setCreateError(null)

    try {
      const newApplication = await createApplicationAction(formData)
      setApplications(prev => [newApplication, ...prev])
      setIsNewApplicationModalOpen(false)
    } catch (err) {
      console.error('Failed to create application:', err)
      setCreateError('Failed to create application. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  // Handle update application
  const handleUpdateApplication = async (id: string, formData: ApplicationFormData) => {
    try {
      const updatedApplication = await updateApplicationAction(id, formData)
      setApplications(prev => prev.map(app => (app.id === id ? updatedApplication : app)))
      setSelectedApplication(null)
    } catch (err) {
      console.error('Failed to update application:', err)
      throw err // Re-throw to let ApplicationDetail handle the error
    }
  }

  // Handle delete application
  const handleDeleteApplication = async (id: string) => {
    try {
      await deleteApplicationAction(id)
      setApplications(prev => prev.filter(app => app.id !== id))
      setSelectedApplication(null)
    } catch (err) {
      console.error('Failed to delete application:', err)
      throw err // Re-throw to let ApplicationDetail handle the error
    }
  }

  // Handle update application status (drag-and-drop)
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const updatedApplication = await updateApplicationStatusAction(
        id,
        newStatus as ApplicationStatus
      )
      setApplications(prev => prev.map(app => (app.id === id ? updatedApplication : app)))
    } catch (err) {
      console.error('Failed to update status:', err)
      throw err // Re-throw to let KanbanBoard handle the error
    }
  }

  // Handle application card click
  const handleApplicationClick = (application: Application) => {
    setSelectedApplication(application)
  }

  // Handle close detail modal
  const handleCloseDetail = () => {
    setSelectedApplication(null)
  }

  // Handle open new application modal
  const handleOpenNewModal = () => {
    setCreateError(null)
    setIsNewApplicationModalOpen(true)
  }

  // Handle close new application modal
  const handleCloseNewModal = () => {
    setIsNewApplicationModalOpen(false)
    setCreateError(null)
  }

  if (isLoading) {
    return (
      <AnimatedBackground variant="minimal">
        <div className="min-h-screen">
          <NavBar variant="authenticated" user={user} userId={userId} />
          <main className="mx-auto w-[85%] px-6 py-8">
            <div className="flex items-center justify-center p-8 glass-ultra rounded-glass shadow-glass-subtle">
              <p className="text-label-secondary">Loading applications...</p>
            </div>
          </main>
        </div>
      </AnimatedBackground>
    )
  }

  if (error) {
    return (
      <AnimatedBackground variant="minimal">
        <div className="min-h-screen">
          <NavBar variant="authenticated" user={user} userId={userId} />
          <main className="mx-auto w-[85%] px-6 py-8">
            <div className="flex items-center justify-center p-8 glass-light rounded-glass shadow-glass-soft">
              <div className="text-center">
                <p
                  className="text-label-primary font-medium mb-4"
                  style={{ color: 'var(--color-error)' }}
                >
                  {error}
                </p>
                <Button onClick={() => window.location.reload()} className="mt-4 btn-glass">
                  Retry
                </Button>
              </div>
            </div>
          </main>
        </div>
      </AnimatedBackground>
    )
  }

  return (
    <AnimatedBackground variant="minimal">
      <div className="min-h-screen">
        <NavBar variant="authenticated" user={user} userId={userId} />

        <main className="mx-auto w-[85%] px-6 py-8">
          {applications.length === 0 && !isNewApplicationModalOpen ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
              <div className="max-w-md text-center space-y-6 glass-ultra rounded-glass-lg p-8 shadow-glass-soft">
                <div className="flex justify-center">
                  <Rocket className="h-24 w-24" style={{ color: 'var(--tint-blue)' }} />
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-semibold text-label-primary">
                    Start Your Job Hunt Journey
                  </h2>
                  <p className="text-label-secondary text-lg">
                    Track applications, ace interviews, land your dream job
                  </p>
                </div>

                <Button
                  onClick={handleOpenNewModal}
                  size="lg"
                  className="w-full sm:w-auto btn-glass font-semibold"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Add Your First Application
                </Button>

                <div
                  className="glass-medium rounded-glass-sm p-4 shadow-glass-subtle"
                  style={{ border: '1px solid var(--glass-border-medium)' }}
                >
                  <p className="text-sm text-label-primary flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" style={{ color: 'var(--tint-yellow)' }} />
                    <span>
                      Tip: Start by adding jobs you&apos;re interested in to your wishlist
                    </span>
                  </p>
                </div>
              </div>
            </div>
          ) : applications.length > 0 ? (
            <>
              {/* Top Section - Global Dashboard (Most Important) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2">
                  <SmartStatsPanel applications={filteredApplications} />
                </div>
                {userId && (
                  <div className="lg:col-span-1">
                    <UpcomingReminders userId={userId} />
                  </div>
                )}
              </div>

              {/* Middle Section - Action Bar (Secondary) */}
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-label-tertiary" />
                    <Input
                      type="text"
                      placeholder="Search by company or job title..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-10 glass-light rounded-glass-sm text-label-primary placeholder:text-label-tertiary shadow-glass-subtle"
                      style={{
                        border: '1px solid var(--glass-border-medium)',
                        backdropFilter: 'blur(20px) saturate(180%)',
                      }}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleOpenNewModal}
                  size="lg"
                  className="w-full sm:w-auto btn-glass font-semibold"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Application
                </Button>
              </div>

              {/* Bottom Section - Enhanced Kanban Board (Detailed View) */}
              <EnhancedKanbanBoard
                applications={filteredApplications}
                board={mockBoard}
                columns={mockColumns}
                settings={mockSettings}
                onUpdateApplicationStatus={handleUpdateStatus}
                onApplicationClick={handleApplicationClick}
                onBoardSettingsClick={() => console.log('Board settings not yet implemented')}
                onBoardAnalyticsClick={() => console.log('Analytics not yet implemented')}
                onBoardExport={async (format: 'json' | 'csv') => {
                  console.log(`Export not yet implemented: ${format}`)
                }}
                onColumnAdd={() => console.log('Column add not yet implemented')}
                onColumnEdit={() => console.log('Column edit not yet implemented')}
                onColumnDelete={() => console.log('Column delete not yet implemented')}
                isLoading={false}
              />

              {/* Timeline Section */}
              {userId && (
                <div className="mt-8">
                  <Timeline userId={userId} />
                </div>
              )}
            </>
          ) : null}
        </main>

        {/* New Application Modal */}
        <Dialog open={isNewApplicationModalOpen} onOpenChange={handleCloseNewModal}>
          <DialogContent variant="glass" className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Application</DialogTitle>
              <DialogDescription>
                Fill in the details of your job application below.
              </DialogDescription>
            </DialogHeader>

            {createError && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-800 dark:text-red-200">
                {createError}
              </div>
            )}

            <ApplicationForm onSubmit={handleCreateApplication} isLoading={isCreating} />

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={handleCloseNewModal} disabled={isCreating}>
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Application Detail Sheet */}
        {selectedApplication && (
          <ApplicationDetail
            application={selectedApplication}
            onUpdate={handleUpdateApplication}
            onDelete={handleDeleteApplication}
            onClose={handleCloseDetail}
            isOpen={true}
          />
        )}
      </div>
    </AnimatedBackground>
  )
}
