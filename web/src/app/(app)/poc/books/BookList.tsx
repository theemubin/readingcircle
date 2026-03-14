'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Book = {
  id: string
  title: string
  author: string | null
  cover_url: string | null
  status: string
  epub_size_bytes: number | null
  created_at: string
  genre: string[] | null
  language: string
}

interface Props {
  books: Book[]
}

function formatBytes(bytes: number | null) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function BookList({ books }: Props) {
  const router = useRouter()
  const [updating, setUpdating] = useState<string | null>(null)

  async function toggleStatus(book: Book) {
    setUpdating(book.id)
    const supabase = createClient()
    const newStatus = book.status === 'published' ? 'draft' : 'published'
    await supabase.from('books').update({ status: newStatus }).eq('id', book.id)
    router.refresh()
    setUpdating(null)
  }

  async function deleteBook(book: Book) {
    if (!confirm(`Delete "${book.title}"? This cannot be undone.`)) return
    setUpdating(book.id)
    const supabase = createClient()
    await supabase.from('books').update({ status: 'archived' }).eq('id', book.id)
    router.refresh()
    setUpdating(null)
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-20 bg-slate-800/50 rounded-xl border border-slate-700 text-slate-500">
        <p className="text-5xl mb-4">📚</p>
        <p className="text-lg font-medium">No books yet</p>
        <p className="text-sm mt-1">Upload an EPUB to get started</p>
      </div>
    )
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wide">
            <th className="text-left px-6 py-3 w-8"></th>
            <th className="text-left px-4 py-3">Title</th>
            <th className="text-left px-4 py-3 hidden md:table-cell">Author</th>
            <th className="text-left px-4 py-3 hidden lg:table-cell">Size</th>
            <th className="text-left px-4 py-3">Status</th>
            <th className="text-right px-6 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {books.map(book => (
            <tr key={book.id} className="hover:bg-slate-700/50 transition">
              <td className="px-6 py-3">
                <div className="w-8 h-10 bg-slate-600 rounded flex items-center justify-center text-lg overflow-hidden flex-shrink-0">
                  {book.cover_url
                    ? <img src={book.cover_url} alt="" className="w-full h-full object-cover" />
                    : '📖'
                  }
                </div>
              </td>
              <td className="px-4 py-3">
                <p className="font-medium text-white">{book.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{book.language.toUpperCase()}</p>
              </td>
              <td className="px-4 py-3 text-slate-300 hidden md:table-cell">{book.author ?? '—'}</td>
              <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">{formatBytes(book.epub_size_bytes)}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  book.status === 'published'
                    ? 'bg-green-500/20 text-green-400'
                    : book.status === 'draft'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-slate-500/20 text-slate-400'
                }`}>
                  {book.status}
                </span>
              </td>
              <td className="px-6 py-3">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => toggleStatus(book)}
                    disabled={updating === book.id}
                    className="text-xs px-3 py-1 rounded-lg border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 transition disabled:opacity-40"
                  >
                    {book.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={() => deleteBook(book)}
                    disabled={updating === book.id}
                    className="text-xs px-3 py-1 rounded-lg border border-red-800 text-red-400 hover:bg-red-900/20 transition disabled:opacity-40"
                  >
                    Archive
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
