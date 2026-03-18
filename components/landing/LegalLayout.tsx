import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/landing/Footer'

interface Section {
  title: string
  content: React.ReactNode
}

interface LegalLayoutProps {
  title:       string
  subtitle:    string
  lastUpdated: string
  sections:    Section[]
}

export default function LegalLayout({ title, subtitle, lastUpdated, sections }: LegalLayoutProps) {
  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-200 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{title}</h1>
          <p className="text-gray-500">{subtitle}</p>
          <p className="text-sm text-gray-400 mt-3">Last updated: {lastUpdated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Quick nav */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-10">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">On this page</p>
          <div className="flex flex-col gap-1.5">
            {sections.map((s, i) => (
              <a
                key={i}
                href={`#section-${i}`}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                {i + 1}. {s.title}
              </a>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {sections.map((s, i) => (
            <section key={i} id={`section-${i}`}>
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                {i + 1}. {s.title}
              </h2>
              <div className="text-sm text-gray-600 leading-relaxed space-y-3">
                {s.content}
              </div>
            </section>
          ))}
        </div>

        {/* Contact footer */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <p className="text-sm font-semibold text-gray-900 mb-2">Questions about this policy?</p>
          <p className="text-sm text-gray-500 mb-4">We're happy to clarify anything. Reach out to us directly.</p>
          <Link href="/contact" className="btn-primary !text-sm inline-flex">
            Contact us
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  )
}