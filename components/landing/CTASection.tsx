import Link from 'next/link'

export default function CTASection() {
  return (
    <section className="py-24 px-6 bg-gradient-to-br from-blue-700 to-purple-700">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-xs font-semibold text-blue-200 uppercase tracking-widest mb-4">Get started today</p>
        <h2 className="font-display text-4xl md:text-5xl text-white mb-5 leading-tight">
          Stop answering the same support questions every day
        </h2>
        <p className="text-lg text-blue-100 mb-10 max-w-xl mx-auto">
          Join 500+ companies using Replify to automate their customer support workflow and delight customers with instant replies.
        </p>
        <Link
          href="/auth/signup"
          className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-50 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 text-base"
        >
          Start Free Trial — No credit card required
        </Link>
      </div>
    </section>
  )
}
