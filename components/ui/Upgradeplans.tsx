'use client'

import { useState } from 'react'
import { Check, Zap, Shield, RefreshCw } from 'lucide-react'
import { PLANS, formatPrice } from '@/lib/razorpay'
import type { SupportedCurrency, PlanId } from '@/lib/razorpay'

interface UpgradePlansProps {
  currentPlan?: string
}

declare global {
  interface Window { Razorpay: any }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (window.Razorpay) return resolve(true)
    const script   = document.createElement('script')
    script.src     = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload  = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function UpgradePlans({ currentPlan = 'starter' }: UpgradePlansProps) {
  // Default USD, toggle to INR
  const [currency, setCurrency] = useState<SupportedCurrency>('USD')
  const [loading,  setLoading]  = useState<string | null>(null)
  const [error,    setError]    = useState<string | null>(null)
  const [success,  setSuccess]  = useState<string | null>(null)

  async function handleUpgrade(planId: string) {
    setError(null)
    setLoading(planId)
    try {
      const loaded = await loadRazorpayScript()
      if (!loaded) throw new Error('Failed to load Razorpay. Check your internet connection.')

      const orderRes = await fetch('/api/razorpay/create-order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ plan: planId, currency }),
      })
      const orderData = await orderRes.json()
      if (!orderRes.ok) throw new Error(orderData.error ?? 'Could not create order')

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key:         orderData.key_id,
          amount:      orderData.amount,
          currency:    orderData.currency,
          name:        'Replify',
          description: `${orderData.plan_name} Plan — Monthly`,
          order_id:    orderData.order_id,
          prefill:     { name: orderData.user.name, email: orderData.user.email },
          theme:       { color: '#2563EB' },
          modal:       { ondismiss: () => reject(new Error('Payment cancelled')) },
          handler: async (response: any) => {
            try {
              const verifyRes = await fetch('/api/razorpay/verify', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                  razorpay_order_id:   response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature:  response.razorpay_signature,
                  plan:                planId,
                }),
              })
              const verifyData = await verifyRes.json()
              if (!verifyRes.ok) throw new Error(verifyData.error ?? 'Verification failed')
              setSuccess(`You are now on the ${verifyData.plan_name} plan! 🎉`)
              setTimeout(() => window.location.reload(), 2000)
              resolve()
            } catch (err: any) { reject(err) }
          },
        })
        rzp.on('payment.failed', (r: any) =>
          reject(new Error(r.error?.description ?? 'Payment failed'))
        )
        rzp.open()
      })

    } catch (err: any) {
      if (err.message !== 'Payment cancelled') setError(err.message ?? 'Something went wrong')
    } finally {
      setLoading(null)
    }
  }

  const planList  = Object.values(PLANS)
  const isINR     = currency === 'INR'

  return (
    <div id="upgrade">
      {/* Header + INR/USD toggle */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">Upgrade Your Plan</h2>
          <p className="text-sm text-gray-400">7-day free trial on Starter. No contracts, cancel anytime.</p>
        </div>

        {/* Toggle pill */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-full p-1 shrink-0">
          <button
            onClick={() => setCurrency('USD')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              !isINR
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            $ USD
          </button>
          <button
            onClick={() => setCurrency('INR')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              isINR
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            ₹ INR
          </button>
        </div>
      </div>

      {/* Success */}
      {success && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl px-4 py-3 mb-5">
          <Check className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="font-medium">{success}</span>
          <RefreshCw className="w-3.5 h-3.5 ml-1 animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
          {error}
        </div>
      )}

      {/* Plan cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {planList.map(plan => {
          const isCurrent = plan.id === currentPlan
          const isPopular = plan.id === 'pro'
          const isLoading = loading === plan.id
          const price     = formatPrice(plan.id as PlanId, currency)

          return (
            <div
              key={plan.id}
              className={`rounded-xl p-6 relative transition-all ${
                isPopular
                  ? 'border-2 border-blue-600 bg-white shadow-md'
                  : 'border border-gray-200 bg-white hover:shadow-sm'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full tracking-wide uppercase whitespace-nowrap">
                  Most Popular
                </div>
              )}

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{plan.name}</p>

              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold text-gray-900">{price}</span>
                <span className="text-sm text-gray-400">/mo</span>
              </div>

              <p className="text-xs text-gray-400 mb-5">
                {plan.tickets === Infinity ? 'Unlimited tickets' : `${plan.tickets.toLocaleString()} tickets/month`}
              </p>

              <ul className="space-y-2 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />{f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="w-full text-center py-2.5 px-4 rounded-lg bg-gray-100 text-gray-500 text-sm font-medium cursor-default">
                  ✓ Current plan
                </div>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={!!loading}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                    isPopular
                      ? 'bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-md'
                      : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {isLoading
                    ? <><div className="spinner !w-3.5 !h-3.5" /> Processing…</>
                    : <><Zap className="w-3.5 h-3.5" /> Upgrade to {plan.name}</>
                  }
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-5 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <Shield className="w-3 h-3" /> Secured by Razorpay
        </span>
        <span>·</span>
        <span>
          {isINR
            ? 'UPI · Cards · Netbanking · Wallets'
            : 'Visa · Mastercard · Amex · International Cards'}
        </span>
        <span>·</span>
        <span>14-day money-back guarantee</span>
      </div>
    </div>
  )
}