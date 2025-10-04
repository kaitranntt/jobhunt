import { createClient } from '@/lib/supabase/client'
import type {
  TimelineActivity,
  TimelineFilters,
  TimelineSortOrder,
} from '@/lib/types/timeline.types'
import type { Application } from '@/lib/types/database.types'

/**
 * Fetches all timeline activities for a user with optional filtering and sorting
 * @param userId - The user ID to fetch activities for
 * @param filters - Optional filters for activity type and date range
 * @param sortOrder - Sort order (newest or oldest first), defaults to newest
 * @returns Array of timeline activities sorted by date
 * @throws Error if database query fails
 */
export async function getTimelineActivities(
  userId: string,
  filters: TimelineFilters = {},
  sortOrder: TimelineSortOrder = 'newest'
): Promise<TimelineActivity[]> {
  const supabase = createClient()
  const activities: TimelineActivity[] = []

  const { types = ['application', 'contact', 'document', 'reminder'], dateFrom, dateTo } = filters

  // Fetch applications if included in filters
  if (types.includes('application')) {
    const { data: applications, error: appError } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (appError) throw new Error(`Failed to fetch applications: ${appError.message}`)

    if (applications) {
      applications.forEach((app) => {
        const applicationName = `${app.company_name} - ${app.job_title}`

        // Add created activity
        activities.push({
          id: `app-created-${app.id}`,
          type: 'application',
          action: 'created',
          title: `Applied to ${app.company_name}`,
          description: `New application created for ${app.job_title} position`,
          application_name: applicationName,
          created_at: app.created_at,
          metadata: {
            company_name: app.company_name,
            job_title: app.job_title,
            status: app.status,
          },
        })

        // Add status update activity if updated_at differs from created_at
        if (app.updated_at !== app.created_at) {
          activities.push({
            id: `app-updated-${app.id}`,
            type: 'application',
            action: 'status_changed',
            title: `Status changed to ${formatStatus(app.status)}`,
            description: `Application status updated to ${app.status}`,
            application_name: applicationName,
            created_at: app.updated_at,
            metadata: {
              new_status: app.status,
            },
          })
        }
      })
    }
  }

  // Fetch contacts if included in filters
  if (types.includes('contact')) {
    const { data: contacts, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (contactError) throw new Error(`Failed to fetch contacts: ${contactError.message}`)

    if (contacts) {
      for (const contact of contacts) {
        let applicationName: string | undefined

        // Fetch application name if contact is linked to an application
        if (contact.application_id) {
          const { data: app } = await supabase
            .from('applications')
            .select('company_name, job_title')
            .eq('id', contact.application_id)
            .single()

          if (app) {
            applicationName = `${app.company_name} - ${app.job_title}`
          }
        }

        activities.push({
          id: `contact-${contact.id}`,
          type: 'contact',
          action: 'created',
          title: `New contact: ${contact.name}`,
          description: `Added contact ${contact.name}${contact.role ? ` (${contact.role})` : ''}`,
          application_name: applicationName,
          created_at: contact.created_at,
          metadata: {
            contact_name: contact.name,
            role: contact.role,
          },
        })
      }
    }
  }

  // Fetch documents if included in filters
  if (types.includes('document')) {
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (docError) throw new Error(`Failed to fetch documents: ${docError.message}`)

    if (documents) {
      for (const doc of documents) {
        let applicationName: string | undefined

        // Fetch application name if document is linked to an application
        if (doc.application_id) {
          const { data: app } = await supabase
            .from('applications')
            .select('company_name, job_title')
            .eq('id', doc.application_id)
            .single()

          if (app) {
            applicationName = `${app.company_name} - ${app.job_title}`
          }
        }

        activities.push({
          id: `doc-${doc.id}`,
          type: 'document',
          action: 'uploaded',
          title: `Uploaded ${doc.file_name}`,
          description: `Uploaded document ${doc.file_name}`,
          application_name: applicationName,
          created_at: doc.created_at,
          metadata: {
            file_name: doc.file_name,
            file_size: doc.file_size,
          },
        })
      }
    }
  }

  // Fetch reminders if included in filters
  if (types.includes('reminder')) {
    const { data: reminders, error: reminderError } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (reminderError) throw new Error(`Failed to fetch reminders: ${reminderError.message}`)

    if (reminders) {
      for (const reminder of reminders) {
        let applicationName: string | undefined

        // Fetch application name if reminder is linked to an application
        if (reminder.application_id) {
          const { data: app } = await supabase
            .from('applications')
            .select('company_name, job_title')
            .eq('id', reminder.application_id)
            .single()

          if (app) {
            applicationName = `${app.company_name} - ${app.job_title}`
          }
        }

        // Add created activity
        activities.push({
          id: `reminder-created-${reminder.id}`,
          type: 'reminder',
          action: 'created',
          title: reminder.title,
          description: `Reminder created for ${new Date(reminder.reminder_date).toLocaleDateString()}`,
          application_name: applicationName,
          created_at: reminder.created_at,
          metadata: {
            reminder_date: reminder.reminder_date,
            is_completed: reminder.is_completed,
          },
        })

        // Add completed activity if reminder was completed and updated_at differs
        if (reminder.is_completed && reminder.updated_at !== reminder.created_at) {
          activities.push({
            id: `reminder-completed-${reminder.id}`,
            type: 'reminder',
            action: 'completed',
            title: `Completed: ${reminder.title}`,
            description: 'Reminder marked as completed',
            application_name: applicationName,
            created_at: reminder.updated_at,
            metadata: {
              is_completed: true,
            },
          })
        }
      }
    }
  }

  // Apply date filters
  let filteredActivities = activities
  if (dateFrom) {
    filteredActivities = filteredActivities.filter((a) => a.created_at >= dateFrom)
  }
  if (dateTo) {
    filteredActivities = filteredActivities.filter((a) => a.created_at <= dateTo)
  }

  // Sort activities
  filteredActivities.sort((a, b) => {
    const dateA = new Date(a.created_at).getTime()
    const dateB = new Date(b.created_at).getTime()
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
  })

  return filteredActivities
}

/**
 * Formats application status for display
 */
function formatStatus(status: Application['status']): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
