import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n)
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  }).format(new Date(date))
}

// Safe timeAgo — returns stable string that won't cause hydration mismatch
// Use suppressHydrationWarning on the element, or call only in useEffect
export function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 0)     return 'just now'
  if (seconds < 60)    return `${seconds}s ago`
  if (seconds < 3600)  return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

// formatRelative — use this for SSR-safe relative dates
// Shows a formatted date on server, timeAgo only after hydration
export function formatRelative(date: string): string {
  return formatDate(date)
}

export const urgencyColors: Record<string, string> = {
  Urgent: 'bg-red-100 text-red-800',
  Medium: 'bg-amber-100 text-amber-800',
  Low:    'bg-emerald-100 text-emerald-800',
}

export const categoryColors: Record<string, string> = {
  Account:           'bg-blue-100 text-blue-800',
  Billing:           'bg-purple-100 text-purple-800',
  Technical:         'bg-orange-100 text-orange-800',
  'How-to':          'bg-teal-100 text-teal-800',
  'Feature Request': 'bg-indigo-100 text-indigo-800',
  Other:             'bg-gray-100 text-gray-600',
}