// app/(organiser)/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { GlassCard } from '@/components/ui/GlassCard'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { 
  Users, 
  UserCheck, 
  Bus, 
  LifeBuoy, 
  Calendar,
  RefreshCw,
  Eye,
  CheckCircle,
  Clock,
  Camera
} from 'lucide-react'
import { QRScanner } from '@/components/organiser/QRScanner'
import { AnnouncementPublisher } from '@/components/organiser/AnnouncementPublisher'
import { HelpDesk } from '@/components/organiser/HelpDesk'
import toast from 'react-hot-toast'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

interface DashboardStats {
  totalParticipants: number
  checkedIn: number
  attendancePercentage: number
  activeBuses: number
  pendingHelpRequests: number
  currentSession: any
  nextSession: any
}

const defaultStats: DashboardStats = {
  totalParticipants: 0,
  checkedIn: 0,
  attendancePercentage: 0,
  activeBuses: 0,
  pendingHelpRequests: 0,
  currentSession: null,
  nextSession: null
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(defaultStats)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'scanner' | 'announcements' | 'help'>('overview')

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchStats() {
    try {
      const { count: totalParticipants } = await supabase
        .from('participants')
        .select('*', { count: 'exact', head: true })

      const { count: checkedIn } = await supabase
        .from('participants')
        .select('*', { count: 'exact', head: true })
        .eq('checked_in', true)

      const { count: pendingHelp } = await supabase
        .from('help_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      const { count: activeBuses } = await supabase
        .from('transport')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      const now = new Date().toISOString()
      const { data: currentSession } = await supabase
        .from('sessions')
        .select('*')
        .lte('start_time', now)
        .gte('end_time', now)
        .maybeSingle()

      const { data: nextSession } = await supabase
        .from('sessions')
        .select('*')
        .gt('start_time', now)
        .order('start_time')
        .limit(1)
        .maybeSingle()

      const total = totalParticipants || 0
      const checked = checkedIn || 0

      setStats({
        totalParticipants: total,
        checkedIn: checked,
        attendancePercentage: total > 0 ? Math.round((checked / total) * 100) : 0,
        activeBuses: activeBuses || 0,
        pendingHelpRequests: pendingHelp || 0,
        currentSession: currentSession || null,
        nextSession: nextSession || null,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchStats()
    toast.success('Dashboard updated')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D4AF37] border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-white/40 text-xs">Updated: {new Date().toLocaleTimeString()}</span>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-white/40 hover:text-[#D4AF37] transition-colors p-1"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats - Compact */}
      <div className="grid grid-cols-2 gap-3">
        <GlassCard dark className="text-center py-3">
          <Users size={20} className="text-[#D4AF37] mx-auto mb-1" />
          <p className="text-xl font-bold text-white">{stats.totalParticipants || 0}</p>
          <p className="text-white/40 text-xs">Total</p>
        </GlassCard>

        <GlassCard dark className="text-center py-3">
          <UserCheck size={20} className="text-green-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-white">{stats.checkedIn || 0}</p>
          <p className="text-white/40 text-xs">Checked In</p>
          <p className="text-[10px] text-green-500">{stats.attendancePercentage || 0}%</p>
        </GlassCard>

        <GlassCard dark className="text-center py-3">
          <Bus size={20} className="text-blue-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-white">{stats.activeBuses || 0}</p>
          <p className="text-white/40 text-xs">Buses</p>
        </GlassCard>

        <GlassCard dark className="text-center py-3 relative">
          <LifeBuoy size={20} className={`mx-auto mb-1 ${(stats.pendingHelpRequests || 0) > 0 ? 'text-red-500' : 'text-[#D4AF37]'}`} />
          <p className="text-xl font-bold text-white">{stats.pendingHelpRequests || 0}</p>
          <p className="text-white/40 text-xs">Help</p>
          {(stats.pendingHelpRequests || 0) > 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
        </GlassCard>
      </div>

      {/* Current Session - Compact */}
      {stats.currentSession && (
        <GlassCard dark className="py-3 px-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#D4AF37]/10">
              <Calendar size={18} className="text-[#D4AF37]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/40 text-[10px] uppercase tracking-wider">Now</p>
              <p className="text-white font-semibold text-sm truncate">{stats.currentSession.title}</p>
              <p className="text-white/40 text-xs">
                {stats.currentSession.location} • {new Date(stats.currentSession.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
              </p>
            </div>
            <span className="flex items-center gap-1 text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              LIVE
            </span>
          </div>
        </GlassCard>
      )}

      {/* Tabs - Compact */}
      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'overview', label: '📊' },
          { id: 'scanner', label: '📷' },
          { id: 'announcements', label: '📢' },
          { id: 'help', label: '🆘' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap
              ${activeTab === tab.id 
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#8B7500] text-black shadow-[0_4px_25px_rgba(212,175,55,0.35)]' 
                : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-2">
        {activeTab === 'overview' && (
          <GlassCard dark>
            <div className="flex items-center justify-between">
              <span className="text-white/40 text-xs">Attendance</span>
              <span className="text-white/60 text-sm font-medium">{stats.attendancePercentage || 0}%</span>
            </div>
            <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#D4AF37] to-[#8B7500] rounded-full transition-all duration-500"
                style={{ width: `${stats.attendancePercentage || 0}%` }}
              />
            </div>
            <p className="text-white/40 text-xs mt-1">{stats.checkedIn || 0} of {stats.totalParticipants || 0} checked in</p>
          </GlassCard>
        )}

        {activeTab === 'scanner' && <QRScanner />}
        {activeTab === 'announcements' && <AnnouncementPublisher />}
        {activeTab === 'help' && <HelpDesk />}
      </div>
    </div>
  )
}