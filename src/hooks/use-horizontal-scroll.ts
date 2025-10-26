'use client'

import * as React from 'react'

export type ScrollBehavior = 'auto' | 'smooth'

export interface ScrollToOptions {
  left?: number
  top?: number
  behavior?: ScrollBehavior
}

export interface UseHorizontalScrollOptions {
  /** Enable horizontal scrolling with mouse wheel */
  enabled?: boolean
  /** Scroll behavior for smooth animations */
  behavior?: ScrollBehavior
  /** Throttle scroll events in milliseconds */
  throttleMs?: number
}

export interface UseHorizontalScrollReturn<T extends HTMLElement = HTMLElement> {
  /** Ref to attach to the scrollable element */
  ref: React.RefCallback<T | null>
  /** Scroll to specific position */
  scrollTo: (options: ScrollToOptions) => void
  /** Scroll by specific amount */
  scrollBy: (options: ScrollToOptions) => void
  /** Check if element is scrollable */
  isScrollable: boolean
}

/**
 * Enhanced horizontal scrolling hook that preserves native scrolling behavior
 *
 * This hook only converts vertical wheel events to horizontal scrolling when:
 * - The element is horizontally scrollable
 * - The user is using a vertical-only scroll device (regular mouse wheel)
 * - Native horizontal scrolling is not already supported
 *
 * Native horizontal scrolling (touchpad, mouse with horizontal wheel) is preserved.
 */
export function useHorizontalScroll<T extends HTMLElement>(
  options: UseHorizontalScrollOptions = {}
): UseHorizontalScrollReturn<T> {
  const { enabled = true, behavior = 'auto', throttleMs = 8 } = options

  const ref = React.useRef<T>(null)
  const [isScrollable, setIsScrollable] = React.useState(false)
  const lastScrollTime = React.useRef(0)

  // Store the current element to trigger useEffect when it changes
  const [element, setElement] = React.useState<T | null>(null)

  // Callback ref to update element state when ref changes
  const callbackRef = React.useCallback((node: T | null) => {
    ref.current = node
    setElement(node)
  }, [])

  // Check if element is horizontally scrollable
  const checkScrollable = React.useCallback(() => {
    const element = ref.current
    if (!element) return false

    return element.scrollWidth > element.clientWidth
  }, [])

  // Optimized throttle function using requestAnimationFrame for better performance
  const throttleRAF = React.useCallback(
    (func: () => void) => {
      const now = performance.now()
      if (now - lastScrollTime.current >= throttleMs) {
        func()
        lastScrollTime.current = now
      }
    },
    [throttleMs]
  )

  // Enhanced wheel event handler that preserves native horizontal scrolling
  const handleWheel = React.useCallback(
    (event: WheelEvent) => {
      if (!enabled || !ref.current) return

      // Don't interfere with native horizontal scrolling
      // If the browser already supports horizontal scrolling (touchpad, mouse wheel), let it work
      if (event.deltaX !== 0) {
        return // Let native horizontal scrolling handle it
      }

      // Only handle pure vertical wheel events
      if (event.deltaY === 0) return

      // Check if element is horizontally scrollable
      if (!checkScrollable()) return

      // Use RAF-based throttling for smooth performance
      throttleRAF(() => {
        if (!ref.current) return

        // Prevent default only when we're going to handle it
        event.preventDefault()

        // Instant scrolling for better responsiveness
        ref.current.scrollLeft += event.deltaY
      })
    },
    [enabled, checkScrollable, throttleRAF]
  )

  // Scroll to specific position
  const scrollTo = React.useCallback(
    (options: ScrollToOptions) => {
      if (!ref.current) return

      ref.current.scrollTo({
        ...options,
        behavior,
      })
    },
    [behavior]
  )

  // Scroll by specific amount
  const scrollBy = React.useCallback(
    (options: ScrollToOptions) => {
      if (!ref.current) return

      ref.current.scrollBy({
        ...options,
        behavior,
      })
    },
    [behavior]
  )

  // Set up event listeners with passive: false only when needed
  React.useEffect(() => {
    if (!element || !enabled) return

    // Check if element is scrollable
    setIsScrollable(checkScrollable())

    // Add wheel event listener - we need passive: false to preventDefault
    // But only when we actually need to intervene
    element.addEventListener('wheel', handleWheel, { passive: false })

    // Add resize observer to check scrollability on resize
    const resizeObserver = new ResizeObserver(() => {
      setIsScrollable(checkScrollable())
    })

    resizeObserver.observe(element)

    // Cleanup
    return () => {
      element.removeEventListener('wheel', handleWheel)
      resizeObserver.disconnect()
    }
  }, [element, enabled, handleWheel, checkScrollable])

  return {
    ref: callbackRef,
    scrollTo,
    scrollBy,
    isScrollable,
  }
}
