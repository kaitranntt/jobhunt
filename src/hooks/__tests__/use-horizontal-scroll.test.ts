import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useHorizontalScroll } from '../use-horizontal-scroll'

describe('useHorizontalScroll', () => {
  let mockElement: HTMLElement
  let mockResizeObserver: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Create a mock ResizeObserver
    mockResizeObserver = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }
    global.ResizeObserver = vi.fn().mockImplementation(() => mockResizeObserver)

    // Create a mock element with scroll properties
    mockElement = {
      scrollWidth: 800,
      clientWidth: 400,
      scrollLeft: 0,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      scrollTo: vi.fn(),
      scrollBy: vi.fn(),
    } as any
  })

  it('should return correct initial state', () => {
    const { result } = renderHook(() => useHorizontalScroll())

    expect(result.current.isScrollable).toBe(false)
    expect(typeof result.current.ref).toBe('function')
    expect(typeof result.current.scrollTo).toBe('function')
    expect(typeof result.current.scrollBy).toBe('function')
  })

  it('should detect when element is horizontally scrollable', () => {
    const { result } = renderHook(() => useHorizontalScroll())

    // Simulate element being assigned to callback ref
    act(() => {
      result.current.ref(mockElement)
    })

    // The hook should detect scrollability and set up event listeners
    expect(mockElement.addEventListener).toHaveBeenCalledWith('wheel', expect.any(Function), {
      passive: false,
    })
    expect(mockResizeObserver.observe).toHaveBeenCalledWith(mockElement)
  })

  it('should not add event listeners when disabled', () => {
    const { result } = renderHook(() => useHorizontalScroll({ enabled: false }))

    act(() => {
      result.current.ref(mockElement)
    })

    expect(mockElement.addEventListener).not.toHaveBeenCalled()
    expect(mockResizeObserver.observe).not.toHaveBeenCalled()
  })

  it('should call scrollTo with correct options', () => {
    const { result } = renderHook(() => useHorizontalScroll({ behavior: 'auto' }))

    // First assign the element to the ref
    act(() => {
      result.current.ref(mockElement)
    })

    // Then call scrollTo
    act(() => {
      result.current.scrollTo({ left: 100, top: 0 })
    })

    expect(mockElement.scrollTo).toHaveBeenCalledWith({
      left: 100,
      top: 0,
      behavior: 'auto',
    })
  })

  it('should call scrollBy with correct options', () => {
    const { result } = renderHook(() => useHorizontalScroll())

    // First assign the element to the ref
    act(() => {
      result.current.ref(mockElement)
    })

    // Then call scrollBy
    act(() => {
      result.current.scrollBy({ left: 50, top: 0 })
    })

    expect(mockElement.scrollBy).toHaveBeenCalledWith({
      left: 50,
      top: 0,
      behavior: 'auto',
    })
  })

  it('should handle pure vertical wheel events correctly', () => {
    const { result } = renderHook(() => useHorizontalScroll())
    let wheelHandler: ((event: WheelEvent) => void) | undefined

    // Mock addEventListener to capture the wheel handler
    mockElement.addEventListener = vi.fn((event, handler) => {
      if (event === 'wheel') {
        wheelHandler = handler as (event: WheelEvent) => void
      }
    })

    act(() => {
      result.current.ref(mockElement)
    })

    expect(wheelHandler).toBeDefined()

    // Simulate pure vertical wheel event (no deltaX)
    const wheelEvent = {
      deltaY: 100,
      deltaX: 0, // Pure vertical event
      preventDefault: vi.fn(),
    } as any

    act(() => {
      wheelHandler!(wheelEvent)
    })

    // Should prevent default and handle vertical scroll
    expect(wheelEvent.preventDefault).toHaveBeenCalled()
    // The new implementation uses direct scrollLeft assignment for performance
    expect(mockElement.scrollLeft).toBe(100)
  })

  it('should ignore wheel events with no deltaY', () => {
    const { result } = renderHook(() => useHorizontalScroll())
    let wheelHandler: ((event: WheelEvent) => void) | undefined

    mockElement.addEventListener = vi.fn((event, handler) => {
      if (event === 'wheel') {
        wheelHandler = handler as (event: WheelEvent) => void
      }
    })

    act(() => {
      result.current.ref(mockElement)
    })

    const wheelEvent = {
      deltaY: 0,
      preventDefault: vi.fn(),
    } as any

    act(() => {
      wheelHandler!(wheelEvent)
    })

    expect(wheelEvent.preventDefault).not.toHaveBeenCalled()
    expect(mockElement.scrollTo).not.toHaveBeenCalled()
  })

  it('should cleanup event listeners on unmount', () => {
    const { result, unmount } = renderHook(() => useHorizontalScroll())

    act(() => {
      result.current.ref(mockElement)
    })

    unmount()

    expect(mockElement.removeEventListener).toHaveBeenCalledWith('wheel', expect.any(Function))
    expect(mockResizeObserver.disconnect).toHaveBeenCalled()
  })

  it('should work with custom throttle setting', () => {
    const { result } = renderHook(() => useHorizontalScroll({ throttleMs: 32 }))

    act(() => {
      result.current.ref(mockElement)
    })

    expect(mockElement.addEventListener).toHaveBeenCalledWith('wheel', expect.any(Function), {
      passive: false,
    })
    expect(mockResizeObserver.observe).toHaveBeenCalledWith(mockElement)
  })

  it('should handle non-scrollable elements gracefully', () => {
    const nonScrollableElement = {
      scrollWidth: 400,
      clientWidth: 400, // Same width, not scrollable
      scrollLeft: 0,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      scrollTo: vi.fn(),
      scrollBy: vi.fn(),
    } as any

    const { result } = renderHook(() => useHorizontalScroll())
    let wheelHandler: ((event: WheelEvent) => void) | undefined

    // Mock addEventListener to capture the wheel handler
    nonScrollableElement.addEventListener = vi.fn((event, handler) => {
      if (event === 'wheel') {
        wheelHandler = handler as (event: WheelEvent) => void
      }
    })

    act(() => {
      result.current.ref(nonScrollableElement)
    })

    const wheelEvent = {
      deltaY: 100,
      preventDefault: vi.fn(),
    } as any

    act(() => {
      wheelHandler!(wheelEvent)
    })

    // Should not prevent default or scroll for non-scrollable elements
    expect(wheelEvent.preventDefault).not.toHaveBeenCalled()
    expect(nonScrollableElement.scrollTo).not.toHaveBeenCalled()
  })

  it('should preserve native horizontal scrolling', () => {
    const { result } = renderHook(() => useHorizontalScroll())
    let wheelHandler: ((event: WheelEvent) => void) | undefined

    // Mock addEventListener to capture the wheel handler
    mockElement.addEventListener = vi.fn((event, handler) => {
      if (event === 'wheel') {
        wheelHandler = handler as (event: WheelEvent) => void
      }
    })

    act(() => {
      result.current.ref(mockElement)
    })

    // Simulate horizontal wheel event (touchpad or mouse with horizontal scroll)
    const horizontalWheelEvent = {
      deltaY: 50,
      deltaX: 30, // Has horizontal component - native scrolling
      preventDefault: vi.fn(),
    } as any

    act(() => {
      wheelHandler!(horizontalWheelEvent)
    })

    // Should NOT prevent default - let native horizontal scrolling handle it
    expect(horizontalWheelEvent.preventDefault).not.toHaveBeenCalled()
    expect(mockElement.scrollLeft).toBe(0) // Should remain unchanged
  })
})
