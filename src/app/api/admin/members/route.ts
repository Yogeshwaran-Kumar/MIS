import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase-server'

// 🔐 Admin-only endpoint — returns ALL fields including PII (email, phone)
export async function GET(request: Request) {
  // Verify the caller is an authenticated admin session
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'active'
  const limit = Math.min(parseInt(searchParams.get('limit') || '2000'), 2000)

  const supabase = await createAdminClient()

  // Auto-transition to Ex-Member after May of EndYear
  try {
    const { data: activeMembers } = await supabase
      .from('members')
      .select('id, batch')
      .eq('status', 'active')

    if (activeMembers) {
      const currentYear = new Date().getFullYear()
      const currentMonth = new Date().getMonth() // 0-11 (May is 4)

      const idsToTransition = activeMembers.filter(m => {
        const parts = m.batch.split('-')
        if (parts.length < 2) return false
        const endYear = parseInt(parts[1])
        if (isNaN(endYear)) return false
        
        // After May of EndYear -> Graduated
        if (currentYear > endYear) return true
        if (currentYear === endYear && currentMonth >= 4) return true // May starts index 4
        return false
      }).map(m => m.id)

      if (idsToTransition.length > 0) {
        await supabase
          .from('members')
          .update({ status: 'ex-member' })
          .in('id', idsToTransition)
      }
    }
  } catch (err) {
    console.error('Auto ex-member update failed:', err)
  }

  const { data, error } = await supabase
    .from('members')
    .select('id, name, sec_id, department, section, year, batch, status, total_score, participation_count, last_active, email, phone')
    .eq('status', status)
    .order('total_score', { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
