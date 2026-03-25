import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const batch = searchParams.get('batch')
  const status = searchParams.get('status') || 'active'
  const limit = Math.min(parseInt(searchParams.get('limit') || '500'), 1000)
  
  const supabase = await createAdminClient()
  
  let query = supabase
    .from('members')
    .select('id, name, sec_id, department, batch, status, total_score, participation_count, last_active')
    .eq('status', status)
    .order('total_score', { ascending: false })
    .limit(limit)

  if (batch) {
    query = query.eq('batch', batch)
  }

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
  const body = await request.json()

  const { data, error } = await adminClient
    .from('members')
    .insert([body])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
