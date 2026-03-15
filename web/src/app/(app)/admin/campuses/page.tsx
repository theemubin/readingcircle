import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { Building2, Search, PlusCircle, Trash2 } from 'lucide-react'
import CampusList from './CampusList'

export const metadata: Metadata = { title: 'Campus Management — Admin' }

export default async function AdminCampusesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const serviceSupabase = await createClient({ useServiceRole: true })

    // Verify Admin
    const { data: profile } = await (serviceSupabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single() as any)

    if (!profile || profile.role !== 'admin') {
        redirect('/dashboard')
    }

    // Fetch all campuses
    const { data: campuses } = await serviceSupabase
        .from('campuses')
        .select('*')
        .order('name', { ascending: true })

    return (
        <div className="p-8 md:p-12 max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <Building2 size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold font-serif">Campus Management</h1>
                        <p className="text-slate-400 text-sm">Create and oversee independent reading communities.</p>
                    </div>
                </div>
            </div>

            <CampusList initialCampuses={campuses || []} />
        </div>
    )
}
