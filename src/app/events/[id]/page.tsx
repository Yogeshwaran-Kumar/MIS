import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase-server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CalendarIcon, DownloadIcon, ArrowLeft } from 'lucide-react'

export const revalidate = 60

export default async function EventDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const supabase = await createAdminClient()
  
  // Parallel fetch: Event details + Contributions
  const [
    { data: event },
    { data: contributions }
  ] = await Promise.all([
    supabase.from('events').select('*').eq('id', params.id).single(),
    supabase.from('contributions')
      .select('*, members(id, name, batch, department)')
      .eq('event_id', params.id)
      .order('score', { ascending: false })
  ])

  if (!event) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl animate-in fade-in">
      <Link href="/events" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to events
      </Link>
      
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-2/3 space-y-6">
          <div>
            <div className="mb-3 flex gap-2 items-center">
              <Badge variant="secondary">{event.category || 'Event'}</Badge>
              {event.mode && (
                <Badge variant="outline" className="opacity-70 text-xs tracking-wider uppercase">{event.mode}</Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{event.name}</h1>
            <div className="flex items-center text-muted-foreground gap-2">
              <CalendarIcon className="w-5 h-5" />
              <span className="font-medium">
                {new Date(event.start_date).toLocaleDateString('en-US', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                })}
              </span>
            </div>
          </div>

          <div className="prose prose-slate max-w-none">
            <h3 className="text-xl font-semibold mb-2">About this {event.category?.toLowerCase() || 'event'}</h3>
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {event.description || 'No description provided.'}
            </p>
          </div>
        </div>
        
        {/* Actions / Poster */}
        <div className="md:w-1/3">
          <Card className="bg-slate-50 border-none shadow-sm">
            <CardContent className="p-6 space-y-6">
              {event.poster_url ? (
                // Use a standard img tag since the domains are unknown and Next/Image requires configuration
                <img 
                  src={event.poster_url} 
                  alt={`${event.name} Poster`}
                  className="w-full h-auto rounded-lg shadow-sm"
                />
              ) : (
                <div className="w-full aspect-[4/3] bg-primary/5 rounded-lg border border-primary/10 flex items-center justify-center flex-col text-primary/40">
                  <CalendarIcon className="w-12 h-12 mb-2" />
                  <span className="text-sm">No Poster Available</span>
                </div>
              )}
              
              <div className="pt-2">
                <a href={`/api/export/event-report/${event.id}`} download>
                  <Button className="w-full flex items-center gap-2" variant="outline">
                    <DownloadIcon className="w-4 h-4" />
                    Download Event Report
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Volunteers & Work Contributions ({contributions?.length || 0})</h2>
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Volunteer</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden md:table-cell">Work Description</TableHead>
                  {/* Score hidden publicly */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {contributions?.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link href={`/members/${c.members?.id}`} className="font-medium hover:text-primary transition-colors block">
                        {c.members?.name}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {c.members?.department} • {c.members?.batch}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{c.role}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-[300px] truncate" title={c.work_description}>
                      {c.work_description || '-'}
                    </TableCell>
                    {/* Score hidden publicly */}
                  </TableRow>
                ))}
                {!contributions?.length && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No contributions recorded for this event yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  )
}
