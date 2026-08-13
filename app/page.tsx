// app/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AuthForm from '@/components/auth/AuthForm'
import HomePage from '@/app/(main)/page'
import { Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

// Local admin check function
function isAdmin(email: string | undefined): boolean {
  const ADMIN_EMAILS = [
    'gizmokzu@gmail.com',
    'joelkaudzu9@gmail.com',
    'elshaddaimpaso@gmail.com',
  ]
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

export default function RootPage() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSession()
  }, [])

  async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession()
    setSession(session)
    setLoading(false)

    if (session?.user) {
      const admin = isAdmin(session.user.email)
      if (admin) {
        router.push('/dashboard')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D4AF37] border-t-transparent"></div>
      </div>
    )
  }

  if (!session) {
    return <AuthForm mode="login" onSuccess={() => window.location.reload()} />
  }

  return <HomePage />
}