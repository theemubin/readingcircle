import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import EpubReader from '@/components/reader/EpubReader'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ bookId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { bookId } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('books').select('title').eq('id', bookId).single()
  return { title: data ? `${data.title} — Readable` : 'Reader — Readable' }
}

export default async function ReaderPage({ params }: Props) {
  const { bookId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: book } = await supabase
    .from('books')
    .select('id, title, author, epub_url')
    .eq('id', bookId)
    .single()

  if (!book || !book.epub_url) notFound()

  // Load or create a reading session
  let { data: session } = await supabase
    .from('reading_sessions')
    .select('id, start_cfi, progress_percent')
    .eq('student_id', user.id)
    .eq('book_id', bookId)
    .eq('state', 'paused')
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  if (!session) {
    const { data: newSession } = await supabase
      .from('reading_sessions')
      .insert({ student_id: user.id, book_id: bookId })
      .select('id, start_cfi, progress_percent')
      .single()
    session = newSession
  }

  const { data: prefs } = await supabase
    .from('reader_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <EpubReader
      bookId={bookId}
      bookTitle={book.title}
      epubUrl={book.epub_url}
      sessionId={session?.id ?? null}
      initialCfi={session?.start_cfi ?? null}
      initialProgress={session?.progress_percent ?? 0}
      userId={user.id}
      preferences={prefs ?? null}
    />
  )
}
