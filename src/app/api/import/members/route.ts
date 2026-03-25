import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase-server'
import * as XLSX from 'xlsx'

export async function POST(request: Request) {
  // Session guard — admin only
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    // Parse Excel to JSON matching our template:
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
    
    if (rows.length < 2) {
      return NextResponse.json({ error: 'File appears to be empty or missing data rows' }, { status: 400 })
    }

    const expectedHeaders = ['S.No.', 'Name', 'SEC_ID', 'Department', 'Section', 'Year', 'sec email', 'Mobile Phone number', 'Batch (e.g. 2023-2027)'];
    const actualHeaders = rows[0] || [];

    if (actualHeaders.length < expectedHeaders.length) {
      return NextResponse.json({ error: 'Invalid template format. The headers do not match the required template.' }, { status: 400 });
    }

    for (let i = 0; i < expectedHeaders.length; i++) {
      if (actualHeaders[i]?.toString().trim() !== expectedHeaders[i]) {
        return NextResponse.json({ 
          error: `Invalid header at column ${i + 1}. Expected "${expectedHeaders[i]}" but got "${actualHeaders[i] || '(empty)'}". Please use the official exact template.` 
        }, { status: 400 });
      }
    }

    // Skip header row
    const dataRows = rows.slice(1).filter(r => r.length > 0 && r[2]) // Must have SEC_ID (column index 2)

    const membersToUpsert = dataRows.map(row => {
      const yearStr = row[5]?.toString().trim().toUpperCase() || '1'
      const romanToNum: Record<string, number> = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4 }
      const year = romanToNum[yearStr] || parseInt(yearStr) || 1
      
      const currentYear = new Date().getFullYear();
      
      const secIdStr = row[2]?.toString().trim().toUpperCase() || ''
      let startYear = currentYear - (year - 1)
      
      // First try explicit batch column, fallback to SEC_ID inference
      const explicitBatch = row[8]?.toString().trim()
      let batch = ''
      
      if (explicitBatch && explicitBatch.includes('-')) {
        batch = explicitBatch
      } else {
        // Match SEC or SIT, 2 digits year, 2 letters Dept (e.g. SEC23CJ014)
        const match = secIdStr.match(/(SEC|SIT)(\d{2})([A-Z]{2})/i)
        if (match) {
          startYear = parseInt("20" + match[2])
          const is5Year = match[3]?.toUpperCase() === 'CJ'
          batch = `${startYear}-${startYear + (is5Year ? 5 : 4)}`
        } else {
          // Fallback if no full match found but year known
          batch = `${startYear}-${startYear + 4}`
        }
      }

      const rawDept = row[3]?.toString().trim() || ''
      let dept = rawDept.toUpperCase()

      // Exact match overrides for shorthand forms
      if (dept === 'AIML') dept = 'CSE (AIML)'
      if (dept === 'AIDS') dept = 'CSE (AIDS)'

      // Fix missing space: CSE(AIML) -> CSE (AIML)
      if (dept.includes('(') && !dept.includes(' (')) {
        dept = dept.replace('(', ' (')
      }

      // Normalize Department Names (e.g., CSE-AIML or CSE AIML -> CSE (AIML))
      if (dept.includes('-')) {
        dept = dept.replace('-', ' (')
        if (!dept.endsWith(')')) dept += ')'
      } else if (dept.includes(' ') && !dept.includes('(')) {
        const parts = dept.split(' ')
        if (parts.length > 1 && parts[0] === 'CSE') {
          dept = `CSE (${parts.slice(1).join(' ')})`
        }
      }

      return {
        sec_id: secIdStr,
        name: row[1]?.toString().trim(),
        department: dept,
        section: row[4]?.toString().trim() || null,
        year: year,
        batch: batch,
        email: row[6]?.toString().trim() || null,
        phone: row[7]?.toString().trim() || null,
        status: 'active'
      }
    })

    const adminClient = await createAdminClient()

    // Upsert members based on sec_id uniqueness
    const { data, error } = await adminClient
      .from('members')
      .upsert(membersToUpsert, { onConflict: 'sec_id' })
      .select()

    if (error) {
      throw error
    }

    return NextResponse.json({ 
      message: `Successfully imported ${membersToUpsert.length} members.`,
      count: membersToUpsert.length 
    }, { status: 200 })

  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json({ error: error.message || 'Failed to process Excel file' }, { status: 500 })
  }
}
