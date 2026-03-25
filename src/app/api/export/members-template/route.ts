import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET() {
  const headers = ['S.No.', 'Name', 'SEC_ID', 'Department', 'Section', 'Year', 'sec email', 'Mobile Phone number', 'Batch (e.g. 2023-2027)']
  const sampleRow = [1, 'Yogeshwaran Kumar', 'SEC23CB014', 'CSBS', 'A', 'III', 'sec23cb014@sairamtap.edu.in', '8270380071', '2023-2027']
  
  const worksheet = XLSX.utils.aoa_to_sheet([headers, sampleRow])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Members')

  const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Disposition': 'attachment; filename="ClubMembersDetails_Template.xlsx"',
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }
  })
}
