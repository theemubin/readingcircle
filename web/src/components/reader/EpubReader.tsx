import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ReaderToolbar from './ReaderToolbar'
import ReaderSettingsPanel from './ReaderSettingsPanel'
import type { Database } from '@/types/database'
import { ChevronLeft, ChevronRight, Loader2, BookOpen } from 'lucide-react'

type Prefs = Database['public']['Tables']['reader_preferences']['Row'] | null

interface Props {
  bookId: string
  bookTitle: string
  epubUrl: string
  sessionId: string | null
  initialCfi: string | null
  initialProgress: number
  userId: string
  preferences: Prefs
}

const DEFAULT_PREFS = {
  font_family: 'Lora', // Updated default font to Lora
  font_size: 19,
  line_spacing: 'normal' as const,
  theme: 'light' as const,
  margin_size: 60,
}

const LINE_SPACING_MAP = { compact: 1.4, normal: 1.7, relaxed: 2.0, spacious: 2.4 }
const THEME_COLORS = {
  light: { bg: '#ffffff', fg: '#1a1a1a', toolbar: '#f8fafc', border: '#e2e8f0' },
  sepia: { bg: '#fbf5e9', fg: '#433422', toolbar: '#f4ead5', border: '#e6d9bf' },
  dark: { bg: '#0f172a', fg: '#f1f5f9', toolbar: '#1e293b', border: '#334155' },
  night: { bg: '#020617', fg: '#94a3b8', toolbar: '#020617', border: '#1e293b' },
}

export default function EpubReader({
  bookId, bookTitle, epubUrl, sessionId, initialCfi, initialProgress, userId, preferences,
}: Props) {
  const router = useRouter()
  const viewerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renditionRef = useRef<any>(null)
  const sessionIdRef = useRef<string | null>(sessionId)
  const startTimeRef = useRef<number>(Date.now())
  const progressRef = useRef<number>(initialProgress)

  const [prefs, setPrefs] = useState({
    ...DEFAULT_PREFS,
    ...(preferences ?? {}),
  })
  const [showSettings, setShowSettings] = useState(false)
  const [currentCfi, setCurrentCfi] = useState<string | null>(initialCfi)
  const [progress, setProgress] = useState(initialProgress)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tocItems, setTocItems] = useState<{ label: string; href: string }[]>([])
  const [showToc, setShowToc] = useState(false)

  const theme = THEME_COLORS[prefs.theme]

  // ── Apply theme / font to rendition ──────────────────────
  const applyStyles = useCallback((rendition: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = rendition as any
    r.themes.default({
      body: {
        'font-family': `${prefs.font_family}, serif`,
        'font-size': `${prefs.font_size}px`,
        'line-height': `${LINE_SPACING_MAP[prefs.line_spacing]}`,
        'color': theme.fg,
        'background': theme.bg,
        'padding': `0 ${prefs.margin_size}px`,
      },
    })
  }, [prefs, theme.bg, theme.fg])

  // ── Init epubjs ───────────────────────────────────────────
  useEffect(() => {
    let destroyed = false

    async function init() {
      if (!viewerRef.current) return

      // Dynamic import
      const ePub = (await import('epubjs')).default
      const book = ePub(epubUrl)
      bookRef.current = book

      const rendition = book.renderTo(viewerRef.current, {
        width: '100%',
        height: '100%',
        spread: 'none',
      })
      renditionRef.current = rendition
      applyStyles(rendition)

      await rendition.display(initialCfi ?? undefined)
      if (!destroyed) setLoading(false)

      const nav = await book.loaded.navigation
      setTocItems(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (nav.toc ?? []).map((item: any) => ({ label: item.label?.trim(), href: item.href }))
      )

      book.ready.then(() => {
        book.locations.generate(1600)
      })

      rendition.on('relocated', (location: { start: { cfi: string; percentage: number } }) => {
        const cfi = location.start.cfi
        const pct = Math.round((location.start.percentage ?? 0) * 100)
        setCurrentCfi(cfi)
        setProgress(pct)
        progressRef.current = pct
        setAtStart(pct === 0)
        setAtEnd(pct >= 99)
        saveProgress(cfi, pct)
      })
    }

    init()
    return () => {
      destroyed = true
      if (renditionRef.current) renditionRef.current.destroy()
      if (bookRef.current) bookRef.current.destroy()
      endSession()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [epubUrl])

  useEffect(() => {
    if (renditionRef.current) applyStyles(renditionRef.current)
  }, [applyStyles])

  async function saveProgress(cfi: string, pct: number) {
    if (!sessionIdRef.current) return
    const supabase = createClient()
    await supabase
      .from('reading_sessions')
      .update({ end_cfi: cfi, progress_percent: pct, state: 'paused' })
      .eq('id', sessionIdRef.current)
  }

  async function endSession() {
    if (!sessionIdRef.current) return
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000)
    const supabase = createClient()
    await supabase
      .from('reading_sessions')
      .update({
        ended_at: new Date().toISOString(),
        duration_seconds: duration,
        progress_percent: progressRef.current,
        state: progressRef.current >= 99 ? 'completed' : 'paused',
      })
      .eq('id', sessionIdRef.current)
  }

  function prevPage() { renditionRef.current?.prev() }
  function nextPage() { renditionRef.current?.next() }
  function navigateTo(href: string) {
    renditionRef.current?.display(href)
    setShowToc(false)
  }

  async function updatePrefs(newPrefs: typeof prefs) {
    setPrefs(newPrefs)
    const supabase = createClient()
    await supabase.from('reader_preferences').upsert({
      user_id: userId,
      ...newPrefs,
    })
  }

  return (
    <div
      className="flex flex-col h-screen overflow-hidden font-sans"
      style={{ background: theme.bg }}
    >
      <ReaderToolbar
        title={bookTitle}
        progress={progress}
        theme={theme}
        onBack={() => { endSession(); router.push('/library') }}
        onToggleSettings={() => setShowSettings(v => !v)}
        onToggleToc={() => setShowToc(v => !v)}
        tocOpen={showToc}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* TOC drawer */}
        {showToc && (
          <div
            className="w-80 border-r overflow-y-auto flex-shrink-0 animate-in slide-in-from-left duration-300 z-40 shadow-2xl"
            style={{ background: theme.toolbar, borderColor: theme.border }}
          >
            <div className="px-6 py-6 border-b" style={{ borderColor: theme.border }}>
              <h2 className="text-[10px] font-bold uppercase tracking-widest opacity-60 flex items-center gap-2" style={{ color: theme.fg }}>
                <BookOpen size={12} /> Table of Contents
              </h2>
            </div>
            <ul className="py-2">
              {tocItems.map((item, i) => (
                <li key={i}>
                  <button
                    onClick={() => navigateTo(item.href)}
                    className="w-full text-left px-6 py-3.5 text-sm font-medium hover:bg-slate-500/5 transition-colors border-l-2 border-transparent hover:border-accent"
                    style={{ color: theme.fg }}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* EPUB viewport */}
        <div className="flex-1 flex flex-col overflow-hidden relative" style={{ background: theme.bg }}>
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 transition-opacity duration-1000" style={{ background: theme.bg, color: theme.fg }}>
              <div className="relative">
                <div className="absolute inset-0 blur-2xl bg-accent/20 rounded-full animate-pulse" />
                <Loader2 size={48} className="animate-spin text-accent relative" />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-40">Opening Scroll</p>
            </div>
          )}
          <div ref={viewerRef} className={`flex-1 transition-opacity duration-1000 ${loading ? 'opacity-0' : 'opacity-100'}`} />
        </div>

        {/* Settings panel overlay */}
        {showSettings && (
          <div className="absolute inset-0 z-50 flex justify-end lg:pr-8 lg:pt-8 pointer-events-none">
            <div className="w-full lg:w-96 pointer-events-auto h-fit">
              <ReaderSettingsPanel
                prefs={prefs}
                theme={theme}
                onUpdate={updatePrefs}
                onClose={() => setShowSettings(false)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom navigation bar */}
      <div
        className="flex items-center justify-between px-8 py-5 border-t select-none z-30"
        style={{ background: theme.toolbar, borderColor: theme.border }}
      >
        <button
          onClick={prevPage}
          disabled={atStart}
          className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold disabled:opacity-20 transition-all hover:bg-slate-500/10 group"
          style={{ color: theme.fg }}
        >
          <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span>Previous</span>
        </button>

        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-30" style={{ color: theme.fg }}>Progress</span>
          <span className="text-xs font-serif font-bold italic" style={{ color: theme.fg }}>{progress}%</span>
        </div>

        <button
          onClick={nextPage}
          disabled={atEnd}
          className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold disabled:opacity-20 transition-all hover:bg-slate-500/10 group"
          style={{ color: theme.fg }}
        >
          <span>Next</span>
          <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  )
}
