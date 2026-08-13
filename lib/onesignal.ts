// lib/onesignal.ts
'use client'

export const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || ''
export const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY || ''

// Initialize OneSignal on the client side
export function initOneSignal() {
  if (typeof window === 'undefined') return

  // @ts-ignore
  if (window.OneSignal) return

  const script = document.createElement('script')
  script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'
  script.async = true
  document.head.appendChild(script)

  script.onload = () => {
    // @ts-ignore
    window.OneSignal = window.OneSignal || []
    // @ts-ignore
    window.OneSignal.push(() => {
      // @ts-ignore
      window.OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true,
        autoRegister: true,
        notifyButton: {
          enable: true,
        },
      })
    })
  }
}

// Subscribe user to notifications
export function subscribeToNotifications(email: string, userId: string) {
  if (typeof window === 'undefined') return

  // @ts-ignore
  if (!window.OneSignal) return

  // @ts-ignore
  window.OneSignal.push(() => {
    // @ts-ignore
    window.OneSignal.sendTag('user_id', userId)
    // @ts-ignore
    window.OneSignal.sendTag('user_email', email)
    // @ts-ignore
    window.OneSignal.getUserId((userId: string) => {
      console.log('OneSignal User ID:', userId)
    })
  })
}

// Unsubscribe from notifications
export function unsubscribeFromNotifications() {
  if (typeof window === 'undefined') return

  // @ts-ignore
  if (!window.OneSignal) return

  // @ts-ignore
  window.OneSignal.push(() => {
    // @ts-ignore
    window.OneSignal.setSubscription(false)
  })
}

// Send notification
export async function sendPushNotification(title: string, message: string, data?: any) {
  try {
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        message,
        data,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to send notification')
    }

    return await response.json()
  } catch (error) {
    console.error('Error sending push notification:', error)
    return null
  }
}