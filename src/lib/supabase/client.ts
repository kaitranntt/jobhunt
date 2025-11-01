import { getBrowserClient } from './singleton'

/**
 * Backward compatibility export
 * @deprecated Use getBrowserClient() from './singleton' instead
 */
export function createClient() {
  return getBrowserClient()
}

/**
 * Recommended: Use the singleton pattern
 */
export { getBrowserClient }
