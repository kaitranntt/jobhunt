/**
 * Tests for real-time subscription functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { RealtimeManager, getRealtimeManager, resetRealtimeManager } from '../index'
import type { Application } from '@/lib/types/database.types'
import { getBrowserClient } from '@/lib/supabase/singleton'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { MockSupabaseClient, MockSupabaseChannel } from '../types'

// Mock the Supabase client
vi.mock('@/lib/supabase/singleton', () => ({
  getBrowserClient: vi.fn(),
}))

// Mock the error logger
vi.mock('@/lib/errors/handlers', () => ({
  ErrorLogger: {
    log: vi.fn(),
    logWithLevel: vi.fn(),
  },
}))

describe('RealtimeManager', () => {
  let mockSupabase: MockSupabaseClient
  let realtimeManager: RealtimeManager
  let mockChannel: MockSupabaseChannel

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock Supabase channel
    mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    } as MockSupabaseChannel

    // Mock Supabase client
    mockSupabase = {
      channel: vi.fn().mockReturnValue(mockChannel),
      removeChannel: vi.fn().mockResolvedValue(undefined),
    } as MockSupabaseClient

    vi.mocked(getBrowserClient).mockReturnValue(mockSupabase as unknown as SupabaseClient)

    resetRealtimeManager()
    realtimeManager = new RealtimeManager(mockSupabase as unknown as SupabaseClient)
  })

  afterEach(() => {
    resetRealtimeManager()
  })

  describe('subscribeToApplications', () => {
    it('should create a subscription for user applications', () => {
      const userId = 'user-123'
      const handler = vi.fn()

      const unsubscribe = realtimeManager.subscribeToApplications(userId, handler)

      expect(mockSupabase.channel).toHaveBeenCalledWith(
        expect.stringMatching(/^applications_user-123_\d+$/)
      )
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: '*',
          schema: 'public',
          table: 'applications',
          filter: `user_id=eq.${userId}`,
        }),
        expect.any(Function)
      )
      expect(mockChannel.subscribe).toHaveBeenCalled()
      expect(typeof unsubscribe).toBe('function')
    })

    it('should call handler when receiving INSERT event', () => {
      const userId = 'user-123'
      const handler = vi.fn()
      const mockApplication: Application = {
        id: 'app-1',
        user_id: userId,
        company_name: 'Test Company',
        job_title: 'Test Job',
        status: 'wishlist',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Application

      realtimeManager.subscribeToApplications(userId, handler)

      // Get the subscription callback
      const onCall = mockChannel.on.mock.calls[0]
      const subscriptionCallback = onCall[2]

      // Simulate INSERT event
      subscriptionCallback({
        eventType: 'INSERT',
        new: mockApplication,
        old: null,
      })

      expect(handler).toHaveBeenCalledWith({
        eventType: 'INSERT',
        old: null,
        new: mockApplication,
        timestamp: expect.any(String),
      })
    })

    it('should filter events by specified event types', () => {
      const userId = 'user-123'
      const handler = vi.fn()

      realtimeManager.subscribeToApplications(userId, handler, {
        eventTypes: ['INSERT', 'UPDATE'],
      })

      const onCall = mockChannel.on.mock.calls[0]
      const subscriptionCallback = onCall[2]

      // Simulate DELETE event (should be filtered out)
      subscriptionCallback({
        eventType: 'DELETE',
        new: null,
        old: { id: 'app-1' },
      })

      expect(handler).not.toHaveBeenCalled()

      // Simulate INSERT event (should not be filtered out)
      subscriptionCallback({
        eventType: 'INSERT',
        new: { id: 'app-1' },
        old: null,
      })

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should unsubscribe correctly', () => {
      const userId = 'user-123'
      const handler = vi.fn()

      const unsubscribe = realtimeManager.subscribeToApplications(userId, handler)
      unsubscribe()

      expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel)
    })
  })

  describe('subscribeToStatusChanges', () => {
    it('should subscribe to specific status changes', () => {
      const userId = 'user-123'
      const statuses: Application['status'][] = ['wishlist', 'applied']
      const handler = vi.fn()

      realtimeManager.subscribeToStatusChanges(userId, statuses, handler)

      expect(mockSupabase.channel).toHaveBeenCalled()
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          filter: `user_id=eq.${userId},or=(status=eq.wishlist,status=eq.applied)`,
        }),
        expect.any(Function)
      )
    })

    it('should only call handler for specified statuses', () => {
      const userId = 'user-123'
      const statuses: Application['status'][] = ['wishlist', 'applied']
      const handler = vi.fn()

      realtimeManager.subscribeToStatusChanges(userId, statuses, handler)

      const onCall = mockChannel.on.mock.calls[0]
      const subscriptionCallback = onCall[2]

      // Application with different status (should be filtered out)
      subscriptionCallback({
        eventType: 'INSERT',
        new: { id: 'app-1', status: 'interviewing' },
        old: null,
      })

      expect(handler).not.toHaveBeenCalled()

      // Application with matching status (should not be filtered out)
      subscriptionCallback({
        eventType: 'INSERT',
        new: { id: 'app-2', status: 'wishlist' },
        old: null,
      })

      expect(handler).toHaveBeenCalledTimes(1)
    })
  })

  describe('getConnectionStatus', () => {
    it('should return connection status', () => {
      expect(realtimeManager.getConnectionStatus()).toBe(false)

      realtimeManager.subscribeToApplications('user-123', vi.fn())

      // Simulate successful subscription
      const onCall = mockChannel.subscribe.mock.calls[0]
      const subscribeCallback = onCall?.[0]
      subscribeCallback?.('SUBSCRIBED')

      expect(realtimeManager.getConnectionStatus()).toBe(true)
    })
  })

  describe('getActiveSubscriptionsCount', () => {
    it('should return active subscriptions count', () => {
      expect(realtimeManager.getActiveSubscriptionsCount()).toBe(0)

      realtimeManager.subscribeToApplications('user-123', vi.fn())
      expect(realtimeManager.getActiveSubscriptionsCount()).toBe(1)

      realtimeManager.subscribeToApplications('user-456', vi.fn())
      expect(realtimeManager.getActiveSubscriptionsCount()).toBe(2)
    })
  })

  describe('unsubscribeAll', () => {
    it('should unsubscribe from all channels', async () => {
      realtimeManager.subscribeToApplications('user-123', vi.fn())
      realtimeManager.subscribeToApplications('user-456', vi.fn())

      await realtimeManager.unsubscribeAll()

      expect(mockSupabase.removeChannel).toHaveBeenCalledTimes(2)
      expect(realtimeManager.getActiveSubscriptionsCount()).toBe(0)
    })
  })
})

describe('Global realtime manager', () => {
  beforeEach(() => {
    resetRealtimeManager()
    vi.clearAllMocks()
  })

  it('should return singleton instance', () => {
    const manager1 = getRealtimeManager()
    const manager2 = getRealtimeManager()

    expect(manager1).toBe(manager2)
  })

  it('should reset global manager', () => {
    const manager1 = getRealtimeManager()
    resetRealtimeManager()
    const manager2 = getRealtimeManager()

    expect(manager1).not.toBe(manager2)
  })
})
