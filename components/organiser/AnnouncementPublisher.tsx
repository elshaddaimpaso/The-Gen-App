// components/organiser/AnnouncementPublisher.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'
import { sendPushNotification } from '@/lib/onesignal'
import toast from 'react-hot-toast'
import { Send, Bell, Star } from 'lucide-react'

export function AnnouncementPublisher() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sendingPush, setSendingPush] = useState(false)
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true)

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  async function fetchAnnouncements() {
    try {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(10)
      if (data) setAnnouncements(data)
    } catch (error) {
      console.error('Error fetching announcements:', error)
    } finally {
      setLoadingAnnouncements(false)
    }
  }

  async function publishAnnouncement(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !message.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)
    setSendingPush(true)
    try {
      // Save to database
      const { data, error } = await supabase
        .from('announcements')
        .insert({
          title: title.trim(),
          message: message.trim(),
          priority: priority,
          published_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Send push notification
      const pushResult = await sendPushNotification(
        title.trim(),
        message.trim(),
        { announcementId: data.id, priority }
      )

      if (pushResult?.success) {
        toast.success('📢 Announcement published! Push notification sent.')
      } else {
        toast.success('📢 Announcement published! (Push notification failed)')
      }

      setTitle('')
      setMessage('')
      setPriority(false)
      await fetchAnnouncements()
    } catch (error) {
      console.error('Error publishing announcement:', error)
      toast.error('Failed to publish announcement')
    } finally {
      setLoading(false)
      setSendingPush(false)
    }
  }

  return (
    <div className="space-y-4">
      <GlassCard dark>
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Send size={20} className="text-[#D4AF37]" />
          Publish Announcement
        </h3>

        <form onSubmit={publishAnnouncement} className="space-y-4">
          <div>
            <label className="block text-white/80 text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-gold"
              placeholder="Announcement title"
              required
            />
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="input-gold"
              placeholder="Write your announcement..."
              rows={3}
              required
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={priority}
                onChange={(e) => setPriority(e.target.checked)}
                className="w-4 h-4 accent-[#D4AF37]"
              />
              <span className="text-white/60 text-sm flex items-center gap-1">
                <Star size={14} className={priority ? 'text-[#D4AF37]' : ''} />
                Priority
              </span>
            </label>
            <span className="text-xs text-white/20">
              {priority ? 'Will send push notification' : 'Will send push notification'}
            </span>
          </div>

          <GoldButton type="submit" loading={loading} fullWidth>
            <Send size={18} />
            {sendingPush ? 'Publishing & Sending...' : 'Publish Announcement'}
          </GoldButton>
        </form>
      </GlassCard>

      <GlassCard dark>
        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Bell size={16} className="text-[#D4AF37]" />
          Recent Announcements
        </h4>

        {loadingAnnouncements ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#D4AF37] border-t-transparent mx-auto"></div>
          </div>
        ) : announcements.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-4">No announcements yet</p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className={`p-3 rounded-xl bg-white/5 border ${
                  announcement.priority ? 'border-[#D4AF37]/30' : 'border-white/5'
                }`}
              >
                <div className="flex items-start justify-between">
                  <h5 className="text-white font-medium text-sm">
                    {announcement.title}
                    {announcement.priority && (
                      <span className="ml-2 text-xs bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded-full">
                        Priority
                      </span>
                    )}
                  </h5>
                  <span className="text-white/30 text-xs">
                    {new Date(announcement.published_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-white/60 text-sm mt-1">{announcement.message}</p>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}