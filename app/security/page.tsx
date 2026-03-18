import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/landing/Footer'
import { Shield, Lock, Server, Eye, RefreshCw, AlertTriangle } from 'lucide-react'

export const metadata = {
  title: 'Security — Replify',
  description: 'How Replify keeps your data safe.',
}

const practices = [
  {
    icon: Lock,
    title: 'Encryption in Transit',
    desc: 'All data is encrypted using TLS 1.2+ in transit. We enforce HTTPS on all connections and redirect HTTP to HTTPS automatically.',
  },
  {
    icon: Server,
    title: 'Encryption at Rest',
    desc: 'Your data is stored in Supabase (PostgreSQL on AWS). All database storage is encrypted at rest using AES-256.',
  },
  {
    icon: Shield,
    title: 'Row Level Security',
    desc: 'We use Supabase\'s Row Level Security (RLS) to enforce data isolation — users can only access their own data. Team members only access their workspace.',
  },
  {
    icon: Eye,
    title: 'Access Controls',
    desc: 'We use role-based access control. Workspace owners, admins, and agents have different permission levels. Sensitive operations require elevated roles.',
  },
  {
    icon: RefreshCw,
    title: 'Secure Authentication',
    desc: 'Passwords are hashed using bcrypt. We support OAuth (Google) and send secure, time-limited tokens for email verification and password resets.',
  },
  {
    icon: AlertTriangle,
    title: 'API Security',
    desc: 'All API endpoints require authentication. Webhook endpoints use unique user-specific tokens. We validate and sanitize all input data.',
  },
]

export default function SecurityPage() {
  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-b from-blue-50 to-white py-16 px-4 text-center">
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Shield className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Security at Replify</h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          We take the security of your data and your customers' data seriously. Here's how we protect it.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Security practices grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {practices.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-6">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Infrastructure */}
        <div className="card p-8 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Infrastructure</h2>
          <div className="grid sm:grid-cols-3 gap-6 text-sm">
            {[
              { label: 'Database',    value: 'Supabase (PostgreSQL on AWS)' },
              { label: 'Hosting',     value: 'Vercel (Edge Network)' },
              { label: 'AI Provider', value: 'Groq (SOC 2 Type II)' },
              { label: 'Payments',    value: 'Razorpay (PCI DSS compliant)' },
              { label: 'Email',       value: 'Resend' },
              { label: 'Uptime',      value: '99.9% SLA target' },
            ].map(item => (
              <div key={item.label}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{item.label}</p>
                <p className="text-gray-700 font-medium">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Responsible disclosure */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h2 className="text-base font-bold text-amber-900 mb-2">Responsible Disclosure</h2>
          <p className="text-sm text-amber-800 leading-relaxed mb-3">
            If you discover a security vulnerability in Replify, please report it to us privately before making it public. We take all reports seriously and will respond within 48 hours.
          </p>
          <a
            href="mailto:security@Replify.app"
            className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700 hover:text-amber-900"
          >
            security@Replify.app →
          </a>
        </div>
      </div>

      <Footer />
    </div>
  )
}