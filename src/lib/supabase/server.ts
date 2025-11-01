import { getServerClient } from './singleton'

/**
 * Backward compatibility export
 * @deprecated Use getServerClient() from './singleton' instead
 */
export async function createClient() {
  return getServerClient()
}

/**
 * Recommended: Use the singleton pattern
 */
export { getServerClient }
