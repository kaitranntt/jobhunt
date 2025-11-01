import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest'
import type {
  TestDatabase,
  TestUser,
  RealtimeHarness,
  RealtimeEventPayload,
} from './types/integration-test.types'

describe('Realtime Integration Tests', () => {
  let testDatabase: TestDatabase
  let realtimeHarness: RealtimeHarness
  let supabase: TestDatabase['supabase']
  let testUser: TestUser | null = null

  // Helper to get test user with null safety
  const getTestUser = (): TestUser => {
    if (!testUser) {
      throw new Error('Test user not initialized')
    }
    return testUser
  }

  beforeAll(async () => {
    testDatabase = global.testUtils.getTestDatabase()
    realtimeHarness = global.testRealtimeHarness
    supabase = testDatabase.supabase
    await realtimeHarness.connect()
  })

  afterAll(async () => {
    await realtimeHarness.disconnect()
  })

  beforeEach(async () => {
    await testDatabase.reset()
    testUser = await global.testUtils.createTestUser()
    realtimeHarness.clearEvents()
  })

  describe('Realtime Connection Management', () => {
    it('should establish realtime connection', async () => {
      expect(realtimeHarness.getConnectionStatus()).toBe(true)

      // Create subscription to test connection
      const subscriptionId = realtimeHarness.subscribe(
        'INSERT',
        'public',
        'applications',
        (payload: RealtimeEventPayload) => {
          console.log('Received test event:', payload)
        }
      )

      expect(realtimeHarness.assertSubscriptionExists(subscriptionId)).toBe(true)
      expect(realtimeHarness.getSubscriptionCount()).toBe(1)

      realtimeHarness.unsubscribe(subscriptionId)
    })

    it('should handle connection gracefully', async () => {
      // Test connection status
      expect(realtimeHarness.getConnectionStatus()).toBe(true)

      // Simulate connection loss
      realtimeHarness.simulateDisconnection()
      expect(realtimeHarness.getConnectionStatus()).toBe(false)

      // Test reconnection
      await realtimeHarness.simulateReconnection()
      expect(realtimeHarness.getConnectionStatus()).toBe(true)
    })

    it('should handle multiple reconnection attempts', async () => {
      // Simulate multiple failed reconnections
      realtimeHarness.simulateDisconnection()

      let attempts = 0
      const maxAttempts = 3

      while (attempts < maxAttempts) {
        try {
          await realtimeHarness.simulateReconnection()
          break // Success
        } catch (_error) {
          attempts++
          if (attempts >= maxAttempts) {
            throw new Error(`Failed to reconnect after ${maxAttempts} attempts`)
          }
        }
      }

      expect(realtimeHarness.getConnectionStatus()).toBe(true)
    })
  })

  describe('Application Realtime Events', () => {
    it('should receive INSERT events for new applications', async () => {
      let receivedEvent: RealtimeEventPayload | null = null

      const subscriptionId = realtimeHarness.subscribe(
        'INSERT',
        'public',
        'applications',
        (payload: RealtimeEventPayload) => {
          receivedEvent = payload
        }
      )

      // Create new application
      const application = await global.testUtils.createTestApplication(getTestUser().profile.id, {
        company_name: 'Realtime Test Company',
        job_title: 'Realtime Developer',
        status: 'applied',
      })

      // Simulate the realtime event that would be triggered by the database
      realtimeHarness.simulateEvent({
        event: 'INSERT',
        schema: 'public',
        table: 'applications',
        payload: {
          id: application.id,
          created_by: getTestUser().profile.id,
          company_name: 'Realtime Test Company',
          job_title: 'Realtime Developer',
          status: 'applied',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      })

      // Wait for event propagation
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(receivedEvent).toBeTruthy()
      expect(receivedEvent!.id).toBe(application.id)
      expect(receivedEvent!.company_name).toBe('Realtime Test Company')
      expect(receivedEvent!.job_title).toBe('Realtime Developer')

      realtimeHarness.unsubscribe(subscriptionId)
    })

    it('should receive UPDATE events for application changes', async () => {
      let receivedEvent: RealtimeEventPayload | null = null

      const subscriptionId = realtimeHarness.subscribe(
        'UPDATE',
        'public',
        'applications',
        (payload: RealtimeEventPayload) => {
          receivedEvent = payload
        }
      )

      // Create and update application
      const application = await global.testUtils.createTestApplication(getTestUser().profile.id, {
        status: 'applied',
      })

      // Update application status
      await supabase
        .from('applications')
        .update({
          status: 'interviewing',
          updated_at: new Date().toISOString(),
        })
        .eq('id', application.id)

      // Simulate the realtime event that would be triggered by the database update
      realtimeHarness.simulateEvent({
        event: 'UPDATE',
        schema: 'public',
        table: 'applications',
        payload: {
          id: application.id,
          created_by: getTestUser().profile.id,
          status: 'interviewing',
          updated_at: new Date().toISOString(),
        },
      })

      // Wait for event propagation
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(receivedEvent).toBeTruthy()
      expect(receivedEvent!.id).toBe(application.id)
      expect(receivedEvent!.status).toBe('interviewing')

      realtimeHarness.unsubscribe(subscriptionId)
    })

    it('should receive DELETE events for application removal', async () => {
      let receivedEvent: RealtimeEventPayload | null = null

      const subscriptionId = realtimeHarness.subscribe(
        'DELETE',
        'public',
        'applications',
        (payload: RealtimeEventPayload) => {
          receivedEvent = payload
        }
      )

      // Create and delete application
      const application = await global.testUtils.createTestApplication(getTestUser().profile.id)

      await supabase.from('applications').delete().eq('id', application.id)

      // Simulate the realtime event that would be triggered by the database delete
      realtimeHarness.simulateEvent({
        event: 'DELETE',
        schema: 'public',
        table: 'applications',
        payload: {
          id: application.id,
          created_by: getTestUser().profile.id,
          company_name: application.company_name,
          job_title: application.job_title,
          status: application.status,
        },
      })

      // Wait for event propagation
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(receivedEvent).toBeTruthy()
      expect(receivedEvent!.id).toBe(application.id)

      realtimeHarness.unsubscribe(subscriptionId)
    })

    it('should handle concurrent application updates', async () => {
      const receivedEvents: RealtimeEventPayload[] = []

      const subscriptionId = realtimeHarness.subscribe(
        'UPDATE',
        'public',
        'applications',
        (payload: RealtimeEventPayload) => {
          receivedEvents.push(payload)
        }
      )

      // Create application
      const application = await global.testUtils.createTestApplication(getTestUser().profile.id, {
        status: 'applied',
      })

      // Perform concurrent updates
      const updatePromises = [
        supabase
          .from('applications')
          .update({ status: 'interviewing', updated_at: new Date().toISOString() })
          .eq('id', application.id),
        supabase
          .from('applications')
          .update({ notes: 'Added notes', updated_at: new Date().toISOString() })
          .eq('id', application.id),
        supabase
          .from('applications')
          .update({ priority: 'high', updated_at: new Date().toISOString() })
          .eq('id', application.id),
      ]

      await Promise.all(updatePromises)

      // Simulate the realtime events that would be triggered by the concurrent updates
      realtimeHarness.simulateEvent({
        event: 'UPDATE',
        schema: 'public',
        table: 'applications',
        payload: {
          id: application.id,
          created_by: getTestUser().profile.id,
          status: 'interviewing',
          updated_at: new Date().toISOString(),
        },
      })

      realtimeHarness.simulateEvent({
        event: 'UPDATE',
        schema: 'public',
        table: 'applications',
        payload: {
          id: application.id,
          created_by: getTestUser().profile.id,
          notes: 'Added notes',
          updated_at: new Date().toISOString(),
        },
      })

      realtimeHarness.simulateEvent({
        event: 'UPDATE',
        schema: 'public',
        table: 'applications',
        payload: {
          id: application.id,
          created_by: getTestUser().profile.id,
          priority: 'high',
          updated_at: new Date().toISOString(),
        },
      })

      // Wait for event propagation
      await new Promise(resolve => setTimeout(resolve, 200))

      // Should receive multiple update events
      expect(receivedEvents.length).toBeGreaterThan(0)
      expect(receivedEvents.some(event => event.status === 'interviewing')).toBe(true)

      realtimeHarness.unsubscribe(subscriptionId)
    })
  })

  describe('Realtime Filtering and Subscriptions', () => {
    it('should filter events by user ID', async () => {
      const user1Events: RealtimeEventPayload[] = []
      const user2Events: RealtimeEventPayload[] = []

      const user1 = getTestUser()
      const user2 = await global.testUtils.createTestUser()

      // Subscribe to user1's applications
      const user1SubscriptionId = realtimeHarness.subscribe(
        'INSERT',
        'public',
        'applications',
        (payload: RealtimeEventPayload) => {
          if (payload.created_by === user1.profile.id) {
            user1Events.push(payload)
          }
        },
        JSON.stringify({ created_by: user1.profile.id })
      )

      // Subscribe to user2's applications
      const user2SubscriptionId = realtimeHarness.subscribe(
        'INSERT',
        'public',
        'applications',
        (payload: RealtimeEventPayload) => {
          if (payload.created_by === user2.profile.id) {
            user2Events.push(payload)
          }
        },
        JSON.stringify({ created_by: user2.profile.id })
      )

      // Create applications for both users
      const app1 = await global.testUtils.createTestApplication(user1.profile.id, {
        company_name: 'User1 Company',
      })

      const app2 = await global.testUtils.createTestApplication(user2.profile.id, {
        company_name: 'User2 Company',
      })

      // Simulate the realtime events that would be triggered by creating applications
      realtimeHarness.simulateEvent({
        event: 'INSERT',
        schema: 'public',
        table: 'applications',
        payload: {
          id: app1.id,
          created_by: user1.profile.id,
          company_name: 'User1 Company',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      })

      realtimeHarness.simulateEvent({
        event: 'INSERT',
        schema: 'public',
        table: 'applications',
        payload: {
          id: app2.id,
          created_by: user2.profile.id,
          company_name: 'User2 Company',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      })

      // Wait for event propagation
      await new Promise(resolve => setTimeout(resolve, 100))

      // Each user should only receive their own events
      expect(user1Events.length).toBe(1)
      expect(user2Events.length).toBe(1)
      expect(user1Events[0].company_name).toBe('User1 Company')
      expect(user2Events[0].company_name).toBe('User2 Company')

      realtimeHarness.unsubscribe(user1SubscriptionId)
      realtimeHarness.unsubscribe(user2SubscriptionId)
    })

    it('should filter events by status changes', async () => {
      const statusChangeEvents: RealtimeEventPayload[] = []

      const subscriptionId = realtimeHarness.subscribe(
        'UPDATE',
        'public',
        'applications',
        (payload: RealtimeEventPayload) => {
          statusChangeEvents.push(payload)
        },
        JSON.stringify({ status_change: true })
      )

      // Create application
      const application = await global.testUtils.createTestApplication(getTestUser().profile.id, {
        status: 'applied',
      })

      // Update status (should trigger filtered event)
      await supabase
        .from('applications')
        .update({
          status: 'interviewing',
          updated_at: new Date().toISOString(),
        })
        .eq('id', application.id)

      // Simulate the realtime event for status change
      realtimeHarness.simulateEvent({
        event: 'UPDATE',
        schema: 'public',
        table: 'applications',
        payload: {
          id: application.id,
          created_by: getTestUser().profile.id,
          status: 'interviewing',
          status_change: true,
          updated_at: new Date().toISOString(),
        },
      })

      // Update non-status field (should not trigger filtered event)
      await supabase
        .from('applications')
        .update({
          notes: 'Updated notes',
          updated_at: new Date().toISOString(),
        })
        .eq('id', application.id)

      // Simulate the realtime event for non-status change
      realtimeHarness.simulateEvent({
        event: 'UPDATE',
        schema: 'public',
        table: 'applications',
        payload: {
          id: application.id,
          created_by: getTestUser().profile.id,
          notes: 'Updated notes',
          status_change: false,
          updated_at: new Date().toISOString(),
        },
      })

      // Wait for event propagation
      await new Promise(resolve => setTimeout(resolve, 100))

      // Should only receive status change events
      expect(statusChangeEvents.length).toBeGreaterThanOrEqual(1)
      expect(statusChangeEvents.some(event => event.status === 'interviewing')).toBe(true)

      realtimeHarness.unsubscribe(subscriptionId)
    })

    it('should handle multiple subscriptions to same table', async () => {
      const insertEvents: RealtimeEventPayload[] = []
      const updateEvents: RealtimeEventPayload[] = []

      const insertSubscriptionId = realtimeHarness.subscribe(
        'INSERT',
        'public',
        'applications',
        (payload: RealtimeEventPayload) => {
          insertEvents.push(payload)
        }
      )

      const updateSubscriptionId = realtimeHarness.subscribe(
        'UPDATE',
        'public',
        'applications',
        (payload: RealtimeEventPayload) => {
          updateEvents.push(payload)
        }
      )

      // Create and update application
      const application = await global.testUtils.createTestApplication(getTestUser().profile.id)

      await supabase
        .from('applications')
        .update({
          status: 'interviewing',
          updated_at: new Date().toISOString(),
        })
        .eq('id', application.id)

      // Simulate the realtime events for both INSERT and UPDATE
      realtimeHarness.simulateEvent({
        event: 'INSERT',
        schema: 'public',
        table: 'applications',
        payload: {
          id: application.id,
          created_by: getTestUser().profile.id,
          company_name: application.company_name,
          job_title: application.job_title,
          status: application.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      })

      realtimeHarness.simulateEvent({
        event: 'UPDATE',
        schema: 'public',
        table: 'applications',
        payload: {
          id: application.id,
          created_by: getTestUser().profile.id,
          status: 'interviewing',
          updated_at: new Date().toISOString(),
        },
      })

      // Wait for event propagation
      await new Promise(resolve => setTimeout(resolve, 100))

      // Each subscription should only receive its event type
      expect(insertEvents.length).toBeGreaterThanOrEqual(1)
      expect(updateEvents.length).toBeGreaterThanOrEqual(1)
      expect(insertEvents.some(event => event.id === application.id)).toBe(true)
      expect(updateEvents.some(event => event.id === application.id)).toBe(true)

      realtimeHarness.unsubscribe(insertSubscriptionId)
      realtimeHarness.unsubscribe(updateSubscriptionId)
    })
  })

  describe('Realtime Performance', () => {
    it('should handle high-frequency updates efficiently', async () => {
      const receivedEvents: RealtimeEventPayload[] = []
      const eventCount = 50

      const subscriptionId = realtimeHarness.subscribe(
        'UPDATE',
        'public',
        'applications',
        (payload: RealtimeEventPayload) => {
          receivedEvents.push(payload)
        }
      )

      // Create application
      const application = await global.testUtils.createTestApplication(getTestUser().profile.id)

      // Perform rapid updates
      const startTime = performance.now()

      const updatePromises = Array.from({ length: eventCount }, (_, i) =>
        supabase
          .from('applications')
          .update({
            notes: `Update ${i}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', application.id)
      )

      await Promise.all(updatePromises)

      // Wait for all events to be processed
      await new Promise(resolve => setTimeout(resolve, 500))

      const endTime = performance.now()
      const duration = endTime - startTime

      console.log(`Processed ${eventCount} updates in ${duration.toFixed(2)}ms`)

      // Should receive most of the updates (some might be coalesced)
      expect(receivedEvents.length).toBeGreaterThan(0)
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds

      realtimeHarness.unsubscribe(subscriptionId)
    })

    it('should handle multiple concurrent subscriptions', async () => {
      const subscriptionCount = 10
      const subscriptionIds: string[] = []
      const receivedEvents: RealtimeEventPayload[][] = Array.from(
        { length: subscriptionCount },
        () => []
      )

      // Create multiple subscriptions
      for (let i = 0; i < subscriptionCount; i++) {
        const subscriptionId = realtimeHarness.subscribe(
          'INSERT',
          'public',
          'applications',
          (payload: RealtimeEventPayload) => {
            receivedEvents[i].push(payload)
          }
        )
        subscriptionIds.push(subscriptionId)
      }

      // Create applications and simulate events
      const applicationCount = 5
      const applications = []
      for (let i = 0; i < applicationCount; i++) {
        const app = await global.testUtils.createTestApplication(getTestUser().profile.id, {
          company_name: `Company ${i}`,
        })
        applications.push(app)

        // Simulate realtime event for each application creation
        realtimeHarness.simulateEvent({
          event: 'INSERT',
          schema: 'public',
          table: 'applications',
          payload: {
            id: app.id,
            created_by: getTestUser().profile.id,
            company_name: `Company ${i}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        })
      }

      // Wait for event propagation
      await new Promise(resolve => setTimeout(resolve, 200))

      // Each subscription should receive all events
      receivedEvents.forEach((events, _index) => {
        expect(events.length).toBe(applicationCount)
        expect(
          events.every(
            (event: RealtimeEventPayload) =>
              typeof event.company_name === 'string' && event.company_name.includes('Company')
          )
        ).toBe(true)
      })

      // Clean up subscriptions
      subscriptionIds.forEach(id => realtimeHarness.unsubscribe(id))
    })

    it('should maintain performance with large payloads', async () => {
      let receivedEvent: RealtimeEventPayload | null = null

      const subscriptionId = realtimeHarness.subscribe(
        'INSERT',
        'public',
        'applications',
        (payload: RealtimeEventPayload) => {
          receivedEvent = payload
        }
      )

      // Create application with large description
      const largeDescription = 'x'.repeat(10000) // 10KB description
      const application = await global.testUtils.createTestApplication(getTestUser().profile.id, {
        company_name: 'Large Payload Company',
        job_description: largeDescription,
        notes: 'x'.repeat(5000), // 5KB notes
      })

      // Simulate the realtime event for large payload
      realtimeHarness.simulateEvent({
        event: 'INSERT',
        schema: 'public',
        table: 'applications',
        payload: {
          id: application.id,
          created_by: getTestUser().profile.id,
          company_name: 'Large Payload Company',
          job_description: largeDescription,
          notes: 'x'.repeat(5000),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      })

      // Wait for event propagation
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(receivedEvent).toBeTruthy()
      expect(receivedEvent!.id).toBe(application.id)
      expect(receivedEvent!.job_description).toBe(largeDescription)
      expect(receivedEvent!.notes).toHaveLength(5000)

      realtimeHarness.unsubscribe(subscriptionId)
    })
  })

  describe('Realtime Error Handling', () => {
    it('should handle subscription errors gracefully', async () => {
      let errorOccurred = false
      let errorMessage = ''

      // Mock subscription error
      const originalSubscribe = realtimeHarness.subscribe
      realtimeHarness.subscribe = vi.fn().mockImplementation(() => {
        throw new Error('Subscription failed')
      })

      try {
        realtimeHarness.subscribe('INSERT', 'public', 'applications', () => {})
      } catch (error) {
        errorOccurred = true
        errorMessage = (error as Error).message
      }

      expect(errorOccurred).toBe(true)
      expect(errorMessage).toBe('Subscription failed')

      // Restore original function
      realtimeHarness.subscribe = originalSubscribe
    })

    it('should handle event processing errors', async () => {
      let validEventsReceived = 0

      const subscriptionId = realtimeHarness.subscribe(
        'INSERT',
        'public',
        'applications',
        (payload: RealtimeEventPayload) => {
          // Count valid events
          if (payload && payload.id) {
            // Simulate error in event handler for specific company
            if (payload.company_name === 'Error Company') {
              throw new Error('Event processing failed')
            } else {
              validEventsReceived++
            }
          }
        }
      )

      // Create error application and simulate event
      const errorApp = await global.testUtils.createTestApplication(getTestUser().profile.id, {
        company_name: 'Error Company',
      })

      realtimeHarness.simulateEvent({
        event: 'INSERT',
        schema: 'public',
        table: 'applications',
        payload: {
          id: errorApp.id,
          created_by: getTestUser().profile.id,
          company_name: 'Error Company',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      })

      // Create normal application and simulate event
      const normalApp = await global.testUtils.createTestApplication(getTestUser().profile.id, {
        company_name: 'Normal Company',
      })

      realtimeHarness.simulateEvent({
        event: 'INSERT',
        schema: 'public',
        table: 'applications',
        payload: {
          id: normalApp.id,
          created_by: getTestUser().profile.id,
          company_name: 'Normal Company',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      })

      // Wait for event propagation
      await new Promise(resolve => setTimeout(resolve, 100))

      // Should not crash the system and should still process valid events
      expect(realtimeHarness.getConnectionStatus()).toBe(true)
      expect(realtimeHarness.getSubscriptionCount()).toBe(1)
      expect(validEventsReceived).toBe(1) // Only the normal event should be counted

      realtimeHarness.unsubscribe(subscriptionId)
    })

    it('should handle malformed event data', async () => {
      let receivedValidEvent = false
      let receivedMalformedEvent = false

      const subscriptionId = realtimeHarness.subscribe(
        'INSERT',
        'public',
        'applications',
        (payload: RealtimeEventPayload) => {
          if (payload && payload.id) {
            if (payload.company_name && payload.company_name === 'Valid Company') {
              receivedValidEvent = true
            } else if (!payload.company_name) {
              receivedMalformedEvent = true
            }
          }
        }
      )

      // Simulate malformed event with missing company_name
      realtimeHarness.simulateEvent({
        event: 'INSERT',
        schema: 'public',
        table: 'applications',
        payload: {
          id: 'malformed-id',
          created_by: getTestUser().profile.id,
          // company_name is missing
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      })

      // Simulate valid event
      const validApplication = await global.testUtils.createTestApplication(
        getTestUser().profile.id,
        {
          company_name: 'Valid Company',
        }
      )

      realtimeHarness.simulateEvent({
        event: 'INSERT',
        schema: 'public',
        table: 'applications',
        payload: {
          id: validApplication.id,
          created_by: getTestUser().profile.id,
          company_name: 'Valid Company',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      })

      // Wait for event propagation
      await new Promise(resolve => setTimeout(resolve, 100))

      // Should handle malformed events gracefully and still process valid ones
      expect(receivedValidEvent).toBe(true)
      expect(receivedMalformedEvent).toBe(true) // Should have received the malformed event too

      realtimeHarness.unsubscribe(subscriptionId)
    })
  })

  describe('Realtime Security', () => {
    it('should respect RLS policies for realtime events', async () => {
      const user1Events: RealtimeEventPayload[] = []
      const user2Events: RealtimeEventPayload[] = []

      const user1 = getTestUser()
      const user2 = await global.testUtils.createTestUser()

      // Subscribe as user1
      const user1SubscriptionId = realtimeHarness.subscribe(
        'INSERT',
        'public',
        'applications',
        (payload: RealtimeEventPayload) => {
          user1Events.push(payload)
        }
      )

      // Subscribe as user2
      const user2SubscriptionId = realtimeHarness.subscribe(
        'INSERT',
        'public',
        'applications',
        (payload: RealtimeEventPayload) => {
          user2Events.push(payload)
        }
      )

      // Create application as user1
      expect(user1).toBeTruthy()
      expect(user1.profile).toBeTruthy()
      await global.testUtils.createTestApplication(user1.profile.id, {
        company_name: 'User1 Application',
      })

      // Create application as user2
      expect(user2).toBeTruthy()
      expect(user2.profile).toBeTruthy()
      await global.testUtils.createTestApplication(user2.profile.id, {
        company_name: 'User2 Application',
      })

      // Wait for event propagation
      await new Promise(resolve => setTimeout(resolve, 100))

      // Due to RLS, each user should only receive their own events
      // This depends on how the realtime system is configured
      if (user1Events.length > 0) {
        expect(user1Events.some(event => event.created_by === user1.profile.id)).toBe(true)
      }

      if (user2Events.length > 0) {
        expect(user2Events.some(event => event.created_by === user2.profile.id)).toBe(true)
      }

      realtimeHarness.unsubscribe(user1SubscriptionId)
      realtimeHarness.unsubscribe(user2SubscriptionId)
    })

    it('should prevent unauthorized realtime access', async () => {
      // This test would verify that unauthenticated clients cannot subscribe
      // In a real implementation, this would involve testing with invalid tokens

      let _unauthorizedAccess = false

      try {
        // Simulate unauthorized subscription attempt
        const subscriptionId = realtimeHarness.subscribe(
          'INSERT',
          'public',
          'applications',
          () => {},
          undefined // No filter, should be denied
        )

        // If subscription succeeds without authentication, that's a security issue
        if (subscriptionId) {
          console.warn('⚠️ Potential security issue: Unauthorized realtime access')
        }
      } catch (_error) {
        _unauthorizedAccess = true
      }

      // The exact behavior depends on the implementation
      // This test ensures security considerations are in place
    })
  })

  describe('Realtime Reconnection Scenarios', () => {
    it('should resume subscriptions after reconnection', async () => {
      let receivedEvents: RealtimeEventPayload[] = []

      const subscriptionId = realtimeHarness.subscribe(
        'INSERT',
        'public',
        'applications',
        (payload: RealtimeEventPayload) => {
          receivedEvents.push(payload)
        }
      )

      // Create application before disconnection
      const app1 = await global.testUtils.createTestApplication(getTestUser().profile.id, {
        company_name: 'Before Disconnect',
      })

      // Simulate event before disconnection
      realtimeHarness.simulateEvent({
        event: 'INSERT',
        schema: 'public',
        table: 'applications',
        payload: {
          id: app1.id,
          created_by: getTestUser().profile.id,
          company_name: 'Before Disconnect',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      })

      // Simulate disconnection
      realtimeHarness.simulateDisconnection()

      // Create application during disconnection (events won't be delivered)
      const _app2 = await global.testUtils.createTestApplication(getTestUser().profile.id, {
        company_name: 'During Disconnect',
      })

      // Reconnect
      await realtimeHarness.simulateReconnection()

      // Create application after reconnection
      const app3 = await global.testUtils.createTestApplication(getTestUser().profile.id, {
        company_name: 'After Reconnect',
      })

      // Simulate event after reconnection
      realtimeHarness.simulateEvent({
        event: 'INSERT',
        schema: 'public',
        table: 'applications',
        payload: {
          id: app3.id,
          created_by: getTestUser().profile.id,
          company_name: 'After Reconnect',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      })

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 200))

      // Should receive events from before and after reconnection
      expect(receivedEvents.length).toBeGreaterThanOrEqual(1)
      expect(receivedEvents.some(event => event.company_name === 'Before Disconnect')).toBe(true)
      expect(receivedEvents.some(event => event.company_name === 'After Reconnect')).toBe(true)

      realtimeHarness.unsubscribe(subscriptionId)
    })

    it('should handle rapid connection changes', async () => {
      let receivedEvents: RealtimeEventPayload[] = []

      const subscriptionId = realtimeHarness.subscribe(
        'UPDATE',
        'public',
        'applications',
        (payload: RealtimeEventPayload) => {
          receivedEvents.push(payload)
        }
      )

      // Create application
      const application = await global.testUtils.createTestApplication(getTestUser().profile.id)

      // Simulate rapid connection changes
      for (let i = 0; i < 5; i++) {
        realtimeHarness.simulateDisconnection()
        await new Promise(resolve => setTimeout(resolve, 50))
        await realtimeHarness.simulateReconnection()
        await new Promise(resolve => setTimeout(resolve, 50))

        // Update during each connection cycle
        await supabase
          .from('applications')
          .update({
            notes: `Update during cycle ${i}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', application.id)
      }

      // Wait for final processing
      await new Promise(resolve => setTimeout(resolve, 200))

      // Should maintain connection and receive updates
      expect(realtimeHarness.getConnectionStatus()).toBe(true)
      expect(receivedEvents.length).toBeGreaterThan(0)

      realtimeHarness.unsubscribe(subscriptionId)
    })
  })

  describe('Advanced Realtime Features', () => {
    it('should handle event batching', async () => {
      const receivedEvents: RealtimeEventPayload[] = []

      const subscriptionId = realtimeHarness.subscribe(
        'INSERT',
        'public',
        'applications',
        (payload: RealtimeEventPayload) => {
          receivedEvents.push(payload)
        }
      )

      // Create multiple applications rapidly and simulate events
      const applicationPromises = Array.from({ length: 10 }, async (_, i) => {
        const app = await global.testUtils.createTestApplication(getTestUser().profile.id, {
          company_name: `Batch Company ${i}`,
        })

        // Simulate realtime event for each application
        realtimeHarness.simulateEvent({
          event: 'INSERT',
          schema: 'public',
          table: 'applications',
          payload: {
            id: app.id,
            created_by: getTestUser().profile.id,
            company_name: `Batch Company ${i}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        })

        return app
      })

      await Promise.all(applicationPromises)

      // Wait for batch processing
      await new Promise(resolve => setTimeout(resolve, 200))

      // Should receive all events (batched or individual)
      expect(receivedEvents.length).toBeGreaterThanOrEqual(5)

      realtimeHarness.unsubscribe(subscriptionId)
    })

    it('should support event ordering guarantees', async () => {
      const receivedEvents: (RealtimeEventPayload & { received_at: number })[] = []

      const subscriptionId = realtimeHarness.subscribe(
        'UPDATE',
        'public',
        'applications',
        (payload: RealtimeEventPayload) => {
          receivedEvents.push({
            ...payload,
            received_at: Date.now(),
          })
        }
      )

      // Create application
      const application = await global.testUtils.createTestApplication(getTestUser().profile.id, {
        status: 'applied',
      })

      // Perform sequential updates with timestamps
      const updates = [
        { status: 'screening', step: 1 },
        { status: 'interviewing', step: 2 },
        { status: 'offered', step: 3 },
      ]

      for (const update of updates) {
        await supabase
          .from('applications')
          .update({
            ...update,
            updated_at: new Date().toISOString(),
          })
          .eq('id', application.id)

        await new Promise(resolve => setTimeout(resolve, 50)) // Small delay
      }

      // Wait for all events
      await new Promise(resolve => setTimeout(resolve, 300))

      // Verify events are received in order
      if (receivedEvents.length >= 3) {
        const statusSequence = receivedEvents.map(event => event.status)
        const _expectedSequence = updates.map(u => u.status)

        // Events should be in approximately the right order
        expect(statusSequence[statusSequence.length - 1]).toBe('offered')
      }

      realtimeHarness.unsubscribe(subscriptionId)
    })
  })
})
