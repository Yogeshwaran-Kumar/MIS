import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Toaster } from '@/components/ui/sonner'
import { clubConfig } from '@/lib/club-config'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: `${clubConfig.shortName} Club | ${clubConfig.college}`,
  description: 'Club Management Information System — tracking members, events, and contributions.',
  icons: {
    icon: clubConfig.logoPath,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${inter.className} min-h-screen bg-slate-50 flex flex-col`}>
        <Navbar />
        <main className="flex-1 mt-16 pb-12">
          {children}
        </main>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
