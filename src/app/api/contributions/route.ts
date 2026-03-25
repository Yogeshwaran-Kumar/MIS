import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const event_id = searchParams.get('event_id')
  const member_id = searchParams.get('member_id')
  
  const supabase = await createClient()
  
  let query = supabase.from('contributions').select('*, member:members(*), event:events(*)')

  if (event_id) query = query.eq('event_id', event_id)
  if (member_id) query = query.eq('member_id', member_id)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  // Session guard — admin only
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = await createAdminClient()
  
  // Can be a single contribution or array of contributions
  const body = await request.json()
  const payload = Array.isArray(body) ? body : [body]

  const { data, error } = await adminClient
    .from('contributions')
    .insert(payload)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
