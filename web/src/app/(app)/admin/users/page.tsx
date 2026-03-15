import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import AdminUserList from './AdminUserList'
import { ShieldCheck } from 'lucide-react'

export const metadata: Metadata = { title: 'User Management — Admin' }

export default async function AdminUsersPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const serviceSupabase = await createClient({ useServiceRole: true })

    // Check if current user is admin
    const { data: profile } = await (serviceSupabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single() as any)

    if (!profile || profile.role !== 'admin') {
        redirect('/dashboard')
    }

    // Fetch all users
    const { data: allUsers } = await (serviceSupabase
        .from('users')
        .select('id, display_name, username, role, campus_id, created_at')
        .order('created_at', { ascending: false }) as any)

    return (
        <div className="p-8 md:p-12 max-w-6xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <ShieldCheck size={28} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold font-serif tracking-tight">User Management</h1>
                    <p className="text-slate-400 text-sm">Review accounts and manage system-wide permissions.</p>
                </div>
            </div>

            <AdminUserList initialUsers={allUsers || []} currentUserId={user.id} />
        </div>
    )
}
