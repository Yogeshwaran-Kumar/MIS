'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { CalendarIcon, Plus, Trash2, Edit, Upload, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Event } from '@/types/database.types'

// ⚠️ MUST be defined OUTSIDE the parent component to prevent remounting on every keystroke
interface EventFormFieldsProps {
  data: any
  onChange: (field: string, val: string) => void
  uploading: boolean
  onPosterUpload: (file: File) => void
}

function EventFormFields({ data, onChange, uploading, onPosterUpload }: EventFormFieldsProps) {
  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Event Name *</Label>
        <Input
          required
          value={data.name || ''}
          onChange={e => onChange('name', e.target.value)}
          placeholder="e.g. Annual Tech Symposium"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>From Date *</Label>
          <Input type="date" required value={data.start_date || ''} onChange={e => onChange('start_date', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>To Date *</Label>
          <Input type="date" required value={data.end_date || ''} onChange={e => onChange('end_date', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Category *</Label>
          <Select required value={data.category || ''} onValueChange={v => onChange('category', v)}>
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              {['Event', 'Program/Activity', 'Attendance'].map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Mode *</Label>
          <Select required value={data.mode || 'Offline'} onValueChange={v => onChange('mode', v)}>
            <SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger>
            <SelectContent>
              {['Offline', 'Online', 'Hybrid'].map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Event Poster (Optional)</Label>
        {data.poster_url ? (
          <div className="relative w-full h-32 rounded-lg overflow-hidden border bg-slate-50">
            <img src={data.poster_url} alt="Poster preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange('poster_url', '')}
              className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
            >✕</button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <div className="flex flex-col items-center justify-center gap-1 text-slate-400 text-sm">
              {uploading
                ? <span className="animate-pulse">Uploading...</span>
                : <><Upload className="w-6 h-6 text-slate-400" /><span>Click to upload poster image</span><span className="text-xs">PNG, JPG, WEBP · Max 5MB</span></>
              }
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={e => { const f = e.target.files?.[0]; if (f) onPosterUpload(f) }}
            />
          </label>
        )}
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea rows={3} value={data.description || ''} onChange={e => onChange('description', e.target.value)} placeholder="Brief about the event..." />
      </div>
    </div>
  )
}

export default function AdminEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Create form state
  const [createForm, setCreateForm] = useState({
    name: '', start_date: '', end_date: '', category: '', mode: 'Offline', description: '', poster_url: ''
  })

  // Edit state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Partial<Event> | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')

  const filteredEvents = events.filter(e => {
    const q = searchQuery.toLowerCase()
    const matchesQuery = (e.name?.toLowerCase() || '').includes(q) || (e.description?.toLowerCase() || '').includes(q)
    const matchesCategory = categoryFilter === 'All' || e.category === categoryFilter
    return matchesQuery && matchesCategory
  })

  const fetchEvents = async () => {
    setLoading(true)
    const res = await fetch('/api/events?limit=100')
    const json = await res.json()
    setEvents(json.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchEvents() }, [])

  const handlePosterUpload = async (
    file: File,
    setUrl: (url: string) => void
  ) => {
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload/poster', { method: 'POST', body: fd })
    const json = await res.json()
    if (res.ok && json.url) {
      setUrl(json.url)
    } else {
      toast.error('Upload failed: ' + (json.error || 'Unknown error'))
    }
    setUploading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: createForm.name,
        start_date: createForm.start_date,
        end_date: createForm.end_date,
        category: createForm.category,
        mode: createForm.mode,
        description: createForm.description,
        poster_url: createForm.poster_url,
      })
    })
    if (res.ok) {
      setIsDialogOpen(false)
      setCreateForm({ name: '', start_date: '', end_date: '', category: '', mode: 'Offline', description: '', poster_url: '' })
      toast.success('Event created successfully')
      fetchEvents()
    } else {
      const err = await res.json()
      toast.error('Error: ' + err.error)
    }
    setSubmitting(false)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEvent) return
    setSubmitting(true)
    const res = await fetch(`/api/events/${editingEvent.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editingEvent.name,
        start_date: editingEvent.start_date,
        end_date: editingEvent.end_date,
        category: editingEvent.category,
        mode: editingEvent.mode,
        description: editingEvent.description,
        poster_url: editingEvent.poster_url,
      })
    })
    if (res.ok) {
      setEditDialogOpen(false)
      setEditingEvent(null)
      toast.success('Event updated successfully')
      fetchEvents()
    } else {
      const err = await res.json()
      toast.error('Error: ' + err.error)
    }
    setSubmitting(false)
  }

  const openEdit = (ev: any) => {
    setEditingEvent({
      ...ev,
      start_date: ev.start_date?.slice(0, 10) ?? '',
      end_date: ev.end_date?.slice(0, 10) ?? '',
    })
    setEditDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    const res = await fetch(`/api/events/${deleteTarget.id}`, { method: 'DELETE' })
    if (res.ok) {
      setEvents(prev => prev.filter(e => e.id !== deleteTarget.id))
      toast.success(`"${deleteTarget.name}" deleted`)
    } else {
      toast.error('Failed to delete event. Try again.')
    }
    setDeleteTarget(null)
  }

  return (
    <>
      <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events Management</h1>
          <p className="text-slate-500">Create and manage club events and activities.</p>
        </div>

        {/* Add Event Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2">
            <Plus className="w-4 h-4" /> Add New Event
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <EventFormFields
                data={createForm}
                onChange={(field, val) => setCreateForm(prev => ({ ...prev, [field]: val }))}
                uploading={uploading}
                onPosterUpload={file => handlePosterUpload(file, url => setCreateForm(prev => ({ ...prev, poster_url: url })))}
              />
              <Button type="submit" className="w-full mt-4" disabled={submitting}>
                {submitting ? 'Creating...' : 'Save Event'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Event Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
            </DialogHeader>
            {editingEvent && (
              <form onSubmit={handleEditSubmit}>
                <EventFormFields
                  data={editingEvent}
                  onChange={(field, val) => setEditingEvent((prev: any) => ({ ...prev, [field]: val }))}
                  uploading={uploading}
                  onPosterUpload={file => handlePosterUpload(file, url => setEditingEvent((prev: any) => ({ ...prev, poster_url: url })))}
                />
                <Button type="submit" className="w-full mt-4" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All Events</CardTitle>
          <CardDescription>Recent events shown first</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search events..." 
                className="pl-8 h-9 text-xs bg-transparent shadow-none border" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={v => setCategoryFilter(v || 'All')}>
              <SelectTrigger className="w-[140px] h-9 text-xs bg-transparent shadow-none border border-slate-200">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                {['All', 'Event', 'Program/Activity', 'Attendance'].map(c => (
                  <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="h-24 text-center">Loading events...</TableCell></TableRow>
                ) : filteredEvents.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="h-24 text-center">No events found.</TableCell></TableRow>
                ) : (
                  filteredEvents.map(ev => (
                    <TableRow key={ev.id}>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">{ev.name}</TableCell>
                      <TableCell className="text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5" />
                          {new Date(ev.start_date).toLocaleDateString()}
                          {ev.end_date && ev.end_date !== ev.start_date && (
                            <> — {new Date(ev.end_date).toLocaleDateString()}</>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{ev.category || 'Event'}</Badge>
                        <Badge variant="outline" className="ml-1 text-[10px] opacity-70">{ev.mode || 'Offline'}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost" size="icon"
                            className="text-slate-400 hover:text-primary hover:bg-primary/10"
                            onClick={() => openEdit(ev)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            onClick={() => setDeleteTarget({ id: ev.id, name: ev.name })}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.name}</strong> and all its associated contributions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 focus:ring-rose-600">
              Delete Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
