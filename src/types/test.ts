/**
 * Test-Related Types
 *
 * Comprehensive type definitions for testing infrastructure,
 * test utilities, mocks, and test configurations.
 */

import type { MockedFunction } from 'vitest'

// Custom request interface for testing
export interface TestRequestInit {
  body?:
    | string
    | Blob
    | ArrayBuffer
    | ArrayBufferView
    | FormData
    | URLSearchParams
    | ReadableStream<Uint8Array>
    | null
  headers?: Record<string, string>
  method?: string
  mode?: 'navigate' | 'same-origin' | 'no-cors' | 'cors'
  credentials?: 'include' | 'same-origin' | 'omit'
  cache?: 'default' | 'no-store' | 'reload' | 'no-cache' | 'force-cache' | 'only-if-cached'
  redirect?: 'manual' | 'follow' | 'error'
  referrer?: string
  referrerPolicy?:
    | ''
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'same-origin'
    | 'origin'
    | 'strict-origin-when-cross-origin'
    | 'unsafe-url'
  integrity?: string
  keepalive?: boolean
  signal?: AbortSignal
  window?: null
}

// Test Configuration Types
export interface TestConfig {
  setupFiles?: string[]
  testEnvironment: 'jsdom' | 'node' | 'happy-dom'
  moduleNameMapper?: Record<string, string>
  transform?: Record<string, string>
  collectCoverageFrom?: string[]
  coverageThreshold?: CoverageThreshold
  testMatch?: string[]
  globals?: Record<string, unknown>
}

export interface CoverageThreshold {
  global?: {
    branches?: number
    functions?: number
    lines?: number
    statements?: number
  }
  [path: string]:
    | {
        branches?: number
        functions?: number
        lines?: number
        statements?: number
      }
    | undefined
}

// Test Types
export interface TestSuite {
  name: string
  tests: TestCase[]
  setup?: TestHook
  teardown?: TestHook
  beforeEach?: TestHook
  afterEach?: TestHook
  timeout?: number
  skip?: boolean
  only?: boolean
}

export interface TestCase {
  name: string
  fn: TestFunction
  timeout?: number
  skip?: boolean
  only?: boolean
  retries?: number
}

export type TestFunction = () => void | Promise<void>

export type TestHook = () => void | Promise<void>

// Assertion Types
export interface Assertion<T = unknown> {
  actual: T
  not: Assertion<T>
  toBe(expected: T): Assertion<T>
  toEqual(expected: T): Assertion<T>
  toStrictEqual(expected: T): Assertion<T>
  toHaveLength(length: number): Assertion<T>
  toContain(item: unknown): Assertion<T>
  toContainEqual(item: unknown): Assertion<T>
  toMatchObject(expected: Partial<T>): Assertion<T>
  toMatch(pattern: RegExp | string): Assertion<T>
  toBeDefined(): Assertion<T>
  toBeUndefined(): Assertion<T>
  toBeNull(): Assertion<T>
  toBeNaN(): Assertion<T>
  toBeTruthy(): Assertion<T>
  toBeFalsy(): Assertion<T>
  toBeGreaterThan(value: number): Assertion<T>
  toBeGreaterThanOrEqual(value: number): Assertion<T>
  toBeLessThan(value: number): Assertion<T>
  toBeLessThanOrEqual(value: number): Assertion<T>
  toBeInstanceOf(constructor: abstract new (...args: unknown[]) => unknown): Assertion<T>
  toHaveProperty(propertyPath: string, value?: unknown): Assertion<T>
  toHaveBeenCalled(): Assertion<T>
  toHaveBeenCalledWith(...args: unknown[]): Assertion<T>
  toHaveBeenCalledTimes(count: number): Assertion<T>
  toThrow(error?: RegExp | string | Error): Assertion<T>
  resolves: Assertion<T>
  rejects: Assertion<T>
}

// Mock Types
export interface MockType<T = unknown> {
  mock: {
    calls: MockCall[]
    instances: unknown[]
    invocationCallOrder: number[]
    results: MockResult<T>[]
  }
}

export interface MockCall {
  this: unknown
  arguments: unknown[]
}

export interface MockResult<T> {
  type: 'return' | 'throw' | 'incomplete'
  value?: T
  isThrow?: boolean
}

export interface MockInstance<T = unknown> {
  (...args: unknown[]): T
  mock: MockType<T>['mock']
  mockClear(): void
  mockReset(): void
  mockRestore(): void
  mockImplementation(fn: (...args: unknown[]) => T): void
  mockImplementationOnce(fn: (...args: unknown[]) => T): void
  mockName(name: string): void
  getMockName(): string
}

// Database Mock Types
export interface MockSupabaseClient {
  from: MockedFunction<(table: string) => MockSupabaseQueryBuilder<unknown>>
  auth: {
    getUser: MockedFunction<() => Promise<MockSupabaseAuthResponse>>
    signIn: MockedFunction<
      (credentials: { email: string; password: string }) => Promise<MockSupabaseAuthResponse>
    >
    signOut: MockedFunction<() => Promise<{ error: { message: string } | null }>>
    onAuthStateChange: MockedFunction<
      (callback: (event: string, session: MockSession | null) => void) => () => void
    >
  }
  storage: {
    from: MockedFunction<(bucket: string) => MockSupabaseStorage>
  }
}

export interface MockSupabaseQueryBuilder<T = unknown> {
  select: MockedFunction<(columns?: string) => MockSupabaseQueryBuilder<T>>
  insert: MockedFunction<
    (data: Record<string, unknown> | Record<string, unknown>[]) => MockSupabaseQueryBuilder<T>
  >
  update: MockedFunction<(data: Record<string, unknown>) => MockSupabaseQueryBuilder<T>>
  delete: MockedFunction<() => MockSupabaseQueryBuilder<T>>
  eq: MockedFunction<(column: string, value: unknown) => MockSupabaseQueryBuilder<T>>
  neq: MockedFunction<(column: string, value: unknown) => MockSupabaseQueryBuilder<T>>
  gt: MockedFunction<(column: string, value: unknown) => MockSupabaseQueryBuilder<T>>
  gte: MockedFunction<(column: string, value: unknown) => MockSupabaseQueryBuilder<T>>
  lt: MockedFunction<(column: string, value: unknown) => MockSupabaseQueryBuilder<T>>
  lte: MockedFunction<(column: string, value: unknown) => MockSupabaseQueryBuilder<T>>
  like: MockedFunction<(column: string, pattern: string) => MockSupabaseQueryBuilder<T>>
  ilike: MockedFunction<(column: string, pattern: string) => MockSupabaseQueryBuilder<T>>
  in: MockedFunction<(column: string, values: unknown[]) => MockSupabaseQueryBuilder<T>>
  is: MockedFunction<(column: string, value: unknown) => MockSupabaseQueryBuilder<T>>
  order: MockedFunction<
    (column: string, options?: { ascending?: boolean }) => MockSupabaseQueryBuilder<T>
  >
  limit: MockedFunction<(count: number) => MockSupabaseQueryBuilder<T>>
  range: MockedFunction<(from: number, to: number) => MockSupabaseQueryBuilder<T>>
  single: MockedFunction<() => MockSupabaseQueryBuilder<T>>
  maybeSingle: MockedFunction<() => MockSupabaseQueryBuilder<T>>
  then: MockedFunction<
    (
      resolve: (value: MockSupabaseResponse<T>) => void,
      reject?: (reason: unknown) => void
    ) => Promise<MockSupabaseResponse<T>>
  >
  // Allow access to response properties via casting for performance tests
  data?: T | null
  error?: {
    message: string
    code?: string
    details?: Record<string, unknown>
  } | null
}

export interface MockSupabaseResponse<T> {
  data: T | null
  error: {
    message: string
    code?: string
    details?: Record<string, unknown>
  } | null
  count?: number
  status: number
  statusText: string
}

export interface MockSupabaseAuthResponse {
  data: {
    user: MockUser | null
    session: MockSession | null
  }
  error: {
    message: string
    code?: string
    details?: Record<string, unknown>
  } | null
}

export interface MockUser {
  id: string
  email: string
  name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
  email_verified?: boolean
}

export interface MockSession {
  access_token: string
  refresh_token: string
  expires_at: number
  user: MockUser
}

export interface MockSupabaseStorage {
  upload: MockedFunction<
    (
      path: string,
      file: File,
      options?: { cacheControl?: string; contentType?: string }
    ) => Promise<MockSupabaseStorageResponse>
  >
  download: MockedFunction<
    (path: string) => Promise<{ data: Blob; error: { message: string } | null }>
  >
  getPublicUrl: MockedFunction<(path: string) => { data: { publicUrl: string } }>
  remove: MockedFunction<(paths: string[]) => Promise<MockSupabaseStorageResponse>>
  list: MockedFunction<
    (
      path?: string,
      options?: { limit?: number; offset?: number; search?: string }
    ) => Promise<MockSupabaseStorageResponse>
  >
}

export interface MockSupabaseStorageResponse {
  data: {
    path?: string
    id?: string
  } | null
  error: {
    message: string
    code?: string
  } | null
}

// Test Data Types
export interface TestDataFactory<T> {
  create(overrides?: Partial<T>): T
  createMany(count: number, overrides?: Partial<T>): T[]
  createList(overrides?: Partial<T>): T[]
}

export interface MockData {
  users: MockUser[]
  applications: Record<string, unknown>[]
  companies: Record<string, unknown>[]
  sessions: MockSession[]
}

// Component Testing Types
export interface ComponentTestProps<P = Record<string, unknown>> {
  props: P
  context?: Record<string, unknown>
  wrapper?: React.ComponentType<Record<string, unknown>>
}

export interface ComponentTestResult<T = unknown, P = Record<string, unknown>> {
  component: React.ReactElement
  unmount: () => void
  rerender: (props: Partial<P>) => void
  querySelector: (selector: string) => T | null
  find: (selector: string) => Promise<T>
  findAll: (selector: string) => Promise<T[]>
  getBy: (role: string, options?: Record<string, unknown>) => T
  getAllBy: (role: string, options?: Record<string, unknown>) => T[]
  queryBy: (role: string, options?: Record<string, unknown>) => T | null
  queryAllBy: (role: string, options?: Record<string, unknown>) => T[]
  waitFor: (callback: () => boolean | Promise<boolean>, options?: WaitForOptions) => Promise<T>
  waitForElementToBeRemoved: (callback: () => T | null, options?: WaitForOptions) => Promise<void>
}

export interface WaitForOptions {
  timeout?: number
  interval?: number
}

// Integration Test Types
export interface IntegrationTestSuite {
  name: string
  setup: TestSetup
  teardown: TestTeardown
  tests: IntegrationTestCase[]
}

export interface IntegrationTestCase {
  name: string
  description: string
  given: TestContext
  when: TestAction[]
  then: TestExpectation[]
  timeout?: number
}

export interface TestContext {
  [key: string]: unknown
}

export interface TestAction {
  type: string
  action: string
  data?: unknown
  delay?: number
}

export interface TestExpectation {
  type: string
  expectation: string
  value?: unknown
  tolerance?: number
}

export type TestSetup = () => Promise<TestContext>
export type TestTeardown = (context: TestContext) => Promise<void>

// Performance Test Types
export interface PerformanceTest {
  name: string
  benchmark: PerformanceBenchmark
  threshold: PerformanceThreshold
  iterations?: number
  warmup?: number
}

export interface PerformanceBenchmark {
  fn: () => void | Promise<void>
  setup?: () => void
  teardown?: () => void
}

export interface PerformanceThreshold {
  maxTime: number
  maxMemory: number
  minThroughput?: number
}

export interface PerformanceResult {
  name: string
  iterations: number
  totalTime: number
  averageTime: number
  minTime: number
  maxTime: number
  memoryUsage: number
  passed: boolean
  threshold: PerformanceThreshold
}

// E2E Test Types
export interface E2ETestSuite {
  name: string
  viewport: ViewportConfig
  tests: E2ETestCase[]
  hooks: E2ETestHooks
}

export interface E2ETestCase {
  name: string
  description: string
  steps: E2ETestStep[]
  timeout?: number
  retries?: number
  tags?: string[]
}

export interface E2ETestStep {
  action: E2EAction
  expectation?: E2EExpectation
  timeout?: number
}

export interface E2EAction {
  type:
    | 'navigate'
    | 'click'
    | 'type'
    | 'select'
    | 'hover'
    | 'scroll'
    | 'wait'
    | 'screenshot'
    | 'execute'
  target: string
  data?: unknown
  options?: Record<string, unknown>
}

export interface E2EExpectation {
  type: 'visible' | 'hidden' | 'text' | 'value' | 'count' | 'attribute' | 'url' | 'title'
  target: string
  value?: unknown
  operator?: 'equals' | 'contains' | 'matches' | 'not-contains' | 'greater-than' | 'less-than'
}

export interface E2ETestHooks {
  beforeAll?: () => Promise<void>
  afterAll?: () => Promise<void>
  beforeEach?: () => Promise<void>
  afterEach?: () => Promise<void>
}

export interface ViewportConfig {
  width: number
  height: number
  deviceScaleFactor?: number
  isMobile?: boolean
  hasTouch?: boolean
  isLandscape?: boolean
}

// Test Utility Types
export interface TestLogger {
  info: (message: string, data?: unknown) => void
  warn: (message: string, data?: unknown) => void
  error: (message: string, error?: Error) => void
  debug: (message: string, data?: unknown) => void
}

export interface TestReporter {
  onTestStart: (test: TestCase) => void
  onTestSuccess: (test: TestCase, duration: number) => void
  onTestFailure: (test: TestCase, error: Error, duration: number) => void
  onTestSkip: (test: TestCase) => void
  onSuiteStart: (suite: TestSuite) => void
  onSuiteEnd: (suite: TestSuite, results: TestSuiteResults) => void
}

export interface TestSuiteResults {
  total: number
  passed: number
  failed: number
  skipped: number
  duration: number
  coverage?: TestCoverage
}

export interface TestCoverage {
  lines: CoverageMetric
  functions: CoverageMetric
  branches: CoverageMetric
  statements: CoverageMetric
}

export interface CoverageMetric {
  total: number
  covered: number
  percentage: number
}

// Test Environment Types
export interface TestEnvironment {
  name: string
  setup: () => Promise<void>
  teardown: () => Promise<void>
  globals?: Record<string, unknown>
  config?: TestConfig
}

export interface MockServiceWorkerConfig {
  handlers: RequestHandler[]
  onUnhandledRequest: 'warn' | 'error' | 'bypass'
}

export interface RequestHandler {
  info: RequestHandlerInfo
  resolver: RequestResolver
}

export interface RequestHandlerInfo {
  method: string
  url: string | RegExp
  headers?: Record<string, string>
}

export type RequestResolver = (req: Request, res: Response, ctx: ResponseContext) => Response

export interface ResponseContext {
  status: (code: number) => ResponseContext
  json: (body: unknown) => ResponseContext
  text: (body: string) => ResponseContext
  set: (headers: Record<string, string>) => ResponseContext
  delay: (duration: number) => ResponseContext
  fetch: (url: string, init?: TestRequestInit) => Promise<Response>
}
