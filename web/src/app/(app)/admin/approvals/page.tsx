import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { Inbox } from 'lucide-react'
import ApprovalList from './approval-list'

export const metadata: Metadata = { title: 'Pending Approvals — Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminApprovalsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
        return null
    }

    const serviceSupabase = await createClient({ useServiceRole: true })

    // Check if current user is admin
    const { data: profile } = await (serviceSupabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single() as any)

    if (!profile || profile.role !== 'admin') {
        redirect('/dashboard')
        return null
    }

    // Fetch all campus requests
    const { data: requests } = await serviceSupabase
        .from('campus_requests')
        .select('*, users(display_name, username)')
        .order('created_at', { ascending: false })

    return (
        <div className="p-8 md:p-12 max-w-6xl mx-auto space-y-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                        <Inbox size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold font-serif tracking-tight text-white">Pending Requests</h1>
                        <p className="text-slate-400 text-lg">Review and approve new campus registrations.</p>
                    </div>
                </div>
            </header>

            <ApprovalList initialRequests={requests || []} />
        </div>
    )
}
