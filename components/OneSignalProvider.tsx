// components/OneSignalProvider.tsx
'use client'

import { useEffect } from 'react'
import { initOneSignal } from '@/lib/onesignal'

export function OneSignalProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize OneSignal when the app loads
    initOneSignal()
  }, [])

  return <>{children}</>
}