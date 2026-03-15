import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

interface QuickActionProps {
    href: string
    label: string
    description: string
    icon: LucideIcon
}

export function QuickAction({ href, label, description, icon: Icon }: QuickActionProps) {
    return (
        <Link href={href} className="flex flex-col gap-3 p-6 rounded-3xl bg-card border border-border/50 hover:border-accent/40 hover:bg-accent/5 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all">
                <Icon size={24} />
            </div>
            <div>
                <p className="font-bold text-white leading-tight">{label}</p>
                <p className="text-xs text-slate-500 mt-1">{description}</p>
            </div>
        </Link>
    )
}
