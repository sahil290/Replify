'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export default function PageProgress() {
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const [progress, setProgress]   = useState(0)
  const [visible,  setVisible]    = useState(false)
  const [complete, setComplete]   = useState(false)
  const timerRef   = useRef<NodeJS.Timeout | null>(null)
  const fakeRef    = useRef<NodeJS.Timeout | null>(null)

  // Track route changes
  useEffect(() => {
    // Route changed — complete the bar
    setProgress(100)
    setComplete(true)

    const done = setTimeout(() => {
      setVisible(false)
      setComplete(false)
      setProgress(0)
    }, 400)

    return () => clearTimeout(done)
  }, [pathname, searchParams])

  // Start the bar on link click
  useEffect(() => {
    function onLinkClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest('a')
      if (!target) return
      const href = target.getAttribute('href')
      // Only internal navigation links
      if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto')) return

      // Clear any existing timers
      if (timerRef.current)  clearTimeout(timerRef.current)
      if (fakeRef.current)   clearInterval(fakeRef.current)

      setVisible(true)
      setComplete(false)
      setProgress(10)

      // Fake incremental progress up to 85%
      let current = 10
      fakeRef.current = setInterval(() => {
        current += Math.random() * 15
        if (current >= 85) {
          current = 85
          if (fakeRef.current) clearInterval(fakeRef.current)
        }
        setProgress(current)
      }, 200)
    }

    document.addEventListener('click', onLinkClick)
    return () => {
      document.removeEventListener('click', onLinkClick)
      if (timerRef.current) clearTimeout(timerRef.current)
      if (fakeRef.current)  clearInterval(fakeRef.current)
    }
  }, [])

  if (!visible && !complete) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-0.5 pointer-events-none"
      style={{ background: 'transparent' }}
    >
      <div
        className="h-full bg-blue-600 transition-all ease-out"
        style={{
          width:      `${progress}%`,
          transitionDuration: complete ? '200ms' : '300ms',
          opacity: complete ? 0 : 1,
          transitionProperty: 'width, opacity',
        }}
      />
      {/* Glow at the tip */}
      <div
        className="absolute top-0 right-0 h-full w-24"
        style={{
          background:   'linear-gradient(to right, transparent, #2563EB)',
          width:        `${progress}%`,
          opacity:      complete ? 0 : 0.6,
          transition:   'opacity 200ms',
          maxWidth:     '100%',
        }}
      />
    </div>
  )
}