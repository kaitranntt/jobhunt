export interface RealtimeEvent {
  id: string
  event: string
  schema: string
  table: string
  commit_timestamp: string
  payload: Record<string, unknown>
}

export interface MockRealtimeSubscription {
  id: string
  event: string
  schema: string
  table: string
  filter?: string
  callback: (payload: Record<string, unknown>) => void
  isActive: boolean
}

export class RealtimeTestHarness {
  private subscriptions: Map<string, MockRealtimeSubscription> = new Map()
  private eventQueue: RealtimeEvent[] = []
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  connect(): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        this.isConnected = true
        this.reconnectAttempts = 0
        console.log('🔌 Realtime test harness connected')
        resolve()
      }, 100) // Simulate connection delay
    })
  }

  disconnect(): void {
    this.isConnected = false
    this.subscriptions.clear()
    this.eventQueue.length = 0
    console.log('🔌 Realtime test harness disconnected')
  }

  subscribe(
    event: string,
    schema: string,
    table: string,
    callback: (payload: Record<string, unknown>) => void,
    filter?: string
  ): string {
    if (!this.isConnected) {
      throw new Error('Realtime harness is not connected')
    }

    const subscriptionId = `sub-${Date.now()}-${Math.random()}`
    const subscription: MockRealtimeSubscription = {
      id: subscriptionId,
      event,
      schema,
      table,
      filter,
      callback,
      isActive: true,
    }

    this.subscriptions.set(subscriptionId, subscription)
    console.log(`📡 Subscribed to ${event} on ${schema}.${table} with ID: ${subscriptionId}`)

    return subscriptionId
  }

  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId)
    if (subscription) {
      subscription.isActive = false
      this.subscriptions.delete(subscriptionId)
      console.log(`📡 Unsubscribed from subscription: ${subscriptionId}`)
    }
  }

  // Simulate receiving a realtime event
  simulateEvent(event: Partial<RealtimeEvent>): void {
    if (!this.isConnected) {
      console.warn('Cannot simulate event: realtime harness is not connected')
      return
    }

    const fullEvent: RealtimeEvent = {
      id: `event-${Date.now()}-${Math.random()}`,
      event: event.event || 'INSERT',
      schema: event.schema || 'public',
      table: event.table || 'applications',
      commit_timestamp: event.commit_timestamp || new Date().toISOString(),
      payload: event.payload || {},
      ...event,
    }

    this.eventQueue.push(fullEvent)

    // Notify matching subscriptions
    for (const subscription of Array.from(this.subscriptions.values())) {
      if (subscription.isActive && this.matchesSubscription(fullEvent, subscription)) {
        try {
          // Always provide a valid payload, never null
          const payload = fullEvent.payload || {}
          subscription.callback(payload)
        } catch (error) {
          console.error(`Error in subscription callback for ${subscription.id}:`, error)
          // Don't let one subscription error break others
        }
      }
    }

    console.log(
      `📨 Simulated realtime event: ${fullEvent.event} on ${fullEvent.schema}.${fullEvent.table}`
    )
  }

  private matchesSubscription(
    event: RealtimeEvent,
    subscription: MockRealtimeSubscription
  ): boolean {
    if (event.event !== subscription.event) return false
    if (event.schema !== subscription.schema) return false
    if (event.table !== subscription.table) return false

    if (subscription.filter) {
      // Simple filter matching - in real implementation this would be more sophisticated
      try {
        const filterObj = JSON.parse(subscription.filter)
        return Object.entries(filterObj).every(([key, value]) => {
          return event.payload && event.payload[key] === value
        })
      } catch {
        return true // If filter is invalid, don't filter
      }
    }

    return true
  }

  // Simulate connection issues
  simulateDisconnection(): void {
    this.isConnected = false
    console.log('❌ Simulated connection loss')
  }

  simulateReconnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        reject(new Error('Max reconnection attempts exceeded'))
        return
      }

      this.reconnectAttempts++
      const _delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000) // Exponential backoff

      setTimeout(() => {
        // For testing purposes, always succeed reconnection
        this.isConnected = true
        this.reconnectAttempts = 0
        console.log(`✅ Simulated successful reconnection (attempt ${this.reconnectAttempts})`)
        resolve()
      }, 100) // Short delay for tests
    })
  }

  // Test utilities
  getSubscriptionCount(): number {
    return this.subscriptions.size
  }

  getConnectionStatus(): boolean {
    return this.isConnected
  }

  getActiveSubscriptions(): MockRealtimeSubscription[] {
    return Array.from(this.subscriptions.values()).filter(sub => sub.isActive)
  }

  getEventCount(): number {
    return this.eventQueue.length
  }

  getEvents(): RealtimeEvent[] {
    return [...this.eventQueue]
  }

  clearEvents(): void {
    this.eventQueue.length = 0
  }

  waitForEvent(eventType: string, timeoutMs: number = 5000): Promise<RealtimeEvent> {
    return new Promise((resolve, reject) => {
      const checkExisting = () => {
        const existingEvent = this.eventQueue.find(e => e.event === eventType)
        if (existingEvent) {
          resolve(existingEvent)
          return true
        }
        return false
      }

      if (checkExisting()) return

      const timeout = setTimeout(() => {
        this.unsubscribe(subscriptionId)
        reject(new Error(`Timeout waiting for ${eventType} event`))
      }, timeoutMs)

      const subscriptionId = this.subscribe(eventType, 'public', '*', _payload => {
        clearTimeout(timeout)
        const event = this.eventQueue[this.eventQueue.length - 1]
        resolve(event)
      })
    })
  }

  assertEventReceived(eventType: string, schema: string, table: string): boolean {
    return this.eventQueue.some(
      event => event.event === eventType && event.schema === schema && event.table === table
    )
  }

  assertSubscriptionExists(subscriptionId: string): boolean {
    return this.subscriptions.has(subscriptionId)
  }

  // Simulate database operations that trigger realtime events
  simulateDatabaseInsert(table: string, data: Record<string, unknown>): void {
    this.simulateEvent({
      event: 'INSERT',
      schema: 'public',
      table,
      payload: {
        id: data.id || `gen-${Date.now()}-${Math.random()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...data,
      },
    })
  }

  simulateDatabaseUpdate(table: string, id: string, data: Record<string, unknown>): void {
    this.simulateEvent({
      event: 'UPDATE',
      schema: 'public',
      table,
      payload: {
        id,
        updated_at: new Date().toISOString(),
        ...data,
      },
    })
  }

  simulateDatabaseDelete(table: string, id: string, oldData?: Record<string, unknown>): void {
    this.simulateEvent({
      event: 'DELETE',
      schema: 'public',
      table,
      payload: {
        id,
        ...oldData,
      },
    })
  }
}

// Realtime test factory
export function createRealtimeTestHarness(): RealtimeTestHarness {
  return new RealtimeTestHarness()
}

// Test scenarios
export async function testBasicRealtimeOperations(harness: RealtimeTestHarness): Promise<void> {
  await harness.connect()

  let eventReceived = false
  const subscriptionId = harness.subscribe('INSERT', 'public', 'applications', payload => {
    eventReceived = true
    console.log('Received INSERT event for applications:', payload)
  })

  // Simulate an application insert
  harness.simulateEvent({
    event: 'INSERT',
    schema: 'public',
    table: 'applications',
    payload: {
      id: 'test-app-1',
      company_name: 'Test Company',
      job_title: 'Software Engineer',
      status: 'applied',
    },
  })

  // Wait a bit for event processing
  await new Promise(resolve => setTimeout(resolve, 100))

  if (!eventReceived) {
    throw new Error('Expected to receive INSERT event')
  }

  harness.unsubscribe(subscriptionId)
  harness.disconnect()
}

export async function testRealtimeReconnection(harness: RealtimeTestHarness): Promise<void> {
  await harness.connect()

  let eventsReceived = 0
  const subscriptionId = harness.subscribe('UPDATE', 'public', 'applications', payload => {
    eventsReceived++
    console.log('Received UPDATE event:', payload)
  })

  // Send initial event
  harness.simulateEvent({
    event: 'UPDATE',
    schema: 'public',
    table: 'applications',
    payload: { id: 'test-app-1', status: 'interview' },
  })

  // Simulate disconnection
  harness.simulateDisconnection()

  // Try to send event while disconnected (should be queued)
  harness.simulateEvent({
    event: 'UPDATE',
    schema: 'public',
    table: 'applications',
    payload: { id: 'test-app-1', status: 'offered' },
  })

  // Reconnect
  await harness.simulateReconnection()

  // Wait for reconnection and event processing
  await new Promise(resolve => setTimeout(resolve, 200))

  if (eventsReceived === 0) {
    throw new Error('Expected to receive events after reconnection')
  }

  harness.unsubscribe(subscriptionId)
  harness.disconnect()
}

export async function testRealtimeFilters(harness: RealtimeTestHarness): Promise<void> {
  await harness.connect()

  let highPriorityEvents = 0
  let lowPriorityEvents = 0

  const highPrioritySub = harness.subscribe(
    'INSERT',
    'public',
    'applications',
    _payload => {
      highPriorityEvents++
    },
    JSON.stringify({ priority: 'high' })
  )

  const lowPrioritySub = harness.subscribe(
    'INSERT',
    'public',
    'applications',
    _payload => {
      lowPriorityEvents++
    },
    JSON.stringify({ priority: 'low' })
  )

  // Send high priority event
  harness.simulateEvent({
    event: 'INSERT',
    schema: 'public',
    table: 'applications',
    payload: { id: 'app-1', priority: 'high' },
  })

  // Send low priority event
  harness.simulateEvent({
    event: 'INSERT',
    schema: 'public',
    table: 'applications',
    payload: { id: 'app-2', priority: 'low' },
  })

  await new Promise(resolve => setTimeout(resolve, 100))

  if (highPriorityEvents !== 1) {
    throw new Error(`Expected 1 high priority event, got ${highPriorityEvents}`)
  }

  if (lowPriorityEvents !== 1) {
    throw new Error(`Expected 1 low priority event, got ${lowPriorityEvents}`)
  }

  harness.unsubscribe(highPrioritySub)
  harness.unsubscribe(lowPrioritySub)
  harness.disconnect()
}

export function setupTestRealtime(): RealtimeTestHarness {
  const harness = createRealtimeTestHarness()

  // Mock Supabase realtime client with enhanced methods
  Object.assign(global.testRealtimeHarness || {}, {
    connect: () => harness.connect(),
    disconnect: () => harness.disconnect(),
    subscribe: (
      event: string,
      schema: string,
      table: string,
      callback: (payload: Record<string, unknown>) => void,
      filter?: string
    ) => harness.subscribe(event, schema, table, callback, filter),
    unsubscribe: (subscriptionId: string) => harness.unsubscribe(subscriptionId),
    getConnectionStatus: () => harness.getConnectionStatus(),
    getSubscriptionCount: () => harness.getSubscriptionCount(),
    assertSubscriptionExists: (subscriptionId: string) =>
      harness.assertSubscriptionExists(subscriptionId),
    clearEvents: () => harness.clearEvents(),
    simulateDisconnection: () => harness.simulateDisconnection(),
    simulateReconnection: () => harness.simulateReconnection(),
    simulateEvent: (event: {
      event: string
      schema: string
      table: string
      payload: Record<string, unknown>
    }) => harness.simulateEvent(event),
    simulateDatabaseInsert: (table: string, data: Record<string, unknown>) =>
      harness.simulateDatabaseInsert(table, data),
    simulateDatabaseUpdate: (table: string, id: string, data: Record<string, unknown>) =>
      harness.simulateDatabaseUpdate(table, id, data),
    simulateDatabaseDelete: (table: string, id: string, oldData?: Record<string, unknown>) =>
      harness.simulateDatabaseDelete(table, id, oldData),
  })

  // Add cleanup hook
  if (typeof process !== 'undefined' && process.on) {
    process.on('exit', () => {
      harness.disconnect()
    })
  }

  return harness
}
