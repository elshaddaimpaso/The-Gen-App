// app/api/send-notification/route.ts
/**
 * PROTECTED API ENDPOINT: Send push notifications
 * 
 * Security requirements:
 * - Authentication: User must be logged in
 * - Authorization: User must be an administrator
 * - Validation: Request body must match schema
 * - Rate limiting: Implemented via simple in-memory store
 * - Error handling: No sensitive information exposed to client
 * 
 * Only accessible to admin users
 * Unauthenticated or unauthorized requests are rejected with 401/403
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession, getAuthToken, createServerSupabaseClient } from '@/lib/auth-server'
import { validateNotification } from '@/lib/schemas'
import { logError, getSafeErrorResponse, PUBLIC_ERRORS } from '@/lib/errors'

// Simple in-memory rate limiting (key: user_id, value: timestamp)
// In production, use Redis or similar
const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT_WINDOW_MS = 60000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || ''
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY || ''

/**
 * Check rate limit for a user
 */
function isRateLimited(userId: string): boolean {
  const now = Date.now()
  const userRequests = rateLimitMap.get(userId) || []

  // Remove requests older than the window
  const recentRequests = userRequests.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS)

  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return true
  }

  // Record this request
  recentRequests.push(now)
  rateLimitMap.set(userId, recentRequests)

  return false
}

export async function POST(request: NextRequest) {
  try {
    // ============================================
    // STEP 1: AUTHENTICATION
    // ============================================
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        getSafeErrorResponse(
          new Error(PUBLIC_ERRORS.UNAUTHORIZED.message)
        ),
        { status: PUBLIC_ERRORS.UNAUTHORIZED.status }
      )
    }

    // ============================================
    // STEP 2: AUTHORIZATION
    // ============================================
    const user = await verifyAdminSession(authHeader)
    if (!user) {
      return NextResponse.json(
        getSafeErrorResponse(
          new Error(PUBLIC_ERRORS.FORBIDDEN.message)
        ),
        { status: PUBLIC_ERRORS.FORBIDDEN.status }
      )
    }

    // ============================================
    // STEP 3: RATE LIMITING
    // ============================================
    if (isRateLimited(user.id)) {
      return NextResponse.json(
        getSafeErrorResponse(
          new Error(PUBLIC_ERRORS.RATE_LIMIT.message)
        ),
        { status: PUBLIC_ERRORS.RATE_LIMIT.status }
      )
    }

    // ============================================
    // STEP 4: REQUEST VALIDATION
    // ============================================
    let body: unknown
    try {
      body = await request.json()
    } catch (error) {
      logError(error as Error, { context: 'Failed to parse JSON', userId: user.id })
      return NextResponse.json(
        getSafeErrorResponse(
          new Error(PUBLIC_ERRORS.VALIDATION_ERROR.message)
        ),
        { status: PUBLIC_ERRORS.VALIDATION_ERROR.status }
      )
    }

    const validation = validateNotification(body)
    if (!validation.success) {
      logError(
        new Error('Validation failed'),
        { context: 'Notification validation', errors: validation.error.errors, userId: user.id }
      )
      return NextResponse.json(
        getSafeErrorResponse(
          new Error(PUBLIC_ERRORS.VALIDATION_ERROR.message)
        ),
        { status: PUBLIC_ERRORS.VALIDATION_ERROR.status }
      )
    }

    // ============================================
    // STEP 5: CONFIGURE NOTIFICATION
    // ============================================
    const payload = validation.data

    // Validate OneSignal configuration
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
      logError(
        new Error('OneSignal not configured'),
        { context: 'Missing OneSignal credentials', userId: user.id }
      )
      return NextResponse.json(
        getSafeErrorResponse(
          new Error(PUBLIC_ERRORS.INTERNAL_ERROR.message)
        ),
        { status: PUBLIC_ERRORS.INTERNAL_ERROR.status }
      )
    }

    // Build OneSignal notification request
    const notificationBody = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: payload.heading || payload.title },
      contents: payload.contents || { en: payload.message },
      data: payload.data || {},
      target_channel: 'push',
      included_segments: ['Subscribed Users'],
    }

    // Add specific recipients if provided
    if (payload.include_external_user_ids && payload.include_external_user_ids.length > 0) {
      Object.assign(notificationBody, {
        include_external_user_ids: payload.include_external_user_ids,
      })
      // Remove included_segments if using specific users
      delete (notificationBody as any).included_segments
    }

    // ============================================
    // STEP 6: SEND NOTIFICATION (Server-side)
    // ============================================
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
      },
      body: JSON.stringify(notificationBody),
    })

    const result = await response.json()

    if (!response.ok) {
      logError(
        new Error('OneSignal API error'),
        { context: 'OneSignal API returned error', status: response.status, result, userId: user.id }
      )
      return NextResponse.json(
        getSafeErrorResponse(
          new Error(PUBLIC_ERRORS.INTERNAL_ERROR.message)
        ),
        { status: PUBLIC_ERRORS.INTERNAL_ERROR.status }
      )
    }

    // ============================================
    // STEP 7: RETURN SUCCESS
    // ============================================
    return NextResponse.json(
      {
        success: true,
        notificationId: result.body?.notification_id || result.id,
        message: 'Notification sent successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    logError(error as Error, { context: 'Unhandled error in send-notification endpoint' })
    return NextResponse.json(
      getSafeErrorResponse(
        new Error(PUBLIC_ERRORS.INTERNAL_ERROR.message)
      ),
      { status: PUBLIC_ERRORS.INTERNAL_ERROR.status }
    )
  }
}
