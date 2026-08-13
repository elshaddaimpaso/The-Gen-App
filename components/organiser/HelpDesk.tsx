// components/organiser/HelpDesk.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'
import toast from 'react-hot-toast'
import { 
  LifeBuoy, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  User,
  RefreshCw
} from 'lucide-react'

const categoryLabels: Record<string, string> = {
  transport: '🚌 Transport',
  registration: '📝 Registration',
  'lost-item': '🔍 Lost Item',
  medical: '🏥 Medical',
  programme: '📅 Programme',
  group: '👥 Group',
  other: '📌 Other'
}

export function HelpDesk() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchRequests()
    const interval = setInterval(fetchRequests, 10000)
    return () => clearInterval(interval)
  }, [])

  async function fetchRequests() {
    try {
      const { data, error } = await supabase
        .from('help_requests')
        .select('*, participants(full_name)')
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setRequests(data)
    } catch (error) {
      console.error('Error fetching help requests:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  async function resolveRequest(id: string) {
    try {
      const { error } = await supabase
        .from('help_requests')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      toast.success('✅ Request resolved')
      await fetchRequests()
    } catch (error) {
      console.error('Error resolving request:', error)
      toast.error('Failed to resolve request')
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchRequests()
    toast.success('Help desk updated')
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const resolvedRequests = requests.filter(r => r.status === 'resolved')

  if (loading) {
    return (
      <GlassCard dark>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#D4AF37] border-t-transparent"></div>
        </div>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LifeBuoy size={20} className="text-[#D4AF37]" />
          <h3 className="text-white font-semibold">Help Requests</h3>
          {pendingRequests.length > 0 && (
            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full animate-pulse">
              {pendingRequests.length} pending
            </span>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-white/40 hover:text-[#D4AF37] transition-colors p-1"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <GlassCard dark className="text-center py-3">
          <Clock size={20} className="text-yellow-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-white">{pendingRequests.length}</p>
          <p className="text-white/40 text-xs">Pending</p>
        </GlassCard>
        <GlassCard dark className="text-center py-3">
          <CheckCircle size={20} className="text-green-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-white">{resolvedRequests.length}</p>
          <p className="text-white/40 text-xs">Resolved</p>
        </GlassCard>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {requests.length === 0 ? (
          <GlassCard dark>
            <p className="text-white/30 text-sm text-center py-4">No help requests</p>
          </GlassCard>
        ) : (
          requests.map((request) => {
            const isPending = request.status === 'pending'
            return (
              <GlassCard 
                key={request.id} 
                dark
                className={`
                  ${isPending ? 'border-l-4 border-yellow-500' : 'border-l-4 border-green-500/30 opacity-70'}
                `}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">
                            {categoryLabels[request.category] || request.category}
                          </span>
                          {isPending ? (
                            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <AlertCircle size={10} />
                              Pending
                            </span>
                          ) : (
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle size={10} />
                              Resolved
                            </span>
                          )}
                        </div>
                        <p className="text-white/80 text-sm mt-1">{request.message}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                          <span className="flex items-center gap-1">
                            <User size={12} /> {request.participants?.full_name || 'Unknown'}
                          </span>
                          <span>
                            {new Date(request.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {isPending && (
                    <GoldButton
                      onClick={() => resolveRequest(request.id)}
                      className="text-xs px-3 py-1.5"
                    >
                      <CheckCircle size={14} />
                      Resolve
                    </GoldButton>
                  )}
                </div>
              </GlassCard>
            )
          })
        )}
      </div>
    </div>
  )
}