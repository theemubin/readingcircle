import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
    label: string
    value: string
    sub: string
    color: 'indigo' | 'purple' | 'orange' | 'yellow'
    icon: LucideIcon
}

export function StatCard({ label, value, sub, color, icon: Icon }: StatCardProps) {
    const colors = {
        indigo: 'from-accent/20 to-indigo-600/5 border-indigo-700/30 text-accent',
        purple: 'from-purple-600/20 to-purple-700/5 border-purple-700/30 text-purple-400',
        orange: 'from-orange-600/20 to-orange-700/5 border-orange-700/30 text-orange-400',
        yellow: 'from-yellow-600/20 to-yellow-700/5 border-yellow-700/30 text-yellow-500',
    }

    return (
        <div className={`bg-gradient-to-br ${colors[color]} border rounded-3xl p-6 transition-all hover:scale-[1.02] hover:shadow-xl relative overflow-hidden group`}>
            <Icon className="absolute -right-2 -bottom-2 w-20 h-20 opacity-5 group-hover:scale-125 transition-transform duration-500" />
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold mb-1">{label}</p>
            <p className="text-3xl font-serif font-bold tracking-tight text-white">{value}</p>
            <p className="text-xs text-slate-400 mt-2 font-medium">{sub}</p>
        </div>
    )
}
