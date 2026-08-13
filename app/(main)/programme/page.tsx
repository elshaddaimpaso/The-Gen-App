// app/(main)/programme/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Session } from '@/lib/types'
import { GlassCard } from '@/components/ui/GlassCard'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { ProgrammeSkeleton } from '@/components/ui/LoadingSkeleton'
import { MapPin, Clock, User, CheckCircle, Calendar } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default function ProgrammePage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedDay, setSelectedDay] = useState(1)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [selectedDay])

  async function fetchSessions() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('day', selectedDay)
        .order('start_time')

      if (error) throw error
      if (data) setSessions(data)
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  function getSessionStatus(session: Session): 'past' | 'current' | 'upcoming' {
    const start = new Date(session.start_time)
    const end = new Date(session.end_time)
    
    if (end < currentTime) return 'past'
    if (start <= currentTime && currentTime <= end) return 'current'
    return 'upcoming'
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const days = [1, 2, 3, 4, 5]
  const dayNames = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5']

  if (loading) return <ProgrammeSkeleton />

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0A0A] via-[#0A0A0A] to-[#1A1A1A] p-4 pb-24">
      <AnimatedSection>
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={24} className="text-[#D4AF37]" />
          <h1 className="text-2xl font-bold text-white">Programme</h1>
        </div>
      </AnimatedSection>

      {/* Day Selector */}
      <AnimatedSection delay={0.1}>
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
          {days.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`
                px-4 py-2 rounded-xl font-medium transition-all duration-300 whitespace-nowrap
                ${selectedDay === day 
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#8B7500] text-black shadow-[0_4px_25px_rgba(212,175,55,0.35)]' 
                  : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
                }
              `}
            >
              {dayNames[day - 1]}
            </button>
          ))}
        </div>
      </AnimatedSection>

      {/* Sessions List */}
      <div className="space-y-3">
        {sessions.length === 0 ? (
          <GlassCard dark>
            <p className="text-white/60 text-center py-4">No sessions for this day</p>
          </GlassCard>
        ) : (
          sessions.map((session, index) => {
            const status = getSessionStatus(session)
            const isCurrent = status === 'current'
            const isPast = status === 'past'

            return (
              <AnimatedSection key={session.id} delay={index * 0.05}>
                <GlassCard 
                  dark 
                  className={`
                    ${isCurrent ? 'border-l-4 border-[#D4AF37] shadow-[0_4px_25px_rgba(212,175,55,0.15)]' : ''}
                    ${isPast ? 'opacity-60' : ''}
                  `}
                  hover={!isPast}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-semibold ${isPast ? 'text-white/50' : 'text-white'}`}>
                          {session.title}
                        </h3>
                        {isCurrent && (
                          <span className="text-[10px] bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded-full animate-pulse">
                            ● LIVE
                          </span>
                        )}
                        {isPast && (
                          <CheckCircle size={14} className="text-green-500" />
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-3 mt-2 text-sm">
                        {session.location && (
                          <span className="flex items-center gap-1 text-white/50">
                            <MapPin size={14} /> {session.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-white/50">
                          <Clock size={14} /> {formatTime(session.start_time)} - {formatTime(session.end_time)}
                        </span>
                      </div>

                      {session.speaker && (
                        <p className="text-sm text-[#D4AF37]/70 mt-2 flex items-center gap-1">
                          <User size={14} /> Speaker: {session.speaker}
                        </p>
                      )}

                      {session.description && (
                        <p className="text-sm text-white/40 mt-2">{session.description}</p>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </AnimatedSection>
            )
          })
        )}
      </div>
    </div>
  )
}