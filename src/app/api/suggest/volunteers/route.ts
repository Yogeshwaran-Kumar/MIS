import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const batch = searchParams.get('batch')
  const section = searchParams.get('section')
  const search = searchParams.get('search')
  const adminClient = await createAdminClient()

  let query = adminClient
    .from('members')
    .select('id, name, sec_id, department, section, batch, email, phone, total_score')
    .eq('status', 'active')

  if (batch) {
    query = query.eq('batch', batch)
  }

  if (section) {
    query = query.or(`section.ilike.%${section}%,department.ilike.%${section}%,name.ilike.%${section}%,sec_id.ilike.%${section}%`)
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,sec_id.ilike.%${search}%`)
  }

  const { data, error } = await query
    .order('total_score', { ascending: true })
    .limit(1000)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
