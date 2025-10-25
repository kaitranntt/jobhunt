/**
 * Image Mock Types
 * Type definitions for mocking Next.js Image component in tests
 */

export interface ImageMockProps {
  alt?: string
  'data-testid'?: string
  className?: string
  style?: React.CSSProperties
  onLoad?: () => void
  onError?: (_event: React.SyntheticEvent<HTMLDivElement>) => void
  [key: string]: unknown // Allow additional props
}
