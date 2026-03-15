import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import {
    BarChart3,
    Users,
    BookOpen,
    Clock,
    TrendingUp,
    Award,
    Calendar,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'

export const metadata: Metadata = { title: 'Campus Analytics — POC' }
export const dynamic = 'force-dynamic'

export default async function PocAnalyticsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const serviceSupabase = await createClient({ useServiceRole: true })

    const { data: profile } = await serviceSupabase
        .from('users')
        .select('role, campus_id')
        .eq('id', user.id)
        .single()

    if (!profile || !['campus_poc', 'admin'].includes(profile.role)) {
        redirect('/dashboard')
    }

    const campusId = profile.campus_id

    // Fetch Analytics Data
    const [
        { count: studentCount },
        { count: bookCount },
        { data: sessions },
        { data: topReaders }
    ] = await Promise.all([
        serviceSupabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'student')
            .eq('campus_id', campusId || ''),
        serviceSupabase
            .from('books')
            .select('*', { count: 'exact', head: true })
            .eq('campus_id', campusId || ''),
        serviceSupabase
            .from('reading_sessions')
            .select('active_seconds, created_at, student_id (campus_id)')
            .filter('student_id.campus_id', 'eq', campusId || ''),
        serviceSupabase
            .from('student_levels')
            .select('student_id, total_xp, level, users(display_name)')
            .order('total_xp', { ascending: false })
            .limit(5)
    ])

    // Calculate totals
    const totalSeconds = sessions?.reduce((acc, s) => acc + (s.active_seconds || 0), 0) || 0
    const totalHours = Math.round(totalSeconds / 3600)

    // Mock weekly growth for visual flair
    const studentsGrowth = "+12%"
    const readingGrowth = "+18%"
    const booksGrowth = "+5"

    return (
        <div className="p-8 md:p-12 max-w-7xl mx-auto space-y-10 font-sans">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                        <BarChart3 size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold font-serif tracking-tight">Campus Insights</h1>
                        <p className="text-slate-400 text-lg">Performance metrics and engagement data for your institution.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-800/50 border border-slate-700 p-2 rounded-2xl">
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-indigo-600/20">Weekly</button>
                    <button className="px-4 py-2 text-slate-400 hover:text-white rounded-xl text-sm font-bold transition">Monthly</button>
                    <button className="px-4 py-2 text-slate-400 hover:text-white rounded-xl text-sm font-bold transition">All Time</button>
                </div>
            </header>

            {/* Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Active Readers"
                    value={`${studentCount ?? 0}`}
                    sub={studentsGrowth}
                    icon={Users}
                    color="indigo"
                />
                <StatCard
                    label="Reading Volume"
                    value={`${totalHours} hrs`}
                    sub={readingGrowth}
                    icon={Clock}
                    color="purple"
                />
                <StatCard
                    label="Library Size"
                    value={`${bookCount ?? 0}`}
                    sub={booksGrowth}
                    icon={BookOpen}
                    color="orange"
                />
                <StatCard
                    label="Active Goals"
                    value="84%"
                    sub="Completion rate"
                    icon={TrendingUp}
                    color="yellow"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Engagement Chart Placeholder */}
                <div className="lg:col-span-2 glass p-8 rounded-[2rem] border-white/5 space-y-6 flex flex-col">
                    <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-serif font-bold">Engagement Trends</h3>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                            <Calendar size={14} /> Last 7 Days
                        </div>
                    </div>
                    <div className="flex-1 min-h-[300px] flex items-end justify-between gap-2 pt-10">
                        {[45, 62, 58, 75, 90, 82, 95].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                                <div className="relative w-full">
                                    <div
                                        className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-2xl group-hover:from-indigo-500 group-hover:to-white transition-all duration-500 shadow-lg"
                                        style={{ height: `${h}%` }}
                                    />
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-indigo-900 px-2 py-1 rounded-lg text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity">
                                        {h}h
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Day {i + 1}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Readers Card */}
                <div className="glass p-8 rounded-[2rem] border-white/5 space-y-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-serif font-bold">Top Achievers</h3>
                        <Award size={20} className="text-yellow-500" />
                    </div>

                    <div className="space-y-6">
                        {topReaders?.map((r: any, i: number) => (
                            <div key={i} className="flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-400 border border-white/5 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                        {r.users?.display_name?.[0] || '?'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm leading-none">{r.users?.display_name || 'Anonymous'}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Lvl {r.level}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-indigo-400 text-sm">{r.total_xp.toLocaleString()} XP</p>
                                    <div className="flex items-center gap-1 text-[9px] text-green-500 font-black justify-end">
                                        <ArrowUpRight size={10} /> 4.2%
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all border border-white/5">
                        View Leaderboard
                    </button>
                </div>
            </div>

            {/* Detailed Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-[2rem] flex flex-col justify-between overflow-hidden relative group">
                    <BarChart3 className="absolute -right-4 -bottom-4 w-40 h-40 text-indigo-500/10 rotate-12 group-hover:scale-110 transition-transform" />
                    <div className="space-y-2 relative">
                        <h4 className="text-xl font-serif font-bold">Vocabulary Velocity</h4>
                        <p className="text-slate-400 text-sm leading-relaxed">Students are mastering an average of <span className="text-white font-bold">14 new words</span> per week. That's 20% higher than last month.</p>
                    </div>
                    <div className="flex items-center gap-2 text-green-400 font-bold text-sm mt-6 relative">
                        <ArrowUpRight size={20} /> Strong Growth
                    </div>
                </div>

                <div className="bg-purple-600/10 border border-purple-500/20 p-8 rounded-[2rem] flex flex-col justify-between overflow-hidden relative group">
                    <BookOpen className="absolute -right-4 -bottom-4 w-40 h-40 text-purple-500/10 -rotate-12 group-hover:scale-110 transition-transform" />
                    <div className="space-y-2 relative">
                        <h4 className="text-xl font-serif font-bold">Library Utilization</h4>
                        <p className="text-slate-400 text-sm leading-relaxed">Average of <span className="text-white font-bold">3.2 active books per student</span>. Diversification of reading material is increasing.</p>
                    </div>
                    <div className="flex items-center gap-2 text-purple-400 font-bold text-sm mt-6 relative">
                        <Zap size={20} className="fill-purple-400" /> High Activity
                    </div>
                </div>
            </div>
        </div>
    )
}

function Zap(props: any) {
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
            <path d="M4 14.71 13 4 11 10.29 20 9.29 11 20l2-6.29Z" />
        </svg>
    )
}
