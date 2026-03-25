import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase-server'
import * as XLSX from 'xlsx'

export async function GET(request: Request) {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'active'
  const batch = searchParams.get('batch') || 'All'

  const adminClient = await createAdminClient()
  
  let query = adminClient
    .from('members')
    .select('name, sec_id, department, section, year, email, phone, batch')
    .eq('status', status)

  if (batch !== 'All') {
    query = query.eq('batch', batch)
  }

  const { data: members, error } = await query.order('name', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const headers = ['S.No.', 'Name', 'SEC_ID', 'Department', 'Section', 'Year', 'sec email', 'Mobile Phone number', 'Batch']
  
  const rows = (members || []).map((m, i) => [
    i + 1,
    m.name,
    m.sec_id,
    m.department || '',
    m.section || '',
    m.year || '',
    m.email || '',
    m.phone || '',
    m.batch || ''
  ])

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Members')

  const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  const filename = `Members_${status}_${batch.replace(/\s+/g, '')}.xlsx`

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }
  })
}
