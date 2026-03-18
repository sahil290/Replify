import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StructuredData from '@/components/landing/StructuredData'
import Navbar from '@/components/layout/Navbar'
import Hero from '@/components/landing/Hero'
import ProblemSection from '@/components/landing/ProblemSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import HowItWorks from '@/components/landing/HowItWorks'
import PricingSection from '@/components/landing/PricingSection'
import Testimonials from '@/components/landing/Testimonials'
import CTASection from '@/components/landing/CTASection'
import Footer from '@/components/landing/Footer'

export const metadata: Metadata = {
  title:       'Replify — Reduce Support Tickets by 40% with AI',
  description: 'Replify analyzes support tickets and automatically generates accurate, empathetic replies. Save your team hours every day with AI-powered support automation.',
  alternates:  { canonical: '/' },
}

export default async function LandingPage() {
  // If logged in, go straight to dashboard
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="bg-white">
      <StructuredData />
      <Navbar />
      <Hero />
      <ProblemSection />
      <FeaturesSection />
      <HowItWorks />
      <PricingSection />
      <Testimonials />
      <CTASection />
      <Footer />
    </div>
  )
}