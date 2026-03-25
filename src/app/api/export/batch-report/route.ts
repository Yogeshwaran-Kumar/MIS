import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import * as XLSX from 'xlsx'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const batch = searchParams.get('batch')
  
  if (!batch) return NextResponse.json({ error: 'Batch query parameter is required' }, { status: 400 })

  const adminClient = await createAdminClient()

  // Get all members for batch with their contributions embedded (Supabase nested queries)
  const { data: members, error } = await adminClient
    .from('members')
    .select('*, contributions(*, events(name, date))')
    .eq('batch', batch)
    .order('total_score', { ascending: false })

  if (error || !members) {
    return NextResponse.json({ error: error?.message || 'Failed to generate report' }, { status: 500 })
  }

  // Format datatable
  const data = members.map(m => {
    // Flatten contributions into a comma separated list of "Event name (Role: score)"
    const contribs = (m.contributions as any[] || []).map(c => 
      `${c.events?.name} - ${c.role} (${c.score})`
    ).join(' | ')

    return {
      'SEC ID': m.sec_id,
      'Name': m.name,
      'Department': m.department || '',
      'Section': m.section || '',
      'Status': m.status,
      'Total Score': m.total_score,
      'Participation Count': m.participation_count,
      'Last Active': m.last_active || 'Never',
      'Contributions': contribs
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, `Batch ${batch}`)

  const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Disposition': `attachment; filename="Batch_${batch}_Report.xlsx"`,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }
  })
}
