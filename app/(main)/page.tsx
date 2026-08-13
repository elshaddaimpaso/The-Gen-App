// app/(main)/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase, getParticipant } from '@/lib/supabase'
import { getLiveStatus } from '@/lib/live-engine'
import { Announcement, LiveStatus, Participant } from '@/lib/types'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { LiveStatusCard } from '@/components/home/LiveStatusCard'
import { AnnouncementCard } from '@/components/home/AnnouncementCard'
import { motion } from 'framer-motion'
import { LogOut } from 'lucide-react'
import toast from 'react-hot-toast'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default function HomePage() {
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [liveStatus, setLiveStatus] = useState<LiveStatus>({ now: null, next: null, later: [] })
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => {
      getLiveStatus().then(setLiveStatus)
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const p = await getParticipant(user.id)
        if (p) setParticipant(p)
      }

      const [status, announcementsData] = await Promise.all([
        getLiveStatus(),
        supabase
          .from('announcements')
          .select('*')
          .order('priority', { ascending: false })
          .order('published_at', { ascending: false })
          .limit(3)
      ])

      setLiveStatus(status)
      if (announcementsData.data) setAnnouncements(announcementsData.data)
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast.success('Signed out')
    window.location.reload()
  }

  if (loading) return <LoadingSkeleton />

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0A0A] via-[#0A0A0A] to-[#1A1A1A] pb-24">
      <div className="p-4 space-y-4 max-w-md mx-auto">
        {/* Hero Section - Simple Logo */}
        <AnimatedSection>
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="w-24 h-24 mx-auto mb-3"
            >
              <div className="w-24 h-24 rounded-full bg-[#D4AF37]/20 border-2 border-[#D4AF37] flex items-center justify-center mx-auto">
                <span className="text-4xl font-bold text-[#D4AF37]">G</span>
              </div>
            </motion.div>
            
            <h1 className="text-2xl font-bold text-white">
              Good {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'}, {participant?.full_name?.split(' ')[0] || 'Guest'} 👋
            </h1>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="inline-block w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse"></span>
              <p className="text-[#D4AF37]/60 text-sm">
                DAY {getCurrentDay()} • RETREAT 2026
              </p>
            </div>
            
            <button
              onClick={handleSignOut}
              className="text-white/30 hover:text-[#D4AF37] transition-colors text-sm mt-2 flex items-center gap-1 mx-auto"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </AnimatedSection>

        {/* Live Status */}
        <AnimatedSection delay={0.1}>
          <LiveStatusCard now={liveStatus.now} next={liveStatus.next} />
        </AnimatedSection>

        {/* Announcements */}
        {announcements.length > 0 && (
          <AnimatedSection delay={0.2}>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-[#D4AF37]/10"></div>
                <h3 className="text-xs font-semibold text-[#D4AF37]/60 uppercase tracking-wider flex items-center gap-1">
                  <span>📢</span> Latest Announcements
                </h3>
                <div className="h-px flex-1 bg-[#D4AF37]/10"></div>
              </div>
              {announcements.map((announcement, index) => (
                <AnnouncementCard key={announcement.id} announcement={announcement} index={index} />
              ))}
            </div>
          </AnimatedSection>
        )}

        <div className="h-4"></div>
      </div>
    </div>
  )
}

function getCurrentDay() {
  const startDate = new Date('2026-08-13')
  const now = new Date()
  const diff = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  return Math.min(Math.max(diff + 1, 1), 5)
}