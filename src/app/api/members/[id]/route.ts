import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase-server'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('members')
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

  const { data, error } = await adminClient
    .from('members')
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

  const { searchParams } = new URL(request.url)
  const isHard = searchParams.get('hard') === 'true'

  if (isHard) {
    const { error } = await adminClient
      .from('members')
      .delete()
      .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ message: 'Deleted permanently' })
  }

  // Soft delete — preserves full contribution history
  const { error } = await adminClient
    .from('members')
    .update({ status: 'ex-member' })
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ message: 'Soft deleted' })
}
