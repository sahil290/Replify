'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export type JobPhase = 'idle' | 'pending' | 'processing' | 'done' | 'failed'

export interface JobState {
  jobId:     string | null
  phase:     JobPhase
  result:    Record<string, unknown> | null
  error:     string | null
  elapsed:   number   // ms since job started
}

const POLL_INTERVAL = 1500   // ms between polls
const MAX_WAIT      = 120000 // 2 min timeout

export function useJobStatus() {
  const [state, setState] = useState<JobState>({
    jobId: null, phase: 'idle', result: null, error: null, elapsed: 0,
  })

  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const startRef    = useRef<number>(0)
  const elapsedRef  = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (timerRef.current)   clearInterval(timerRef.current)
    if (elapsedRef.current) clearInterval(elapsedRef.current)
    timerRef.current   = null
    elapsedRef.current = null
  }, [])

  const startPolling = useCallback((jobId: string) => {
    stopPolling()
    startRef.current = Date.now()

    // Elapsed timer — updates every 100ms for smooth display
    elapsedRef.current = setInterval(() => {
      setState(s => ({ ...s, elapsed: Date.now() - startRef.current }))
    }, 100)

    // Status poller
    timerRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`/api/jobs/status/${jobId}`)
        const data = await res.json()

        if (data.status === 'done') {
          stopPolling()
          setState({
            jobId, phase: 'done',
            result:  data.result ?? null,
            error:   null,
            elapsed: Date.now() - startRef.current,
          })
        } else if (data.status === 'failed') {
          stopPolling()
          setState({
            jobId, phase: 'failed',
            result:  null,
            error:   data.error ?? 'Job failed',
            elapsed: Date.now() - startRef.current,
          })
        } else if (Date.now() - startRef.current > MAX_WAIT) {
          stopPolling()
          setState({
            jobId, phase: 'failed',
            result:  null,
            error:   'Job timed out after 2 minutes',
            elapsed: Date.now() - startRef.current,
          })
        } else {
          setState(s => ({ ...s, phase: data.status as JobPhase }))
        }
      } catch {
        // Network error — keep polling
      }
    }, POLL_INTERVAL)
  }, [stopPolling])

  const enqueue = useCallback((jobId: string) => {
    setState({
      jobId, phase: 'pending', result: null, error: null, elapsed: 0,
    })
    startPolling(jobId)
  }, [startPolling])

  const reset = useCallback(() => {
    stopPolling()
    setState({ jobId: null, phase: 'idle', result: null, error: null, elapsed: 0 })
  }, [stopPolling])

  // Cleanup on unmount
  useEffect(() => () => stopPolling(), [stopPolling])

  return { state, enqueue, reset }
}