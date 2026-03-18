'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname()
  const [show, setShow] = useState(true)
  const [key,  setKey]  = useState(pathname)

  useEffect(() => {
    if (pathname !== key) {
      // Briefly hide then fade in new content
      setShow(false)
      const t = setTimeout(() => {
        setKey(pathname)
        setShow(true)
      }, 80)
      return () => clearTimeout(t)
    }
  }, [pathname, key])

  return (
    <div
      style={{
        opacity:    show ? 1 : 0,
        transform:  show ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity 200ms ease, transform 200ms ease',
      }}
    >
      {children}
    </div>
  )
}