import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const session = await request.json()

    const supabase = await createClient()
    const { error } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 })
  }
}
