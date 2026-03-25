'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/events?limit=200')
      .then(r => r.json())
      .then(d => { setEvents(d.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filteredEvents = events.filter(e => {
    const matchesQuery = (e.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                       (e.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    const matchesCategory = category === 'All' || e.category === category
    return matchesQuery && matchesCategory
  })

  const categories = ['All', 'Event', 'Program/Activity', 'Attendance']

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl animate-in fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events & Activities</h1>
          <p className="text-muted-foreground mt-2">
            Browse all our past and upcoming programs.
          </p>
        </div>

        {/* Filters Row */}
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-[240px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search events..." 
              className="pl-8 h-9 text-xs w-full bg-white dark:bg-slate-900 shadow-none border-primary/20" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={category} onValueChange={v => setCategory(v || 'All')}>
            <SelectTrigger className="w-[140px] h-9 text-xs bg-white dark:bg-slate-900 shadow-none border-primary/20">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              {categories.map(c => (
                <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {[1,2,3].map(i => (
            <Card key={i} className="h-[220px] shadow-none flex items-center justify-center border-dashed">
              <div className="w-full h-full rounded-xl animate-pulse bg-slate-100 dark:bg-slate-800" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {filteredEvents.map((event) => (
            <Link key={event.id} href={`/events/${event.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group hover:border-primary/50">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                        {event.category || 'Event'}
                      </Badge>
                      {event.mode && (
                        <Badge variant="outline" className="opacity-70 text-[10px] tracking-wider uppercase">
                          {event.mode}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors line-clamp-2">
                    {event.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1.5 mt-2">
                    <CalendarIcon className="w-4 h-4" />
                    {new Date(event.start_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {event.description || 'No description provided for this event.'}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}

          {!filteredEvents.length && (
            <div className="col-span-full py-12 text-center text-muted-foreground border border-dash rounded-xl">
              No events found. Try matching different terms!
            </div>
          )}
        </div>
      )}
    </div>
  )
}
