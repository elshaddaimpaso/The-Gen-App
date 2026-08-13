// components/home/LiveStatusCard.tsx
'use client'

import { motion } from 'framer-motion'
import { Session } from '@/lib/types'
import { MapPin, Clock, User } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'

interface LiveStatusCardProps {
  now: Session | null
  next: Session | null
}

export function LiveStatusCard({ now, next }: LiveStatusCardProps) {
  if (now) {
    return (
      <GlassCard dark>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-xs font-semibold text-red-500 uppercase tracking-wider">
              LIVE NOW
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">{now.title}</h2>
          <div className="flex flex-wrap gap-4 text-sm text-white/70">
            {now.location && (
              <span className="flex items-center gap-1">
                <MapPin size={16} /> {now.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={16} />
              {new Date(now.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - {new Date(now.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
            </span>
          </div>
          {now.speaker && (
            <p className="text-sm text-[#D4AF37] flex items-center gap-1">
              <User size={14} /> Speaker: {now.speaker}
            </p>
          )}
        </motion.div>
      </GlassCard>
    )
  }

  if (next) {
    return (
      <GlassCard dark>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider">
              UP NEXT
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">{next.title}</h2>
          <div className="flex flex-wrap gap-4 text-sm text-white/70">
            {next.location && (
              <span className="flex items-center gap-1">
                <MapPin size={16} /> {next.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={16} /> {new Date(next.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
            </span>
          </div>
          <div className="text-[#D4AF37] font-medium">
            Starts in {getTimeUntil(next.start_time)}
          </div>
        </motion.div>
      </GlassCard>
    )
  }

  return (
    <GlassCard dark>
      <div className="text-center py-4">
        <p className="text-white/70">No sessions scheduled</p>
        <p className="text-sm text-white/40">Enjoy your retreat!</p>
      </div>
    </GlassCard>
  )
}

function getTimeUntil(dateStr: string) {
  const target = new Date(dateStr)
  const now = new Date()
  const diff = target.getTime() - now.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}