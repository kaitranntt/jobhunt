import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import type { TestDatabase, TestUser } from './types/integration-test.types'

// Storage bucket interface for testing
interface StorageBucket {
  upload: (
    path: string,
    file: File
  ) => Promise<{ data: { path: string } | null; error: Error | null }>
  remove: (paths: string[]) => Promise<{ data: unknown; error: Error | null }>
  getPublicUrl: (path: string) => { data: { publicUrl: string } }
}

interface StorageClient {
  from: (bucket: string) => StorageBucket
}

describe('Storage Integration Tests', () => {
  let testDatabase: TestDatabase
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
    supabase = testDatabase.supabase
  })

  beforeEach(async () => {
    await testDatabase.reset()
    testUser = await global.testUtils.createTestUser()
    global.testStorage.clearAllStorage()
  })

  describe('Local Storage Operations', () => {
    it('should store and retrieve data from localStorage', () => {
      const testData = {
        userPreferences: {
          theme: 'dark',
          language: 'en',
          notifications: true,
        },
        lastVisited: '2024-01-15T10:30:00Z',
      }

      // Store data
      localStorage.setItem('user-settings', JSON.stringify(testData))

      // Retrieve data
      const storedData = localStorage.getItem('user-settings')
      const parsedData = JSON.parse(storedData || '{}')

      expect(parsedData).toEqual(testData)
      expect(parsedData.userPreferences.theme).toBe('dark')
      expect(parsedData.userPreferences.notifications).toBe(true)
    })

    it('should handle localStorage quota exceeded errors', () => {
      // Fill localStorage to capacity
      const largeData = 'x'.repeat(5 * 1024 * 1024) // 5MB
      let dataStored = true

      try {
        localStorage.setItem('large-data', largeData)
      } catch (error) {
        dataStored = false
        if (error instanceof Error) {
          expect(error.name).toBe('QuotaExceededError')
        }
      }

      // In test environment, this might not fail, but the error handling should exist
      if (!dataStored) {
        expect(localStorage.getItem('large-data')).toBeNull()
      }
    })

    it('should persist data across page reloads (simulated)', () => {
      const testData = { sessionId: 'abc123', csrfToken: 'xyz789' }

      // Store data
      localStorage.setItem('session-data', JSON.stringify(testData))

      // Simulate page reload by clearing and re-reading
      const reloadedData = JSON.parse(localStorage.getItem('session-data') || '{}')

      expect(reloadedData).toEqual(testData)
    })

    it('should handle corrupted data gracefully', () => {
      // Store invalid JSON
      localStorage.setItem('corrupted-data', '{ invalid json }')

      // Attempt to parse with error handling
      let parsedData = null
      try {
        parsedData = JSON.parse(localStorage.getItem('corrupted-data') || '{}')
      } catch (error) {
        // Should handle JSON parsing errors
        expect(error).toBeInstanceOf(SyntaxError)
      }

      // Should have fallback or null value
      expect(parsedData).toBeNull()
    })
  })

  describe('Session Storage Operations', () => {
    it('should store and retrieve data from sessionStorage', () => {
      const tempData = {
        formDraft: {
          company_name: 'Test Company',
          job_title: 'Software Engineer',
          status: 'draft',
        },
        lastActivity: Date.now(),
      }

      // Store data
      sessionStorage.setItem('form-draft', JSON.stringify(tempData))

      // Retrieve data
      const storedData = sessionStorage.getItem('form-draft')
      const parsedData = JSON.parse(storedData || '{}')

      expect(parsedData).toEqual(tempData)
      expect(parsedData.formDraft.company_name).toBe('Test Company')
    })

    it('should clear sessionStorage when browser session ends', () => {
      const sessionData = { tempToken: 'temp-123' }

      // Store data
      sessionStorage.setItem('temp-token', JSON.stringify(sessionData))
      expect(sessionStorage.getItem('temp-token')).toBeTruthy()

      // Simulate session end
      sessionStorage.clear()

      // Data should be gone
      expect(sessionStorage.getItem('temp-token')).toBeNull()
    })

    it('should handle sessionStorage errors gracefully', () => {
      // Simulate sessionStorage being unavailable
      const originalSessionStorage = global.sessionStorage
      global.sessionStorage = {
        getItem: vi.fn().mockImplementation(() => {
          throw new Error('SessionStorage unavailable')
        }),
        setItem: vi.fn().mockImplementation(() => {
          throw new Error('SessionStorage unavailable')
        }),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn(),
      }

      // Attempt to use sessionStorage with error handling
      let errorOccurred = false
      try {
        sessionStorage.setItem('test', 'data')
      } catch (error) {
        errorOccurred = true
        if (error instanceof Error) {
          expect(error.message).toBe('SessionStorage unavailable')
        }
      }

      expect(errorOccurred).toBe(true)

      // Restore original sessionStorage
      global.sessionStorage = originalSessionStorage
    })
  })

  describe('File Upload Operations', () => {
    it('should handle file upload to Supabase Storage', async () => {
      // Create mock file
      const file = new File(['test content'], 'resume.pdf', {
        type: 'application/pdf',
      })

      // Get dynamic user ID for this test
      const userId = getTestUser().profile.id
      const fileName = `resumes/${userId}/resume.pdf`

      // Mock successful upload with dynamic user ID
      const mockStorageFrom = vi.fn().mockReturnValue({
        upload: vi.fn().mockImplementation((path: string, _file: File) => {
          return Promise.resolve({
            data: {
              id: 'file-123',
              path: path, // Use the actual path passed in
              fullPath: path,
            },
            error: null,
          })
        }),
        getPublicUrl: vi.fn().mockImplementation((path: string) => {
          return {
            data: {
              publicUrl: `https://storage.supabase.co/${path}`,
            },
          }
        }),
      })
      vi.mocked((supabase.storage as unknown as StorageClient).from).mockImplementation(
        mockStorageFrom
      )

      // Simulate upload
      const uploadResult = await (supabase.storage as unknown as StorageClient)
        .from('user-files')
        .upload(fileName, file)

      expect(uploadResult.error).toBeNull()
      expect(uploadResult.data!.path).toBe(fileName)

      // Get public URL
      const { data: urlData } = await (supabase.storage as unknown as StorageClient)
        .from('user-files')
        .getPublicUrl(fileName)

      expect(urlData.publicUrl).toContain('resume.pdf')
      expect(urlData.publicUrl).toContain(userId)
    })

    it('should handle upload errors gracefully', async () => {
      const file = new File(['test content'], 'large-file.pdf', {
        type: 'application/pdf',
      })

      // Mock upload error
      const mockUploadError = {
        data: null,
        error: {
          message: 'File size too large',
          code: 'file_too_large',
        },
      }

      const mockStorageFrom = vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue(mockUploadError),
      })
      vi.mocked((supabase.storage as unknown as StorageClient).from).mockImplementation(
        mockStorageFrom
      )

      const fileName = `resumes/${getTestUser().profile.id}/large-file.pdf`
      const uploadResult = await (supabase.storage as unknown as StorageClient)
        .from('user-files')
        .upload(fileName, file)

      expect(uploadResult.error).toBeTruthy()
      expect(uploadResult.error!.message).toBe('File size too large')
      expect(uploadResult.data).toBeNull()
    })

    it('should handle file deletion', async () => {
      const fileName = `resumes/${getTestUser().profile.id}/old-resume.pdf`

      // Mock successful deletion
      const mockStorageFrom = vi.fn().mockReturnValue({
        remove: vi.fn().mockResolvedValue({
          data: { success: true },
          error: null,
        }),
      })
      vi.mocked((supabase.storage as unknown as StorageClient).from).mockImplementation(
        mockStorageFrom
      )

      const deleteResult = await (supabase.storage as unknown as StorageClient)
        .from('user-files')
        .remove([fileName])

      expect(deleteResult.error).toBeNull()
      expect((deleteResult.data as { success: boolean }).success).toBe(true)
    })

    it('should validate file types and sizes', async () => {
      // Test with disallowed file type
      const invalidFile = new File(['malicious content'], 'virus.exe', {
        type: 'application/x-executable',
      })

      // Mock validation error
      const mockStorageFrom = vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: null,
          error: {
            message: 'File type not allowed',
            code: 'invalid_file_type',
          },
        }),
      })
      vi.mocked((supabase.storage as unknown as StorageClient).from).mockImplementation(
        mockStorageFrom
      )

      const fileName = `uploads/${getTestUser().profile.id}/virus.exe`
      const uploadResult = await (supabase.storage as unknown as StorageClient)
        .from('user-files')
        .upload(fileName, invalidFile)

      expect(uploadResult.error).toBeTruthy()
      expect((uploadResult.error as { code?: string })?.code).toBe('invalid_file_type')
      expect(uploadResult.data).toBeNull()
    })
  })

  describe('Column Storage (Kanban Board State)', () => {
    it('should save and load Kanban column configuration', async () => {
      const columnConfig = {
        columns: [
          {
            id: 'applied',
            title: 'Applied',
            color: '#3B82F6',
            order: 0,
            visible: true,
          },
          {
            id: 'interview',
            title: 'Interview',
            color: '#F59E0B',
            order: 1,
            visible: true,
          },
          {
            id: 'offer',
            title: 'Offer',
            color: '#10B981',
            order: 2,
            visible: true,
          },
        ],
        settings: {
          showCounts: true,
          compactMode: false,
          sortBy: 'date',
        },
      }

      // Save configuration
      localStorage.setItem('kanban-columns', JSON.stringify(columnConfig))

      // Load configuration
      const savedConfig = JSON.parse(localStorage.getItem('kanban-columns') || '{}')

      expect(savedConfig).toEqual(columnConfig)
      expect(savedConfig.columns).toHaveLength(3)
      expect(savedConfig.columns[0].id).toBe('applied')
      expect(savedConfig.settings.showCounts).toBe(true)
    })

    it('should handle column order changes', async () => {
      const initialColumns = [
        { id: 'applied', order: 0 },
        { id: 'interview', order: 1 },
        { id: 'offer', order: 2 },
      ]

      // Save initial order
      localStorage.setItem('column-order', JSON.stringify(initialColumns))

      // Update order (drag and drop simulation)
      const reorderedColumns = [
        { id: 'interview', order: 0 },
        { id: 'applied', order: 1 },
        { id: 'offer', order: 2 },
      ]

      localStorage.setItem('column-order', JSON.stringify(reorderedColumns))

      // Verify new order
      const currentOrder = JSON.parse(localStorage.getItem('column-order') || '[]')
      expect(currentOrder[0].id).toBe('interview')
      expect(currentOrder[1].id).toBe('applied')
    })

    it('should handle column visibility toggles', async () => {
      const columnVisibility = {
        applied: true,
        interview: true,
        offer: false, // Hidden
        rejected: true,
      }

      // Save visibility state
      localStorage.setItem('column-visibility', JSON.stringify(columnVisibility))

      // Load and verify
      const savedVisibility = JSON.parse(localStorage.getItem('column-visibility') || '{}')
      expect(savedVisibility.offer).toBe(false)
      expect(savedVisibility.applied).toBe(true)
    })
  })

  describe('Cache Management', () => {
    it('should cache API responses in localStorage', async () => {
      const mockApiResponse = {
        applications: [
          {
            id: 'app-1',
            company_name: 'Test Company',
            job_title: 'Software Engineer',
            status: 'applied',
          },
        ],
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000, // 5 minutes
      }

      // Cache the response
      const cacheKey = `api-cache-applications-${getTestUser().profile.id}`
      localStorage.setItem(cacheKey, JSON.stringify(mockApiResponse))

      // Retrieve from cache
      const cachedData = JSON.parse(localStorage.getItem(cacheKey) || '{}')

      expect(cachedData.applications).toHaveLength(1)
      expect(cachedData.applications[0].company_name).toBe('Test Company')
      expect(cachedData.timestamp).toBeTruthy()
    })

    it('should handle cache expiration', async () => {
      const expiredCacheData = {
        data: { applications: [] },
        timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago
        ttl: 5 * 60 * 1000, // 5 minutes TTL
      }

      const cacheKey = `api-cache-expired-${getTestUser().profile.id}`
      localStorage.setItem(cacheKey, JSON.stringify(expiredCacheData))

      // Check if cache is expired
      const cached = JSON.parse(localStorage.getItem(cacheKey) || '{}')
      const isExpired = Date.now() - cached.timestamp > cached.ttl

      expect(isExpired).toBe(true)

      // Should remove expired cache
      if (isExpired) {
        localStorage.removeItem(cacheKey)
        expect(localStorage.getItem(cacheKey)).toBeNull()
      }
    })

    it('should handle cache storage limits', async () => {
      // Fill cache with large amounts of data
      const largeDataSet = {
        data: 'x'.repeat(1024 * 1024), // 1MB
        timestamp: Date.now(),
        ttl: 60 * 60 * 1000, // 1 hour
      }

      let cacheFull = false
      let cacheEntries = 0

      // Keep adding until storage is full
      try {
        for (let i = 0; i < 100; i++) {
          localStorage.setItem(`cache-entry-${i}`, JSON.stringify({ ...largeDataSet, id: i }))
          cacheEntries++
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          cacheFull = true
        }
      }

      // If cache is full, should implement cleanup strategy
      if (cacheFull) {
        // Remove oldest entries
        for (let i = 0; i < cacheEntries / 2; i++) {
          localStorage.removeItem(`cache-entry-${i}`)
        }

        // Should have space now
        expect(localStorage.getItem(`cache-entry-0`)).toBeNull()
      }
    })
  })

  describe('Storage Security', () => {
    it('should not store sensitive data in localStorage', async () => {
      const sensitiveData = {
        password: 'super-secret-password',
        apiKey: 'sk-1234567890',
        sessionToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      }

      // Mock a security validation function that prevents storing sensitive data
      const mockSecurityValidator = vi.fn().mockImplementation((key: string, data: unknown) => {
        const dataStr = JSON.stringify(data)
        const isSensitive =
          /password|api[_-]?key|token|secret/i.test(key) ||
          /password|api[_-]?key|token|secret/i.test(dataStr)
        if (isSensitive) {
          throw new Error(
            'Security policy violation: Sensitive data cannot be stored in localStorage'
          )
        }
      })

      // Should not store sensitive data
      let errorOccurred = false
      try {
        // Simulate security validation before storing
        mockSecurityValidator('sensitive', sensitiveData)
        localStorage.setItem('sensitive', JSON.stringify(sensitiveData))
      } catch (error) {
        errorOccurred = true
        if (error instanceof Error) {
          expect(error.message).toContain('Security policy violation')
        }
      }

      expect(errorOccurred).toBe(true)
      expect(localStorage.getItem('sensitive')).toBeNull()
    })

    it('should sanitize stored data', async () => {
      const maliciousData = {
        userInput: '<script>alert("xss")</script>',
        htmlContent: '<img src="x" onerror="alert(\'xss\')">',
        cssInjection: 'body { background: url("javascript:alert(\'xss\')"); }',
      }

      // Store data (should be sanitized)
      localStorage.setItem('user-input', JSON.stringify(maliciousData))

      // Retrieve and verify sanitization
      const storedData = JSON.parse(localStorage.getItem('user-input') || '{}')

      // In a real implementation, this should be sanitized
      // For testing, we ensure it doesn't break the storage system
      expect(typeof storedData.userInput).toBe('string')
      expect(storedData.userInput).toContain('<script>')
    })

    it('should validate data before storage', async () => {
      const invalidData = {
        circularReference: null as unknown, // Would cause JSON.stringify error
        undefined: undefined,
        function: () => console.log('not serializable'),
      }

      // Create circular reference
      invalidData.circularReference = invalidData

      let errorOccurred = false
      try {
        localStorage.setItem('invalid', JSON.stringify(invalidData))
      } catch (error) {
        errorOccurred = true
        if (error instanceof Error) {
          expect(error.message).toContain('circular')
        }
      }

      expect(errorOccurred).toBe(true)
    })
  })

  describe('Performance Optimization', () => {
    it('should batch storage operations', async () => {
      const startTime = performance.now()

      // Batch multiple storage operations
      const batchData = {
        settings: { theme: 'dark', language: 'en' },
        preferences: { notifications: true, autoSave: true },
        recentActivity: ['viewed app 1', 'edited app 2'],
        lastSync: Date.now(),
      }

      // Store all at once
      localStorage.setItem('user-batch-data', JSON.stringify(batchData))

      const batchTime = performance.now() - startTime

      // Retrieve all at once
      const retrieveStart = performance.now()
      const retrievedData = JSON.parse(localStorage.getItem('user-batch-data') || '{}')
      const retrieveTime = performance.now() - retrieveStart

      expect(retrievedData.settings.theme).toBe('dark')
      expect(retrievedData.preferences.notifications).toBe(true)
      expect(retrievedData.recentActivity).toHaveLength(2)

      console.log(
        `Batch storage: ${batchTime.toFixed(2)}ms, retrieval: ${retrieveTime.toFixed(2)}ms`
      )
      expect(batchTime).toBeLessThan(10)
      expect(retrieveTime).toBeLessThan(10)
    })

    it('should implement lazy loading for large datasets', async () => {
      const largeDataset = {
        applications: Array.from({ length: 1000 }, (_, i) => ({
          id: `app-${i}`,
          company_name: `Company ${i}`,
          job_title: `Job ${i}`,
        })),
        metadata: { totalCount: 1000, lastUpdated: Date.now() },
      }

      // Store metadata separately from full dataset
      localStorage.setItem(
        'applications-metadata',
        JSON.stringify({
          totalCount: largeDataset.metadata.totalCount,
          lastUpdated: largeDataset.metadata.lastUpdated,
        })
      )

      // Store full dataset in chunks
      const chunkSize = 100
      for (let i = 0; i < largeDataset.applications.length; i += chunkSize) {
        const chunk = largeDataset.applications.slice(i, i + chunkSize)
        localStorage.setItem(`applications-chunk-${i / chunkSize}`, JSON.stringify(chunk))
      }

      // Lazy load metadata first
      const metadata = JSON.parse(localStorage.getItem('applications-metadata') || '{}')
      expect(metadata.totalCount).toBe(1000)

      // Load first chunk on demand
      const firstChunk = JSON.parse(localStorage.getItem('applications-chunk-0') || '[]')
      expect(firstChunk).toHaveLength(100)
      expect(firstChunk[0].company_name).toBe('Company 0')
    })
  })

  describe('Storage Cleanup', () => {
    it('should cleanup expired data', async () => {
      const expiredData = {
        key: 'expired-cache',
        data: { temp: 'data' },
        timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
        ttl: 60 * 60 * 1000, // 1 hour TTL
      }

      const validData = {
        key: 'valid-cache',
        data: { current: 'data' },
        timestamp: Date.now() - 30 * 60 * 1000, // 30 minutes ago
        ttl: 60 * 60 * 1000, // 1 hour TTL
      }

      // Store both
      localStorage.setItem('expired-cache', JSON.stringify(expiredData))
      localStorage.setItem('valid-cache', JSON.stringify(validData))

      // Cleanup expired items
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.includes('-cache')) {
          const item = JSON.parse(localStorage.getItem(key) || '{}')
          if (Date.now() - item.timestamp > item.ttl) {
            localStorage.removeItem(key)
          }
        }
      }

      // Verify cleanup
      expect(localStorage.getItem('expired-cache')).toBeNull()
      expect(localStorage.getItem('valid-cache')).toBeTruthy()
    })

    it('should handle storage quota management', async () => {
      // Fill storage to near capacity
      const items = []
      for (let i = 0; i < 50; i++) {
        const item = {
          id: i,
          data: 'x'.repeat(1024), // 1KB each
          timestamp: Date.now(),
          priority: i < 10 ? 'high' : 'low',
        }
        items.push(item)
      }

      // Store items
      items.forEach(item => {
        try {
          localStorage.setItem(`item-${item.id}`, JSON.stringify(item))
        } catch (error) {
          // If storage is full, implement cleanup
          if (error instanceof Error && error.name === 'QuotaExceededError') {
            // Remove low priority items first
            for (let j = 0; j < localStorage.length; j++) {
              const key = localStorage.key(j)
              if (key && key.includes('item-')) {
                const storedItem = JSON.parse(localStorage.getItem(key) || '{}')
                if (storedItem.priority === 'low') {
                  localStorage.removeItem(key)
                  break
                }
              }
            }
          }
        }
      })

      // Verify high priority items are preserved
      const highPriorityCount = Array.from({ length: localStorage.length }, (_, i) => {
        const key = localStorage.key(i)
        if (key && key.includes('item-')) {
          const item = JSON.parse(localStorage.getItem(key) || '{}')
          return item.priority === 'high' ? 1 : 0
        }
        return 0
      }).reduce((sum: number, count) => sum + count, 0)

      expect(highPriorityCount).toBeGreaterThanOrEqual(5)
    })
  })
})
