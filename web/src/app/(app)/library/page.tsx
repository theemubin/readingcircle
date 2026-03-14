import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Library — Readable' }

export default async function LibraryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: books } = await supabase
    .from('books')
    .select('id, title, author, cover_url, description, genre, language')
    .eq('status', 'published')
    .order('title')

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Library</h1>
      <p className="text-slate-400 mb-8">{books?.length ?? 0} books available</p>

      {books && books.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {books.map(book => (
            <Link
              key={book.id}
              href={`/read/${book.id}`}
              className="group flex flex-col hover:-translate-y-1 transition-transform"
            >
              <div className="aspect-[2/3] bg-slate-700 rounded-lg overflow-hidden mb-3 shadow-md group-hover:shadow-indigo-900/40 group-hover:shadow-xl transition-shadow">
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-indigo-800 to-slate-800">
                    📖
                  </div>
                )}
              </div>
              <p className="text-sm font-medium text-white group-hover:text-indigo-300 transition line-clamp-2 leading-snug">
                {book.title}
              </p>
              {book.author && (
                <p className="text-xs text-slate-400 mt-0.5 truncate">{book.author}</p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-800/50 rounded-xl border border-slate-700 text-slate-500">
          <p className="text-5xl mb-4">📚</p>
          <p className="text-lg font-medium">No books in the library yet</p>
          <p className="text-sm mt-1">Ask your campus coordinator to upload EPUBs</p>
        </div>
      )}
    </div>
  )
}
