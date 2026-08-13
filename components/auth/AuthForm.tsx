// components/auth/AuthForm.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { GoldButton } from '@/components/ui/GoldButton'
import { GlassCard } from '@/components/ui/GlassCard'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'
import { initOneSignal, subscribeToNotifications } from '@/lib/onesignal'

const ADMIN_EMAILS = [
    'gizmokzu@gmail.com',
    'joelkaudzu9@gmail.com',
    'elshaddaimpaso@gmail.com',
]

function isAdmin(email: string | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

// ============================================
// AUTH FORM COMPONENT
// ============================================
interface AuthFormProps {
  mode: 'login' | 'register'
  onSuccess?: () => void
}

export default function AuthForm({ mode, onSuccess }: AuthFormProps) {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [imageError, setImageError] = useState(false)

  // ============================================
  // HANDLE FORM SUBMISSION
  // ============================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === 'login') {
        // ============================================
        // LOGIN
        // ============================================
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error

        // Check if user is admin
        const userEmail = data.user?.email
        const admin = isAdmin(userEmail)

        if (admin) {
          toast.success('👋 Welcome Admin! Redirecting to dashboard...', {
            duration: 3000,
            style: {
              background: '#0A0A0A',
              color: '#D4AF37',
              border: '1px solid rgba(212, 175, 55, 0.3)',
            },
          })
          // Redirect to dashboard
          setTimeout(() => {
            window.location.href = '/dashboard'
          }, 500)
          return
        }

        // Regular user
        toast.success('Welcome back! 👋')
        initOneSignal()
        subscribeToNotifications(email, data.user.id)
        onSuccess?.()
      } else {
        // ============================================
        // REGISTER
        // ============================================
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        })
        if (error) throw error

        // Create participant record via RPC (security definer bypasses RLS)
        if (data.user) {
          const { error: insertError } = await supabase
            .rpc('create_participant', {
              p_user_id: data.user.id,
              p_full_name: fullName,
            })

          if (insertError) throw insertError
        }

        toast.success('Account created! Please sign in. 🎉')
        initOneSignal()
        subscribeToNotifications(email, data.user?.id || '')
        setTimeout(() => {
          window.location.href = '/login'
        }, 1500)
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0A0A0A]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <GlassCard dark className="p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="relative w-20 h-20 mx-auto mb-4">
              {!imageError ? (
                <Image
                  src="/logo-gold.png"
                  alt="THE GEN-APP Logo"
                  width={80}
                  height={80}
                  className="w-20 h-20 object-contain"
                  priority
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#D4AF37]/20 border-2 border-[#D4AF37] flex items-center justify-center mx-auto">
                  <span className="text-3xl font-bold text-[#D4AF37]">G</span>
                </div>
              )}
            </div>
            <h1 className="text-3xl font-bold text-[#D4AF37]">THE GEN-APP</h1>
            <p className="text-white/60 mt-1 text-sm">Generation Family Retreat 2026</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name - Only for Register */}
            {mode === 'register' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                <label className="block text-white/80 text-sm font-medium mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-gold"
                  placeholder="Enter your full name"
                  required={mode === 'register'}
                />
              </motion.div>
            )}

            {/* Email */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-gold"
                placeholder="you@example.com"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-gold pr-12"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <GoldButton type="submit" loading={loading} fullWidth>
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </GoldButton>
          </form>

          {/* Toggle between Login/Register */}
          <div className="mt-6 text-center">
            <p className="text-white/40 text-sm">
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => window.location.href = mode === 'login' ? '/register' : '/login'}
                className="text-[#D4AF37] hover:underline transition-colors font-medium"
              >
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>

          {/* Admin Hint - Only shown if trying to access admin */}
          {mode === 'login' && (
            <div className="mt-4 text-center">
              <p className="text-white/20 text-xs">
                🔐 Admin users will be redirected to the dashboard
              </p>
            </div>
          )}
        </GlassCard>
      </motion.div>
    </div>
  )
}