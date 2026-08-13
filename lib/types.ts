// lib/types.ts

export interface Participant {
  id: string
  user_id: string
  full_name: string
  university: string | null
  phone: string | null
  group_id: string | null
  transport_id: string | null
  qr_code_hash: string | null
  checked_in: boolean
  checked_in_at: string | null
  dietary_restrictions: string | null
  emergency_contact: string | null
  created_at: string
  groups?: Group
  transport?: Transport
}

export interface Group {
  id: string
  name: string
  leader_name: string | null
  color: string
  created_at: string
}

export interface Transport {
  id: string
  bus_number: string
  capacity: number
  departure_time: string | null
  meeting_point: string | null
  status: string
  created_at: string
}

export interface Session {
  id: string
  day: number
  title: string
  location: string | null
  start_time: string
  end_time: string
  description: string | null
  speaker: string | null
  session_type: string | null
  color: string
  created_at: string
}

export interface Announcement {
  id: string
  title: string
  message: string
  priority: boolean
  published_at: string
  expires_at: string | null
}

export interface HelpRequest {
  id: string
  participant_id: string
  category: string
  message: string
  status: 'pending' | 'assigned' | 'resolved'
  assigned_to: string | null
  resolved_at: string | null
  created_at: string
}

export interface Attendance {
  id: string
  participant_id: string
  session_id: string
  scanned_at: string
}

export interface LiveStatus {
  now: Session | null
  next: Session | null
  later: Session[]
}

export interface DashboardStats {
  totalParticipants: number
  checkedIn: number
  attendancePercentage: number
  activeBuses: number
  pendingHelpRequests: number
}