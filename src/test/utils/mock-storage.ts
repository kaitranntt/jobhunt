// Use DOM types for web API compatibility

export function setupMockStorage(): void {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {}

    return {
      getItem(key: string): string | null {
        return store[key] || null
      },

      setItem(key: string, value: string): void {
        store[key] = String(value)
      },

      removeItem(key: string): void {
        delete store[key]
      },

      clear(): void {
        store = {}
      },

      get length(): number {
        return Object.keys(store).length
      },

      key(index: number): string | null {
        return Object.keys(store)[index] || null
      },

      // Additional methods for testing
      getStore(): Record<string, string> {
        return { ...store }
      },

      setStore(newStore: Record<string, string>): void {
        store = { ...newStore }
      },
    }
  })()

  // Mock sessionStorage
  const sessionStorageMock = (() => {
    let store: Record<string, string> = {}

    return {
      getItem(key: string): string | null {
        return store[key] || null
      },

      setItem(key: string, value: string): void {
        store[key] = String(value)
      },

      removeItem(key: string): void {
        delete store[key]
      },

      clear(): void {
        store = {}
      },

      get length(): number {
        return Object.keys(store).length
      },

      key(index: number): string | null {
        return Object.keys(store)[index] || null
      },

      // Additional methods for testing
      getStore(): Record<string, string> {
        return { ...store }
      },

      setStore(newStore: Record<string, string>): void {
        store = { ...newStore }
      },

      // Simulate quota exceeded error
      simulateQuotaExceeded(): void {
        const error = new Error('SessionStorage is full')
        error.name = 'QuotaExceededError'
        throw error
      },
    }
  })()

  // Define interfaces for file-related types
  interface MockFileBits extends Array<string | Blob | ArrayBuffer> {}

  interface MockFileOptions {
    type?: string
    lastModified?: number
  }

  // Mock File API
  class MockFile {
    name: string
    size: number
    type: string
    lastModified: number
    content: string

    constructor(bits: MockFileBits, name: string, options: MockFileOptions = {}) {
      this.name = name
      this.type = options.type || 'text/plain'
      this.size = bits.join('').length
      this.lastModified = options.lastModified || Date.now()
      this.content = bits.join('')
    }

    arrayBuffer(): Promise<ArrayBuffer> {
      return Promise.resolve(new TextEncoder().encode(this.content).buffer)
    }

    text(): Promise<string> {
      return Promise.resolve(this.content)
    }

    stream(): ReadableStream {
      const content = this.content
      return new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(content))
          controller.close()
        },
      })
    }

    slice(start?: number, end?: number, contentType?: string): MockFile {
      const content = this.content.slice(start || 0, end || this.content.length)
      return new MockFile([content], this.name, { type: contentType || this.type })
    }
  }

  interface FileReaderEvent {
    target: MockFileReader
    type?: string
  }

  class MockFileReader {
    result: string | ArrayBuffer | null = null
    error: Error | null = null
    readyState: number = 0
    onload: ((event: FileReaderEvent) => void) | null = null
    onerror: ((event: FileReaderEvent) => void) | null = null

    static readonly EMPTY = 0
    static readonly LOADING = 1
    static readonly DONE = 2

    readAsText(file: MockFile): void {
      this.readyState = MockFileReader.LOADING
      setTimeout(() => {
        this.result = file.content
        this.readyState = MockFileReader.DONE
        if (this.onload) {
          this.onload({ target: this })
        }
      }, 0)
    }

    readAsDataURL(file: MockFile): void {
      this.readyState = MockFileReader.LOADING
      setTimeout(() => {
        const dataUrl = `data:${file.type};base64,${btoa(file.content)}`
        this.result = dataUrl
        this.readyState = MockFileReader.DONE
        if (this.onload) {
          this.onload({ target: this })
        }
      }, 0)
    }

    readAsArrayBuffer(file: MockFile): void {
      this.readyState = MockFileReader.LOADING
      setTimeout(async () => {
        this.result = await file.arrayBuffer()
        this.readyState = MockFileReader.DONE
        if (this.onload) {
          this.onload({ target: this })
        }
      }, 0)
    }
  }

  interface MockBlobParts extends Array<string | Blob | ArrayBuffer> {}

  interface MockBlobOptions {
    type?: string
    endings?: 'transparent' | 'native'
  }

  class MockBlob {
    size: number
    type: string
    content: string

    constructor(parts: MockBlobParts, options: MockBlobOptions = {}) {
      this.content = parts.join('')
      this.size = this.content.length
      this.type = options.type || 'text/plain'
    }

    arrayBuffer(): Promise<ArrayBuffer> {
      return Promise.resolve(new TextEncoder().encode(this.content).buffer)
    }

    text(): Promise<string> {
      return Promise.resolve(this.content)
    }

    stream(): ReadableStream {
      const content = this.content
      return new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(content))
          controller.close()
        },
      })
    }

    slice(): MockBlob {
      return new MockBlob([this.content], { type: this.type })
    }
  }

  // Mock URL.createObjectURL and revokeObjectURL
  const mockObjectURLs = new Set<string>()
  let urlCounter = 0

  // Replace global objects
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  })

  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
  })

  Object.defineProperty(global, 'File', {
    value: MockFile,
    writable: true,
  })

  Object.defineProperty(global, 'FileReader', {
    value: MockFileReader,
    writable: true,
  })

  Object.defineProperty(global, 'Blob', {
    value: MockBlob,
    writable: true,
  })

  Object.defineProperty(global, 'URL', {
    value: {
      createObjectURL: (_obj: Blob | MediaSource): string => {
        const url = `blob:mock-url-${++urlCounter}`
        mockObjectURLs.add(url)
        return url
      },
      revokeObjectURL: (url: string): void => {
        mockObjectURLs.delete(url)
      },
    },
    writable: true,
  })

  // Define interfaces for FormData
  interface FormDataEntry {
    value: string | MockFile | MockBlob
    fileName?: string
  }

  type MockFormDataEntryValue = string | MockFile | MockBlob

  // Mock FormData
  class MockFormData {
    private data: Map<string, FormDataEntry> = new Map()

    append(name: string, value: string | MockFile | MockBlob, fileName?: string): void {
      this.data.set(name, { value, fileName })
    }

    delete(name: string): void {
      this.data.delete(name)
    }

    get(name: string): MockFormDataEntryValue | null {
      const entry = this.data.get(name)
      return entry ? entry.value : null
    }

    getAll(name: string): MockFormDataEntryValue[] {
      return Array.from(this.data.entries())
        .filter(([key]) => key === name)
        .map(([, entry]) => entry.value)
    }

    has(name: string): boolean {
      return this.data.has(name)
    }

    set(name: string, value: string | MockFile | MockBlob, fileName?: string): void {
      this.data.set(name, { value, fileName })
    }

    entries(): IterableIterator<[string, MockFormDataEntryValue]> {
      return (
        Array.from(this.data.entries()).map(([key, entry]) => [key, entry.value]) as [
          string,
          MockFormDataEntryValue,
        ][]
      )[Symbol.iterator]()
    }

    keys(): IterableIterator<string> {
      return this.data.keys()
    }

    values(): IterableIterator<MockFormDataEntryValue> {
      return Array.from(this.data.values())
        .map(entry => entry.value)
        [Symbol.iterator]()
    }

    // Test utility
    toObject(): Record<string, MockFormDataEntryValue> {
      const result: Record<string, MockFormDataEntryValue> = {}
      for (const [key, entry] of Array.from(this.data.entries())) {
        result[key] = entry.value
      }
      return result
    }
  }

  Object.defineProperty(global, 'FormData', {
    value: MockFormData,
    writable: true,
  })

  // Mock fetch for file upload scenarios
  global.fetch = async (input: unknown, init?: unknown): Promise<Response> => {
    // Handle file upload scenarios
    if (typeof input === 'string' && input.includes('upload')) {
      await new Promise(resolve => setTimeout(resolve, 100)) // Simulate network delay

      return new Response(
        JSON.stringify({
          id: `file-${Date.now()}`,
          url: `https://mock-storage.example.com/files/file-${Date.now()}`,
          size:
            init && typeof init === 'object' && 'body' in init
              ? JSON.stringify(init.body).length
              : 0,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // For other requests, use mock response
    // In test environment, we don't need real network calls

    return new Response(JSON.stringify({ mock: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  // Test utilities
  global.testStorage = {
    getLocalStorage: () => localStorageMock.getStore(),
    getSessionStorage: () => sessionStorageMock.getStore(),
    setLocalStorage: (store: Record<string, string>) => localStorageMock.setStore(store),
    setSessionStorage: (store: Record<string, string>) => sessionStorageMock.setStore(store),
    clearAllStorage: () => {
      localStorageMock.clear()
      sessionStorageMock.clear()
    },
    simulateSessionStorageQuotaExceeded: () => sessionStorageMock.simulateQuotaExceeded(),
    getObjectURLs: () => Array.from(mockObjectURLs),
    clearObjectURLs: () => {
      mockObjectURLs.clear()
      urlCounter = 0
    },
  }
}
