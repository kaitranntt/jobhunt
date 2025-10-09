'use client'

import * as React from 'react'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Rocket } from 'lucide-react'
import { NavBar } from '@/components/layout/NavBar'
import { PipelineTracker } from '@/components/tracker/PipelineTracker'
import { OverviewTable } from '@/components/dashboard/OverviewTable'
import ApplicationForm from '@/components/applications/ApplicationForm'
import { ApplicationDetail } from '@/components/applications/ApplicationDetail'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Application } from '@/lib/types/database.types'
import type { ApplicationFormData } from '@/lib/schemas/application.schema'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import {
  createApplicationAction,
  updateApplicationAction,
  deleteApplicationAction,
  getApplicationsAction,
} from './actions'

function DashboardContent() {
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'tracker'

  const [applications, setApplications] = React.useState<Application[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Modal states
  const [isNewApplicationModalOpen, setIsNewApplicationModalOpen] = React.useState(false)
  const [selectedApplication, setSelectedApplication] = React.useState<Application | null>(null)

  // Operation loading states
  const [isCreating, setIsCreating] = React.useState(false)
  const [createError, setCreateError] = React.useState<string | null>(null)

  // User state for NavBar
  const [user, setUser] = React.useState<User | null>(null)
  const [userId, setUserId] = React.useState<string>('')

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

        // Load applications
        const apps = await getApplicationsAction()
        setApplications(apps)
      } catch (err) {
        console.error('Failed to load data:', err)
        setError('Failed to load applications. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

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

  // Handle application status update
  const handleStatusUpdate = async (id: string, status: Application['status']) => {
    try {
      const updatedApplication = await updateApplicationAction(id, {
        status,
      } as ApplicationFormData)
      setApplications(prev => prev.map(app => (app.id === id ? updatedApplication : app)))
    } catch (err) {
      console.error('Failed to update status:', err)
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
      <div className="min-h-screen relative" style={{ background: 'var(--gradient-page-bg)' }}>
        <div
          className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full filter blur-80 opacity-40 z-0"
          style={{ backgroundColor: 'var(--shape-color-1)', transform: 'translate(100px, -100px)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full filter blur-80 opacity-40 z-0"
          style={{ backgroundColor: 'var(--shape-color-2)', transform: 'translate(-50px, -50px)' }}
        />

        <div className="relative z-10 min-h-screen">
          <div className="w-[98%] max-w-[98vw] min-h-[700px] mx-auto p-[8px] sm:p-[16px] lg:p-[20px]">
            <NavBar variant="dashboard" user={user} userId={userId} activeTab={currentTab} />
            <main className="flex items-center justify-center h-[600px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p style={{ color: 'var(--macos-label-secondary)' }}>Loading applications...</p>
              </div>
            </main>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen relative" style={{ background: 'var(--gradient-page-bg)' }}>
        <div
          className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full filter blur-80 opacity-40 z-0"
          style={{ backgroundColor: 'var(--shape-color-1)', transform: 'translate(100px, -100px)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full filter blur-80 opacity-40 z-0"
          style={{ backgroundColor: 'var(--shape-color-2)', transform: 'translate(-50px, -50px)' }}
        />

        <div className="relative z-10 min-h-screen">
          <div className="w-[98%] max-w-[98vw] min-h-[700px] mx-auto p-[8px] sm:p-[16px] lg:p-[20px]">
            <NavBar variant="dashboard" user={user} userId={userId} activeTab={currentTab} />
            <main className="flex items-center justify-center h-[600px]">
              <div className="text-center">
                <p className="font-medium mb-4" style={{ color: 'var(--color-error)' }}>
                  {error}
                </p>
                <Button onClick={() => window.location.reload()} className="mt-4">
                  Retry
                </Button>
              </div>
            </main>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--gradient-page-bg)' }}>
      {/* Background Shapes */}
      <div
        className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full filter blur-80 opacity-40 z-0"
        style={{ backgroundColor: 'var(--shape-color-1)', transform: 'translate(100px, -100px)' }}
      />
      <div
        className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full filter blur-80 opacity-40 z-0"
        style={{ backgroundColor: 'var(--shape-color-2)', transform: 'translate(-50px, -50px)' }}
      />

      <div className="relative z-10 min-h-screen">
        <div className="w-[98%] max-w-[98vw] min-h-[700px] mx-auto p-[8px] sm:p-[16px] lg:p-[20px] flex flex-col">
          <NavBar variant="dashboard" user={user} userId={userId} activeTab={currentTab} />

          <main className="flex-grow flex flex-col gap-6 mt-6">
            {applications.length === 0 && !isNewApplicationModalOpen ? (
              <div className="flex items-center justify-center flex-grow">
                <div
                  className="text-center space-y-6 bg-white rounded-xl p-8 shadow-sm max-w-md"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <div className="flex justify-center">
                    <Rocket className="h-24 w-24" style={{ color: 'var(--tint-blue)' }} />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-3xl font-semibold text-label-primary">
                      Start Your Job Hunt Journey
                    </h2>
                    <p className="text-lg text-label-secondary">
                      Track applications, ace interviews, land your dream job
                    </p>
                  </div>

                  <Button
                    onClick={handleOpenNewModal}
                    size="lg"
                    className="font-semibold btn-glass"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Add Your First Application
                  </Button>

                  <div className="text-sm text-label-tertiary">
                    Tip: Start by adding jobs you're interested in to your wishlist
                  </div>
                </div>
              </div>
            ) : applications.length > 0 ? (
              <>
                {/* Tracker Tab */}
                {currentTab === 'tracker' && (
                  <>
                    <PipelineTracker applications={applications} />

                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold text-gray-900">All Applications</h2>
                      <Button onClick={handleOpenNewModal} className="font-semibold">
                        <Plus className="mr-2 h-4 w-4" />
                        New Application
                      </Button>
                    </div>

                    <OverviewTable
                      applications={applications}
                      onApplicationClick={handleApplicationClick}
                      onApplicationUpdate={handleStatusUpdate}
                    />
                  </>
                )}

                {/* Overview Tab */}
                {currentTab === 'overview' && (
                  <>
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold text-gray-900">Application Overview</h2>
                      <Button onClick={handleOpenNewModal} className="font-semibold">
                        <Plus className="mr-2 h-4 w-4" />
                        New Application
                      </Button>
                    </div>

                    <OverviewTable
                      applications={applications}
                      onApplicationClick={handleApplicationClick}
                      onApplicationUpdate={handleStatusUpdate}
                    />
                  </>
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
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: 'var(--gradient-page-bg)' }}
        >
          <div className="text-label-secondary">Loading dashboard...</div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}
