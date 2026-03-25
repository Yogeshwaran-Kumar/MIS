export type Member = {
  id: string
  sec_id: string
  name: string
  department: string | null
  section: string | null
  year: number | null
  batch: string
  email: string | null
  phone: string | null
  total_score: number
  participation_count: number
  last_active: string | null
  status: 'active' | 'ex-member'
  created_at: string
}

export type Event = {
  id: string
  name: string
  start_date: string
  end_date: string
  category: string | null
  mode: string | null
  description: string | null
  poster_url: string | null
  created_at: string
}

export type Contribution = {
  id: string
  member_id: string
  event_id: string
  role: string
  work_description: string | null
  score: number
  remarks: string | null
  created_at: string
  member?: Member
  event?: Event
}
