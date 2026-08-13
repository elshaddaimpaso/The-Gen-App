// lib/auth-server.ts
/**
 * Server-side authentication and authorization utilities
 * These functions ONLY run on the server and verify auth state
 * Never expose these to the client
 */

import { createClient } from '@supabase/supabase-js'
import { ADMIN_EMAILS } from './admin'

// Create server-side Supabase client (with service role if available)
export function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')

  // Use service role key for server operations if available
  // Fall back to anon key if service role is not configured
  const key = serviceKey || anonKey
  if (!key) throw new Error('Supabase key is required')

  return createClient(url, key)
}

export interface AuthUser {
  id: string
  email: string
  isAdmin: boolean
}

/**
 * Verify user session from request headers
 * Extract and validate the Supabase auth token
 */
export async function verifyUserSession(
  authHeader?: string
): Promise<AuthUser | null> {
  if (!authHeader) return null

  try {
    const token = authHeader.replace('Bearer ', '')
    if (!token) return null

    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data.user) {
      return null
    }

    return {
      id: data.user.id,
      email: data.user.email || '',
      isAdmin: ADMIN_EMAILS.includes((data.user.email || '').toLowerCase()),
    }
  } catch (error) {
    console.error('Session verification error:', error)
    return null
  }
}

/**
 * Verify admin status
 * Used in API routes and server actions
 */
export async function verifyAdminSession(authHeader?: string): Promise<AuthUser | null> {
  const user = await verifyUserSession(authHeader)
  return user && user.isAdmin ? user : null
}

/**
 * Get auth token from request headers
 */
export function getAuthToken(headers: Headers | Record<string, string>): string | null {
  const authHeader = headers instanceof Headers
    ? headers.get('authorization')
    : headers['authorization']

  return authHeader?.startsWith('Bearer ') ? authHeader : null
}
