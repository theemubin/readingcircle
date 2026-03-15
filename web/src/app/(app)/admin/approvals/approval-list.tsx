'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, Clock, Mail, MessageSquare, User, Building2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Request {
    id: string
    user_id: string
    campus_name: string
    contact_email: string
    message: string | null
    status: string
    created_at: string
    users: {
        display_name: string
        username: string
    } | null
}

export default function ApprovalList({ initialRequests }: { initialRequests: Request[] }) {
    const router = useRouter()
    const [requests, setRequests] = useState(initialRequests)
    const [updatingId, setUpdatingId] = useState<string | null>(null)

    async function handleStatusChange(id: string, status: string) {
        setUpdatingId(id)
        const res = await fetch('/api/campus-requests', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status }),
        })

        if (res.ok) {
            setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
            router.refresh()
        }
        setUpdatingId(null)
    }

    if (requests.length === 0) {
        return (
            <div className="text-center py-24 glass rounded-[2.5rem] border-white/5">
                <InboxIcon className="w-16 h-16 text-slate-700 mx-auto mb-4 opacity-20" />
                <p className="text-slate-500 font-medium">No pending requests at the moment.</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 gap-6">
            {requests.map(req => (
                <div
                    key={req.id}
                    className={`glass p-8 rounded-[2.5rem] border-white/5 flex flex-col md:flex-row gap-8 transition-all relative overflow-hidden group ${req.status === 'approved' ? 'opacity-60 grayscale-[0.5]' : ''
                        }`}
                >
                    <div className="flex-1 space-y-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                                    <Building2 size={24} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-serif font-bold text-white">{req.campus_name}</h3>
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">
                                        <Clock size={12} /> {new Date(req.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${req.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                                    req.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                                        'bg-red-500/10 text-red-500'
                                }`}>
                                {req.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 bg-slate-900/40 p-4 rounded-2xl border border-white/5">
                                <Mail size={16} className="text-slate-500" />
                                <div className="min-w-0">
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Contact Email</p>
                                    <p className="text-sm font-medium text-slate-300 truncate">{req.contact_email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-900/40 p-4 rounded-2xl border border-white/5">
                                <User size={16} className="text-slate-500" />
                                <div className="min-w-0">
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Requested By</p>
                                    <p className="text-sm font-medium text-slate-300 truncate">{req.users?.display_name || 'Unknown'}</p>
                                </div>
                            </div>
                        </div>

                        {req.message && (
                            <div className="bg-indigo-500/5 p-6 rounded-2xl border border-indigo-500/10 relative">
                                <MessageSquare size={16} className="absolute -top-2 -left-2 text-indigo-500" />
                                <p className="text-sm text-slate-400 leading-relaxed italic">&ldquo;{req.message}&rdquo;</p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-row md:flex-col justify-center gap-3 w-full md:w-48">
                        {req.status === 'pending' ? (
                            <>
                                <button
                                    disabled={updatingId === req.id}
                                    onClick={() => handleStatusChange(req.id, 'approved')}
                                    className="flex-1 md:flex-none py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
                                >
                                    {updatingId === req.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                    Approve
                                </button>
                                <button
                                    disabled={updatingId === req.id}
                                    onClick={() => handleStatusChange(req.id, 'rejected')}
                                    className="flex-1 md:flex-none py-4 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-2xl text-xs font-black uppercase tracking-widest transition border border-white/5 flex items-center justify-center gap-2"
                                >
                                    <XCircle size={16} />
                                    Reject
                                </button>
                            </>
                        ) : (
                            <button
                                disabled
                                className="w-full py-4 bg-slate-800/50 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest border border-white/5"
                            >
                                Decided
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}

function InboxIcon(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
            <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
        </svg>
    )
}
