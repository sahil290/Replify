import type { Metadata } from 'next'
import { Suspense } from 'react'
import './globals.css'
import PageProgress   from '@/components/ui/PageProgress'
import PageTransition from '@/components/ui/PageTransition'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://Replify.app'
const OG_IMAGE = `${APP_URL}/og?title=Reduce Support Tickets by 40%25 with AI&subtitle=Replify analyzes tickets and generates accurate replies automatically`

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),

  title: {
    default:  'Replify — AI-Powered Customer Support',
    template: '%s — Replify',
  },

  description:
    'Reduce customer support tickets by 40% with AI. Replify analyzes support tickets, generates accurate replies, detects recurring issues, and auto-responds — saving your team hours every day.',

  keywords: [
    'AI customer support',
    'support ticket automation',
    'helpdesk AI',
    'automated support replies',
    'customer support software',
    'ticket analyzer',
    'support automation',
    'AI helpdesk',
    'Zendesk alternative',
    'support ticket AI',
  ],

  authors: [{ name: 'Replify' }],

  creator:   'Replify',
  publisher: 'Replify',

  robots: {
    index:          true,
    follow:         true,
    googleBot: {
      index:              true,
      follow:             true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet':       -1,
    },
  },

  icons: {
    icon:     [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    shortcut: '/favicon.svg',
    apple:    '/favicon.svg',
  },

  openGraph: {
    type:        'website',
    locale:      'en_US',
    url:         APP_URL,
    siteName:    'Replify',
    title:       'Replify — AI-Powered Customer Support',
    description: 'Reduce customer support tickets by 40% with AI. Analyze tickets, auto-generate replies, detect patterns.',
    images: [{
      url:    OG_IMAGE,
      width:  1200,
      height: 630,
      alt:    'Replify — AI-Powered Customer Support',
    }],
  },

  twitter: {
    card:        'summary_large_image',
    title:       'Replify — AI-Powered Customer Support',
    description: 'Reduce customer support tickets by 40% with AI.',
    images:      [OG_IMAGE],
    creator:     '@Replify',
  },

  alternates: {
    canonical: APP_URL,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <PageProgress />
        </Suspense>
        <PageTransition>
          {children}
        </PageTransition>
      </body>
    </html>
  )
}