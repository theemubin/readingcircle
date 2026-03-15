'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Search, Shield, User, Loader2 } from 'lucide-react'

type UserRow = {
    id: string
    display_name: string
    username: string
    role: 'student' | 'campus_poc' | 'admin'
    campus_id: string | null
    created_at: string
}

interface Props {
    initialUsers: UserRow[]
    currentUserId: string
}

export default function AdminUserList({ initialUsers, currentUserId }: Props) {
    const router = useRouter()
    const [users, setUsers] = useState<UserRow[]>(initialUsers)
    const [search, setSearch] = useState('')
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const filteredUsers = users.filter(u =>
        u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.username?.toLowerCase().includes(search.toLowerCase()) ||
        u.id.includes(search)
    )

    async function handleRoleChange(userId: string, newRole: 'student' | 'campus_poc' | 'admin') {
        if (userId === currentUserId && newRole !== 'admin') {
            if (!confirm('You are about to remove your own admin privileges. Are you sure?')) return
        }

        setUpdatingId(userId)
        setError(null)

        try {
            const res = await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: userId, // The API route needs to be updated to support 'id' override for admins
                    role: newRole
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to update role')
            }

            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setUpdatingId(null)
        }
    }

    return (
        <div className="space-y-6">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                    type="text"
                    placeholder="Search by name, username or ID..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    {error}
                </div>
            )}

            <div className="bg-slate-800/40 rounded-2xl border border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-700 bg-slate-800/50">
                                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-slate-400">User</th>
                                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-slate-400">Role</th>
                                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-slate-400">Campus ID</th>
                                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-slate-400">Joined</th>
                                <th className="px-6 py-4 text-xs uppercase tracking-wider font-bold text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-slate-700/20 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                                                {user.role === 'admin' ? <Shield size={20} className="text-indigo-400" /> : <User size={20} />}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-white">{user.display_name}</p>
                                                <p className="text-xs text-slate-500">@{user.username}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${user.role === 'admin' ? 'bg-indigo-500/20 text-indigo-400' :
                                                user.role === 'campus_poc' ? 'bg-purple-500/20 text-purple-400' :
                                                    'bg-slate-700 text-slate-400'
                                            }`}>
                                            {user.role.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <code className="text-xs text-slate-500 font-mono">
                                            {user.campus_id || '—'}
                                        </code>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <select
                                                value={user.role}
                                                disabled={updatingId === user.id}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                                                className="bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none disabled:opacity-50"
                                            >
                                                <option value="student">Student</option>
                                                <option value="campus_poc">Campus POC</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                            {updatingId === user.id && <Loader2 size={14} className="animate-spin text-slate-500" />}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
