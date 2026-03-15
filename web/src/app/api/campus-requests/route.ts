import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, email, message } = await request.json()

    if (!name || !email) {
        return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const serviceSupabase = await createClient({ useServiceRole: true })

    const { error } = await serviceSupabase
        .from('campus_requests')
        .insert({
            user_id: user.id,
            campus_name: name,
            contact_email: email,
            message: message,
            status: 'pending'
        })

    if (error) {
        console.error('Campus request failed:', error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
}

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceSupabase = await createClient({ useServiceRole: true })

    // Auth check for admin
    const { data: profile } = await (serviceSupabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single() as any)

    if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: requests, error } = await serviceSupabase
        .from('campus_requests')
        .select('*, users(display_name)')
        .order('created_at', { ascending: false })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(requests)
}

export async function PATCH(request: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceSupabase = await createClient({ useServiceRole: true })

    // Auth check for admin
    const { data: profile } = await (serviceSupabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single() as any)

    if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id, status } = await request.json()

    if (!id || !status) {
        return NextResponse.json({ error: 'ID and status required' }, { status: 400 })
    }

    const { error } = await serviceSupabase
        .from('campus_requests')
        .update({ status })
        .eq('id', id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
}
