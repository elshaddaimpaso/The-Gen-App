// components/organiser/ManualCheckIn.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'
import toast from 'react-hot-toast'
import { UserCheck, CheckCircle, AlertTriangle, X, Clock } from 'lucide-react'

export function ManualCheckIn() {
  const [participantId, setParticipantId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    participant: any
    success: boolean
    message: string
  } | null>(null)

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!participantId.trim()) {
      toast.error('Please enter a participant ID')
      return
    }

    setLoading(true)
    try {
      const { data: participant, error } = await supabase
        .from('participants')
        .select('*, groups(name), transport(bus_number)')
        .eq('id', participantId.trim())
        .single()

      if (error || !participant) {
        setResult({
          participant: null,
          success: false,
          message: '❌ Participant not found'
        })
        toast.error('Participant not found')
        return
      }

      if (participant.checked_in) {
        setResult({
          participant,
          success: false,
          message: `⚠️ ${participant.full_name} already checked in`
        })
        toast.error(`${participant.full_name} already checked in`)
        return
      }

      const { error: updateError } = await supabase
        .from('participants')
        .update({
          checked_in: true,
          checked_in_at: new Date().toISOString()
        })
        .eq('id', participant.id)

      if (updateError) throw updateError

      await supabase.from('attendance').insert({
        participant_id: participant.id,
        scanned_at: new Date().toISOString()
      })

      setResult({
        participant,
        success: true,
        message: `✅ ${participant.full_name} checked in!`
      })

      toast.success(`✅ ${participant.full_name} checked in!`)
      setParticipantId('')
    } catch (error) {
      console.error('Check-in error:', error)
      toast.error('Failed to check in')
      setResult({
        participant: null,
        success: false,
        message: '❌ Check-in failed. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <GlassCard dark>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-[#D4AF37]/20">
            <UserCheck size={24} className="text-[#D4AF37]" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Manual Check-In</h3>
            <p className="text-white/40 text-sm">Enter participant ID to check them in</p>
          </div>
        </div>

        <form onSubmit={handleCheckIn} className="flex gap-2">
          <input
            type="text"
            value={participantId}
            onChange={(e) => setParticipantId(e.target.value)}
            placeholder="Enter participant ID"
            className="input-gold flex-1"
          />
          <GoldButton type="submit" loading={loading}>
            Check In
          </GoldButton>
        </form>

        <p className="text-white/20 text-xs mt-3">
          You can find participant IDs on the "Me" page of each participant
        </p>
      </GlassCard>

      {result && (
        <GlassCard 
          dark 
          className={result.success ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}
        >
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle size={24} className="text-green-500 flex-shrink-0 mt-1" />
            ) : (
              <AlertTriangle size={24} className="text-red-500 flex-shrink-0 mt-1" />
            )}
            <div className="flex-1">
              <p className={`font-semibold ${result.success ? 'text-green-500' : 'text-red-500'}`}>
                {result.message}
              </p>
              {result.participant && (
                <div className="mt-2 space-y-1 text-sm">
                  <p className="text-white font-medium">{result.participant.full_name}</p>
                  {result.participant.groups && (
                    <p className="text-white/60">Group: {result.participant.groups.name}</p>
                  )}
                  {result.participant.transport && (
                    <p className="text-white/60">Bus: {result.participant.transport.bus_number}</p>
                  )}
                  <p className="text-white/40 text-xs">{new Date().toLocaleTimeString()}</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setResult(null)}
              className="text-white/30 hover:text-white/60 transition-colors p-1"
            >
              <X size={16} />
            </button>
          </div>
        </GlassCard>
      )}
    </div>
  )
}