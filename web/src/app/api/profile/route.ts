import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const { role, campus_id, display_name, username, id: targetId, invite_code } = body as {
    role?: string
    campus_id?: string
    display_name?: string
    username?: string
    id?: string
    invite_code?: string
  }

  const serviceSupabase = await createClient({ useServiceRole: true })

  // Check if requester is admin if they are trying to update someone else
  let finalTargetId = user.id
  if (targetId && targetId !== user.id) {
    const { data: requesterProfile } = await (serviceSupabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single() as any)

    if (requesterProfile?.role === 'admin') {
      finalTargetId = targetId
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  // Fetch the target user to get their existing info for fallbacks if needed
  const { data: targetUser } = await (serviceSupabase
    .from('users')
    .select('*')
    .eq('id', finalTargetId)
    .single() as any)

  const payload: Record<string, unknown> = {
    id: finalTargetId,
    display_name: display_name || targetUser?.display_name || user.user_metadata?.full_name || 'Reader',
    username: username || targetUser?.username || (user.email ? `${user.email.split('@')[0]}_${user.id.slice(0, 4)}` : user.id),
  }
  if (role !== undefined) payload.role = role

  // Handle campus resolution (invite code -> UUID)
  if (invite_code) {
    const { data: campus } = await serviceSupabase
      .from('campuses')
      .select('id')
      .eq('invite_code', invite_code.toUpperCase())
      .single()

    if (!campus) {
      return NextResponse.json({ error: 'Invalid campus invite code' }, { status: 400 })
    }
    payload.campus_id = campus.id
  } else if (campus_id !== undefined) {
    payload.campus_id = campus_id
  }


  const { error } = await serviceSupabase.from('users').upsert(payload, { onConflict: 'id' })

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Profile upsert failed:', error.message, { payload })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
