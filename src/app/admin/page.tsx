'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Users, Calendar, Trophy, AlertTriangle, Download, Star } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatName } from '@/lib/utils'


const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedBatch, setSelectedBatch] = useState<string>('All')

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => {
        setStats(d)
        setLoading(false)
      })
  }, [])

  const batches = useMemo(() => {
    if (!stats?.membersRaw) return ['All']
    const b = new Set(stats.membersRaw.map((m: any) => m.batch).filter(Boolean))
    return ['All', ...Array.from(b).sort()]
  }, [stats])

  const filteredDeptChart = useMemo(() => {
    if (!stats?.membersRaw) return stats?.deptChart || []
    const filtered = selectedBatch === 'All' 
      ? stats.membersRaw 
      : stats.membersRaw.filter((m: any) => m.batch === selectedBatch)

    const counts = filtered.reduce((acc: any, curr: any) => {
      const d = curr.department || 'Other'
      acc[d] = (acc[d] || 0) + 1
      return acc
    }, {})

    return Object.keys(counts).map(name => ({ name, count: counts[name] }))
  }, [stats, selectedBatch])

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded"></div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>)}
    </div>
  </div>

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500">Monitor NDLI Club metrics and member performance.</p>
        </div>
      </div>

      {/* 1. KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Members</p>
              <h2 className="text-3xl font-bold mt-1">{stats?.kpis?.totalMembers || 0}</h2>
              <p className="text-xs text-slate-400 mt-1">{stats?.kpis?.activeMembers || 0} active</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-full text-blue-600">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-emerald-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Events</p>
              <h2 className="text-3xl font-bold mt-1">{stats?.kpis?.totalEvents || 0}</h2>
              <p className="text-xs text-slate-400 mt-1">Activities tracked</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-full text-emerald-600">
              <Calendar className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Distributions Breakdown Visual Row */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <div>
              <CardTitle className="text-base">Department Distribution</CardTitle>
              <CardDescription>Members split by department</CardDescription>
            </div>
            <select 
              value={selectedBatch} 
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="text-xs border rounded px-1.5 py-0.5 bg-background shadow-xs outline-none"
            >
              {batches.map((b: any) => <option key={b} value={b}>{b === 'All' ? 'All Batches' : b}</option>)}
            </select>
          </CardHeader>
          <CardContent className="h-[250px]">
            {filteredDeptChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredDeptChart} margin={{ bottom: 10 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data available</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <div>
              <CardTitle className="text-base">Role Distribution</CardTitle>
              <CardDescription>Contribution totals by role</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-[250px]">
            {stats?.roleChart?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.roleChart} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={4} label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}>
                    {stats.roleChart.map((e: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data available</div>}
          </CardContent>
        </Card>
      </div>

      {/* 3. Tables Row (Top and Low Contributors) */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-sm border-t-2 border-t-emerald-500">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" /> Top Contributors
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableBody>
                {stats?.topMembers?.slice(0, 10).map((m: any, i: number) => (
                  <TableRow key={m.id || i} className="hover:bg-muted/40 cursor-pointer" onClick={() => window.location.href = `/admin/members/${m.id}`}>
                    <TableCell className="w-8 text-center font-bold text-xs">{i+1}</TableCell>
                    <TableCell className="font-medium text-xs">{formatName(m.name)}</TableCell>
                    <TableCell className="font-mono text-[10px] text-slate-500">{m.sec_id}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-2 border-t text-center">
              <Link href="/admin/members?sort=score_desc" className="text-xs text-blue-600 hover:underline">View All Members</Link>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-t-2 border-t-rose-500">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-500" /> Developing Contributors
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableBody>
                {stats?.lowMembers?.slice(0, 10).map((m: any, i: number) => (
                  <TableRow key={m.id || i} className="hover:bg-muted/40 cursor-pointer" onClick={() => window.location.href = `/admin/members/${m.id}`}>
                    <TableCell className="w-8 text-center font-bold text-xs">{i+1}</TableCell>
                    <TableCell className="font-medium text-xs">{formatName(m.name)}</TableCell>
                    <TableCell className="font-mono text-[10px] text-slate-500">{m.sec_id}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-2 border-t text-center">
              <Link href="/admin/members?sort=score_asc" className="text-xs text-blue-600 hover:underline">View All Members</Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Bottom Index Row summary */}
      <div className="space-y-4">
        <div className="bg-slate-50 dark:bg-slate-900 border rounded-lg px-4 py-3 flex items-center justify-around text-xs font-medium text-slate-600 dark:text-slate-400 shadow-sm">
          <div>SEC Campus Members: <span className="text-slate-900 dark:text-slate-100 font-bold ml-1">{stats?.kpis?.totalSec || 0}</span></div>
          <div className="border-r h-4"></div>
          <div>SIT Campus Members: <span className="text-slate-900 dark:text-slate-100 font-bold ml-1">{stats?.kpis?.totalSit || 0}</span></div>
        </div>

        <div className="flex flex-wrap gap-3 items-center justify-center mt-2">
          {stats?.batchChart?.map((b: any) => (
            <Link key={b.name} href={`/admin/members?batch=${b.name}`} className="bg-white dark:bg-slate-900 border-2 rounded-xl px-4 py-2 shadow-md flex items-center gap-2 text-sm hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer">
              <span className="text-slate-600 dark:text-slate-400 font-semibold">Batch {b.name}</span>
              <span className="h-4 w-px bg-slate-200 dark:bg-slate-700"></span>
              <span className="font-extrabold text-blue-600 dark:text-blue-400 text-base">{b.count}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
