-- ============================================================
-- THE GEN-APP — Supabase Database Schema
-- Generation Family Retreat 2026
-- Paste this entire file into: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- 2. TABLES
-- ============================================================

-- ---------- GROUPS ----------
create table if not exists public.groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  leader_name text,
  color text not null default '#D4AF37',
  created_at timestamptz not null default now()
);

-- ---------- TRANSPORT ----------
create table if not exists public.transport (
  id uuid primary key default uuid_generate_v4(),
  bus_number text not null,
  capacity integer not null default 0,
  departure_time timestamptz,
  meeting_point text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

-- ---------- PARTICIPANTS ----------
create table if not exists public.participants (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  full_name text not null,
  university text,
  phone text,
  group_id uuid references public.groups(id) on delete set null,
  transport_id uuid references public.transport(id) on delete set null,
  qr_code_hash text,
  checked_in boolean not null default false,
  checked_in_at timestamptz,
  dietary_restrictions text,
  emergency_contact text,
  role text not null default 'participant',
  created_at timestamptz not null default now(),
  unique (user_id)
);

-- ---------- SESSIONS ----------
create table if not exists public.sessions (
  id uuid primary key default uuid_generate_v4(),
  day integer not null,
  title text not null,
  location text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  description text,
  speaker text,
  session_type text,
  color text not null default '#D4AF37',
  created_at timestamptz not null default now()
);

-- ---------- ANNOUNCEMENTS ----------
create table if not exists public.announcements (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  message text not null,
  priority boolean not null default false,
  published_at timestamptz not null default now(),
  expires_at timestamptz
);

-- ---------- HELP REQUESTS ----------
create table if not exists public.help_requests (
  id uuid primary key default uuid_generate_v4(),
  participant_id uuid references public.participants(id) on delete cascade,
  category text not null,
  message text not null,
  status text not null default 'pending'
    check (status in ('pending', 'assigned', 'resolved')),
  assigned_to uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- ATTENDANCE ----------
create table if not exists public.attendance (
  id uuid primary key default uuid_generate_v4(),
  participant_id uuid references public.participants(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete set null,
  scanned_at timestamptz not null default now()
);

-- ============================================================
-- 3. INDEXES (for performance)
-- ============================================================
create index if not exists idx_participants_user_id on public.participants(user_id);
create index if not exists idx_participants_group_id on public.participants(group_id);
create index if not exists idx_participants_transport_id on public.participants(transport_id);
create index if not exists idx_participants_checked_in on public.participants(checked_in);
create index if not exists idx_sessions_day on public.sessions(day);
create index if not exists idx_sessions_start_time on public.sessions(start_time);
create index if not exists idx_announcements_published_at on public.announcements(published_at);
create index if not exists idx_help_requests_status on public.help_requests(status);
create index if not exists idx_help_requests_participant on public.help_requests(participant_id);
create index if not exists idx_attendance_participant on public.attendance(participant_id);
create index if not exists idx_attendance_scanned_at on public.attendance(scanned_at);

-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from auth.users
    where id = auth.uid()
      and lower(email) in (
        'gizmokzu@gmail.com',
        'joelkaudzu9@gmail.com',
        'elshaddaimpaso@gmail.com'
      )
  );
$$;

-- Helper: get the participant id for the current user
create or replace function public.current_participant_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id
  from public.participants
  where user_id = auth.uid()
  limit 1;
$$;

-- ============================================================
-- RPC: CREATE PARTICIPANT
-- Bypasses RLS so users can create their own participant
-- record immediately after sign-up (even before email
-- confirmation creates a session, auth.uid() would be null
-- and the normal RLS insert policy would block the write).
-- security definer = runs with the function owner's privileges.
-- ============================================================
create or replace function public.create_participant(
  p_user_id uuid,
  p_full_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if p_user_id is null or p_full_name is null or trim(p_full_name) = '' then
    raise exception 'User ID and full name are required';
  end if;

  insert into public.participants (user_id, full_name)
  values (p_user_id, p_full_name)
  returning id into new_id;

  return new_id;
end;
$$;

-- Grant execution to anon + authenticated so the RPC works
-- both before and after email confirmation.
grant execute on function public.create_participant(uuid, text) to anon, authenticated;

-- ---------- GROUPS RLS ----------
alter table public.groups enable row level security;

drop policy if exists "Groups are readable by authenticated users" on public.groups;
create policy "Groups are readable by authenticated users"
  on public.groups for select
  to authenticated
  using (true);

drop policy if exists "Groups are manageable by admins" on public.groups;
create policy "Groups are manageable by admins"
  on public.groups for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- TRANSPORT RLS ----------
alter table public.transport enable row level security;

drop policy if exists "Transport is readable by authenticated users" on public.transport;
create policy "Transport is readable by authenticated users"
  on public.transport for select
  to authenticated
  using (true);

drop policy if exists "Transport is manageable by admins" on public.transport;
create policy "Transport is manageable by admins"
  on public.transport for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- PARTICIPANTS RLS ----------
alter table public.participants enable row level security;

drop policy if exists "Participants can read their own record" on public.participants;
create policy "Participants can read their own record"
  on public.participants for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Participants can insert their own record" on public.participants;
create policy "Participants can insert their own record"
  on public.participants for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Participants can update their own record" on public.participants;
create policy "Participants can update their own record"
  on public.participants for update
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "Admins can delete participants" on public.participants;
create policy "Admins can delete participants"
  on public.participants for delete
  to authenticated
  using (public.is_admin());

-- ---------- SESSIONS RLS ----------
alter table public.sessions enable row level security;

drop policy if exists "Sessions are readable by authenticated users" on public.sessions;
create policy "Sessions are readable by authenticated users"
  on public.sessions for select
  to authenticated
  using (true);

drop policy if exists "Sessions are manageable by admins" on public.sessions;
create policy "Sessions are manageable by admins"
  on public.sessions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- ANNOUNCEMENTS RLS ----------
alter table public.announcements enable row level security;

drop policy if exists "Announcements are readable by authenticated users" on public.announcements;
create policy "Announcements are readable by authenticated users"
  on public.announcements for select
  to authenticated
  using (true);

drop policy if exists "Announcements are manageable by admins" on public.announcements;
create policy "Announcements are manageable by admins"
  on public.announcements for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- HELP REQUESTS RLS ----------
alter table public.help_requests enable row level security;

drop policy if exists "Users can read their own help requests" on public.help_requests;
create policy "Users can read their own help requests"
  on public.help_requests for select
  to authenticated
  using (participant_id = public.current_participant_id() or public.is_admin());

drop policy if exists "Users can create help requests" on public.help_requests;
create policy "Users can create help requests"
  on public.help_requests for insert
  to authenticated
  with check (participant_id = public.current_participant_id() or public.is_admin());

drop policy if exists "Admins can update help requests" on public.help_requests;
create policy "Admins can update help requests"
  on public.help_requests for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete help requests" on public.help_requests;
create policy "Admins can delete help requests"
  on public.help_requests for delete
  to authenticated
  using (public.is_admin());

-- ---------- ATTENDANCE RLS ----------
alter table public.attendance enable row level security;

drop policy if exists "Users can read their own attendance" on public.attendance;
create policy "Users can read their own attendance"
  on public.attendance for select
  to authenticated
  using (participant_id = public.current_participant_id() or public.is_admin());

drop policy if exists "Admins can insert attendance" on public.attendance;
create policy "Admins can insert attendance"
  on public.attendance for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update attendance" on public.attendance;
create policy "Admins can update attendance"
  on public.attendance for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete attendance" on public.attendance;
create policy "Admins can delete attendance"
  on public.attendance for delete
  to authenticated
  using (public.is_admin());

-- ============================================================
-- 5. SEED DATA (optional — run after tables are created)
-- ============================================================

-- ---------- GROUPS ----------
insert into public.groups (name, leader_name, color) values
  ('Group 1', 'Leader 1', '#D4AF37'),
  ('Group 2', 'Leader 2', '#D4AF37'),
  ('Group 3', 'Leader 3', '#D4AF37'),
  ('Group 4', 'Leader 4', '#D4AF37'),
  ('Group 5', 'Leader 5', '#D4AF37')
on conflict do nothing;

-- ---------- TRANSPORT ----------
insert into public.transport (bus_number, capacity, departure_time, meeting_point, status) values
  ('Bus 1', 50, '2026-08-13 06:00:00+00', 'Main Gate', 'active'),
  ('Bus 2', 50, '2026-08-13 06:30:00+00', 'Main Gate', 'active'),
  ('Bus 3', 50, '2026-08-13 07:00:00+00', 'Main Gate', 'active')
on conflict do nothing;

-- ---------- SESSIONS (Day 1–5) ----------
insert into public.sessions (day, title, location, start_time, end_time, description, speaker, session_type, color) values
  -- Day 1
  (1, 'Registration & Welcome', 'Main Hall', '2026-08-13 08:00:00+00', '2026-08-13 09:00:00+00', 'Check-in and welcome', null, 'registration', '#D4AF37'),
  (1, 'Opening Ceremony', 'Main Hall', '2026-08-13 09:00:00+00', '2026-08-13 10:30:00+00', 'Official opening of the retreat', 'Pastor David', 'plenary', '#D4AF37'),
  (1, 'Morning Bible Study', 'Main Hall', '2026-08-13 10:30:00+00', '2026-08-13 12:00:00+00', 'Study guide for Ephesians', 'Pastor David', 'bible-study', '#D4AF37'),
  (1, 'Lunch Break', 'Dining Hall', '2026-08-13 12:00:00+00', '2026-08-13 14:00:00+00', null, null, 'break', '#D4AF37'),
  (1, 'Group Activities', 'Various', '2026-08-13 14:00:00+00', '2026-08-13 16:00:00+00', 'Ice breakers and team building', null, 'group', '#D4AF37'),
  (1, 'Evening Worship', 'Main Hall', '2026-08-13 18:00:00+00', '2026-08-13 20:00:00+00', 'Worship and praise', 'Worship Team', 'worship', '#D4AF37'),
  -- Day 2
  (2, 'Morning Devotion', 'Main Hall', '2026-08-14 07:00:00+00', '2026-08-14 08:00:00+00', 'Start the day with prayer', null, 'devotion', '#D4AF37'),
  (2, 'Session 1: Faith in Action', 'Main Hall', '2026-08-14 09:00:00+00', '2026-08-14 10:30:00+00', 'Living out your faith daily', 'Pastor David', 'plenary', '#D4AF37'),
  (2, 'Workshop: Leadership', 'Room A', '2026-08-14 11:00:00+00', '2026-08-14 12:30:00+00', 'Leadership skills for young people', 'Guest Speaker', 'workshop', '#D4AF37'),
  (2, 'Lunch Break', 'Dining Hall', '2026-08-14 12:30:00+00', '2026-08-14 14:00:00+00', null, null, 'break', '#D4AF37'),
  (2, 'Outdoor Games', 'Sports Field', '2026-08-14 14:00:00+00', '2026-08-14 16:00:00+00', 'Fun and games', null, 'recreation', '#D4AF37'),
  (2, 'Evening Worship', 'Main Hall', '2026-08-14 18:00:00+00', '2026-08-14 20:00:00+00', 'Worship and praise', 'Worship Team', 'worship', '#D4AF37'),
  -- Day 3
  (3, 'Morning Devotion', 'Main Hall', '2026-08-15 07:00:00+00', '2026-08-15 08:00:00+00', 'Start the day with prayer', null, 'devotion', '#D4AF37'),
  (3, 'Session 2: Purpose & Calling', 'Main Hall', '2026-08-15 09:00:00+00', '2026-08-15 10:30:00+00', 'Discovering your purpose', 'Pastor David', 'plenary', '#D4AF37'),
  (3, 'Workshop: Worship & Music', 'Room B', '2026-08-15 11:00:00+00', '2026-08-15 12:30:00+00', 'Worship through music', 'Worship Team', 'workshop', '#D4AF37'),
  (3, 'Lunch Break', 'Dining Hall', '2026-08-15 12:30:00+00', '2026-08-15 14:00:00+00', null, null, 'break', '#D4AF37'),
  (3, 'Community Service', 'Local Community', '2026-08-15 14:00:00+00', '2026-08-15 17:00:00+00', 'Serving the community', null, 'service', '#D4AF37'),
  (3, 'Evening Worship', 'Main Hall', '2026-08-15 18:00:00+00', '2026-08-15 20:00:00+00', 'Worship and praise', 'Worship Team', 'worship', '#D4AF37'),
  -- Day 4
  (4, 'Morning Devotion', 'Main Hall', '2026-08-16 07:00:00+00', '2026-08-16 08:00:00+00', 'Start the day with prayer', null, 'devotion', '#D4AF37'),
  (4, 'Session 3: Relationships', 'Main Hall', '2026-08-16 09:00:00+00', '2026-08-16 10:30:00+00', 'Godly relationships', 'Pastor David', 'plenary', '#D4AF37'),
  (4, 'Panel Discussion', 'Main Hall', '2026-08-16 11:00:00+00', '2026-08-16 12:30:00+00', 'Q&A with speakers', 'Panel', 'panel', '#D4AF37'),
  (4, 'Lunch Break', 'Dining Hall', '2026-08-16 12:30:00+00', '2026-08-16 14:00:00+00', null, null, 'break', '#D4AF37'),
  (4, 'Group Bible Study', 'Various', '2026-08-16 14:00:00+00', '2026-08-16 16:00:00+00', 'Small group discussions', null, 'group', '#D4AF37'),
  (4, 'Talent Show', 'Main Hall', '2026-08-16 18:00:00+00', '2026-08-16 20:00:00+00', 'Showcase your talents', null, 'recreation', '#D4AF37'),
  -- Day 5
  (5, 'Morning Devotion', 'Main Hall', '2026-08-17 07:00:00+00', '2026-08-17 08:00:00+00', 'Start the day with prayer', null, 'devotion', '#D4AF37'),
  (5, 'Session 4: Going Forward', 'Main Hall', '2026-08-17 09:00:00+00', '2026-08-17 10:30:00+00', 'Applying what we learned', 'Pastor David', 'plenary', '#D4AF37'),
  (5, 'Closing Ceremony', 'Main Hall', '2026-08-17 11:00:00+00', '2026-08-17 12:30:00+00', 'Farewell and blessings', 'Pastor David', 'plenary', '#D4AF37'),
  (5, 'Lunch & Departure', 'Dining Hall', '2026-08-17 12:30:00+00', '2026-08-17 14:00:00+00', null, null, 'break', '#D4AF37')
on conflict do nothing;

-- ============================================================
-- 6. SAMPLE ANNOUNCEMENT (optional)
-- ============================================================
insert into public.announcements (title, message, priority, published_at) values
  ('Welcome to the Retreat! 🎉', 'We are so excited to have you here. Please check in at the registration desk and collect your welcome pack.', true, now())
on conflict do nothing;

-- ============================================================
-- DONE! ✅
-- After running this, go to:
--   Project Settings → API → copy the URL and anon key
--   Create a .env.local file with:
--     NEXT_PUBLIC_SUPABASE_URL=your-project-url
--     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
--     NEXT_PUBLIC_ONESIGNAL_APP_ID=your-onesignal-app-id
--     ONESIGNAL_API_KEY=your-onesignal-api-key
-- ============================================================