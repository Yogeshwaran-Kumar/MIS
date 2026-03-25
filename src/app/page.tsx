import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { createAdminClient } from '@/lib/supabase-server'
import { Trophy, Calendar, Users, ArrowRight } from 'lucide-react'
import { Member } from '@/types/database.types'
import { clubConfig } from '@/lib/club-config'
import { formatName } from '@/lib/utils'

export const revalidate = 60 // Revalidate every 60 seconds

export default async function Home() {
  const supabase = await createAdminClient()
  
  // Fetch top 10 members
  const { data: topMembers } = await supabase
    .from('members')
    .select('id, name, department, batch, total_score')
    .eq('status', 'active')
    .order('total_score', { ascending: false })
    .limit(20)

  // Fetch 3 most recent events
  const { data: recentEvents } = await supabase
    .from('events')
    .select('id, name, start_date, category')
    .order('start_date', { ascending: false })
    .limit(3)

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-12 animate-in fade-in duration-500">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden text-center py-16 md:py-24 bg-gradient-to-b from-primary/5 to-transparent rounded-3xl border">
        
        {/* Animated SDG background */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none flex items-center">
          <div className="flex w-[200%] animate-marquee">
            {[...Array(2)].map((_, index) => (
              <div key={index} className="flex gap-4 px-2 w-1/2 justify-around">
                {[...Array(17)].map((_, i) => (
                  <img 
                    key={i} 
                    src={`https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-${String(i + 1).padStart(2, '0')}.jpg`}
                    alt={`SDG Goal ${i + 1}`}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg shadow-sm object-cover"
                  />
                ))}
              </div>
            ))}
          </div>
          {/* Gradient overlay to blur edges */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-transparent to-slate-50 dark:from-slate-950 dark:to-slate-950/80"></div>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center justify-center mb-4">
            <img src="/ndli-logo-nbg.png" alt="NDLI Club Logo" className="h-24 md:h-28 object-contain drop-shadow-sm" />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight drop-shadow-sm">
            {clubConfig.name}
            <span className="block text-2xl md:text-3xl text-foreground/80 mt-2 font-medium">{clubConfig.college}</span>
          </h1>
          <p className="text-muted-foreground/90 max-w-2xl mx-auto text-lg mt-4 px-4 font-medium drop-shadow-sm">
            Empowering knowledge, recognizing contribution, and building a stronger student community through active engagement.
          </p>
          <div className="flex justify-center gap-4 mt-8">
            <Link href="/events">
              <Button size="lg" className="rounded-full shadow-md hover:shadow-lg transition-shadow">Explore Events</Button>
            </Link>
            <Link href="/members">
              <Button size="lg" variant="outline" className="rounded-full shadow-sm hover:shadow-md transition-shadow bg-background/50 backdrop-blur-sm">View Members</Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column - NDLI Info & Developer */}
        <div className="md:col-span-1 space-y-4">
          <Card className="border-primary/20 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-primary" />
                About
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed">
              The NDLI Club of our college is an integral part of our vibrant academic community, fostering a culture of reading, learning, and intellectual exploration. Supported by a team of active volunteers and guiding staff, the club is dedicated to promoting the effective use of resources among students and faculty.
              <br/><br/>
              Housed within the spacious and fully equipped college library, the NDLI Club conducts innovative and inspiring events aimed at involving students with books and digital resources. From creative activities to engaging discussions, every event is designed to ignite a passion for learning and provide valuable takeaways for participants.
            </CardContent>
          </Card>

          <Card className="border-primary/20 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="w-5 h-5 text-emerald-500" />
                Vision
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed">
              To establish the NDLI Club as a vibrant hub of learning and engagement, fostering a passion for books, knowledge, and creativity. By leveraging the resources of the National Digital Library and organizing impactful activities, we aim to develop well-rounded individuals who contribute meaningfully to society.
            </CardContent>
          </Card>

          <Card className="border-primary/20 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-blue-500" />
                Mission
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed">
              To create a vibrant and engaging platform where students can explore, connect, and grow through the world of books and knowledge. With active volunteers and dedicated guiding staff, we aim to organize innovative events, interactive book fairs, and creative library initiatives that inspire curiosity, foster critical thinking, and build a culture of lifelong learning and collaboration.
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Leaderboard & Events */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Leaderboard */}
          <Card className="shadow-md border-t-4 border-t-amber-500 overflow-hidden">
            <CardHeader className="bg-amber-500/5 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Trophy className="w-6 h-6 text-amber-500" />
                    Wall of Fame
                  </CardTitle>
                  <CardDescription className="mt-1">Top 10 contributors across all batches</CardDescription>
                </div>
                <Link href="/members">
                  <Button variant="ghost" size="sm" className="hidden sm:flex">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-amber-500/5 hover:bg-amber-500/5">
                    <TableHead className="w-12 text-center text-xs">Rank</TableHead>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Department</TableHead>
                    <TableHead className="text-xs">Batch</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topMembers?.map((m: any, i) => (
                    <TableRow key={m.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-center py-2">
                        <div className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center font-bold font-mono text-[11px]
                          ${i === 0 ? 'bg-amber-100 text-amber-700' : 
                            i === 1 ? 'bg-slate-100 text-slate-700' : 
                            i === 2 ? 'bg-orange-100 text-orange-800' : 
                            'bg-primary/5 text-primary'}`}>
                          {i + 1}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium py-2">
                        <Link href={`/members/${m.id}`} className="hover:text-primary transition-colors">
                          {formatName(m.name)}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs py-2">{m.department || '-'}</TableCell>
                      <TableCell className="text-muted-foreground text-xs py-2">{m.batch}</TableCell>
                    </TableRow>
                  ))}
                  {!topMembers?.length && (
                    <TableRow>
                      <TableCell colSpan={4} className="p-8 text-center text-muted-foreground">
                        No contributions yet. Start adding events!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Recent Events */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Recent Activities
              </h3>
              <Link href="/events" className="text-sm text-primary hover:underline flex items-center gap-1">
                See all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {recentEvents?.map((e: any) => (
                <Link key={e.id} href={`/events/${e.id}`}>
                  <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer group">
                    <CardHeader className="p-4">
                      <div className="text-xs text-primary font-medium mb-1">{e.category}</div>
                      <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-2">
                        {e.name}
                      </CardTitle>
                      <CardDescription className="text-xs mt-2 truncate">
                        {new Date(e.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
              {!recentEvents?.length && (
                <div className="col-span-3 p-8 text-center text-muted-foreground border rounded-xl border-dashed">
                  No events found.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} {clubConfig.name} MIS. All rights reserved.
        </p>
      </footer>
    </div>
  )
}

function BookOpenIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}
