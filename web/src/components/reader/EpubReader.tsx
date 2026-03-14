'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ReaderToolbar from './ReaderToolbar'
import ReaderSettingsPanel from './ReaderSettingsPanel'
import type { Database } from '@/types/database'

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
  font_family: 'Georgia',
  font_size: 18,
  line_spacing: 'normal' as const,
  theme: 'light' as const,
  margin_size: 60,
}

const LINE_SPACING_MAP = { compact: 1.4, normal: 1.7, relaxed: 2.0, spacious: 2.4 }
const THEME_COLORS = {
  light: { bg: '#ffffff', fg: '#1a1a1a', toolbar: '#f8f8f8', border: '#e5e5e5' },
  sepia: { bg: '#f5efe0', fg: '#3d2b1f', toolbar: '#ede3ce', border: '#d4c4a8' },
  dark:  { bg: '#1e1e2e', fg: '#cdd6f4', toolbar: '#181825', border: '#313244' },
  night: { bg: '#0d0d0d', fg: '#d4d4d4', toolbar: '#0d0d0d', border: '#1f1f1f' },
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

      // Dynamic import (epubjs is browser-only)
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

      // TOC
      const nav = await book.loaded.navigation
      setTocItems(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (nav.toc ?? []).map((item: any) => ({ label: item.label?.trim(), href: item.href }))
      )

      // Progress tracking
      book.ready.then(() => {
        book.locations.generate(1600) // roughly 1 word per char
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

  // ── Re-apply styles when prefs change ────────────────────
  useEffect(() => {
    if (renditionRef.current) applyStyles(renditionRef.current)
  }, [applyStyles])

  // ── Session management ────────────────────────────────────
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

  // ── Navigation ────────────────────────────────────────────
  function prevPage() { renditionRef.current?.prev() }
  function nextPage() { renditionRef.current?.next() }

  function navigateTo(href: string) {
    renditionRef.current?.display(href)
    setShowToc(false)
  }

  // ── Prefs persistence ─────────────────────────────────────
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
      className="flex flex-col h-screen"
      style={{ background: theme.toolbar }}
    >
      {/* Toolbar */}
      <ReaderToolbar
        title={bookTitle}
        progress={progress}
        theme={theme}
        onBack={() => { endSession(); router.push('/library') }}
        onToggleSettings={() => setShowSettings(v => !v)}
        onToggleToc={() => setShowToc(v => !v)}
        tocOpen={showToc}
      />

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* TOC drawer */}
        {showToc && (
          <div
            className="w-72 border-r overflow-y-auto flex-shrink-0"
            style={{ background: theme.toolbar, borderColor: theme.border }}
          >
            <p className="px-5 py-3 text-xs font-semibold uppercase tracking-wide opacity-60" style={{ color: theme.fg }}>
              Table of Contents
            </p>
            <ul>
              {tocItems.map((item, i) => (
                <li key={i}>
                  <button
                    onClick={() => navigateTo(item.href)}
                    className="w-full text-left px-5 py-2 text-sm hover:opacity-80 transition"
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
        <div className="flex-1 flex flex-col overflow-hidden" style={{ background: theme.bg }}>
          {loading && (
            <div className="flex-1 flex items-center justify-center" style={{ color: theme.fg }}>
              <div className="text-center opacity-50">
                <p className="text-4xl mb-3">📖</p>
                <p>Loading…</p>
              </div>
            </div>
          )}
          <div ref={viewerRef} className={`flex-1 ${loading ? 'opacity-0' : 'opacity-100'}`} />
        </div>

        {/* Settings panel */}
        {showSettings && (
          <ReaderSettingsPanel
            prefs={prefs}
            theme={theme}
            onUpdate={updatePrefs}
            onClose={() => setShowSettings(false)}
          />
        )}
      </div>

      {/* Bottom nav bar */}
      <div
        className="flex items-center justify-between px-6 py-3 border-t select-none"
        style={{ background: theme.toolbar, borderColor: theme.border }}
      >
        <button
          onClick={prevPage}
          disabled={atStart}
          className="px-5 py-1.5 rounded-lg text-sm font-medium disabled:opacity-30 transition hover:opacity-70"
          style={{ color: theme.fg }}
        >
          ← Prev
        </button>
        <span className="text-xs opacity-50" style={{ color: theme.fg }}>{progress}%</span>
        <button
          onClick={nextPage}
          disabled={atEnd}
          className="px-5 py-1.5 rounded-lg text-sm font-medium disabled:opacity-30 transition hover:opacity-70"
          style={{ color: theme.fg }}
        >
          Next →
        </button>
      </div>
    </div>
  )
}
