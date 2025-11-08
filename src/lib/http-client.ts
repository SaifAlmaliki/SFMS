/**
 * HTTP Client Utility
 * Provides a consistent fetch implementation using undici for server-side code
 * 
 * NOTE: This file is server-only and should only be imported in server actions/API routes
 */

import 'server-only';
import { fetch as undiciFetch } from 'undici';

/**
 * Server-side fetch function using undici
 * Use this instead of native fetch in server-side code for consistency
 * 
 * @param url - The URL to fetch
 * @param init - Optional fetch options
 * @returns Promise<Response>
 */
export async function serverFetch(
  url: string | URL,
  init?: RequestInit
): Promise<Response> {
  return undiciFetch(url, init as any);
}

/**
 * Re-export undici fetch for direct use when needed
 */
export { fetch as undiciFetch } from 'undici';

