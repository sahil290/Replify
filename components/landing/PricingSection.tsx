import Link from 'next/link'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    price: '$29',
    desc: 'Perfect for small teams just getting started.',
    features: ['100 tickets analyzed/month', 'AI suggested replies', 'Basic issue detection', 'Email support'],
    popular: false,
    cta: 'Get started',
  },
  {
    name: 'Pro',
    price: '$99',
    desc: 'For growing teams who need more power.',
    features: ['1,000 tickets analyzed/month', 'AI suggested replies', 'Advanced issue detection', 'Analytics dashboard', 'Priority support'],
    popular: true,
    cta: 'Start free trial',
  },
  {
    name: 'Business',
    price: '$199',
    desc: 'Unlimited scale for enterprise support teams.',
    features: ['Unlimited tickets', 'Custom AI training', 'API access', 'Dedicated account manager', 'SSO & advanced security'],
    popular: false,
    cta: 'Contact sales',
  },
]

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 px-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="font-display text-4xl text-gray-900 mb-4">Simple, predictable pricing</h2>
          <p className="text-lg text-gray-500">Start free, scale as you grow. No contracts, cancel anytime.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map(plan => (
            <div
              key={plan.name}
              className={`bg-white rounded-xl p-8 relative transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${
                plan.popular
                  ? 'border-2 border-blue-600 shadow-md'
                  : 'border border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                  Most Popular
                </div>
              )}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{plan.name}</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                <span className="text-gray-400">/mo</span>
              </div>
              <p className="text-sm text-gray-500 mb-6">{plan.desc}</p>
              <ul className="space-y-2.5 mb-8">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/signup"
                className={`block text-center py-2.5 px-5 rounded-lg text-sm font-medium transition-all ${
                  plan.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}