export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  PLANS,
  CURRENCY_CONFIG,
  getAmountInSmallestUnit,
  type PlanId,
  type SupportedCurrency,
} from '@/lib/razorpay'

const SUPPORTED_CURRENCIES: SupportedCurrency[] = ['INR', 'USD']

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { plan, currency = 'INR' } = await request.json()

    if (!plan || !(plan in PLANS)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }
    if (!SUPPORTED_CURRENCIES.includes(currency)) {
      return NextResponse.json({ error: 'Unsupported currency. Use INR or USD.' }, { status: 400 })
    }

    const selectedPlan = PLANS[plan as PlanId]
    const curr         = currency as SupportedCurrency
    const amount       = getAmountInSmallestUnit(plan as PlanId, curr)  // paise or cents
    const keyId        = process.env.RAZORPAY_KEY_ID
    const keySecret    = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: 'Razorpay not configured' }, { status: 500 })
    }

    // Note: Razorpay requires your account to be enabled for USD.
    // Enable international payments in: Dashboard → Settings → International Payments
    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64')

    const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Basic ${credentials}`,
      },
      body: JSON.stringify({
        amount,
        currency: curr,
        receipt:  `rcpt_${user.id.slice(0, 8)}_${Date.now()}`,
        notes: {
          user_id:    user.id,
          user_email: user.email ?? '',
          plan,
          currency:   curr,
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
      plan,
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