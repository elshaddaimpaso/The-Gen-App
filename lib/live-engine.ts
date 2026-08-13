// lib/live-engine.ts
import { supabase } from './supabase'
import { Session, LiveStatus } from './types'

export async function getLiveStatus(): Promise<LiveStatus> {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('*')
    .gte('start_time', `${today}T00:00:00`)
    .lt('start_time', `${today}T23:59:59`)
    .order('start_time')

  if (error || !sessions || sessions.length === 0) {
    return { now: null, next: null, later: [] }
  }

  let currentNow: Session | null = null
  let currentNext: Session | null = null
  const later: Session[] = []

  for (let i = 0; i < sessions.length; i++) {
    const session = sessions[i]
    const start = new Date(session.start_time)
    const end = new Date(session.end_time)

    if (start <= now && now <= end) {
      currentNow = session
      for (let j = i + 1; j < sessions.length; j++) {
        if (new Date(sessions[j].start_time) > now) {
          currentNext = sessions[j]
          break
        }
      }
      break
    } else if (start > now) {
      if (!currentNext) {
        currentNext = session
      } else {
        later.push(session)
      }
    }
  }

  return { now: currentNow, next: currentNext, later }
}