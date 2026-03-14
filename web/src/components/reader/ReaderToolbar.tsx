'use client'

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
      className="flex items-center gap-4 px-4 py-2 border-b flex-shrink-0"
      style={{ background: theme.toolbar, borderColor: theme.border }}
    >
      <button
        onClick={onBack}
        className="p-2 rounded-lg hover:opacity-70 transition flex-shrink-0"
        style={{ color: theme.fg }}
        title="Back to library"
      >
        ←
      </button>

      <button
        onClick={onToggleToc}
        className={`p-2 rounded-lg hover:opacity-70 transition flex-shrink-0 ${tocOpen ? 'opacity-100' : 'opacity-50'}`}
        style={{ color: theme.fg }}
        title="Table of contents"
      >
        ☰
      </button>

      <p
        className="flex-1 text-sm font-medium truncate text-center"
        style={{ color: theme.fg }}
      >
        {title}
      </p>

      {/* Progress bar */}
      <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
        <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: theme.border }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress}%`, background: '#6366f1' }}
          />
        </div>
        <span className="text-xs opacity-50 w-7 text-right" style={{ color: theme.fg }}>
          {progress}%
        </span>
      </div>

      <button
        onClick={onToggleSettings}
        className="p-2 rounded-lg hover:opacity-70 transition flex-shrink-0"
        style={{ color: theme.fg }}
        title="Reader settings"
      >
        Aa
      </button>
    </div>
  )
}
