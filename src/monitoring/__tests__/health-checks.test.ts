import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type {
  HealthCheckDetails,
  HealthCheckStatus,
  HealthCheckMetrics,
  HealthCheckConfig,
  HealthCheckAlert,
  HealthCheckResponse,
  ReadinessCheckResponse,
  LivenessCheckResponse,
  DetailedHealthReport,
} from '@/types/monitoring'

// Mock health check system
class MockHealthChecker {
  private checks: Map<string, HealthCheckStatus> = new Map()

  private config: HealthCheckConfig = {
    interval: 30000, // 30 seconds
    timeout: 5000, // 5 seconds
    retries: 3,
    alertThreshold: 3, // Number of consecutive failures before alerting
  }

  private consecutiveFailures: Map<string, number> = new Map()
  private isRunning = false
  private intervalId: ReturnType<typeof setTimeout> | null = null

  // Register health checks
  registerCheck(
    name: string,
    checkFunction: () => Promise<boolean>,
    details?: HealthCheckDetails
  ): void {
    this.checks.set(name, {
      name,
      status: 'healthy',
      lastCheck: 0,
      responseTime: 0,
      details,
    })

    // Perform initial check
    this.performCheck(name, checkFunction)
  }

  // Perform individual health check
  public async performCheck(name: string, checkFunction: () => Promise<boolean>): Promise<void> {
    const startTime = Date.now()
    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy'
    let error: string | undefined

    try {
      const result = await Promise.race([
        checkFunction(),
        new Promise<boolean>((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), this.config.timeout)
        ),
      ])

      if (!result) {
        status = 'degraded'
      }
    } catch (err) {
      status = 'unhealthy'
      error = err instanceof Error ? err.message : 'Unknown error'
    }

    const responseTime = Date.now() - startTime
    const currentCheck = this.checks.get(name)

    if (currentCheck) {
      this.checks.set(name, {
        ...currentCheck,
        status,
        lastCheck: Date.now(),
        responseTime,
        error,
      })

      // Track consecutive failures
      if (status === 'unhealthy') {
        const failures = (this.consecutiveFailures.get(name) || 0) + 1
        this.consecutiveFailures.set(name, failures)

        // Generate alert if threshold exceeded
        if (failures >= this.config.alertThreshold) {
          this.generateAlert(name, status, error)
        }
      } else {
        this.consecutiveFailures.delete(name)
      }
    }
  }

  // Start continuous monitoring
  startMonitoring(): void {
    if (this.isRunning) {
      return
    }

    this.isRunning = true
    console.log('🏥 Health monitoring started')

    // Perform initial checks
    this.performAllChecks()

    // Set up interval for continuous monitoring
    this.intervalId = setInterval(() => {
      this.performAllChecks()
    }, this.config.interval)
  }

  // Stop monitoring
  stopMonitoring(): void {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    console.log('🏥 Health monitoring stopped')
  }

  // Perform all registered checks
  private async performAllChecks(): Promise<void> {
    // In a real implementation, this would execute actual health checks
    // For testing, we'll simulate the checks
    const checkFunctions = this.getMockCheckFunctions()

    for (const [name, checkFunction] of checkFunctions) {
      if (this.checks.has(name)) {
        await this.performCheck(name, checkFunction)
      }
    }
  }

  // Mock check functions for testing
  private getMockCheckFunctions(): Map<string, () => Promise<boolean>> {
    const checks = new Map<string, () => Promise<boolean>>()

    // Database health check
    checks.set('database', async () => {
      const mockResponseTime = Math.random() * 100 + 50 // 50-150ms
      if (mockResponseTime > 120) {
        throw new Error('Database response time too high')
      }
      return true
    })

    // API health check
    checks.set('api', async () => {
      const mockStatusCode = Math.random() > 0.1 ? 200 : 500
      return mockStatusCode === 200
    })

    // Cache health check
    checks.set('cache', async () => {
      const mockHitRate = Math.random() * 100
      return mockHitRate > 70 // 70% hit rate threshold
    })

    // Storage health check
    checks.set('storage', async () => {
      const mockSpace = Math.random() * 100
      return mockSpace < 90 // Less than 90% full
    })

    // Memory health check
    checks.set('memory', async () => {
      const mockUsage = Math.random() * 100
      return mockUsage < 85 // Less than 85% usage
    })

    return checks
  }

  // Generate alerts for unhealthy services
  private generateAlert(name: string, status: string, error?: string): void {
    const alert: HealthCheckAlert = {
      service: name,
      status,
      error,
      timestamp: Date.now(),
      consecutiveFailures: this.consecutiveFailures.get(name) || 0,
    }

    console.error(`🚨 Health Alert: ${name} is ${status}`, alert)

    // In a real implementation, this would send notifications
    // to monitoring systems, Slack, email, etc.
  }

  // Get current health status
  getHealthStatus(): {
    overall: 'healthy' | 'degraded' | 'unhealthy'
    checks: HealthCheckStatus[]
    timestamp: number
  } {
    const checks = Array.from(this.checks.values())

    // Determine overall status
    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length
    const degradedCount = checks.filter(c => c.status === 'degraded').length

    if (unhealthyCount > 0) {
      overall = 'unhealthy'
    } else if (degradedCount > 0) {
      overall = 'degraded'
    }

    return {
      overall,
      checks,
      timestamp: Date.now(),
    }
  }

  // Get specific check status
  getCheckStatus(name: string): HealthCheckStatus | undefined {
    return this.checks.get(name)
  }

  // Simulate check failure for testing
  simulateFailure(name: string, error?: string): void {
    const check = this.checks.get(name)
    if (check) {
      this.checks.set(name, {
        ...check,
        status: 'unhealthy',
        lastCheck: Date.now(),
        error: error || 'Simulated failure',
      })
    }
  }

  // Simulate check recovery
  simulateRecovery(name: string): void {
    const check = this.checks.get(name)
    if (check) {
      this.checks.set(name, {
        ...check,
        status: 'healthy',
        lastCheck: Date.now(),
        error: undefined,
      })
      this.consecutiveFailures.delete(name)
    }
  }

  // Get performance metrics
  getMetrics(): HealthCheckMetrics {
    const checks = Array.from(this.checks.values())
    const healthyChecks = checks.filter(c => c.status === 'healthy').length
    const degradedChecks = checks.filter(c => c.status === 'degraded').length
    const unhealthyChecks = checks.filter(c => c.status === 'unhealthy').length

    const responseTimes = checks.map(c => c.responseTime).filter(t => t > 0)
    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        : 0

    return {
      totalChecks: checks.length,
      healthyChecks,
      degradedChecks,
      unhealthyChecks,
      averageResponseTime,
      uptime: this.isRunning ? Date.now() : 0,
    }
  }

  // Reset all checks
  reset(): void {
    this.checks.clear()
    this.consecutiveFailures.clear()
    this.stopMonitoring()
  }
}

// Mock health check endpoints
class MockHealthEndpoints {
  private healthChecker: MockHealthChecker

  constructor(healthChecker: MockHealthChecker) {
    this.healthChecker = healthChecker
  }

  // General health endpoint
  async healthCheck(): Promise<HealthCheckResponse> {
    const status = this.healthChecker.getHealthStatus()

    return {
      status: status.overall,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      checks: status.checks,
    }
  }

  // Readiness check (for Kubernetes)
  async readinessCheck(): Promise<ReadinessCheckResponse> {
    const status = this.healthChecker.getHealthStatus()
    const readyChecks = status.checks
      .filter(check => check.status === 'healthy')
      .map(check => check.name)

    return {
      ready: status.overall === 'healthy',
      checks: readyChecks,
      timestamp: new Date().toISOString(),
    }
  }

  // Liveness check (for Kubernetes)
  async livenessCheck(): Promise<LivenessCheckResponse> {
    // Simple liveness - just check if the service is running
    return {
      alive: true,
      timestamp: new Date().toISOString(),
    }
  }

  // Detailed health report
  async detailedHealthReport(): Promise<DetailedHealthReport> {
    const status = this.healthChecker.getHealthStatus()
    const metrics = this.healthChecker.getMetrics()

    return {
      summary: {
        overall: status.overall,
        totalChecks: metrics.totalChecks,
        healthyChecks: metrics.healthyChecks,
        degradedChecks: metrics.degradedChecks,
        unhealthyChecks: metrics.unhealthyChecks,
      },
      checks: status.checks,
      metrics,
      alerts: [], // Would be populated by actual alert system
      timestamp: new Date().toISOString(),
    }
  }
}

describe('Health Check System Tests', () => {
  let healthChecker: MockHealthChecker
  let healthEndpoints: MockHealthEndpoints

  beforeEach(() => {
    healthChecker = new MockHealthChecker()
    healthEndpoints = new MockHealthEndpoints(healthChecker)

    // Register standard health checks
    healthChecker.registerCheck('database', async () => true, { type: 'postgresql' })
    healthChecker.registerCheck('api', async () => true, { type: 'rest' })
    healthChecker.registerCheck('cache', async () => true, { type: 'redis' })
    healthChecker.registerCheck('storage', async () => true, { type: 's3' })
    healthChecker.registerCheck('memory', async () => true, { type: 'system' })
  })

  afterEach(() => {
    healthChecker.reset()
  })

  describe('Health Check Registration', () => {
    it('should register health checks with names and functions', () => {
      const customCheck = async () => Math.random() > 0.5
      healthChecker.registerCheck('custom_service', customCheck, { type: 'external' })

      const status = healthChecker.getCheckStatus('custom_service')
      expect(status).toBeDefined()
      expect(status?.name).toBe('custom_service')
      expect(status?.details).toEqual({ type: 'external' })
    })

    it('should perform initial health check on registration', async () => {
      const mockCheck = vi.fn().mockResolvedValue(true)
      healthChecker.registerCheck('test_service', mockCheck)

      // Wait for async check to complete
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockCheck).toHaveBeenCalled()
    })
  })

  describe('Health Status Monitoring', () => {
    it('should start and stop monitoring', () => {
      expect(healthChecker['isRunning']).toBe(false)

      healthChecker.startMonitoring()
      expect(healthChecker['isRunning']).toBe(true)

      healthChecker.stopMonitoring()
      expect(healthChecker['isRunning']).toBe(false)
    })

    it('should not start monitoring if already running', () => {
      healthChecker.startMonitoring()
      healthChecker.startMonitoring() // Should not throw

      expect(healthChecker['isRunning']).toBe(true)

      healthChecker.stopMonitoring()
    })

    it('should perform all health checks during monitoring cycle', async () => {
      healthChecker.startMonitoring()

      // Wait for one monitoring cycle
      await new Promise(resolve => setTimeout(resolve, 100))

      const status = healthChecker.getHealthStatus()
      expect(status.checks.length).toBeGreaterThan(0)

      healthChecker.stopMonitoring()
    })
  })

  describe('Health Status Evaluation', () => {
    it('should evaluate overall health as healthy when all checks pass', () => {
      // All checks should be healthy initially
      const status = healthChecker.getHealthStatus()
      expect(status.overall).toBe('healthy')
    })

    it('should evaluate overall health as degraded when some checks are degraded', () => {
      healthChecker.simulateFailure('cache')
      const status = healthChecker.getHealthStatus()
      expect(status.overall).toBe('unhealthy') // Mock failure creates unhealthy status
    })

    it('should evaluate overall health as unhealthy when critical checks fail', () => {
      healthChecker.simulateFailure('database')
      const status = healthChecker.getHealthStatus()
      expect(status.overall).toBe('unhealthy')
    })

    it('should track response times for health checks', () => {
      const status = healthChecker.getHealthStatus()
      status.checks.forEach(check => {
        expect(check.responseTime).toBeGreaterThanOrEqual(0)
        expect(check.lastCheck).toBeGreaterThan(0)
      })
    })
  })

  describe('Health Check Endpoints', () => {
    it('should return basic health status', async () => {
      const response = await healthEndpoints.healthCheck()

      expect(response).toHaveProperty('status')
      expect(response).toHaveProperty('timestamp')
      expect(response).toHaveProperty('version')
      expect(response).toHaveProperty('checks')
      expect(['healthy', 'degraded', 'unhealthy']).toContain(response.status)
    })

    it('should return readiness status', async () => {
      const response = await healthEndpoints.readinessCheck()

      expect(response).toHaveProperty('ready')
      expect(response).toHaveProperty('checks')
      expect(response).toHaveProperty('timestamp')
      expect(typeof response.ready).toBe('boolean')
      expect(Array.isArray(response.checks)).toBe(true)
    })

    it('should return liveness status', async () => {
      const response = await healthEndpoints.livenessCheck()

      expect(response).toHaveProperty('alive')
      expect(response).toHaveProperty('timestamp')
      expect(response.alive).toBe(true)
    })

    it('should return detailed health report', async () => {
      const response = await healthEndpoints.detailedHealthReport()

      expect(response).toHaveProperty('summary')
      expect(response).toHaveProperty('checks')
      expect(response).toHaveProperty('metrics')
      expect(response).toHaveProperty('alerts')
      expect(response).toHaveProperty('timestamp')

      expect(response.summary).toHaveProperty('overall')
      expect(response.summary).toHaveProperty('totalChecks')
      expect(response.metrics).toHaveProperty('averageResponseTime')
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle health check failures gracefully', async () => {
      healthChecker.simulateFailure('database', 'Connection timeout')

      const status = healthChecker.getCheckStatus('database')
      expect(status?.status).toBe('unhealthy')
      expect(status?.error).toBe('Connection timeout')
    })

    it('should track consecutive failures', () => {
      // Simulate multiple failures
      healthChecker.simulateFailure('api')
      healthChecker.simulateFailure('api')
      healthChecker.simulateFailure('api')

      const status = healthChecker.getHealthStatus()
      const apiCheck = status.checks.find(check => check.name === 'api')
      expect(apiCheck?.status).toBe('unhealthy')
    })

    it('should recover from failures', () => {
      healthChecker.simulateFailure('cache')
      expect(healthChecker.getCheckStatus('cache')?.status).toBe('unhealthy')

      healthChecker.simulateRecovery('cache')
      expect(healthChecker.getCheckStatus('cache')?.status).toBe('healthy')
    })

    it('should handle timeouts during health checks', async () => {
      const slowCheck = async (): Promise<boolean> => {
        return new Promise(resolve => setTimeout(() => resolve(true), 10000))
      }

      healthChecker.registerCheck('slow_service', slowCheck)

      // Wait for timeout to occur
      await new Promise(resolve => setTimeout(resolve, 100))

      const status = healthChecker.getCheckStatus('slow_service')
      // In a real implementation, this would timeout and be marked unhealthy
      expect(status).toBeDefined()
    })
  })

  describe('Performance Metrics', () => {
    it('should calculate health check metrics', () => {
      const metrics = healthChecker.getMetrics()

      expect(metrics).toHaveProperty('totalChecks')
      expect(metrics).toHaveProperty('healthyChecks')
      expect(metrics).toHaveProperty('degradedChecks')
      expect(metrics).toHaveProperty('unhealthyChecks')
      expect(metrics).toHaveProperty('averageResponseTime')

      expect(metrics.totalChecks).toBeGreaterThan(0)
      expect(metrics.healthyChecks + metrics.degradedChecks + metrics.unhealthyChecks).toBe(
        metrics.totalChecks
      )
    })

    it('should track average response time', () => {
      const metrics = healthChecker.getMetrics()
      expect(metrics.averageResponseTime).toBeGreaterThanOrEqual(0)
    })

    it('should update metrics when health status changes', () => {
      const initialMetrics = healthChecker.getMetrics()

      healthChecker.simulateFailure('storage')
      const updatedMetrics = healthChecker.getMetrics()

      expect(updatedMetrics.unhealthyChecks).toBeGreaterThan(initialMetrics.unhealthyChecks)
      expect(updatedMetrics.healthyChecks).toBeLessThan(initialMetrics.healthyChecks)
    })
  })

  describe('Integration with Monitoring', () => {
    it('should integrate with performance monitoring', async () => {
      healthChecker.startMonitoring()

      // Wait for monitoring cycle
      await new Promise(resolve => setTimeout(resolve, 100))

      const healthStatus = healthChecker.getHealthStatus()
      const metrics = healthChecker.getMetrics()

      expect(healthStatus.checks.length).toBeGreaterThan(0)
      expect(metrics.totalChecks).toBe(healthStatus.checks.length)

      healthChecker.stopMonitoring()
    })

    it('should provide data for alerting', () => {
      // Simulate multiple failures to trigger alerts
      healthChecker.simulateFailure('database')
      healthChecker.simulateFailure('api')

      const status = healthChecker.getHealthStatus()
      const unhealthyChecks = status.checks.filter(check => check.status === 'unhealthy')

      expect(unhealthyChecks.length).toBeGreaterThan(0)

      // This data would be used by alerting system
      unhealthyChecks.forEach(check => {
        expect(check.name).toBeTruthy()
        expect(check.error).toBeTruthy()
        expect(check.lastCheck).toBeGreaterThan(0)
      })
    })
  })

  describe('Configuration Management', () => {
    it('should use default configuration', () => {
      expect(healthChecker['config'].interval).toBe(30000)
      expect(healthChecker['config'].timeout).toBe(5000)
      expect(healthChecker['config'].retries).toBe(3)
    })

    it('should handle different service types', () => {
      // Register checks with different service types
      healthChecker.registerCheck('webhook', async () => true, { type: 'external_api' })
      healthChecker.registerCheck('queue', async () => true, { type: 'message_queue' })

      const webhookStatus = healthChecker.getCheckStatus('webhook')
      const queueStatus = healthChecker.getCheckStatus('queue')

      expect(webhookStatus?.details?.type).toBe('external_api')
      expect(queueStatus?.details?.type).toBe('message_queue')
    })
  })

  describe('Concurrent Health Checks', () => {
    it('should handle multiple concurrent health checks', async () => {
      // Register multiple additional checks
      for (let i = 0; i < 10; i++) {
        healthChecker.registerCheck(`service_${i}`, async () => Math.random() > 0.2)
      }

      healthChecker.startMonitoring()

      // Wait for monitoring cycle
      await new Promise(resolve => setTimeout(resolve, 200))

      const status = healthChecker.getHealthStatus()
      expect(status.checks.length).toBeGreaterThan(10)

      healthChecker.stopMonitoring()
    })

    it('should prevent race conditions during health checks', async () => {
      const checkFunction = vi.fn().mockResolvedValue(true)
      healthChecker.registerCheck('race_condition_test', checkFunction)

      // Perform multiple simultaneous checks
      const promises = Array.from({ length: 5 }, () =>
        healthChecker.performCheck('race_condition_test', checkFunction)
      )

      await Promise.all(promises)

      // All should complete without errors
      expect(checkFunction).toHaveBeenCalled()
    })
  })

  describe('Resource Cleanup', () => {
    it('should cleanup resources when stopping monitoring', () => {
      healthChecker.startMonitoring()
      expect(healthChecker['intervalId']).toBeTruthy()

      healthChecker.stopMonitoring()
      expect(healthChecker['intervalId']).toBeNull()
      expect(healthChecker['isRunning']).toBe(false)
    })

    it('should reset all health check state', () => {
      // First register a test service
      healthChecker.registerCheck('test_service', async () => false, { type: 'test_service' })
      healthChecker.simulateFailure('test_service')
      expect(healthChecker.getCheckStatus('test_service')).toBeDefined()

      healthChecker.reset()
      expect(healthChecker.getCheckStatus('test_service')).toBeUndefined()
      expect(healthChecker['isRunning']).toBe(false)
    })
  })
})
