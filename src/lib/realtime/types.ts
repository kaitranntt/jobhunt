/**
 * Realtime Type Definitions
 *
 * Provides proper typing for realtime functionality without using any types
 */

import type { Application } from '@/lib/types/database.types'
import type { MockedFunction } from 'vitest'

/**
 * Realtime event types
 */
export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

/**
 * Realtime subscription payload
 */
export interface RealtimePayload<T = unknown> {
  eventType: RealtimeEventType
  new: T | null
  old: T | null
  timestamp?: string
}

/**
 * Application event payload
 */
export interface ApplicationEventPayload extends RealtimePayload<Application> {
  eventType: RealtimeEventType
  new: Application | null
  old: Application | null
}

/**
 * Subscription options
 */
export interface SubscriptionOptions {
  eventTypes?: RealtimeEventType[]
}

/**
 * Mock Supabase channel interface for testing
 */
export interface MockSupabaseChannel {
  on: MockedFunction<
    (
      event: string,
      filter: Record<string, unknown>,
      callback: (payload: RealtimePayload) => void
    ) => MockSupabaseChannel
  >
  subscribe: MockedFunction<(callback?: (status: string) => void) => MockSupabaseChannel>
}

/**
 * Mock Supabase client interface for testing
 */
export interface MockSupabaseClient {
  channel: MockedFunction<(name: string) => MockSupabaseChannel>
  removeChannel: MockedFunction<(channel: MockSupabaseChannel) => Promise<void>>
}

/**
 * Realtime subscription callback
 */
export type SubscriptionCallback = (payload: ApplicationEventPayload) => void

/**
 * Application status filter
 */
export type ApplicationStatusFilter = Application['status'][]

/**
 * Realtime manager state
 */
export interface RealtimeManagerState {
  connectionStatus: boolean
  activeSubscriptions: number
}
