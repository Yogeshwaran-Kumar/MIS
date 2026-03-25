import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import * as XLSX from 'xlsx'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  const adminClient = await createAdminClient()

  const { data: event } = await adminClient.from('events').select('name, start_date').eq('id', params.id).single()
  
  const { data: contributions, error } = await adminClient
    .from('contributions')
    .select('role, work_description, score, remarks, members(sec_id, name, department, batch, status)')
    .eq('event_id', params.id)

  if (error || !contributions) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch event data' }, { status: 500 })
  }

  // Sort by role: Volunteer > Participant > Attendance > Others
  const roleOrder: Record<string, number> = { 'Volunteer': 1, 'Participant': 2, 'Attendance': 3 }
  const sortedContributions = [...contributions].sort((a, b) => {
    return (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99)
  })

  const exportData = sortedContributions.map(c => {
    const member = c.members as any
    return {
      'Event Date': event?.start_date ? new Date(event.start_date).toLocaleDateString() : 'N/A',
      'SEC ID': member?.sec_id || 'Unknown',
      'Name': member?.name || 'Unknown',
      'Batch': member?.batch || 'Unknown',
      'Department': member?.department || '',
      'Status': member?.status || 'Unknown',
      'Role': c.role,
      'Work Description': c.work_description || '',
      'Remarks': c.remarks || ''
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(exportData)
  const workbook = XLSX.utils.book_new()
  const sheetName = event?.name ? event.name.substring(0, 31) : 'Event Report'
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Disposition': `attachment; filename="Event_${params.id}_Report.xlsx"`,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }
  })
}
