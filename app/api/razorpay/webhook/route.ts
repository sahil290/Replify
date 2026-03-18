import { NextResponse } from 'next/server'
import { verifyRazorpaySignature } from '@/lib/razorpay'

// Razorpay sends webhooks for subscription renewals, failures, refunds etc.
// Set this URL in Razorpay Dashboard → Webhooks:
// https://yourdomain.com/api/razorpay/webhook

export async function POST(request: Request) {
  try {
    const body      = await request.text()
    const signature = request.headers.get('x-razorpay-signature') ?? ''
    const secret    = process.env.RAZORPAY_WEBHOOK_SECRET

    if (!secret) {
      console.error('[webhook] RAZORPAY_WEBHOOK_SECRET not set')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    // Verify the webhook came from Razorpay
    const isValid = await verifyRazorpaySignature(body, signature, secret)
    if (!isValid) {
      console.error('[webhook] Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)
    console.log('[razorpay webhook]', event.event)

    // Dynamically import Supabase to avoid edge runtime issues
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = createClient()

    switch (event.event) {

      // ── Successful payment ──────────────────────────────────────
      case 'payment.captured': {
        const payment = event.payload.payment.entity
        const notes   = payment.notes ?? {}
        const userId  = notes.user_id
        const plan    = notes.plan

        if (userId && plan) {
          const nextBilling = new Date()
          nextBilling.setMonth(nextBilling.getMonth() + 1)

          await supabase.from('users').update({
            plan,
            razorpay_payment_id: payment.id,
            plan_started_at:     new Date().toISOString(),
            plan_expires_at:     nextBilling.toISOString(),
          }).eq('id', userId)

          await supabase.from('payments').upsert({
            user_id:            userId,
            razorpay_payment_id: payment.id,
            razorpay_order_id:   payment.order_id,
            plan,
            amount_paise:        payment.amount,
            currency:            payment.currency,
            status:              'captured',
            paid_at:             new Date(payment.created_at * 1000).toISOString(),
          }, { onConflict: 'razorpay_payment_id' })
        }
        break
      }

      // ── Payment failed ──────────────────────────────────────────
      case 'payment.failed': {
        const payment = event.payload.payment.entity
        const notes   = payment.notes ?? {}
        const userId  = notes.user_id

        if (userId) {
          await supabase.from('payments').insert({
            user_id:            userId,
            razorpay_payment_id: payment.id,
            razorpay_order_id:   payment.order_id,
            plan:                notes.plan ?? 'unknown',
            amount_paise:        payment.amount,
            currency:            payment.currency,
            status:              'failed',
            paid_at:             new Date().toISOString(),
          })
        }
        break
      }

      // ── Refund processed ────────────────────────────────────────
      case 'refund.processed': {
        const refund  = event.payload.refund.entity
        const payment = event.payload.payment?.entity
        const userId  = payment?.notes?.user_id

        if (userId) {
          // Downgrade user back to starter on refund
          await supabase.from('users').update({
            plan:            'starter',
            plan_expires_at: new Date().toISOString(),
          }).eq('id', userId)
        }
        break
      }

      default:
        // Acknowledge but ignore unhandled events
        break
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('[razorpay/webhook]', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}