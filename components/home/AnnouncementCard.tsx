// components/home/AnnouncementCard.tsx
'use client'

import { Announcement } from '@/lib/types'
import { GlassCard } from '@/components/ui/GlassCard'
import { motion } from 'framer-motion'
import { Bell } from 'lucide-react'

interface AnnouncementCardProps {
  announcement: Announcement
  index: number
}

export function AnnouncementCard({ announcement, index }: AnnouncementCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <GlassCard
        dark
        className={announcement.priority ? 'border-l-4 border-[#D4AF37]' : ''}
        hover={false}
      >
        <div className="flex items-start gap-3">
          <Bell size={20} className={announcement.priority ? 'text-[#D4AF37]' : 'text-white/40'} />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-white">{announcement.title}</h4>
              {announcement.priority && (
                <span className="text-[10px] bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded-full">
                  Important
                </span>
              )}
            </div>
            <p className="text-sm text-white/70 mt-1">{announcement.message}</p>
            <p className="text-xs text-white/30 mt-2">
              {new Date(announcement.published_at).toLocaleString()}
            </p>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  )
}