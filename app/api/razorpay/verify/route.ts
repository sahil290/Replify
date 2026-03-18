import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyRazorpaySignature } from '@/lib/razorpay'
import { PLANS, type PlanId } from '@/lib/razorpay'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = await request.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan) {
      return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 })
    }

    const secret   = process.env.RAZORPAY_KEY_SECRET!
    const body     = `${razorpay_order_id}|${razorpay_payment_id}`
    const isValid  = await verifyRazorpaySignature(body, razorpay_signature, secret)

    if (!isValid) {
      console.error('[razorpay/verify] Invalid signature for user', user.id)
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 })
    }

    const selectedPlan = PLANS[plan as PlanId]
    const now          = new Date()
    const nextBilling  = new Date(now)
    nextBilling.setMonth(nextBilling.getMonth() + 1)

    const { error: updateError } = await supabase.from('users').update({
      plan,
      razorpay_payment_id,
      razorpay_order_id,
      plan_started_at: now.toISOString(),
      plan_expires_at: nextBilling.toISOString(),
    }).eq('id', user.id)

    if (updateError) throw updateError

    await supabase.from('payments').insert({
      user_id:             user.id,
      razorpay_order_id,
      razorpay_payment_id,
      plan,
      amount_paise:        selectedPlan.prices.INR * 100,
      currency:            'INR',
      status:              'captured',
      paid_at:             now.toISOString(),
    })

    return NextResponse.json({ success: true, plan, plan_name: selectedPlan.name })
  } catch (err: any) {
    console.error('[razorpay/verify]', err)
    return NextResponse.json({ error: err.message ?? 'Verification failed' }, { status: 500 })
  }
}