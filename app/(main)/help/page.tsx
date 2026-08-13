// app/(main)/help/page.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { GlassCard } from '@/components/ui/GlassCard'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { GoldButton } from '@/components/ui/GoldButton'
import toast from 'react-hot-toast'
import { LifeBuoy, Send } from 'lucide-react'

const categories = [
  { value: 'transport', label: '🚌 Transport' },
  { value: 'registration', label: '📝 Registration' },
  { value: 'lost-item', label: '🔍 Lost Item' },
  { value: 'medical', label: '🏥 Medical Assistance' },
  { value: 'programme', label: '📅 Programme' },
  { value: 'group', label: '👥 Group' },
  { value: 'other', label: '📌 Other' },
]

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'


export default function HelpPage() {
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!category || !message) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: participant } = await supabase
        .from('participants')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!participant) throw new Error('Participant not found')

      const { error } = await supabase
        .from('help_requests')
        .insert({
          participant_id: participant.id,
          category,
          message,
          status: 'pending',
        })

      if (error) throw error

      toast.success('Help request submitted! 📨')
      setCategory('')
      setMessage('')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0A0A] via-[#0A0A0A] to-[#1A1A1A] p-4 pb-24">
      <AnimatedSection>
        <h1 className="text-2xl font-bold text-white mb-4">Get Help</h1>
      </AnimatedSection>

      <AnimatedSection delay={0.1}>
        <GlassCard dark>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-[#D4AF37]/20">
              <LifeBuoy size={24} className="text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="text-white font-semibold">How can we help?</h2>
              <p className="text-white/40 text-sm">We'll respond as soon as possible</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-gold"
                required
              >
                <option value="" className="text-black">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value} className="text-black">
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-1">
                Describe your issue
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="input-gold"
                placeholder="Please describe what you need help with..."
                rows={4}
                required
                style={{ minHeight: '120px', resize: 'vertical' }}
              />
            </div>

            <GoldButton
              type="submit"
              loading={loading}
              fullWidth
              className="flex items-center justify-center gap-2"
            >
              <Send size={18} />
              Submit Request
            </GoldButton>
          </form>
        </GlassCard>
      </AnimatedSection>

      <AnimatedSection delay={0.2}>
        <p className="text-white/20 text-xs text-center mt-4">
          Your request will be sent to the retreat organisers
        </p>
      </AnimatedSection>
    </div>
  )
}