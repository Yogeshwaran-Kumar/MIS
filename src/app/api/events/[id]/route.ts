import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase-server'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  return NextResponse.json({ data })
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const params = await context.params
  const adminClient = await createAdminClient()
  const body = await request.json()
  if (body.mode) delete body.mode

  const { data, error } = await adminClient
    .from('events')
    .update(body)
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data })
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const params = await context.params
  const adminClient = await createAdminClient()

  const { error } = await adminClient
    .from('events')
    .delete()
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ message: 'Deleted' })
}
