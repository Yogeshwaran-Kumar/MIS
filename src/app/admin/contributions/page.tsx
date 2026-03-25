'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Trash2, Search, Trophy, Check, Plus, HelpCircle, Activity } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { formatName } from '@/lib/utils'

export default function AdminContributions() {
  const [events, setEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  
  // Data for selected event
  const [contributions, setContributions] = useState<any[]>([])
  const [loadingContribs, setLoadingContribs] = useState(false)

  // Smart Suggest
  const [batch, setBatch] = useState<string>('')
  const [section, setSection] = useState<string>('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  
  // Auto-Allocate state
  const [volCount, setVolCount] = useState<number>(0)
  const [partCount, setPartCount] = useState<number>(0)

  const [activeTab, setActiveTab] = useState<'smart' | 'manual'>('smart')
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]) 
  // Each: { ...member, role: 'Volunteer', justification: '' }

  const [deleteContribId, setDeleteContribId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/events?limit=200').then(r => r.json()).then(d => setEvents(d.data || []))
  }, [])

  useEffect(() => {
    if (activeTab === 'manual') {
      setLoadingSuggestions(true)
      fetch('/api/suggest/volunteers?limit=2000')
        .then(r => r.json())
        .then(d => { setSuggestions(d.data || []); setLoadingSuggestions(false); })
    }
  }, [activeTab])

  useEffect(() => {
    if (selectedEvent) {
      fetchContributions()
      const ev = events.find(e => e.id === selectedEvent)
      if (ev) {
        // Pre-Event: Future event, show Smart Suggest
        // Post-Event: Current or Past event, show Manual search
        const isPreEvent = new Date(ev.start_date || ev.date) > new Date()
        setActiveTab(isPreEvent ? 'smart' : 'manual')
      }
    } else {
      setContributions([])
    }
  }, [selectedEvent, events])

  const fetchContributions = async () => {
    setLoadingContribs(true)
    const r = await fetch(`/api/contributions?event_id=${selectedEvent}`)
    const d = await r.json()
    setContributions(d.data || [])
    setLoadingContribs(false)
  }

  useEffect(() => {
    handleFetchSuggestions()
  }, [batch, section, searchQuery, activeTab])

  const handleFetchSuggestions = async () => {
    setLoadingSuggestions(true)
    let url = `/api/suggest/volunteers?`
    if (batch && batch !== 'All') url += `&batch=${batch}`
    if (activeTab === 'smart') {
      if (section) url += `&section=${section}`
    } else {
      if (searchQuery) url += `&search=${searchQuery}`
    }
    
    const r = await fetch(url)
    const d = await r.json()
    if (r.ok) {
      const existingMemberIds = new Set(contributions.map(c => c.member_id))
      setSuggestions(d.data?.filter((m: any) => !existingMemberIds.has(m.id)) || [])
      setSearchQuery('')
    } else {
      toast.error(d.error || 'Failed to fetch suggestions')
    }
    setLoadingSuggestions(false)
  }

  const activeEvent = events.find(e => e.id === selectedEvent)
  const cat = activeEvent?.category || 'Event'
  const visibleBuckets = cat === 'Event' 
    ? ['Volunteer', 'Participant']
    : cat === 'Attendance' || cat === 'Meeting'
      ? ['Attendance']
      : ['Volunteer']

  const toggleMemberSelection = (member: any) => {
    if (selectedMembers.find(m => m.id === member.id)) {
      setSelectedMembers(prev => prev.filter(m => m.id !== member.id))
    } else {
      const defaultRole = visibleBuckets[0] || 'Volunteer'
      setSelectedMembers(prev => [...prev, { ...member, role: defaultRole, justification: '' }])
    }
  }

  const handleSelectAll = () => {
    const visibleSuggestions = suggestions.filter(m => {
      const q = searchQuery.toLowerCase()
      return (
        (m.name?.toLowerCase() || '').includes(q) || 
        (m.sec_id?.toLowerCase() || '').includes(q) ||
        (m.department?.toLowerCase() || '').includes(q)
      )
    })
    const allSelected = visibleSuggestions.length > 0 && visibleSuggestions.every(s => selectedMembers.find(m => m.id === s.id))
    
    if (allSelected) {
      const ids = new Set(visibleSuggestions.map(s => s.id))
      setSelectedMembers(prev => prev.filter(m => !ids.has(m.id)))
    } else {
      const defaultRole = visibleBuckets[0] || 'Volunteer'
      const toAdd = visibleSuggestions.filter(s => !selectedMembers.find(m => m.id === s.id))
                        .map(s => ({ ...s, role: defaultRole, justification: '' }))
      setSelectedMembers(prev => [...prev, ...toAdd])
    }
  }

  const handleAutoAllocate = () => {
    if (suggestions.length === 0) {
      toast.error("No suggestions available to allocate.")
      return
    }

    const currentSelectedIds = new Set(selectedMembers.map(m => m.id))
    const available = suggestions.filter(m => !currentSelectedIds.has(m.id))

    if (available.length < (volCount + partCount)) {
      toast.warning(`Only ${available.length} additional members available. Allocating what's possible.`)
    }

    const newSelections: any[] = []
    let pointer = 0

    // Allocate volunteers
    for (let i = 0; i < volCount && pointer < available.length; i++) {
      newSelections.push({ ...available[pointer], role: 'Volunteer', justification: '' })
      pointer++
    }

    // Allocate participants
    for (let i = 0; i < partCount && pointer < available.length; i++) {
      newSelections.push({ ...available[pointer], role: 'Participant', justification: '' })
      pointer++
    }

    if (newSelections.length > 0) {
      setSelectedMembers(prev => [...prev, ...newSelections])
      setVolCount(0)
      setPartCount(0)
      toast.success(`Auto-allocated ${newSelections.length} members. Review and Submit.`)
    } else {
      toast.error("Could not allocate any new members.")
    }
  }

  const handleCreateContributions = async () => {
    const ROLE_POINTS: Record<string, number> = { 'Volunteer': 5, 'Participant': 3, 'Attendance': 2, 'Report': 5 }
    if (!selectedEvent) { toast.error('Select an event first'); return }
    if (selectedMembers.length === 0) { toast.error('Select at least one member'); return }

    const payload = selectedMembers.map(m => ({
      member_id: m.id,
      event_id: selectedEvent,
      role: m.role,
      work_description: m.justification || '',
      score: ROLE_POINTS[m.role] || 5
    }))

    const r = await fetch('/api/contributions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (r.ok) {
      toast.success(`${selectedMembers.length} contributions recorded successfully`)
      setSelectedMembers([])
      fetchContributions()
    } else {
      const err = await r.json()
      toast.error('Error: ' + err.error)
    }
  }

  const updateMemberRole = (id: string, role: string) => {
    setSelectedMembers(prev => prev.map(m => m.id === id ? { ...m, role } : m))
  }

  const updateMemberJustification = (id: string, justification: string) => {
    setSelectedMembers(prev => prev.map(m => m.id === id ? { ...m, justification } : m))
  }

  const confirmDeleteContrib = async () => {
    if (!deleteContribId) return
    const r = await fetch(`/api/contributions/${deleteContribId}`, { method: 'DELETE' })
    if (r.ok) {
      setContributions(prev => prev.filter(c => c.id !== deleteContribId))
      toast.success('Contribution removed')
    } else {
      toast.error('Failed to remove contribution')
    }
    setDeleteContribId(null)
  }

  return (
    <>
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contributions Manager</h1>
          <p className="text-slate-500">Record volunteer work and distribute opportunities using Smart Suggest.</p>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5 shadow-none">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full space-y-2">
              <Label className="text-xs font-semibold text-primary uppercase tracking-wider">Active Event</Label>
              <Select value={selectedEvent} onValueChange={(val) => setSelectedEvent(val || '')}>
                <SelectTrigger className="w-full h-11 text-base bg-white dark:bg-slate-900 shadow-xs border-primary/20">
                  <SelectValue placeholder="Choose an event to manage...">
                    {selectedEvent && events.find(e => e.id === selectedEvent) 
                      ? `${events.find(e => e.id === selectedEvent).name} (${events.find(e => e.id === selectedEvent).start_date ? new Date(events.find(e => e.id === selectedEvent).start_date).toLocaleDateString() : 'N/A'})`
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="w-full">
                  {events.map((e: any) => {
                    const label = `${e.name} (${e.start_date ? new Date(e.start_date).toLocaleDateString() : 'N/A'})`
                    return (
                      <SelectItem key={e.id} value={e.id} className="text-base py-2.5">
                        {label}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedEvent && (
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left Column: Member Selector & Auto-Allocate */}
          <div className="space-y-6">
            <Card className="shadow-sm border-primary/10 bg-white dark:bg-slate-950">
              <CardHeader className="pb-3 border-b border-slate-50 dark:border-slate-900">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="w-4 h-4 text-primary" />
                  Select Members
                </CardTitle>
                <CardDescription>Find members with lowest scores automatically.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
                  <TabsList className="grid grid-cols-2 mb-4 bg-slate-100/50 dark:bg-slate-900/50">
                    <TabsTrigger value="smart" className="text-xs">Smart Suggest</TabsTrigger>
                    <TabsTrigger value="manual" className="text-xs">Manual Search</TabsTrigger>
                  </TabsList>

                  <TabsContent value="smart" className="space-y-4 mt-0">
                    <div className="flex gap-2">
                      <Select value={batch} onValueChange={(v) => setBatch(v || '')}>
                        <SelectTrigger className="flex-1 h-9 text-xs bg-white dark:bg-slate-900 shadow-xs border-primary/20"><SelectValue placeholder="All Batches" /></SelectTrigger>
                        <SelectContent>
                          {['All', '2021-2025', '2022-2026', '2023-2027', '2024-2028', '2025-2029'].map(b => (
                            <SelectItem key={b} value={b} className="text-xs">{b}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="relative flex-[2]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input 
                          placeholder="Filter results..." 
                          className="pl-8 h-9 text-xs w-full bg-white dark:bg-slate-900 shadow-xs border-primary/20" 
                          value={section}
                          onChange={e => setSection(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Auto-Allocate Area - ONLY for Pre-Event */}
                    {suggestions.length > 0 && activeEvent && new Date(activeEvent.start_date || activeEvent.date) > new Date() ? (
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-primary/30 space-y-4 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                            <Trophy className="w-3 h-3" /> Auto-Suggest & Allocate (Pre-Event)
                          </Label>
                          <HelpCircle className="w-3 h-3 text-slate-400" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] text-slate-500 font-medium">Volunteers Required</Label>
                            <Input 
                              type="number" 
                              min="0" 
                              placeholder="0"
                              className="h-10 text-sm bg-white dark:bg-slate-950 font-bold" 
                              value={volCount || ''} 
                              onChange={e => setVolCount(Math.max(0, parseInt(e.target.value) || 0))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] text-slate-500 font-medium">Participants Required</Label>
                            <Input 
                              type="number" 
                              min="0" 
                              placeholder="0"
                              className="h-10 text-sm bg-white dark:bg-slate-950 font-bold" 
                              value={partCount || ''} 
                              onChange={e => setPartCount(Math.max(0, parseInt(e.target.value) || 0))}
                            />
                          </div>
                        </div>
                        <Button 
                          className="w-full h-10 text-xs font-bold shadow-md bg-primary hover:bg-primary/90 transition-all active:scale-95" 
                          onClick={handleAutoAllocate}
                          disabled={volCount + partCount === 0}
                        >
                          <Plus className="w-3.5 h-3.5 mr-2" /> 
                          Auto-Allocate {volCount + partCount > 0 ? (volCount + partCount) : ''} Members
                        </Button>
                      </div>
                    ) : (
                      activeEvent && new Date(activeEvent.start_date || activeEvent.date) <= new Date() && (
                        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/30">
                          <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                            <strong>Note:</strong> Auto-Allocate is tailored for <strong>Pre-Event planning</strong>. 
                            For completed events (Post-Event), please manual search to record actual contributions.
                          </p>
                        </div>
                      )
                    )}
                  </TabsContent>

                  <TabsContent value="manual" className="space-y-4 mt-0">
                    <div className="flex gap-2">
                      <Select value={batch} onValueChange={(v) => setBatch(v || '')}>
                        <SelectTrigger className="flex-[1.5] h-10 text-xs bg-white dark:bg-slate-900 shadow-xs border-primary/20"><SelectValue placeholder="All Batches" /></SelectTrigger>
                        <SelectContent>
                          {['All', '2021-2025', '2022-2026', '2023-2027', '2024-2028', '2025-2029'].map(b => (
                            <SelectItem key={b} value={b} className="text-xs">{b}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="relative flex-[3]">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input 
                          placeholder="Search Name/SEC ID..." 
                          className="pl-10 h-10 text-sm w-full bg-white dark:bg-slate-900 shadow-xs border-primary/20" 
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">
                    <span>Available Members</span>
                    <Button variant="link" size="sm" className="h-auto p-0 text-[10px] text-primary" onClick={handleSelectAll}>Select All</Button>
                  </div>
                  <div className="border border-slate-100 dark:border-slate-800 rounded-xl max-h-[400px] overflow-y-auto p-2 space-y-1.5 bg-slate-50/30 dark:bg-slate-900/20">
                    {suggestions.filter(m => {
                      const q = searchQuery.toLowerCase()
                      const matchesQuery = (m.name?.toLowerCase() || '').includes(q) || (m.sec_id?.toLowerCase() || '').includes(q)
                      const matchesBatch = !batch || batch === 'All' || m.batch === batch
                      return matchesQuery && matchesBatch
                    }).map((m: any) => {
                      const isSelected = selectedMembers.find(sm => sm.id === m.id)
                      return (
                        <div 
                          key={m.id} 
                          onClick={() => toggleMemberSelection(m)}
                          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all duration-200 ${
                            isSelected ? 'bg-white dark:bg-slate-900 border-primary shadow-sm scale-[1.02]' : 'border-transparent hover:bg-white dark:hover:bg-slate-900'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                              {formatName(m.name)} {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase">{m.sec_id} • {m.department} • {m.batch}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Roles & History */}
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-slate-100/50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-xs uppercase tracking-widest text-slate-600 dark:text-slate-400 ml-2">Allocated Roles</h3>
              <Button size="sm" onClick={handleCreateContributions} disabled={selectedMembers.length === 0} className="shadow-lg h-8 text-xs font-bold px-4">Submit Records ({selectedMembers.length})</Button>
            </div>

            <div className="grid gap-4">
              {['Volunteer', 'Participant', 'Attendance'].filter(r => visibleBuckets.includes(r)).map(role => {
                const bucketMembers = selectedMembers.filter(m => m.role === role)
                const colorMap: any = {
                  Volunteer: 'emerald',
                  Participant: 'blue',
                  Attendance: 'amber'
                }
                const color = colorMap[role] || 'slate'
                
                return (
                  <Card key={role} className={`border border-${color}-100 dark:border-${color}-900/30 bg-white dark:bg-slate-950 overflow-hidden shadow-sm`}>
                    <div className={`h-1 bg-${color}-500`} />
                    <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
                      <CardTitle className={`text-xs font-black uppercase tracking-tighter text-${color}-600 dark:text-${color}-400`}>{role}</CardTitle>
                      <Badge variant="outline" className={`font-mono text-[10px] border-${color}-200 text-${color}-600 bg-${color}-50/50`}>{bucketMembers.length}</Badge>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 pt-0">
                      {bucketMembers.length === 0 ? (
                        <div className="text-center py-4 text-[10px] text-slate-400 border border-dashed rounded-xl bg-slate-50/50 dark:bg-slate-900/20 uppercase font-bold tracking-widest">
                          Not Assigned
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {bucketMembers.map(m => (
                            <div key={m.id} className="bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs">{m.name}</span>
                                <div className="flex gap-1.5">
                                  {visibleBuckets.length > 1 && (
                                    <Select value={m.role} onValueChange={(v) => updateMemberRole(m.id, v)}>
                                      <SelectTrigger className="h-6 text-[10px] px-2 w-[90px] shadow-none bg-white dark:bg-slate-950 border-slate-200"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        {visibleBuckets.map(r => <SelectItem key={r} value={r} className="text-[10px]">{r}</SelectItem>)}
                                      </SelectContent>
                                    </Select>
                                  )}
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20" onClick={() => toggleMemberSelection(m)}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                              {role !== 'Attendance' && (
                                <Input 
                                  placeholder="Work detail (e.g. Stage Management)" 
                                  className="h-7 text-[10px] shadow-none border-dashed bg-white dark:bg-slate-950" 
                                  value={m.justification}
                                  onChange={e => updateMemberJustification(m.id, e.target.value)}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Recorded Contributions History on Right */}
            <Card className="shadow-none bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 overflow-hidden">
              <CardHeader className="py-4 px-5 flex flex-row items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50">
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> History ({contributions.length})
                </CardTitle>
                {selectedEvent && (
                  <a href={`/api/export/event-report/${selectedEvent}`} download>
                    <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold px-3 border-primary/20 text-primary hover:bg-primary/5">
                      Export XLSX
                    </Button>
                  </a>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[400px] overflow-y-auto bg-white dark:bg-slate-950">
                  <Table>
                    <TableBody>
                      {contributions.length === 0 ? (
                        <TableRow><TableCell className="text-center text-xs text-slate-400 py-16 uppercase font-bold tracking-widest">No data recorded</TableCell></TableRow>
                      ) : (
                        contributions.map((c: any) => (
                          <TableRow key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors border-b border-slate-50 dark:border-slate-900">
                            <TableCell className="py-4 pl-5">
                              <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{formatName(c.member?.name)}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-1">{c.member?.sec_id} • {c.member?.batch}</div>
                            </TableCell>
                            <TableCell className="py-4 text-center">
                              <Badge variant="outline" className={`text-[9px] px-2 h-5 font-black border-0 bg-${c.role === 'Volunteer' ? 'emerald' : c.role === 'Participant' ? 'blue' : 'amber'}-100 dark:bg-${c.role === 'Volunteer' ? 'emerald' : c.role === 'Participant' ? 'blue' : 'amber'}-900/40 text-${c.role === 'Volunteer' ? 'emerald' : c.role === 'Participant' ? 'blue' : 'amber'}-700 dark:text-${c.role === 'Volunteer' ? 'emerald' : c.role === 'Participant' ? 'blue' : 'amber'}-400 uppercase`}>
                                {c.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-4 text-right pr-5">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all" onClick={() => setDeleteContribId(c.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>

    {/* Delete Contribution Confirm Dialog */}
    <AlertDialog open={!!deleteContribId} onOpenChange={open => !open && setDeleteContribId(null)}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold">Remove Contribution?</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-500">
            This will permanently remove the volunteer record for this member and deduct their score points.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 gap-2">
          <AlertDialogCancel className="rounded-xl border-slate-200">Keep it</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDeleteContrib} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-200 dark:shadow-none transition-all">
            Yes, Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
