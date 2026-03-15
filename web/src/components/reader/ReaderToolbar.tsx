'use client'

import { ArrowLeft, List, Settings2 } from 'lucide-react'

interface Theme {
  bg: string; fg: string; toolbar: string; border: string
}

interface Props {
  title: string
  progress: number
  theme: Theme
  onBack: () => void
  onToggleSettings: () => void
  onToggleToc: () => void
  tocOpen: boolean
}

export default function ReaderToolbar({ title, progress, theme, onBack, onToggleSettings, onToggleToc, tocOpen }: Props) {
  return (
    <div
      className="flex items-center gap-4 px-6 md:px-8 py-4 border-b flex-shrink-0 z-50 transition-all"
      style={{ background: theme.toolbar, borderColor: theme.border }}
    >
      <button
        onClick={onBack}
        className="p-2.5 rounded-xl hover:bg-slate-500/10 transition-all flex-shrink-0 group"
        style={{ color: theme.fg }}
        title="Back to library"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
      </button>

      <button
        onClick={onToggleToc}
        className={`p-2.5 rounded-xl transition-all flex-shrink-0 ${tocOpen ? 'bg-accent/10 border-accent/20 border text-accent' : 'hover:bg-slate-500/10 opacity-60 hover:opacity-100'}`}
        style={{ color: tocOpen ? '#6366f1' : theme.fg }}
        title="Table of contents"
      >
        <List size={20} />
      </button>

      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-serif font-bold italic truncate text-center"
          style={{ color: theme.fg }}
        >
          {title}
        </p>
      </div>

      {/* Progress pill */}
      <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-full bg-slate-500/5 border border-white/5 flex-shrink-0">
        <div className="w-20 h-1 bg-slate-500/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[10px] font-bold tracking-widest uppercase opacity-60 min-w-[32px] text-right" style={{ color: theme.fg }}>
          {progress}%
        </span>
      </div>

      <button
        onClick={onToggleSettings}
        className="p-2.5 rounded-xl hover:bg-slate-500/10 transition-all flex-shrink-0 group"
        style={{ color: theme.fg }}
        title="Reader settings"
      >
        <Settings2 size={20} className="group-hover:rotate-45 transition-transform duration-500" />
      </button>
    </div>
  )
}
