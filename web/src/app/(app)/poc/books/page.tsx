import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import BookList from './BookList'
import UploadBookButton from './UploadBookButton'

export const metadata: Metadata = { title: 'Book Library — Readable' }

export default async function PocBooksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceSupabase = await createClient({ useServiceRole: true })

  const { data: profile } = await serviceSupabase
    .from('users')
    .select('role, campus_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['campus_poc', 'admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  let query = supabase
    .from('books')
    .select('id, title, author, cover_url, status, file_path, file_size, created_at, language')

  if (profile.role !== 'admin') {
    query = query.eq('campus_id', profile.campus_id ?? '')
  }

  const { data: books } = await query.order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Book Library</h1>
          <p className="text-slate-400 text-sm mt-1">
            {books?.length ?? 0} book{books?.length !== 1 ? 's' : ''} in your campus library
          </p>
        </div>
        <UploadBookButton campusId={profile.campus_id ?? ''} userId={user.id} />
      </div>

      <BookList books={books ?? []} />
    </div>
  )
}
