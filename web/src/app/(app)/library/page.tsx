import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { BookOpen, Library as LibraryIcon, Search, Info } from 'lucide-react'

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
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-serif font-bold tracking-tight">The Library</h1>
          <p className="text-slate-400 font-medium">{books?.length ?? 0} volumes available</p>
        </div>

        {/* Search Mockup (visual only for now) */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-accent transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search titles or authors..."
            className="pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-accent/50 focus:ring-4 focus:ring-accent/5 transition-all w-full md:w-64"
          />
        </div>
      </header>

      {books && books.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {books.map(book => (
            <Link
              key={book.id}
              href={`/read/${book.id}`}
              className="group flex flex-col transition-all duration-300"
            >
              <div className="aspect-[2/3] bg-slate-900 rounded-2xl overflow-hidden mb-4 shadow-lg border border-white/5 group-hover:shadow-2xl group-hover:shadow-accent/20 group-hover:-translate-y-2 group-hover:border-accent/30 transition-all duration-300 relative">
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-950 to-slate-950">
                    <BookOpen size={40} className="text-indigo-500/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-accent px-2 py-1 rounded">Read Now</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-white group-hover:text-accent transition-colors line-clamp-2 leading-tight">
                  {book.title}
                </p>
                {book.author && (
                  <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider truncate">
                    {book.author}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 glass rounded-3xl border-dashed border-white/10 max-w-2xl mx-auto">
          <LibraryIcon size={48} className="text-slate-700 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-serif font-bold text-white mb-2">Shelf empty</h2>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">This library is awaiting its first collection. Ask your coordinator to upload some masterpieces.</p>
        </div>
      )}
    </div>
  )
}
