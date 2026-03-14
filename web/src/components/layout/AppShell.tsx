'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['users']['Row'] | null

interface AppShellProps {
  user: Profile
  children: React.ReactNode
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/library', label: 'Library', icon: '📚' },
  { href: '/vocabulary', label: 'Vocabulary', icon: '📖' },
  { href: '/quests', label: 'Quests', icon: '⚡' },
  { href: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { href: '/social', label: 'Social', icon: '👥' },
  { href: '/profile', label: 'Profile', icon: '👤' },
]

const POC_NAV_ITEMS = [
  { href: '/poc/books', label: 'Book Library', icon: '📚' },
  { href: '/poc/students', label: 'Students', icon: '🎓' },
  { href: '/poc/analytics', label: 'Analytics', icon: '📊' },
]

export default function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname()
  const isPoc = user?.role === 'campus_poc' || user?.role === 'admin'
  const navItems = isPoc ? POC_NAV_ITEMS : NAV_ITEMS

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-800">
          <Link href="/dashboard" className="text-xl font-bold">📚 Readable</Link>
        </div>

        {/* User card */}
        <div className="px-4 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
              {user?.display_name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.display_name ?? 'Reader'}</p>
              <p className="text-xs text-slate-400">
                {user ? `${user.xp_total.toLocaleString()} XP · 🔥${user.streak_current}` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  active
                    ? 'bg-indigo-700 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>{icon}</span>
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-slate-800">
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <span>🚪</span> Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
