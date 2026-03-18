import type { Metadata } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://replify.app'

export function generatePageMetadata({
  title,
  description,
  path = '',
  page = '',
}: {
  title:       string
  description: string
  path?:       string
  page?:       string
}): Metadata {
  const url      = `${APP_URL}${path}`
  const ogTitle  = encodeURIComponent(title)
  const ogSub    = encodeURIComponent(description.slice(0, 100))
  const ogPage   = encodeURIComponent(page)
  const ogImage  = `${APP_URL}/og?title=${ogTitle}&subtitle=${ogSub}&page=${ogPage}`

  return {
    title,
    description,
    alternates:  { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card:        'summary_large_image',
      title,
      description,
      images:      [ogImage],
    },
  }
}