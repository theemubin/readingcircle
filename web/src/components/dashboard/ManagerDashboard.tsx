import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { Users, BookOpen, ShieldCheck, PlusCircle, BarChart3, UserPlus, Library as LibraryIcon } from 'lucide-react'
import { StatCard } from './StatCard'
import { QuickAction } from './QuickAction'

interface ManagerDashboardProps {
    role: string
    profile: { display_name: string; campus_id?: string }
    supabase: SupabaseClient<Database>
}

export default async function ManagerDashboard({ role, profile, supabase }: ManagerDashboardProps) {
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <QuickAction
                    href="/poc/books"
                    label="Manage Books"
                    description="Upload & edit library"
                    icon={PlusCircle}
                />
                <QuickAction
                    href="/poc/students"
                    label="Student Progress"
                    description="View reading logs & XP"
                    icon={BarChart3}
                />
                <QuickAction
                    href="/poc/analytics"
                    label="Platform Stats"
                    description="Deep dive insights"
                    icon={BarChart3}
                />
                {role === 'admin' && (
                    <>
                        <QuickAction
                            href="/admin/approvals"
                            label="Pending Approvals"
                            description="Verify campus requests"
                            icon={ShieldCheck}
                        />
                        <QuickAction
                            href="/admin/users"
                            label="System Users"
                            description="Manage permissions"
                            icon={UserPlus}
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
