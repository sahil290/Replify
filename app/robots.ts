import { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://replify.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow:     '/',
        disallow: [
          '/dashboard',
          '/analyze-ticket',
          '/insights',
          '/settings',
          '/integrations',
          '/saved-replies',
          '/tickets',
          '/team',
          '/api/',
          '/invite/',
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  }
}