'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Home,
  Library,
  BookOpen,
  Zap,
  Trophy,
  Users,
  User,
  LogOut,
  Menu,
  X,
  BookMarked,
  GraduationCap,
  BarChart3,
  Shield,
  Building2
} from 'lucide-react'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['users']['Row'] | null

interface AppShellProps {
  user: Profile
  children: React.ReactNode
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/vocabulary', label: 'Vocabulary', icon: BookOpen },
  { href: '/quests', label: 'Quests', icon: Zap },
  { href: '/leaderboard', label: 'Leagues', icon: Trophy },
  { href: '/social', label: 'Social', icon: Users },
  { href: '/profile', label: 'Profile', icon: User },
]

const POC_NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/poc/books', label: 'Library', icon: Library },
  { href: '/poc/students', label: 'Students', icon: GraduationCap },
  { href: '/poc/analytics', label: 'Analytics', icon: BarChart3 },
]

const BOTTOM_NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/quests', label: 'Quests', icon: Zap },
  { href: '/profile', label: 'Profile', icon: User },
]

const POC_BOTTOM_NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/poc/books', label: 'Library', icon: Library },
  { href: '/poc/students', label: 'Students', icon: GraduationCap },
  { href: '/profile', label: 'Profile', icon: User },
]

export default function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const isPoc = user?.role === 'campus_poc' || user?.role === 'admin'
  const isAdmin = user?.role === 'admin'

  const baseNavItems = isPoc ? POC_NAV_ITEMS : NAV_ITEMS
  const adminNavItems = isAdmin ? [
    { href: '/admin/users', label: 'Users', icon: Shield },
    { href: '/admin/campuses', label: 'Campuses', icon: Building2 }
  ] : []
  const navItems = [...baseNavItems, ...adminNavItems]

  const baseBottomNavItems = isPoc ? POC_BOTTOM_NAV_ITEMS : BOTTOM_NAV_ITEMS
  const adminBottomNavItems = isAdmin ? [
    { href: '/admin/users', label: 'Users', icon: Shield },
    { href: '/admin/campuses', label: 'Campuses', icon: Building2 }
  ] : []
  const bottomNavItems = [...baseBottomNavItems, ...adminBottomNavItems]

  // Close mobile menu on path change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 bg-card border-r border-border flex-col">
        {/* Logo */}
        <div className="px-8 py-8">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20 transition-transform group-hover:scale-105">
              <BookMarked size={24} className="text-white" />
            </div>
            <span className="text-2xl font-serif font-bold tracking-tight">Readable</span>
          </Link>
        </div>

        {/* User preview */}
        <div className="px-6 mb-6">
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-border/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-inner">
              {user?.display_name?.[0]?.toUpperCase() ?? 'R'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{user?.display_name ?? 'Reader'}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                {user?.role === 'admin' ? 'Global Admin' : user?.role === 'campus_poc' ? 'Campus POC' : `Level ${user?.xp_total ? Math.floor(user.xp_total / 100) + 1 : 1} Reader`}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${active
                  ? 'bg-accent text-white shadow-lg shadow-accent/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
              >
                <Icon size={18} className={active ? 'text-white' : 'group-hover:text-white'} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-4 border-t border-border">
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-red-500/10 hover:text-red-400 transition-all"
            >
              <LogOut size={18} />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 flex items-center justify-between px-6 bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-40">
          <Link href="/dashboard" className="flex items-center gap-2">
            <BookMarked size={20} className="text-accent" />
            <span className="text-xl font-serif font-bold">Readable</span>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* Mobile Navigation Drawer (Overlay) */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="absolute top-0 right-0 bottom-0 w-72 bg-card border-l border-border flex flex-col animate-in slide-in-from-right duration-300">
              <div className="p-6 flex justify-end">
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400">
                  <X size={24} />
                </button>
              </div>
              <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                {navItems.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href || pathname.startsWith(href + '/')
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-4 px-4 py-4 rounded-2xl text-base font-medium transition ${active ? 'bg-accent text-white' : 'text-slate-400 hover:bg-slate-800'
                        }`}
                    >
                      <Icon size={20} />
                      {label}
                    </Link>
                  )
                })}
              </nav>
              <div className="p-6 border-t border-border">
                <form action="/api/auth/signout" method="POST">
                  <button type="submit" className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-base font-medium text-red-400 hover:bg-red-500/10">
                    <LogOut size={20} />
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto relative pb-20 lg:pb-0">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 glass-dark border-t border-white/5 flex items-center justify-around px-4 z-40">
          {bottomNavItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-all ${active ? 'text-accent' : 'text-slate-500'
                  }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-accent/10 scale-110' : ''}`}>
                  <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-tighter ${active ? 'opacity-100' : 'opacity-60'}`}>
                  {label}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
