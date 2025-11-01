/**
 * Real-time subscription service for JobHunt
 *
 * Provides real-time updates for applications using Supabase Realtime
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Application } from '@/lib/types/database.types'
import { getBrowserClient } from '@/lib/supabase/singleton'
import { ErrorLogger } from '@/lib/errors/handlers'

/**
 * Real-time event types
 */
export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE'

/**
 * Real-time event payload
 */
export interface RealtimeEventPayload<T = Application> {
  eventType: RealtimeEvent
  old?: T
  new?: T
  timestamp: string
}

/**
 * Subscription event handler
 */
export type SubscriptionHandler<T = Application> = (payload: RealtimeEventPayload<T>) => void

/**
 * Subscription options
 */
export interface SubscriptionOptions {
  schema?: string
  table?: string
  filter?: string
  eventTypes?: RealtimeEvent[]
}

/**
 * Real-time subscription manager
 */
export class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map()
  private supabase: SupabaseClient
  private isConnected: boolean = false

  constructor(supabase?: SupabaseClient) {
    this.supabase = supabase || getBrowserClient()
  }

  /**
   * Subscribe to application changes for the current user
   */
  subscribeToApplications(
    userId: string,
    handler: SubscriptionHandler<Application>,
    options: SubscriptionOptions = {}
  ): () => void {
    const {
      schema = 'public',
      table = 'applications',
      filter = `user_id=eq.${userId}`,
      eventTypes = ['INSERT', 'UPDATE', 'DELETE'],
    } = options

    const channelName = `applications_${userId}_${Date.now()}`

    try {
      const channel = this.supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema,
            table,
            filter,
          },
          payload => {
            try {
              const eventType = payload.eventType as RealtimeEvent

              // Only process specified event types
              if (!eventTypes.includes(eventType)) {
                return
              }

              const eventPayload: RealtimeEventPayload<Application> = {
                eventType,
                old: payload.old as Application,
                new: payload.new as Application,
                timestamp: new Date().toISOString(),
              }

              handler(eventPayload)
            } catch (error) {
              ErrorLogger.log(error, {
                context: 'realtime_handler',
                channelName,
                eventType: payload.eventType,
              })
            }
          }
        )
        .subscribe(status => {
          if (status === 'SUBSCRIBED') {
            this.isConnected = true
            ErrorLogger.logWithLevel('info', `Successfully subscribed to ${channelName}`)
          } else if (status === 'CHANNEL_ERROR') {
            ErrorLogger.logWithLevel('error', `Failed to subscribe to ${channelName}`)
          }
        })

      this.channels.set(channelName, channel)

      // Return unsubscribe function
      return () => {
        this.unsubscribe(channelName)
      }
    } catch (error) {
      ErrorLogger.log(error, {
        context: 'realtime_subscribe',
        channelName,
        userId,
      })
      throw error
    }
  }

  /**
   * Subscribe to specific application status changes
   */
  subscribeToStatusChanges(
    userId: string,
    statuses: Application['status'][],
    handler: SubscriptionHandler<Application>
  ): () => void {
    const statusFilter = statuses.map(status => `status=eq.${status}`).join(',')

    return this.subscribeToApplications(
      userId,
      payload => {
        // Only handle events for the specified statuses
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const application = payload.new
          if (application && statuses.includes(application.status)) {
            handler(payload)
          }
        } else if (payload.eventType === 'DELETE') {
          const application = payload.old
          if (application && statuses.includes(application.status)) {
            handler(payload)
          }
        }
      },
      {
        filter: `user_id=eq.${userId},or=(${statusFilter})`,
        eventTypes: ['INSERT', 'UPDATE', 'DELETE'],
      }
    )
  }

  /**
   * Subscribe to application count changes
   */
  subscribeToApplicationCount(userId: string, handler: (count: number) => void): () => void {
    let currentCount = 0

    return this.subscribeToApplications(
      userId,
      payload => {
        switch (payload.eventType) {
          case 'INSERT':
            currentCount += 1
            break
          case 'DELETE':
            currentCount -= 1
            break
          // UPDATE doesn't change count
        }

        handler(currentCount)
      },
      {
        eventTypes: ['INSERT', 'DELETE'],
      }
    )
  }

  /**
   * Unsubscribe from a channel
   */
  private async unsubscribe(channelName: string): Promise<void> {
    try {
      const channel = this.channels.get(channelName)
      if (channel) {
        await this.supabase.removeChannel(channel)
        this.channels.delete(channelName)

        if (this.channels.size === 0) {
          this.isConnected = false
        }

        ErrorLogger.logWithLevel('info', `Unsubscribed from ${channelName}`)
      }
    } catch (error) {
      ErrorLogger.log(error, {
        context: 'realtime_unsubscribe',
        channelName,
      })
    }
  }

  /**
   * Unsubscribe from all channels
   */
  async unsubscribeAll(): Promise<void> {
    const channelNames = Array.from(this.channels.keys())

    await Promise.all(channelNames.map(channelName => this.unsubscribe(channelName)))
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected
  }

  /**
   * Get active subscriptions count
   */
  getActiveSubscriptionsCount(): number {
    return this.channels.size
  }

  /**
   * Cleanup method to be called when component unmounts
   */
  cleanup(): void {
    this.unsubscribeAll().catch(error => {
      ErrorLogger.log(error, { context: 'realtime_cleanup' })
    })
  }
}

/**
 * Global realtime manager instance
 */
let globalRealtimeManager: RealtimeManager | null = null

/**
 * Get or create the global realtime manager
 */
export function getRealtimeManager(): RealtimeManager {
  if (!globalRealtimeManager) {
    globalRealtimeManager = new RealtimeManager()
  }
  return globalRealtimeManager
}

/**
 * Reset the global realtime manager (useful for testing)
 */
export function resetRealtimeManager(): void {
  if (globalRealtimeManager) {
    globalRealtimeManager.cleanup()
    globalRealtimeManager = null
  }
}

/**
 * React hook for real-time application subscriptions
 */
export function useRealtimeApplications(
  userId: string | undefined,
  handler: SubscriptionHandler<Application>,
  options?: SubscriptionOptions
): () => void {
  if (!userId) {
    return () => {} // No-op if no user ID
  }

  const realtimeManager = getRealtimeManager()

  // Subscribe and return unsubscribe function
  return realtimeManager.subscribeToApplications(userId, handler, options)
}

/**
 * React hook for real-time status subscriptions
 */
export function useRealtimeStatusChanges(
  userId: string | undefined,
  statuses: Application['status'][],
  handler: SubscriptionHandler<Application>
): () => void {
  if (!userId || statuses.length === 0) {
    return () => {} // No-op if no user ID or no statuses
  }

  const realtimeManager = getRealtimeManager()

  return realtimeManager.subscribeToStatusChanges(userId, statuses, handler)
}
