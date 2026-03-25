import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500)

  const supabase = await createClient()
  let query = supabase.from('events').select('*').order('start_date', { ascending: false }).limit(limit)

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const adminClient = await createAdminClient()
  const body = await request.json()
  if (body.mode) delete body.mode

  const { data, error } = await adminClient
    .from('events')
    .insert([body])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
