import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PLANS, type PlanId } from '@/lib/razorpay'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { plan } = await request.json()
    if (!plan || !(plan in PLANS)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const selectedPlan = PLANS[plan as PlanId]
    const keyId     = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: 'Razorpay not configured' }, { status: 500 })
    }

    // Create order via Razorpay REST API
    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64')

    const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Basic ${credentials}`,
      },
      body: JSON.stringify({
        amount:   selectedPlan.prices.INR * 100,  // paise
        currency: 'INR',
        receipt:  `receipt_${user.id.slice(0, 8)}_${Date.now()}`,
        notes: {
          user_id:    user.id,
          user_email: user.email ?? '',
          plan:       plan,
        },
      }),
    })

    if (!orderRes.ok) {
      const err = await orderRes.json()
      throw new Error(err?.error?.description ?? 'Failed to create Razorpay order')
    }

    const order = await orderRes.json()

    return NextResponse.json({
      order_id:  order.id,
      amount:    order.amount,
      currency:  order.currency,
      plan:      plan,
      plan_name: selectedPlan.name,
      key_id:    keyId,
      user: {
        name:  user.user_metadata?.full_name ?? '',
        email: user.email ?? '',
      },
    })
  } catch (err: any) {
    console.error('[razorpay/create-order]', err)
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 })
  }
}