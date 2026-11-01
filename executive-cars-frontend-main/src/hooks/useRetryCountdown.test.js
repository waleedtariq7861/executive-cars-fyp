import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import useRetryCountdown from './useRetryCountdown.js'

describe('useRetryCountdown', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('counts down one second at a time and then stops waiting', async () => {
    const { result } = renderHook(() => useRetryCountdown())
    expect(result.current).toMatchObject({ seconds: 0, waiting: false })
    act(() => result.current.start(2))
    expect(result.current).toMatchObject({ seconds: 2, waiting: true })
    await act(async () => { vi.advanceTimersByTime(1000) })
    expect(result.current.seconds).toBe(1)
    await act(async () => { vi.advanceTimersByTime(1000) })
    expect(result.current).toMatchObject({ seconds: 0, waiting: false })
    await act(async () => { vi.advanceTimersByTime(5000) })
    expect(result.current.seconds).toBe(0)
  })

  it('rounds partial seconds up and ignores nonsense', () => {
    const { result } = renderHook(() => useRetryCountdown())
    act(() => result.current.start(1.2))
    expect(result.current.seconds).toBe(2)
    act(() => result.current.start(-5))
    expect(result.current.seconds).toBe(0)
    act(() => result.current.start('soon'))
    expect(result.current.seconds).toBe(0)
  })
})
