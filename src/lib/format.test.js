import { describe, expect, it } from 'vitest'
import { addDays, formatDateTime, formatDay, formatDuration, formatPrice, formatTime, groupSlots } from './format.js'

describe('format', () => {
  it('shows free services as covered and rounds shekels', () => {
    expect(formatPrice(0)).toBe('Covered')
    expect(formatPrice(18000)).toMatch(/180/)
  })

  it('writes durations people read', () => {
    expect(formatDuration(20)).toBe('20 min')
    expect(formatDuration(60)).toBe('1 h')
    expect(formatDuration(75)).toBe('1 h 15 min')
  })

  it('keeps the calendar day whatever the browser zone is', () => {
    expect(formatDay('2026-12-01')).toBe('Tue 1 Dec')
    expect(formatDay('2026-12-01', { long: true })).toBe('Tuesday 1 December')
  })

  it('shows instants in the clinic zone', () => {
    expect(formatTime('2026-12-01T07:00:00Z', 'Asia/Jerusalem')).toBe('09:00')
    expect(formatTime('2027-07-01T07:00:00Z', 'Asia/Jerusalem')).toBe('10:00') // summer time
  })

  it('shows a deadline on the clinic calendar, not the UTC one', () => {
    // 23:30 UTC on 30 Nov is 01:30 on 1 Dec in Israel.
    expect(formatDateTime('2026-11-30T23:30:00Z', 'Asia/Jerusalem')).toBe('Tue 1 Dec, 01:30')
  })

  it('adds days across month ends', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('groups slots by part of the day and drops empty groups', () => {
    const groups = groupSlots([{ localTime: '09:00' }, { localTime: '12:00' }, { localTime: '16:45' }])
    expect(groups.map((g) => [g.label, g.slots.length])).toEqual([
      ['Morning', 1],
      ['Afternoon', 2],
    ])
  })
})
