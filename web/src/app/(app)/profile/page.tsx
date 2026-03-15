import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileForm from './ProfileForm'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Use a service role client so RLS doesn't prevent reading the user's profile.
  const serviceSupabase = await createClient({ useServiceRole: true })

  const { data: profile, error } = await serviceSupabase
    .from('users')
    .select('id, display_name, role')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    redirect('/dashboard')
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold text-white mb-4">Profile</h1>
      <ProfileForm currentRole={profile.role} displayName={profile.display_name} />
    </div>
  )
}
