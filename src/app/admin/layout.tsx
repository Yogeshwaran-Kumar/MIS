import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Users, Calendar, Trophy, LogOut } from 'lucide-react'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase-server'
import { clubConfig } from '@/lib/club-config'
import { AdminSidebarNav } from '@/components/AdminSidebarNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || ''
  
  let device = 'Desktop PC'
  if (userAgent.toLowerCase().includes('mobile')) device = 'Mobile Device'
  else if (userAgent.includes('Windows')) device = 'Windows PC'
  else if (userAgent.includes('Mac')) device = 'Mac'

  // Server-rendered current time as login time (since layout mounts on nav)
  const loginTime = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })

  if (device === 'Mobile Device') {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 items-center justify-center p-4 text-center">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border max-w-md">
          <LayoutDashboard className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-rose-600 dark:text-rose-400 mb-2">Desktop Access Only</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Admin portal access is restricted to Desktop or PC devices for security and optimal usability. Please log in from a computer.</p>
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="outline" className="w-full">
              Sign Out
            </Button>
          </form>
        </div>
      </div>
    )
  }

  // If unauthenticated, only render the child content (the Login box)
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        {children}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-50 flex-col hidden md:flex border-r border-slate-800 h-screen sticky top-0">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white tracking-tight">{clubConfig.shortName} Admin</h2>
          <p className="text-sm text-slate-400">{clubConfig.name} MIS</p>
        </div>
        <AdminSidebarNav />
        <div className="p-4 border-t border-slate-800">
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="ghost" className="w-full justify-start text-slate-400 hover:text-rose-400 hover:bg-rose-400/10">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden bg-slate-900 p-4 flex items-center justify-between text-white md:px-8 px-4 border-b border-slate-800">
          <span className="font-bold">{clubConfig.shortName} Admin</span>
          <div className="flex gap-2">
            <Link href="/admin"><Button variant="ghost" size="sm" className="px-2"><LayoutDashboard className="h-4 w-4" /></Button></Link>
            <Link href="/admin/members"><Button variant="ghost" size="sm" className="px-2"><Users className="h-4 w-4" /></Button></Link>
            <Link href="/admin/events"><Button variant="ghost" size="sm" className="px-2"><Calendar className="h-4 w-4" /></Button></Link>
            <Link href="/admin/contributions"><Button variant="ghost" size="sm" className="px-2"><Trophy className="h-4 w-4" /></Button></Link>
          </div>
        </header>

        {/* Desktop Active Session Banner */}
        <div className="hidden md:flex items-center justify-between bg-white dark:bg-slate-900 border-b px-8 py-3 text-sm shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium tracking-wide">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Admin Session Active
          </div>
          <div className="flex gap-6 text-slate-500 text-xs">
            <span suppressHydrationWarning>Login Time: {loginTime}</span>
            <span suppressHydrationWarning className="border-l pl-6">Device: {device}</span>
          </div>
        </div>

        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
