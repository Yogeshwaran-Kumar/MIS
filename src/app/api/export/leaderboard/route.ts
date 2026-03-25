import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase-server'
import * as XLSX from 'xlsx'

export async function GET() {
  // Session guard — admin only export
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = await createAdminClient()

  // Top 100 overall leaderboard
  const { data: members, error } = await adminClient
    .from('members')
    .select('sec_id, name, department, batch, total_score, participation_count, last_active, status')
    .eq('status', 'active')
    .order('total_score', { ascending: false })
    .limit(100)

  if (error || !members) {
    return NextResponse.json({ error: error?.message || 'Failed to generate report' }, { status: 500 })
  }

  const exportData = members.map((m, index) => ({
    'Rank': index + 1,
    'SEC ID': m.sec_id,
    'Name': m.name,
    'Department': m.department || '',
    'Batch': m.batch,
    'Total Score': m.total_score,
    'Participation Count': m.participation_count,
    'Last Active': m.last_active || 'Never'
  }))

  const worksheet = XLSX.utils.json_to_sheet(exportData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Overall Leaderboard')

  const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Disposition': `attachment; filename="Overall_Leaderboard.xlsx"`,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }
  })
}
