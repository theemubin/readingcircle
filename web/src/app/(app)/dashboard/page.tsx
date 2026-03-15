import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { LucideIcon } from 'lucide-react'
import type { Database } from '@/types/database'
import {
  Flame,
  Trophy,
  TrendingUp,
  Star,
  ArrowRight,
  BookOpen,
  Library as LibraryIcon,
  Medal,
  PlayCircle,
  Users,
  BarChart3,
  PlusCircle,
  ShieldCheck,
  UserPlus
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceSupabase = await createClient({ useServiceRole: true }) as unknown as SupabaseClient<Database>

  const { data: profile } = await (serviceSupabase
    .from('users')
    .select('display_name, role, campus_id')
    .eq('id', user.id)
    .single() as any)

  if (!profile) {
    // If no profile yet, they must go through onboarding
    redirect('/onboarding')
  }

  const isAdmin = profile.role === 'admin'
  const isPoc = profile.role === 'campus_poc'

  if (isAdmin || isPoc) {
    return <ManagerDashboard role={profile.role} profile={profile} supabase={serviceSupabase} />
  }

  // Student Dashboard Data
  const [
    { data: recentSessions },
    { data: levelData },
    { data: recentBadges },
    { data: streakData },
  ] = await Promise.all([
    supabase
      .from('reading_sessions')
      .select('id, book_id, duration_seconds, progress_percent, started_at, books(title, cover_url)')
      .eq('student_id', user.id)
      .order('started_at', { ascending: false })
      .limit(5),
    supabase
      .from('student_levels')
      .select('total_xp, level, xp_for_next_level')
      .eq('student_id', user.id)
      .single() as any,
    supabase
      .from('student_badges')
      .select('earned_at, badges(name, icon_url, slug)')
      .eq('student_id', user.id)
      .order('earned_at', { ascending: false })
      .limit(4),
    supabase
      .from('streaks')
      .select('current_streak, longest_streak')
      .eq('student_id', user.id)
      .single() as any,
  ])

  const level = levelData?.level ?? 1
  const totalXp = levelData?.total_xp ?? 0
  const xpForNext = levelData?.xp_for_next_level ?? 100
  const xpProgress = xpForNext > 0 ? Math.min((totalXp % 100) / xpForNext * 100, 100) : 0

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-10">
      <header className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight">
          Welcome back, {profile?.display_name?.split(' ')[0] ?? 'Reader'}
        </h1>
        <p className="text-slate-400 text-lg flex items-center gap-2">
          Ready to dive back into your books? <TrendingUp size={18} className="text-accent" />
        </p>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          label="Rank"
          value={`Level ${level}`}
          sub="Master Reader"
          icon={Star}
          color="indigo"
        />
        <StatCard
          label="Knowledge"
          value={totalXp.toLocaleString()}
          sub={`${xpForNext - (totalXp % xpForNext)} XP to next`}
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          label="Streak"
          value={`${streakData?.current_streak ?? 0}`}
          sub="Consecutive days"
          icon={Flame}
          color="orange"
        />
        <StatCard
          label="Hall of Fame"
          value={`${streakData?.longest_streak ?? 0}`}
          sub="All-time best"
          icon={Trophy}
          color="yellow"
        />
      </div>

      {/* XP progress bar */}
      <div className="glass p-6 rounded-3xl border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-white/5" />
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-1">XP Progression</p>
            <h3 className="text-xl font-serif font-bold italic">Path to Level {level + 1}</h3>
          </div>
          <span className="text-2xl font-bold text-accent font-serif">{Math.round(xpProgress)}%</span>
        </div>
        <div className="h-4 bg-slate-800/50 rounded-full overflow-hidden p-1 border border-white/5">
          <div
            className="h-full bg-gradient-to-r from-accent via-purple-500 to-accent bg-[length:200%_auto] animate-gradient-x rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(99,102,241,0.5)]"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Continue reading */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-serif font-bold">Recent Reading</h2>
            <Link href="/library" className="group flex items-center gap-1 text-sm font-bold text-accent hover:text-white transition-colors">
              Library <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {recentSessions && recentSessions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentSessions.slice(0, 4).map(session => {
                const book = Array.isArray(session.books) ? session.books[0] : session.books
                return (
                  <Link
                    key={session.id}
                    href={`/read/${session.book_id}`}
                    className="flex items-center gap-5 p-4 rounded-3xl bg-card border border-border/50 hover:bg-slate-800/50 hover:border-accent/30 transition-all group"
                  >
                    <div className="w-16 h-20 bg-slate-800 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden shadow-lg border border-white/5 group-hover:scale-105 transition-transform">
                      {book?.cover_url ? (
                        <img src={book.cover_url} alt="" className="w-full h-full object-cover" />
                      ) : <BookOpen size={24} className="text-slate-600" />}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between h-20 py-1">
                      <div>
                        <p className="font-bold truncate group-hover:text-accent transition-colors leading-tight">
                          {book?.title ?? 'Unknown book'}
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">
                          {Math.round(session.progress_percent)}% Complete
                        </p>
                      </div>
                      <div className="relative">
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent rounded-full group-hover:animate-pulse transition-all duration-500"
                            style={{ width: `${session.progress_percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-16 glass rounded-3xl border-dashed border-white/10">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                <LibraryIcon size={32} className="text-slate-600" />
              </div>
              <p className="text-slate-400 font-medium">Nothing here yet</p>
              <Link href="/library" className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-accent text-white rounded-xl font-bold hover:scale-105 transition-all text-sm shadow-lg shadow-accent/20">
                <PlayCircle size={18} /> Start Reading
              </Link>
            </div>
          )}
        </div>

        {/* Achievements / Badges */}
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-serif font-bold text-center w-full">Badges</h2>
          </div>

          <div className="glass p-6 rounded-3xl border-white/5">
            {recentBadges && recentBadges.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {recentBadges.map(sb => {
                  const badge = Array.isArray(sb.badges) ? sb.badges[0] : sb.badges
                  return (
                    <div key={`${sb.earned_at}`} className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-accent/20 transition-colors group">
                      <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-accent/10 group-hover:bg-accent group-hover:text-white transition-all text-accent">
                        {badge?.icon_url ? (
                          <img src={badge.icon_url} alt="" className="w-8 h-8 object-contain" />
                        ) : <Medal size={28} />}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest leading-none">
                        {badge?.name ?? 'Badge'}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Medal size={40} className="text-slate-700 mx-auto mb-3 opacity-20" />
                <p className="text-sm text-slate-500 font-medium">Earn badges by<br />mastering texts</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

async function ManagerDashboard({ role, profile, supabase }: { role: string; profile: { display_name: string; campus_id?: string }; supabase: SupabaseClient<Database> }) {
  const isPoc = role === 'campus_poc'

  // Fetch high-level stats
  const [
    { count: totalStudents },
    { count: totalBooks },
    { data: recentBooks }
  ] = await Promise.all([
    supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student')
      .filter('campus_id', isPoc ? 'eq' : 'neq', isPoc ? profile.campus_id : null),
    supabase
      .from('books')
      .select('*', { count: 'exact', head: true })
      .filter('campus_id', isPoc ? 'eq' : 'neq', isPoc ? profile.campus_id : null),
    supabase
      .from('books')
      .select('id, title, author, cover_url, status')
      .filter('campus_id', isPoc ? 'eq' : 'neq', isPoc ? profile.campus_id : null)
      .order('created_at', { ascending: false })
      .limit(4) as unknown as Promise<{ data: Database['public']['Tables']['books']['Row'][] }>
  ])

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-10">
      <header className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight">
          {role === 'admin' ? 'Global Command' : 'Campus Dashboard'}
        </h1>
        <p className="text-slate-400 text-lg flex items-center gap-2">
          Signed in as {profile.display_name} ({role.replace('_', ' ').toUpperCase()})
        </p>
      </header>

      {/* Admin/POC Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Community"
          value={`${totalStudents ?? 0}`}
          sub="Students enrolled"
          icon={Users}
          color="indigo"
        />
        <StatCard
          label="Library"
          value={`${totalBooks ?? 0}`}
          sub="Total volumes"
          icon={BookOpen}
          color="purple"
        />
        <StatCard
          label="System Status"
          value="Healthy"
          sub="All systems operational"
          icon={ShieldCheck}
          color="yellow"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickAction
          href="/poc/books"
          label="Add New Book"
          description="Upload EPUB & metadata"
          icon={PlusCircle}
        />
        <QuickAction
          href="/poc/students"
          label="Student Progress"
          description="View reading logs & XP"
          icon={BarChart3}
        />
        {role === 'admin' && (
          <>
            <QuickAction
              href="/admin/users"
              label="User Roles"
              description="Manage permissions"
              icon={UserPlus}
            />
            <QuickAction
              href="/admin/approvals"
              label="Pending Approvals"
              description="Verify campus requests"
              icon={ShieldCheck}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-serif font-bold">Recently Added Books</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentBooks?.map(book => (
              <div key={book.id} className="flex items-center gap-4 p-4 rounded-3xl bg-card border border-border/50">
                <div className="w-12 h-16 bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-white/5">
                  {book.cover_url ? (
                    <img src={book.cover_url} alt="" className="w-full h-full object-cover" />
                  ) : <BookOpen size={20} className="text-slate-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate leading-tight">{book.title}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">
                    {book.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-serif font-bold">Admin Tips</h2>
          <div className="glass p-6 rounded-3xl border-white/5 text-sm text-slate-400 leading-relaxed italic">
            Encourage students to reach a 7-day streak to unlock special community badges. Frequent uploads keep the library fresh!
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickAction({ href, label, description, icon: Icon }: { href: string; label: string; description: string; icon: LucideIcon }) {
  return (
    <Link href={href} className="flex flex-col gap-3 p-6 rounded-3xl bg-card border border-border/50 hover:border-accent/40 hover:bg-accent/5 transition-all group">
      <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all">
        <Icon size={24} />
      </div>
      <div>
        <p className="font-bold text-white leading-tight">{label}</p>
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      </div>
    </Link>
  )
}

function StatCard({ label, value, sub, color, icon: Icon }: {
  label: string
  value: string
  sub: string
  color: 'indigo' | 'purple' | 'orange' | 'yellow'
  icon: LucideIcon
}) {
  const colors = {
    indigo: 'from-accent/20 to-indigo-600/5 border-indigo-700/30 text-accent',
    purple: 'from-purple-600/20 to-purple-700/5 border-purple-700/30 text-purple-400',
    orange: 'from-orange-600/20 to-orange-700/5 border-orange-700/30 text-orange-400',
    yellow: 'from-yellow-600/20 to-yellow-700/5 border-yellow-700/30 text-yellow-500',
  }

  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-3xl p-6 transition-all hover:scale-[1.02] hover:shadow-xl relative overflow-hidden group`}>
      <Icon className="absolute -right-2 -bottom-2 w-20 h-20 opacity-5 group-hover:scale-125 transition-transform duration-500" />
      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold mb-1">{label}</p>
      <p className="text-3xl font-serif font-bold tracking-tight text-white">{value}</p>
      <p className="text-xs text-slate-400 mt-2 font-medium">{sub}</p>
    </div>
  )
}
