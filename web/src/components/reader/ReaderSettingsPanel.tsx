'use client'

type Theme = { bg: string; fg: string; toolbar: string; border: string }
type ReaderTheme = 'light' | 'sepia' | 'dark' | 'night'
type LineSpacing = 'compact' | 'normal' | 'relaxed' | 'spacious'

interface Prefs {
  font_family: string
  font_size: number
  line_spacing: LineSpacing
  theme: ReaderTheme
  margin_size: number
}

interface Props {
  prefs: Prefs
  theme: Theme
  onUpdate: (prefs: Prefs) => void
  onClose: () => void
}

const FONTS = ['Georgia', 'Palatino Linotype', 'Helvetica Neue', 'Arial', 'Verdana', 'Courier New']
const THEMES: { value: ReaderTheme; label: string; emoji: string }[] = [
  { value: 'light', label: 'Light', emoji: '☀️' },
  { value: 'sepia', label: 'Sepia', emoji: '📜' },
  { value: 'dark',  label: 'Dark',  emoji: '🌙' },
  { value: 'night', label: 'Night', emoji: '🌑' },
]
const SPACINGS: LineSpacing[] = ['compact', 'normal', 'relaxed', 'spacious']

export default function ReaderSettingsPanel({ prefs, theme, onUpdate, onClose }: Props) {
  function set<K extends keyof Prefs>(key: K, value: Prefs[K]) {
    onUpdate({ ...prefs, [key]: value })
  }

  return (
    <div
      className="w-72 border-l flex-shrink-0 overflow-y-auto p-5 space-y-6"
      style={{ background: theme.toolbar, borderColor: theme.border, color: theme.fg }}
    >
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-sm">Reading settings</h3>
        <button onClick={onClose} className="opacity-50 hover:opacity-100 transition text-lg">✕</button>
      </div>

      {/* Theme */}
      <div>
        <p className="text-xs uppercase tracking-wide opacity-50 mb-2">Theme</p>
        <div className="grid grid-cols-4 gap-2">
          {THEMES.map(t => (
            <button
              key={t.value}
              onClick={() => set('theme', t.value)}
              className={`flex flex-col items-center gap-1 py-2 rounded-lg border text-xs transition ${
                prefs.theme === t.value ? 'border-indigo-500' : 'border-transparent hover:opacity-80'
              }`}
            >
              <span className="text-xl">{t.emoji}</span>
              <span style={{ color: theme.fg }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Font family */}
      <div>
        <p className="text-xs uppercase tracking-wide opacity-50 mb-2">Font</p>
        <select
          value={prefs.font_family}
          onChange={e => set('font_family', e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm"
          style={{ background: theme.bg, color: theme.fg, border: `1px solid ${theme.border}` }}
        >
          {FONTS.map(f => (
            <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
          ))}
        </select>
      </div>

      {/* Font size */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs uppercase tracking-wide opacity-50">Font size</p>
          <span className="text-sm font-medium">{prefs.font_size}px</span>
        </div>
        <input
          type="range"
          min={12}
          max={32}
          step={1}
          value={prefs.font_size}
          onChange={e => set('font_size', Number(e.target.value))}
          className="w-full accent-indigo-500"
        />
        <div className="flex justify-between text-xs opacity-40 mt-1">
          <span>A</span><span className="text-lg">A</span>
        </div>
      </div>

      {/* Line spacing */}
      <div>
        <p className="text-xs uppercase tracking-wide opacity-50 mb-2">Line spacing</p>
        <div className="grid grid-cols-4 gap-1.5">
          {SPACINGS.map(s => (
            <button
              key={s}
              onClick={() => set('line_spacing', s)}
              className={`py-1.5 rounded text-xs capitalize border transition ${
                prefs.line_spacing === s ? 'border-indigo-500' : 'border-transparent hover:opacity-80'
              }`}
              style={{ background: theme.bg, color: theme.fg }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Margins */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs uppercase tracking-wide opacity-50">Margins</p>
          <span className="text-sm font-medium">{prefs.margin_size}px</span>
        </div>
        <input
          type="range"
          min={20}
          max={150}
          step={10}
          value={prefs.margin_size}
          onChange={e => set('margin_size', Number(e.target.value))}
          className="w-full accent-indigo-500"
        />
        <div className="flex justify-between text-xs opacity-40 mt-1">
          <span>Narrow</span><span>Wide</span>
        </div>
      </div>
    </div>
  )
}
