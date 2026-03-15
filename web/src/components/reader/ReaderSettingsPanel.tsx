'use client'

import { X, Sun, Moon, Type, AlignJustify, MoveHorizontal } from 'lucide-react'

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

const FONTS = ['Lora', 'Merriweather', 'Playfair Display', 'Outfit', 'Inter', 'System']
const THEMES: { value: ReaderTheme; label: string; bg: string; fg: string }[] = [
  { value: 'light', label: 'Day', bg: '#ffffff', fg: '#1a1a1a' },
  { value: 'sepia', label: 'Sepia', bg: '#fbf5e9', fg: '#433422' },
  { value: 'dark', label: 'Dusk', bg: '#0f172a', fg: '#f1f5f9' },
  { value: 'night', label: 'Night', bg: '#020617', fg: '#94a3b8' },
]
const SPACINGS: LineSpacing[] = ['compact', 'normal', 'relaxed', 'spacious']

export default function ReaderSettingsPanel({ prefs, theme, onUpdate, onClose }: Props) {
  function set<K extends keyof Prefs>(key: K, value: Prefs[K]) {
    onUpdate({ ...prefs, [key]: value })
  }

  return (
    <div
      className="glass rounded-3xl overflow-y-auto p-8 space-y-8 animate-in fade-in zoom-in duration-200 shadow-2xl border-white/10"
      style={{ background: `${theme.toolbar}EE`, color: theme.fg }}
    >
      <div className="flex justify-between items-center pb-2 border-b border-white/5">
        <h3 className="font-serif font-bold text-lg italic">Reading Prefs</h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-500/10 rounded-full transition-colors opacity-50 hover:opacity-100">
          <X size={20} />
        </button>
      </div>

      {/* Theme Selection */}
      <div className="space-y-4">
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
          <Sun size={12} /> Appearance
        </p>
        <div className="grid grid-cols-2 gap-3">
          {THEMES.map(t => (
            <button
              key={t.value}
              onClick={() => set('theme', t.value)}
              className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300 ${prefs.theme === t.value ? 'border-accent ring-1 ring-accent' : 'border-white/5 hover:bg-slate-500/5'
                }`}
              style={{ background: t.bg }}
            >
              <div className="w-4 h-4 rounded-full border border-black/10" style={{ background: t.fg }} />
              <span className="text-sm font-bold" style={{ color: t.fg }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Font Family */}
      <div className="space-y-4">
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
          <Type size={12} /> Typography
        </p>
        <div className="grid grid-cols-1 gap-2">
          {FONTS.map(f => (
            <button
              key={f}
              onClick={() => set('font_family', f)}
              className={`text-left px-5 py-3 rounded-2xl border transition-all ${prefs.font_family === f ? 'border-accent bg-accent/5' : 'border-white/5 hover:bg-slate-500/5'
                }`}
            >
              <span className="text-sm font-medium" style={{ fontFamily: f }}>{f}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Size</p>
          <span className="text-xs font-bold font-serif italic">{prefs.font_size}pt</span>
        </div>
        <input
          type="range"
          min={14}
          max={32}
          step={1}
          value={prefs.font_size}
          onChange={e => set('font_size', Number(e.target.value))}
          className="w-full h-1.5 bg-slate-500/20 rounded-lg appearance-none cursor-pointer accent-accent"
        />
      </div>

      {/* Line Spacing */}
      <div className="space-y-4">
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
          <AlignJustify size={12} /> Spacing
        </p>
        <div className="grid grid-cols-4 gap-2">
          {SPACINGS.map(s => (
            <button
              key={s}
              onClick={() => set('line_spacing', s)}
              className={`py-2 rounded-xl text-[10px] font-bold uppercase tracking-tighter border transition-all ${prefs.line_spacing === s ? 'border-accent bg-accent text-white' : 'border-white/5 hover:bg-slate-500/5'
                }`}
            >
              {s.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {/* Margins */}
      <div className="space-y-4 pb-4">
        <div className="flex justify-between items-center">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
            <MoveHorizontal size={12} /> Layout Width
          </p>
        </div>
        <input
          type="range"
          min={10}
          max={120}
          step={5}
          value={prefs.margin_size}
          onChange={e => set('margin_size', Number(e.target.value))}
          className="w-full h-1.5 bg-slate-500/20 rounded-lg appearance-none cursor-pointer accent-accent"
        />
      </div>
    </div>
  )
}
