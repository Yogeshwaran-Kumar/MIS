import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase-server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft, User, Trophy, Calendar, Target, Activity,
  Mail, Phone, Shield, Star
} from 'lucide-react'

export const revalidate = 0 // Always fresh for admin

export default async function AdminMemberProfilePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const supabase = await createAdminClient()

  // Fetch ALL member fields (admin has full access)
  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!member) notFound()

  // Calculate dynamic Year based on Batch Start Year and Month (Increments after May)
  const startYear = parseInt(member.batch?.split('-')[0] || '')
  let dynamicYear = member.year
  if (!isNaN(startYear)) {
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() // 0-11 (June is index 5)
    let calculatedYear = currentYear - startYear
    if (currentMonth >= 5) calculatedYear += 1 // June onwards increment
    
    // Bounds check with maxYear calculated from batch Range
    const endYear = parseInt(member.batch?.split('-')[1] || '')
    const maxYear = !isNaN(endYear) ? (endYear - startYear) : 4
    dynamicYear = Math.max(1, Math.min(calculatedYear, Math.max(1, maxYear)))
  }

  // Fetch contributions with event details - filter out Attendance for cleaner UI focus
  const { data: contributions } = await supabase
    .from('contributions')
    .select('id, role, work_description, score, created_at, events(id, name, start_date, category)')
    .eq('member_id', member.id)

  // Sort by event start_date (latest at top)
  const sortedContributions = (contributions || []).sort((a, b) => {
    const dateA = new Date((a.events as any)?.start_date || a.created_at).getTime()
    const dateB = new Date((b.events as any)?.start_date || b.created_at).getTime()
    return dateB - dateA
  })

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <Link href="/admin/members" className="group flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          All Members
        </Link>
        <Badge variant="outline" className="h-7 px-3 border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 font-semibold tracking-tight">
          <Shield className="w-3.5 h-3.5 mr-1.5" />
          Admin Panel
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Minimal Profile Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="overflow-hidden border-none shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-none dark:border bg-white dark:bg-slate-950 rounded-2xl">
            {/* Header Decorator */}
            <div className="h-24 bg-gradient-to-r from-blue-600 to-emerald-500 opacity-90" />
            <CardContent className="relative px-6 pb-8 text-center sm:text-left pt-0 -mt-10">
              <div className="w-20 h-20 mx-auto sm:ml-0 rounded-2xl bg-white dark:bg-slate-900 shadow-xl flex items-center justify-center border-4 border-white dark:border-slate-800 text-primary">
                <User className="w-10 h-10" />
              </div>
              <div className="mt-4">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{member.name}</h1>
                <p className="font-mono text-xs font-semibold text-primary mt-1 tracking-wider uppercase opacity-80">{member.sec_id}</p>
                {member.status === 'ex-member' && (
                  <Badge variant="destructive" className="mt-2 text-xs font-semibold px-2 py-0">Ex-Member</Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-y-5 gap-x-2 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-left">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Department</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">{member.department || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Batch</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{member.batch || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Activities</p>
                  <p className="text-sm font-semibold text-emerald-600 flex items-center gap-1.5 mt-0.5">
                    <Target className="w-3.5 h-3.5" />
                    {member.participation_count || 0}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Current Year</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{dynamicYear ? `Year ${dynamicYear}` : '-'}</p>
                </div>
              </div>

              <div className="mt-8 space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800 text-left">
                <div className="flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-none">Email Address</p>
                    <a href={`mailto:${member.email}`} className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-primary truncate block mt-1.5">{member.email || 'N/A'}</a>
                  </div>
                </div>
                <div className="flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-none">Phone Contact</p>
                    <a href={`tel:${member.phone}`} className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-primary block mt-1.5">{member.phone || 'N/A'}</a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Elegant Content Timeline */}
        <div className="lg:col-span-8">
          <Card className="border-none shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-none dark:border bg-white dark:bg-slate-950 rounded-2xl overflow-hidden min-h-[500px]">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 px-8 py-5 flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/40 flex items-center justify-center text-amber-500 border border-amber-100 dark:border-amber-800">
                  <Trophy className="w-5 h-5 shadow-xs" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Contribution History</CardTitle>
                  <CardDescription className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Professional activity log</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 py-6 sm:px-8">
              {!sortedContributions?.length ? (
                <div className="py-24 flex flex-col items-center justify-center text-center opacity-60">
                  <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-300 mb-4 border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <Activity className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Contributions Yet</h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-[240px]">We haven't recorded any volunteer or participation work for this member.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedContributions.map((c, idx) => {
                    const event = c.events as any
                    const isLast = idx === sortedContributions.length - 1
                    return (
                      <div key={c.id} className="relative group">
                        {!isLast && <div className="absolute left-[39px] top-12 bottom-0 w-px bg-slate-100 dark:bg-slate-800 z-0 group-hover:bg-primary/20 transition-colors" />}
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-all duration-300 relative z-10 border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                          {/* Date indicator */}
                          <div className="flex-shrink-0 w-20 hidden sm:flex flex-col items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              {event?.start_date ? new Date(event.start_date).toLocaleDateString('en-GB', { month: 'short' }) : '---'}
                            </span>
                            <span className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                              {event?.start_date ? new Date(event.start_date).getDate() : '--'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 opacity-60">
                              {event?.start_date ? new Date(event.start_date).getFullYear() : '----'}
                            </span>
                          </div>

                          {/* Event details */}
                          <div className="flex-grow pt-0.5">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                              <div className="space-y-1">
                                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors flex items-center gap-2">
                                  {event?.name}
                                  {c.role === 'Volunteer' && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}
                                </h3>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-semibold tracking-wide uppercase opacity-70">
                                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {event?.start_date ? new Date(event.start_date).toLocaleDateString('en-GB') : 'Unknown'}</span>
                                  <span>•</span>
                                  <span>{event?.category || 'Event'}</span>
                                </div>
                              </div>
                              <Badge variant="outline" className={`h-6 text-[10px] font-bold uppercase tracking-widest border-2 ${
                                c.role === 'Volunteer' 
                                  ? 'border-blue-100 text-blue-600 bg-blue-50/50' 
                                  : c.role === 'Participant'
                                    ? 'border-emerald-100 text-emerald-600 bg-emerald-50/50'
                                    : 'border-slate-100 text-slate-600 bg-slate-50/50'
                              }`}>
                                {c.role}
                              </Badge>
                            </div>

                            {c.work_description && (
                              <div className="mt-3 p-3 rounded-lg bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100/50 dark:border-slate-800/50">
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
                                  &ldquo;{c.work_description}&rdquo;
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
