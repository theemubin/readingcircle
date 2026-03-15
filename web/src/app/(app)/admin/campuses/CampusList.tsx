'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Search, Plus, Trash2, Hash, Calendar, Loader2 } from 'lucide-react'

type Campus = {
    id: string
    name: string
    invite_code: string
    created_at: string
}

interface Props {
    initialCampuses: Campus[]
}

export default function CampusList({ initialCampuses }: Props) {
    const router = useRouter()
    const [campuses, setCampuses] = useState<Campus[]>(initialCampuses)
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    // New campus form
    const [showAdd, setShowAdd] = useState(false)
    const [newName, setNewName] = useState('')
    const [newCode, setNewCode] = useState('')

    const filtered = campuses.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.invite_code.toLowerCase().includes(search.toLowerCase())
    )

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault()
        if (!newName || !newCode) return

        setLoading(true)
        const supabase = createClient()

        const { data, error } = await supabase
            .from('campuses')
            .insert({ name: newName, invite_code: newCode.toUpperCase() })
            .select()
            .single()

        if (error) {
            alert(error.message)
        } else if (data) {
            setCampuses(prev => [data as Campus, ...prev])
            setNewName('')
            setNewCode('')
            setShowAdd(false)
            router.refresh()
        }
        setLoading(false)
    }

    async function handleDelete(id: string, name: string) {
        if (!confirm(`Are you sure you want to delete "${name}"? This might break user references if they are assigned to this campus.`)) return

        setDeletingId(id)
        const supabase = createClient()
        const { error } = await supabase.from('campuses').delete().eq('id', id)

        if (error) {
            alert(error.message)
        } else {
            setCampuses(prev => prev.filter(c => c.id !== id))
            router.refresh()
        }
        setDeletingId(null)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search campuses..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    />
                </div>
                <button
                    onClick={() => setShowAdd(!showAdd)}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl flex items-center gap-2 transition"
                >
                    <Plus size={18} /> New Campus
                </button>
            </div>

            {showAdd && (
                <form onSubmit={handleAdd} className="p-6 bg-slate-800 border border-indigo-500/30 rounded-2xl flex flex-wrap gap-4 items-end animate-in fade-in slide-in-from-top-4">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Campus Name</label>
                        <input
                            autoFocus
                            required
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="e.g. Oxford University"
                            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                        />
                    </div>
                    <div className="w-40">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Invite Code</label>
                        <input
                            required
                            value={newCode}
                            onChange={e => setNewCode(e.target.value.toUpperCase())}
                            placeholder="OXFORD24"
                            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setShowAdd(false)}
                            className="px-4 py-2.5 text-slate-400 hover:text-white transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl disabled:opacity-50 transition"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Create'}
                        </button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(campus => (
                    <div key={campus.id} className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6 group hover:border-indigo-500/40 transition-all hover:bg-slate-800/60">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                                <Building2 size={24} />
                            </div>
                            <button
                                onClick={() => handleDelete(campus.id, campus.name)}
                                disabled={deletingId === campus.id}
                                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            >
                                {deletingId === campus.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                            </button>
                        </div>

                        <h3 className="text-xl font-bold mb-1 truncate">{campus.name}</h3>

                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                            <Hash size={14} />
                            <span className="font-mono text-xs">{campus.invite_code}</span>
                        </div>

                        <div className="pt-4 border-t border-slate-700/50 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                            <div className="flex items-center gap-1.5">
                                <Calendar size={12} />
                                {new Date(campus.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-indigo-400/60 font-mono text-[9px] truncate ml-4">
                                {campus.id.split('-')[0]}...
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-20 bg-slate-800/20 rounded-2xl border border-dashed border-slate-700 text-slate-500">
                    <p className="text-4xl mb-4 opacity-20">🏫</p>
                    <p>No campuses foundmatching your search.</p>
                </div>
            )}
        </div>
    )
}

function Building2(props: any) {
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
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
            <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
            <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
            <path d="M10 6h4" />
            <path d="M10 10h4" />
            <path d="M10 14h4" />
            <path d="M10 18h4" />
        </svg>
    )
}
