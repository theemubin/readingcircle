import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard — Readable' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: recentSessions },
    { data: levelData },
    { data: recentBadges },
  ] = await Promise.all([
    supabase
      .from('users')
      .select('display_name, xp_total, streak_current, streak_longest')
      .eq('id', user.id)
      .single(),
    supabase
      .from('reading_sessions')
      .select('id, book_id, duration_seconds, progress_percent, started_at, books(title, cover_url)')
      .eq('student_id', user.id)
      .order('started_at', { ascending: false })
      .limit(5),
    supabase
      .from('student_levels')
      .select('level, total_xp, xp_for_next_level')
      .eq('student_id', user.id)
      .single(),
    supabase
      .from('student_badges')
      .select('earned_at, badges(name, icon_url, slug)')
      .eq('student_id', user.id)
      .order('earned_at', { ascending: false })
      .limit(5),
  ])

  const level = levelData?.level ?? 1
  const totalXp = levelData?.total_xp ?? profile?.xp_total ?? 0
  const xpForNext = levelData?.xp_for_next_level ?? 100
  const xpProgress = xpForNext > 0 ? Math.min((totalXp % 100) / xpForNext * 100, 100) : 0

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-1">
        Hey {profile?.display_name?.split(' ')[0] ?? 'Reader'} 👋
      </h1>
      <p className="text-slate-400 mb-8">Ready to read something today?</p>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Level" value={`${level}`} sub="Reader" color="indigo" />
        <StatCard label="Total XP" value={totalXp.toLocaleString()} sub={`${xpForNext - (totalXp % xpForNext)} to next level`} color="purple" />
        <StatCard label="Current Streak" value={`${profile?.streak_current ?? 0}`} sub="days 🔥" color="orange" />
        <StatCard label="Best Streak" value={`${profile?.streak_longest ?? 0}`} sub="days 🏆" color="yellow" />
      </div>

      {/* XP progress bar */}
      <div className="bg-slate-800 rounded-xl p-5 mb-8 border border-slate-700">
        <div className="flex justify-between text-sm text-slate-400 mb-2">
          <span>Level {level}</span>
          <span>{Math.round(xpProgress)}%</span>
          <span>Level {level + 1}</span>
        </div>
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Continue reading */}
        <div className="lg:col-span-2 bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Continue reading</h2>
            <Link href="/library" className="text-sm text-indigo-400 hover:text-indigo-300">
              Browse library →
            </Link>
          </div>

          {recentSessions && recentSessions.length > 0 ? (
            <div className="space-y-3">
              {recentSessions.slice(0, 3).map(session => {
                const book = Array.isArray(session.books) ? session.books[0] : session.books
                return (
                  <Link
                    key={session.id}
                    href={`/read/${session.book_id}`}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-700 transition group"
                  >
                    <div className="w-10 h-14 bg-slate-600 rounded flex-shrink-0 flex items-center justify-center text-xl overflow-hidden">
                      {book?.cover_url ? (
                        <img src={book.cover_url} alt="" className="w-full h-full object-cover rounded" />
                      ) : '📖'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate group-hover:text-indigo-300 transition">
                        {book?.title ?? 'Unknown book'}
                      </p>
                      <div className="mt-1.5 h-1.5 bg-slate-600 rounded-full">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${session.progress_percent}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{Math.round(session.progress_percent)}% complete</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500">
              <p className="text-4xl mb-3">📚</p>
              <p>No reading sessions yet.</p>
              <Link href="/library" className="mt-3 inline-block text-sm text-indigo-400 hover:text-indigo-300">
                Pick a book to start →
              </Link>
            </div>
          )}
        </div>

        {/* Recent badges */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Badges</h2>
            <Link href="/profile" className="text-sm text-indigo-400 hover:text-indigo-300">
              All →
            </Link>
          </div>

          {recentBadges && recentBadges.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {recentBadges.map(sb => {
                const badge = Array.isArray(sb.badges) ? sb.badges[0] : sb.badges
                return (
                  <div key={`${sb.earned_at}`} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-700">
                    <span className="text-2xl">{badge?.icon_url ?? '🏅'}</span>
                    <span className="text-xs text-slate-300 text-center leading-tight">
                      {badge?.name ?? 'Badge'}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <p className="text-3xl mb-2">🏅</p>
              <p className="text-sm">Earn badges by reading!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, color }: {
  label: string; value: string; sub: string
  color: 'indigo' | 'purple' | 'orange' | 'yellow'
}) {
  const colors = {
    indigo: 'from-indigo-600/30 to-indigo-700/10 border-indigo-700/50',
    purple: 'from-purple-600/30 to-purple-700/10 border-purple-700/50',
    orange: 'from-orange-600/30 to-orange-700/10 border-orange-700/50',
    yellow: 'from-yellow-600/30 to-yellow-700/10 border-yellow-700/50',
  }
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-5`}>
      <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  )
}
