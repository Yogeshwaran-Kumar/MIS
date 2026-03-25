'use client'

import Link from 'next/link'
import { BookOpen, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function Navbar() {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Home' },
    { href: '/events', label: 'Events' },
    { href: '/members', label: 'Members' },
    { href: '/about', label: 'About' }
  ]

  return (
    <nav className="fixed top-0 w-full z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3">
          <img src="/ndli-logo-nbg.png" alt="NDLI Club Logo" className="h-8 object-contain" />
          <span className="font-bold text-lg hidden sm:inline-block">
            NDLI Club <span className="text-muted-foreground font-normal text-sm">| Sri Sairam Engineering College</span>
          </span>
          <span className="font-bold text-lg sm:hidden">NDLI Club</span>
        </Link>
        <div className="flex items-center space-x-1 sm:space-x-2">
          {links.map(({ href, label }) => {
            const isActive = pathname === href
            return (
              <Link key={href} href={href} className="relative">
                <Button 
                  variant="ghost" 
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-300 hover:text-blue-600"
                  )}
                >
                  {label}
                </Button>
              </Link>
            )
          })}
          <div className="w-px h-6 bg-border mx-2" />
          <Link href="/admin/login">
            <Button variant="outline" size="sm">Admin</Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}
