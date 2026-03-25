import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  // Auth check — only logged-in admins can upload
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  // Validate type
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
  }

  // Max 5MB
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File must be under 5MB' }, { status: 400 })
  }

  const supabase = await createAdminClient()
  const ext = file.name.split('.').pop() || 'jpg'
  const filename = `poster_${Date.now()}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from('event-posters')
    .upload(filename, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from('event-posters')
    .getPublicUrl(filename)

  return NextResponse.json({ url: publicUrl })
}
