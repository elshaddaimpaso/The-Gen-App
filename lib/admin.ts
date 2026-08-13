// lib/admin.ts
/**
 * Admin authorization configuration
 * 
 * ADMIN_EMAILS is the SINGLE SOURCE OF TRUTH for administrator access
 * This array is used by:
 * - Server-side middleware and API routes (auth-server.ts)
 * - Client-side components for UI display only (never for security decisions)
 * - Database RLS policies (see supabase/schema.sql)
 * 
 * To add an admin:
 * 1. Update ADMIN_EMAILS below
 * 2. Verify RLS policy is_admin() in Supabase matches this list
 * 3. Test authorization flows
 */

import { supabase } from './supabase'

// ============================================
// ADMIN CONFIGURATION - SINGLE SOURCE OF TRUTH
// ============================================
export const ADMIN_EMAILS = [
  'gizmokzu@gmail.com',
  'joelkaudzu9@gmail.com',
  'elshaddaimpaso@gmail.com',
]

// ============================================
// CHECK IF USER IS ADMIN (Client-side helper)
// ============================================
export function isAdmin(email: string | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

// ============================================
// GET ADMIN STATUS FROM SESSION
// ============================================
export async function getAdminStatus() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return {
      isAdmin: isAdmin(user?.email),
      user: user
    }
  } catch (error) {
    console.error('Error checking admin status:', error)
    return {
      isAdmin: false,
      user: null
    }
  }
}

// ============================================
// CHECK IF CURRENT USER IS ADMIN (Throws error if not)
// ============================================
export async function requireAdmin() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }
  if (!isAdmin(user.email)) {
    throw new Error('Admin access required')
  }
  return user
}

// ============================================
// ADD ADMIN ROLE TO USER (For registration)
// ============================================
export async function setAdminRole(userId: string) {
  const { error } = await supabase
    .from('participants')
    .update({ role: 'admin' })
    .eq('user_id', userId)
  
  if (error) {
    console.error('Error setting admin role:', error)
    throw error
  }
  return true
}