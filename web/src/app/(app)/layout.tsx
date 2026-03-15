import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'

export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Use a server-side service key so RLS doesn't block reading the user profile.
  const serviceSupabase = await createClient({ useServiceRole: true })

  const { data: profile } = await (serviceSupabase
    .from('users')
    .select('id, display_name, avatar_url, role')
    .eq('id', user.id)
    .single() as any)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <AppShell user={profile as any}>{children}</AppShell>
}
