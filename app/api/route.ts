import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(25, parseInt(searchParams.get('limit') ?? '20'))
    const search = searchParams.get('search') ?? ''
    const urgency = searchParams.get('urgency') ?? ''
    const category = searchParams.get('category') ?? ''
    const sort = searchParams.get('sort') ?? 'newest'

    const offset = (page - 1) * limit

    let query = supabase
      .from('tickets')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)

    // Search across summary and ticket_text
    if (search.trim()) {
      query = query.or(
        `summary.ilike.%${search}%,ticket_text.ilike.%${search}%,category.ilike.%${search}%`
      )
    }

    // Urgency filter
    if (urgency && urgency !== 'all') {
      query = query.eq('urgency', urgency)
    }

    // Category filter
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    // Sort
    if (sort === 'oldest') {
      query = query.order('created_at', { ascending: true })
    } else if (sort === 'confidence_high') {
      query = query.order('confidence', { ascending: false })
    } else if (sort === 'confidence_low') {
      query = query.order('confidence', { ascending: true })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data: tickets, count, error } = await query.range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({
      tickets: tickets ?? [],
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    })
  } catch (err: any) {
    console.error('[tickets GET]', err)
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}