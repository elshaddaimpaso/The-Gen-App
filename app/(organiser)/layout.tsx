// app/(organiser)/layout.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Shield } from 'lucide-react'
import toast from 'react-hot-toast'

function isAdmin(email: string | undefined): boolean {
  const ADMIN_EMAILS = [
    'gizmokzu@gmail.com',
    'joelkaudzu9@gmail.com',
    'elshaddaimpaso@gmail.com',
  ]
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

export default function OrganiserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    checkAccess()
  }, [])

  async function checkAccess() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const admin = isAdmin(user.email)
      
      if (!admin) {
        toast.error('Access denied. Admin only.')
        router.push('/')
        return
      }

      setAuthorized(true)
    } catch (error) {
      console.error('Access denied:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D4AF37] border-t-transparent"></div>
      </div>
    )
  }

  if (!authorized) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield size={28} className="text-[#D4AF37]" />
            <h1 className="text-2xl font-bold text-white">Organiser Dashboard</h1>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              router.push('/login')
            }}
            className="text-white/40 hover:text-[#D4AF37] transition-colors text-sm"
          >
            Sign Out
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}