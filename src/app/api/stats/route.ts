import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

export async function GET() {
  const adminClient = await createAdminClient()

  // Run in parallel
  const [
    { count: totalMembers },
    { count: activeMembers },
    { count: totalEvents },
    { data: scoreData },
    { data: topMembers },
    { data: lowMembers },
    { data: membersAndEvents },
    { count: totalSec },
    { count: totalSit },
    { data: roleData }
  ] = await Promise.all([
    adminClient.from('members').select('*', { count: 'exact', head: true }),
    adminClient.from('members').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    adminClient.from('events').select('*', { count: 'exact', head: true }),
    adminClient.from('members').select('total_score'),
    
    // Top 10 members
    adminClient.from('members').select('id, name, total_score, sec_id')
      .eq('status', 'active')
      .order('total_score', { ascending: false })
      .limit(10),

    // Low 10 members
    adminClient.from('members').select('id, name, total_score, sec_id')
      .eq('status', 'active')
      .order('total_score', { ascending: true })
      .limit(10),

    // Multi-fetch support for aggregator batches
    adminClient.from('members').select('batch, department').eq('status', 'active'),

    // Campus splits
    adminClient.from('members').select('*', { count: 'exact', head: true }).ilike('sec_id', 'SEC%'),
    adminClient.from('members').select('*', { count: 'exact', head: true }).ilike('sec_id', 'SIT%'),

    // Role Data
    adminClient.from('contributions').select('role')
  ])

  // Separate fetch for events to aggregate timelines safely
  const { data: eventsData } = await adminClient
    .from('events')
    .select('category, start_date')
    .order('start_date', { ascending: true })

  // Calculate Average Score
  const validScores = scoreData?.filter(m => typeof m.total_score === 'number').map(m => m.total_score) || []
  let avgScore = 0
  if (validScores.length > 0) {
    avgScore = validScores.reduce((acc, curr) => acc + curr, 0) / validScores.length
  }

  // Aggregate Category Distribution
  const categoryCounts = eventsData?.reduce((acc: any, curr) => {
    const cat = curr.category || 'Other'
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {}) || {}

  const categoriesChart = Object.keys(categoryCounts).map(name => ({
    name,
    value: categoryCounts[name]
  }))

  // 1. Batch Wise total aggregates 
  const batchCounts = membersAndEvents?.reduce((acc: any, curr) => {
    const b = curr.batch || 'Other'
    acc[b] = (acc[b] || 0) + 1
    return acc
  }, {}) || {}

  const batchChart = Object.keys(batchCounts).sort().map(name => ({
    name,
    count: batchCounts[name]
  }))

  // 1b. Department Wise Aggregates (Including complete members map for interlinking on client)
  const deptCounts = membersAndEvents?.reduce((acc: any, curr) => {
    const d = curr.department || 'Other'
    acc[d] = (acc[d] || 0) + 1
    return acc
  }, {}) || {}

  const deptChart = Object.keys(deptCounts).map(name => ({
    name,
    count: deptCounts[name]
  }))

  // 1c. Role Distribution Aggregates
  const roleCounts = roleData?.reduce((acc: any, curr) => {
    const r = curr.role || 'Other'
    acc[r] = (acc[r] || 0) + 1
    return acc
  }, {}) || {}

  const roleChart = Object.keys(roleCounts)
    .filter(name => ['Volunteer', 'Participant'].includes(name))
    .map(name => ({
      name: name === 'Participant' ? 'Participate' : name,
      value: roleCounts[name]
    }))

  // 2. Progressive Growth (Events over months)
  const monthCounts = eventsData?.reduce((acc: any, curr) => {
    if (!curr.start_date) return acc
    const d = new Date(curr.start_date)
    const month = d.toLocaleString('en-US', { month: 'short' })
    const year = d.getFullYear().toString().slice(-2)
    const label = `${month} '${year}`
    acc[label] = (acc[label] || 0) + 1
    return acc
  }, {}) || {}

  const progressiveChart = Object.keys(monthCounts).map(label => ({
    name: label,
    events: monthCounts[label]
  }))

  return NextResponse.json({
    kpis: {
      totalMembers: totalMembers || 0,
      activeMembers: activeMembers || 0,
      totalEvents: totalEvents || 0,
      totalSec: totalSec || 0,
      totalSit: totalSit || 0,
      avgScore: Math.round(avgScore * 10) / 10
    },
    topMembers: topMembers || [],
    lowMembers: lowMembers || [],
    categoriesChart,
    batchChart,
    deptChart,
    roleChart,
    membersRaw: membersAndEvents || [], // send for client-side interactive filtering
    progressiveChart
  })
}
