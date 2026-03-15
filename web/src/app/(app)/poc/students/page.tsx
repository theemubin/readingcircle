import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { GraduationCap, TrendingUp, Flame, Star, Search } from 'lucide-react'

export const metadata: Metadata = { title: 'Student Progress — POC' }

export default async function PocStudentsPage() {
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

    // Fetch students, their levels, and streaks for this campus
    const [
        { data: students },
        { data: levelData },
        { data: streakData }
    ] = await Promise.all([
        serviceSupabase
            .from('users')
            .select('id, display_name, username, avatar_url, created_at')
            .eq('role', 'student')
            .eq('campus_id', campusId || ''),
        serviceSupabase
            .from('student_levels')
            .select('student_id, total_xp, level'),
        serviceSupabase
            .from('streaks')
            .select('student_id, current_streak, longest_streak')
    ])

    // Merge data
    const studentsWithStats = (students || []).map(student => {
        const stats = levelData?.find(l => l.student_id === student.id)
        const streak = streakData?.find(s => s.student_id === student.id)
        return {
            ...student,
            level: stats?.level ?? 1,
            total_xp: stats?.total_xp ?? 0,
            current_streak: streak?.current_streak ?? 0,
        }
    }).sort((a, b) => b.total_xp - a.total_xp)

    return (
        <div className="p-8 md:p-12 max-w-6xl mx-auto space-y-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <GraduationCap size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold font-serif">Student Progress</h1>
                        <p className="text-slate-400 text-sm">Monitor reading activity and achievements across your campus.</p>
                    </div>
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search students..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    />
                </div>
            </header>

            {/* Leaderboard Cards (Top 3) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {studentsWithStats.slice(0, 3).map((s, i) => (
                    <div key={s.id} className="glass p-6 rounded-3xl border-indigo-500/10 relative overflow-hidden group hover:scale-[1.02] transition-all">
                        <div className={`absolute top-0 right-0 p-4 font-serif text-6xl opacity-5 italic font-black ${i === 0 ? 'text-yellow-400' : 'text-slate-400'}`}>
                            #{i + 1}
                        </div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white border-2 border-indigo-500/20">
                                {s.display_name[0]}
                            </div>
                            <div>
                                <p className="font-bold text-lg">{s.display_name}</p>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Level {s.level}</p>
                            </div>
                        </div>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Total Knowledge</p>
                                <p className="text-2xl font-serif font-black text-indigo-400">{s.total_xp.toLocaleString()} <span className="text-xs font-sans text-slate-500 tracking-normal font-bold">XP</span></p>
                            </div>
                            <div className="text-right">
                                <Flame className="text-orange-500 inline-block mr-1" size={18} />
                                <span className="font-black text-xl">{s.current_streak}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Complete Roster */}
            <div className="bg-slate-800/40 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-700 bg-slate-800/50">
                                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-slate-500">Student</th>
                                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-slate-500">Rank</th>
                                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-slate-500 text-center">Streak</th>
                                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-slate-500 text-right">Activity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {studentsWithStats.map((s, i) => (
                                <tr key={s.id} className="hover:bg-slate-700/20 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold font-serif text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                {s.display_name[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{s.display_name}</p>
                                                <p className="text-[10px] text-slate-500 font-mono tracking-tighter">@{s.username}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5">
                                            <Star size={14} className="text-yellow-500" />
                                            <span className="text-sm font-bold">Level {s.level}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="inline-flex items-center gap-1 bg-orange-500/10 text-orange-500 px-2 py-1 rounded-lg">
                                            <Flame size={14} />
                                            <span className="text-xs font-black">{s.current_streak}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-black text-indigo-400">{s.total_xp.toLocaleString()} XP</span>
                                            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Total Knowledge</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {studentsWithStats.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">
                                        No students found in this campus roster.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
