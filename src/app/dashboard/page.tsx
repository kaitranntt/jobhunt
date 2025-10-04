'use client'

import * as React from 'react'
import { Plus, Search, Rocket, Lightbulb } from 'lucide-react'
import { NavBar } from '@/components/layout/NavBar'
import { KanbanBoardV2 } from '@/components/applications/KanbanBoardV2'
import { SmartStatsPanel } from '@/components/applications/SmartStatsPanel'
import ApplicationForm from '@/components/applications/ApplicationForm'
import { ApplicationDetail } from '@/components/applications/ApplicationDetail'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Application } from '@/lib/types/database.types'
import type { ApplicationFormData } from '@/lib/schemas/application.schema'
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

  // User email for NavBar
  const [userEmail, setUserEmail] = React.useState<string>('')

  // Load applications on mount
  React.useEffect(() => {
    async function loadApplications() {
      try {
        setIsLoading(true)
        setError(null)
        const apps = await getApplicationsAction()
        setApplications(apps)
        setFilteredApplications(apps)

        // Get user email from first application
        if (apps.length > 0) {
          setUserEmail('user@example.com') // In real app, would get from auth
        }
      } catch (err) {
        console.error('Failed to load applications:', err)
        setError('Failed to load applications. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadApplications()
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
      setApplications(prev =>
        prev.map(app => (app.id === id ? updatedApplication : app))
      )
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
  const handleUpdateStatus = async (id: string, newStatus: Application['status']) => {
    try {
      const updatedApplication = await updateApplicationStatusAction(id, newStatus)
      setApplications(prev =>
        prev.map(app => (app.id === id ? updatedApplication : app))
      )
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
      <div className="min-h-screen bg-background">
        <NavBar variant="authenticated" user={{ email: userEmail }} />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center p-8">
            <p className="text-muted-foreground">Loading applications...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar variant="authenticated" user={{ email: userEmail }} />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar variant="authenticated" user={{ email: userEmail }} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {applications.length === 0 && !isNewApplicationModalOpen ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <div className="max-w-md text-center space-y-6">
              <div className="flex justify-center">
                <Rocket className="h-24 w-24 text-primary" />
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-foreground">
                  Start Your Job Hunt Journey
                </h2>
                <p className="text-muted-foreground text-lg">
                  Track applications, ace interviews, land your dream job
                </p>
              </div>

              <Button
                onClick={handleOpenNewModal}
                size="lg"
                className="w-full sm:w-auto"
              >
                <Plus className="mr-2 h-5 w-5" />
                Add Your First Application
              </Button>

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  <span>Tip: Start by adding jobs you&apos;re interested in to your wishlist</span>
                </p>
              </div>
            </div>
          </div>
        ) : applications.length > 0 ? (
          <>
            {/* Top Section - Global Dashboard (Most Important) */}
            <SmartStatsPanel applications={filteredApplications} />

            {/* Middle Section - Action Bar (Secondary) */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by company or job title..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Button onClick={handleOpenNewModal} size="lg" className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                New Application
              </Button>
            </div>

            {/* Bottom Section - Kanban Board (Detailed View) */}
            <KanbanBoardV2
              applications={filteredApplications}
              onUpdateStatus={handleUpdateStatus}
              onApplicationClick={handleApplicationClick}
              isLoading={false}
            />
          </>
        ) : null}
      </main>

      {/* New Application Modal */}
      <Dialog open={isNewApplicationModalOpen} onOpenChange={handleCloseNewModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

          <ApplicationForm
            onSubmit={handleCreateApplication}
            isLoading={isCreating}
          />

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleCloseNewModal}
              disabled={isCreating}
            >
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
  )
}
