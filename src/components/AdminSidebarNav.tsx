'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Users, Calendar, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AdminSidebarNav() {
  const pathname = usePathname()
  
  const links = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/members', label: 'Members', icon: Users },
    { href: '/admin/events', label: 'Events', icon: Calendar },
    { href: '/admin/contributions', label: 'Contributions', icon: Trophy },
  ]

  return (
    <nav className="flex-1 px-4 space-y-2 mt-4">
      {links.map(({ href, label, icon: Icon }) => {
        // Match exactly or starts with for nested admin routes
        const isActive = href === '/admin' 
          ? pathname === '/admin' 
          : pathname.startsWith(href)

        return (
          <Link key={href} href={href} className="relative block">
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800 transition-all",
                isActive && "bg-slate-800/60 text-white font-medium"
              )}
            >
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </Button>
          </Link>
        )
      })}
    </nav>
  )
}
