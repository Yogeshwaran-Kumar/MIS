'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Upload, Download, Search, Trash2, Plus, Users as UsersIcon, Edit, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn, formatName } from '@/lib/utils'
import { toast } from 'sonner'
import { Member } from '@/types/database.types'

export default function AdminMembers() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [selectedBatch, setSelectedBatch] = useState<string>('All')

  // Derive unique batches from members list
  const batches = useMemo(() => {
    const b = new Set(members.map(m => m.batch).filter(Boolean))
    return ['All', ...Array.from(b).sort()]
  }, [members])

  const [selectedStatus, setSelectedStatus] = useState<'active' | 'ex-member'>('active')

  const fetchMembers = async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/members?limit=2000&status=${selectedStatus}`)
    const json = await res.json()
    setMembers(json.data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchMembers()
  }, [selectedStatus])

  // Auto-infer batch logic
  const handleSecIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase()
    setNewMember(prev => ({ ...prev, sec_id: val }))
    
    // Attempt auto-infer
    const match = val.match(/(SEC|SIT)(\d{2})([A-Z]{2})/i)
    if (match) {
      const startYear = parseInt("20" + match[2])
      const is5Year = match[3]?.toUpperCase() === 'CJ'
      setNewMember(prev => ({ ...prev, batch: `${startYear}-${startYear + (is5Year ? 5 : 4)}` }))
    }
  }

  // Edit state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<any>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newMember, setNewMember] = useState({
    name: '',
    sec_id: '',
    department: '',
    section: '',
    year: '1',
    batch: '',
    email: '',
    phone: '',
  })

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = { ...newMember, year: parseInt(newMember.year) }
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const result = await res.json()
      
      if (res.ok) {
        setDialogOpen(false)
        setNewMember({ name: '', sec_id: '', department: '', section: '', year: '1', batch: '', email: '', phone: '' })
        toast.success('Member added successfully')
        fetchMembers()
      } else {
        toast.error('Failed to add member: ' + result.error)
      }
    } finally {
      setSubmitting(false)
    }
  }

// (removed duplicate useEffect hook for fetchMembers since we added it tied to selectedStatus above)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/import/members', {
        method: 'POST',
        body: formData
      })
      const result = await res.json()
      if (res.ok) {
        toast.success(result.message)
        fetchMembers()
      } else {
        toast.error('Error: ' + result.error)
      }
    } catch (err: any) {
      toast.error('Failed to upload file: ' + err.message)
    } finally {
      setUploading(false)
      // clear input
      e.target.value = ''
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = { ...editingMember, year: parseInt(editingMember.year) }
      const res = await fetch(`/api/members/${editingMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const result = await res.json()
      
      if (res.ok) {
        setEditDialogOpen(false)
        setEditingMember(null)
        toast.success('Member updated successfully')
        fetchMembers()
      } else {
        toast.error('Failed to update member: ' + result.error)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name })
  }

  const handleSoftDelete = async () => {
    if (!deleteTarget) return
    const res = await fetch(`/api/members/${deleteTarget.id}`, { method: 'DELETE' })
    if (res.ok) {
      setMembers(prev => prev.filter(m => m.id !== deleteTarget.id))
      toast.success(`${deleteTarget.name} marked as ex-member`)
    } else {
      toast.error('Failed to update member status')
    }
    setDeleteTarget(null)
  }

  const handleHardDelete = async () => {
    if (!deleteTarget) return
    const res = await fetch(`/api/members/${deleteTarget.id}?hard=true`, { method: 'DELETE' })
    if (res.ok) {
      setMembers(prev => prev.filter(m => m.id !== deleteTarget.id))
      toast.success(`${deleteTarget.name} deleted permanently`)
    } else {
      toast.error('Failed to delete member')
    }
    setDeleteTarget(null)
  }

  const filtered = members.filter(m => {
    const q = search.toLowerCase()
    const matchesSearch = (
      (m.name?.toLowerCase() || '').includes(q) || 
      (m.sec_id?.toLowerCase() || '').includes(q) ||
      (m.department?.toLowerCase() || '').includes(q) ||
      (m.email?.toLowerCase() || '').includes(q)
    )
    const matchesBatch = selectedBatch === 'All' || m.batch === selectedBatch
    return matchesSearch && matchesBatch
  })

  // URL-based Filters & Sorting supports
  const searchParams = useSearchParams()

  useEffect(() => {
    const b = searchParams.get('batch')
    if (b) setSelectedBatch(b)
  }, [searchParams])

  const sortedAndFiltered = useMemo(() => {
    const res = [...filtered]
    const sort = searchParams.get('sort')
    if (sort === 'score_asc') {
      res.sort((a, b) => (a.total_score || 0) - (b.total_score || 0))
    } else if (sort === 'score_desc') {
      res.sort((a, b) => (b.total_score || 0) - (a.total_score || 0))
    }
    return res
  }, [filtered, searchParams])

  return (
    <>
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Members Management</h1>
          <p className="text-slate-500">View, add, or update member records via Excel.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <a href="/api/export/members-template" download>
            <Button variant="outline" size="lg" className="gap-2 shadow-sm">
              <Download className="w-4 h-4 text-primary" /> Download Template
            </Button>
          </a>

          <a href={`/api/export/members?status=${selectedStatus}&batch=${selectedBatch}`} download>
            <Button variant="outline" size="lg" className="gap-2 shadow-sm border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400">
              <Download className="w-4 h-4" /> Export List
            </Button>
          </a>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger className={cn(buttonVariants({ variant: 'default', size: 'lg' }), "gap-2 shadow-sm cursor-pointer")}>
              <Plus className="w-4 h-4" /> Add Manual
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Member Manually</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleManualAdd} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input required value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>SEC ID *</Label>
                    <Input required placeholder="SEC23..." value={newMember.sec_id} onChange={handleSecIdChange} />
                  </div>
                  <div className="space-y-2">
                    <Label>Batch * (Auto-detected)</Label>
                    <Input required placeholder="2023-2027" value={newMember.batch} onChange={e => setNewMember({...newMember, batch: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Year *</Label>
                    <Select required value={newMember.year} onValueChange={v => setNewMember({...newMember, year: v || '1'})}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1st Year</SelectItem>
                        <SelectItem value="2">2nd Year</SelectItem>
                        <SelectItem value="3">3rd Year</SelectItem>
                        <SelectItem value="4">4th Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Department *</Label>
                    <Input required value={newMember.department} onChange={e => setNewMember({...newMember, department: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Section</Label>
                    <Input placeholder="A, B..." value={newMember.section} onChange={e => setNewMember({...newMember, section: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input required type="email" value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={newMember.phone} onChange={e => setNewMember({...newMember, phone: e.target.value})} />
                  </div>
                </div>
                <Button type="submit" className="w-full mt-4" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Record'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Edit Member</DialogTitle>
              </DialogHeader>
              {editingMember && (
                <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name *</Label>
                      <Input required value={editingMember.name} onChange={e => setEditingMember({...editingMember, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>SEC ID *</Label>
                      <Input required value={editingMember.sec_id} onChange={e => setEditingMember({...editingMember, sec_id: e.target.value.toUpperCase()})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Batch *</Label>
                      <Input required placeholder="2023-2027" value={editingMember.batch} onChange={e => setEditingMember({...editingMember, batch: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Year *</Label>
                      <Select required value={editingMember.year?.toString()} onValueChange={v => setEditingMember({...editingMember, year: v || '1'})}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1st Year</SelectItem>
                          <SelectItem value="2">2nd Year</SelectItem>
                          <SelectItem value="3">3rd Year</SelectItem>
                          <SelectItem value="4">4th Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Department *</Label>
                      <Input required value={editingMember.department || ''} onChange={e => setEditingMember({...editingMember, department: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Section</Label>
                      <Input placeholder="A, B..." value={editingMember.section || ''} onChange={e => setEditingMember({...editingMember, section: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input required type="email" value={editingMember.email || ''} onChange={e => setEditingMember({...editingMember, email: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={editingMember.phone || ''} onChange={e => setEditingMember({...editingMember, phone: e.target.value})} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full mt-4" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
          
          <div className="relative">
            <input 
              type="file" 
              accept=".xlsx,.xls" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <Button size="lg" className="gap-2 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white" disabled={uploading}>
              <Upload className="w-4 h-4" /> 
              {uploading ? 'Uploading...' : 'Upload Excel'}
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              {selectedStatus === 'active' ? 'Active Directory' : 'Ex-Members Archive'} 
              <span className="text-sm font-normal text-muted-foreground">({filtered.length})</span>
            </CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              {/* Status Dropdown */}
              <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v === 'ex-member' ? 'ex-member' : 'active')}>
                <SelectTrigger className="w-[125px] h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="ex-member">Ex-Member</SelectItem>
                </SelectContent>
              </Select>

              {/* Batch Dropdown */}
              <Select value={selectedBatch} onValueChange={(v) => setSelectedBatch(v || 'All')}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="All Batches" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map(b => (
                    <SelectItem key={b} value={b}>{b === 'All' ? 'All Batches' : `Batch ${b}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input 
                  placeholder="Search name or SEC ID..." 
                  className="pl-9 h-9" 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name / SEC ID</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Dept</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center">Loading members...</TableCell></TableRow>
                ) : sortedAndFiltered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center">No active members found.</TableCell></TableRow>
                ) : (
                  sortedAndFiltered.slice(0, 100).map(m => ( // Limit rendering for performance if too many
                    <TableRow key={m.id}>
                      <TableCell>
                        <Link href={`/admin/members/${m.id}`} className="group">
                          <div className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-primary flex items-center gap-1">
                            {formatName(m.name)} <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="text-xs text-slate-500 font-mono">{m.sec_id}</div>
                        </Link>
                      </TableCell>
                      <TableCell><Badge variant="outline">{m.batch}</Badge></TableCell>
                      <TableCell>{m.department || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5 text-xs">
                          {m.email
                            ? <a href={`mailto:${m.email}`} className="text-blue-600 hover:underline truncate max-w-[180px]">{m.email}</a>
                            : <span className="text-slate-400 italic">No email</span>}
                          {m.phone
                            ? <a href={`tel:${m.phone}`} className="text-slate-600 hover:text-primary">{m.phone}</a>
                            : <span className="text-slate-400 italic">No phone</span>}
                        </div>
                      </TableCell>

                      <TableCell className="text-right flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-slate-400 hover:text-primary hover:bg-primary/10" 
                          onClick={() => {
                            setEditingMember(m)
                            setEditDialogOpen(true)
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30" 
                          onClick={() => handleDelete(m.id, m.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {filtered.length > 100 && (
              <div className="p-3 text-center text-xs text-slate-500 bg-slate-50 border-t">
                Showing top 100 results. Use search to find specific members.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Delete Confirm Dialog */}
    <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Manage Status</AlertDialogTitle>
          <AlertDialogDescription>
            Choose action for <strong>{deleteTarget?.name}</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-end gap-2 z-10">
          <AlertDialogCancel className="mt-0 h-9">Cancel</AlertDialogCancel>
          <Button variant="outline" onClick={handleSoftDelete} className="text-slate-700 h-9">Ex NDLI</Button>
          <AlertDialogAction onClick={handleHardDelete} className="bg-rose-600 hover:bg-rose-700 mt-0 h-9 text-white">
            Delete data
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
