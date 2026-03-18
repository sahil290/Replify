import { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://replify.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  // Static public pages
  const staticPages = [
    { path: '',           priority: 1.0,  changeFreq: 'weekly'  },
    { path: '/privacy',   priority: 0.5,  changeFreq: 'monthly' },
    { path: '/terms',     priority: 0.5,  changeFreq: 'monthly' },
    { path: '/cookies',   priority: 0.3,  changeFreq: 'monthly' },
    { path: '/security',  priority: 0.6,  changeFreq: 'monthly' },
    { path: '/contact',   priority: 0.7,  changeFreq: 'monthly' },
  ] as const

  return staticPages.map(page => ({
    url:             `${APP_URL}${page.path}`,
    lastModified:    now,
    changeFrequency: page.changeFreq as any,
    priority:        page.priority,
  }))
}