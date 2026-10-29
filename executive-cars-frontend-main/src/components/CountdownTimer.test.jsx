import React from 'react'
import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CountdownTimer from './CountdownTimer.jsx'

describe('CountdownTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-29T10:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('counts down to an absolute end time and calls onEnd exactly once', () => {
    const onEnd = vi.fn()
    render(<CountdownTimer endsAt="2026-10-29T10:00:03Z" onEnd={onEnd} />)
    expect(screen.getByRole('timer')).toHaveAccessibleName('00:00:03 remaining')

    act(() => { vi.advanceTimersByTime(2000) })
    expect(screen.getByRole('timer')).toHaveAccessibleName('00:00:01 remaining')
    expect(onEnd).not.toHaveBeenCalled()

    act(() => { vi.advanceTimersByTime(5000) })
    expect(screen.getByRole('timer')).toHaveAccessibleName('00:00:00 remaining')
    expect(onEnd).toHaveBeenCalledTimes(1)
  })

  it('stays accurate across re-renders instead of restarting', () => {
    const { rerender } = render(<CountdownTimer endsAt="2026-10-29T10:00:10Z" showDays />)
    act(() => { vi.advanceTimersByTime(4000) })
    rerender(<CountdownTimer endsAt="2026-10-29T10:00:10Z" showDays />)
    expect(screen.getByRole('timer')).toHaveAccessibleName('0 days 0 hours 0 minutes 6 seconds remaining')
  })

  it('reports an already-passed end time immediately', () => {
    const onEnd = vi.fn()
    render(<CountdownTimer endsAt="2026-10-29T09:00:00Z" onEnd={onEnd} />)
    expect(screen.getByRole('timer')).toHaveAccessibleName('00:00:00 remaining')
    expect(onEnd).toHaveBeenCalledTimes(1)
  })

  it('counts days when showDays is set', () => {
    render(<CountdownTimer endsAt="2026-10-31T11:02:03Z" showDays />)
    expect(screen.getByRole('timer')).toHaveAccessibleName('2 days 1 hours 2 minutes 3 seconds remaining')
  })
})
