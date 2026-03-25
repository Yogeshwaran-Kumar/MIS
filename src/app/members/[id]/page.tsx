import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase-server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, User, Trophy, Calendar, Target, Activity } from 'lucide-react'
import { formatName } from '@/lib/utils'

export const revalidate = 60

export default async function MemberProfilePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const supabase = await createAdminClient()

  // Fetch Member
  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!member) notFound()

  // Fetch Member's Contributions
  const { data: contributions } = await supabase
    .from('contributions')
    .select('id, role, work_description, score, created_at, events(id, name, start_date, category)')
    .eq('member_id', member.id)

  const sortedContributions = (contributions || []).sort((a, b) => {
    const dateA = new Date((a.events as any)?.start_date || a.created_at).getTime()
    const dateB = new Date((b.events as any)?.start_date || b.created_at).getTime()
    return dateB - dateA
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl animate-in fade-in">
      <Link href="/members" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to members
      </Link>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Stats */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-t-4 border-t-primary shadow-sm">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <User className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{formatName(member.name)}</h1>
                <p className="font-mono text-sm mt-1 text-muted-foreground bg-muted inline-block px-2 py-0.5 rounded">
                  {member.sec_id}
                </p>
                {member.status === 'ex-member' && (
                  <div className="mt-2 text-xs font-semibold text-rose-500 bg-rose-50 px-2 py-1 rounded-full border border-rose-100">
                    Ex-Member
                  </div>
                )}
              </div>
              <div className="pt-4 border-t flex flex-col items-center">
                {/* Score hidden from public view */}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm text-sm">
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs uppercase">Department</p>
                <p className="font-medium">{member.department || '-'} {member.section ? `(Sec ${member.section})` : ''}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs uppercase">Batch</p>
                <p className="font-medium">{member.batch}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs uppercase">Total Contributions</p>
                <p className="font-medium flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-emerald-500" />
                  {member.participation_count} recorded
                </p>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Contribution Timeline */}
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-sm min-h-full">
            <CardHeader className="pb-4 border-b">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Contribution Timeline
              </CardTitle>
              <CardDescription>All recorded volunteer work and activity.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y relative">
                {!sortedContributions?.length ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No contributions recorded yet.
                  </div>
                ) : (
                  sortedContributions.map((c) => {
                    const event = c.events as any
                    return (
                      <div key={c.id} className="p-6 hover:bg-muted/30 transition-colors">
                        <div className="flex justify-between items-start gap-4 mb-3">
                          <Link href={`/events/${event?.id}`} className="group block">
                            <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                              {event?.name}
                            </h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {event?.start_date ? new Date(event.start_date).toLocaleDateString('en-US') : 'Unknown Date'}
                              <span className="mx-1">•</span>
                              <span>{event?.category || 'Event'}</span>
                            </p>
                          </Link>
                          <div className="flex flex-col items-center justify-center bg-transparent text-transparent rounded-lg px-3 py-2 min-w-[3rem] select-none">
                            {/* Score hidden from public view */}
                          </div>
                        </div>
                        
                        <div className="bg-slate-50 dark:bg-slate-900 border rounded-lg p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs bg-white dark:bg-black font-semibold">
                              Role: {c.role}
                            </Badge>
                          </div>
                          {c.work_description && (
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium text-foreground mr-1">Work:</span>
                              {c.work_description}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
