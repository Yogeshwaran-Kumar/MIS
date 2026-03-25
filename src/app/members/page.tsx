'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SearchIcon } from 'lucide-react'
import { Member } from '@/types/database.types'
import { formatName } from '@/lib/utils'

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedBatch, setSelectedBatch] = useState<string>('All')
  const [selectedStatus, setSelectedStatus] = useState<'active' | 'ex-member'>('active')

  useEffect(() => {
    async function fetchMembers() {
      setLoading(true)
      try {
        const res = await fetch(`/api/members?limit=2000&status=${selectedStatus}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const json = await res.json()
        setMembers(json.data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchMembers()
  }, [selectedStatus])

  // Derived state
  const batches = useMemo(() => {
    const b = new Set(members.map(m => m.batch))
    return ['All', ...Array.from(b).sort()]
  }, [members])

  const filteredMembers = useMemo(() => {
    let result = members

    if (selectedBatch !== 'All') {
      result = result.filter(m => m.batch === selectedBatch)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(m => 
        m.name.toLowerCase().includes(q) || 
        m.sec_id.toLowerCase().includes(q) || 
        (m.department || '').toLowerCase().includes(q)
      )
    }

    // Sort by batch (ascending), then by score (descending)
    return result.sort((a, b) => a.batch.localeCompare(b.batch) || b.total_score - a.total_score)
  }, [members, search, selectedBatch])

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl animate-in fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Members Directory</h1>
          <p className="text-muted-foreground mt-2">
            Search active and inactive volunteers and view their profiles.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by Name, SEC ID..." 
            className="pl-9 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto ml-auto">
          {/* Status Dropdown */}
          <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v === 'ex-member' ? 'ex-member' : 'active')}>
            <SelectTrigger className="w-[120px] h-9">
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
        </div>
      </div>

      {loading ? (
        <div className="border rounded-xl p-4 space-y-3 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-muted/50 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="border rounded-xl bg-background overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 text-center text-xs">Rank</TableHead>
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs">SEC ID</TableHead>
                <TableHead className="text-xs">Department</TableHead>
                <TableHead className="text-xs">Batch</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((m, i) => (
                <TableRow 
                  key={m.id} 
                  className="cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => window.location.href = `/members/${m.id}`}
                >
                  <TableCell className="text-center py-2.5">
                    <div className="w-5 h-5 mx-auto rounded-full flex items-center justify-center font-bold font-mono text-[10px] bg-primary/5 text-primary">
                      {i + 1}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-slate-800 dark:text-slate-100 py-2.5">
                    {formatName(m.name)}
                  </TableCell>
                  <TableCell className="font-mono text-xs py-2.5">{m.sec_id}</TableCell>
                  <TableCell className="text-xs py-2.5">{m.department || '-'}</TableCell>
                  <TableCell className="text-muted-foreground text-xs py-2.5">{m.batch}</TableCell>
                </TableRow>
              ))}
              {filteredMembers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    No members found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
