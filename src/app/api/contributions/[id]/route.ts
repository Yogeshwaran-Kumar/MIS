import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  const adminClient = await createAdminClient()
  const body = await request.json()

  const { data, error } = await adminClient
    .from('contributions')
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
  const params = await context.params
  const adminClient = await createAdminClient()

  const { error } = await adminClient
    .from('contributions')
    .delete()
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ message: 'Deleted' })
}
