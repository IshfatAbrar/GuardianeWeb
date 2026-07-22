import { describe, it, expect } from 'vitest'
import { formatDuration, totalSeconds, aggregateApps } from './screenTime'

describe('formatDuration', () => {
  it('formats hours and minutes', () => {
    expect(formatDuration(3600 + 15 * 60)).toBe('1h 15m')
  })

  it('drops the hour when under one', () => {
    expect(formatDuration(45 * 60)).toBe('45m')
  })

  it('drops the minutes when they round to zero', () => {
    expect(formatDuration(7200)).toBe('2h')
  })

  it('returns 0m for junk rather than NaN', () => {
    expect(formatDuration(undefined)).toBe('0m')
    expect(formatDuration(-5)).toBe('0m')
    expect(formatDuration('abc')).toBe('0m')
  })
})

describe('totalSeconds', () => {
  it('sums the per-row totals', () => {
    expect(totalSeconds([{ totalScreenTime: 100 }, { totalScreenTime: 50 }])).toBe(150)
  })

  it('falls back to the app breakdown when a row has no total', () => {
    const rows = [{ allApps: [{ timeSpent: 30 }, { timeSpent: 20 }] }]
    expect(totalSeconds(rows)).toBe(50)
  })

  it('is 0 for no entries', () => {
    expect(totalSeconds([])).toBe(0)
    expect(totalSeconds(null)).toBe(0)
  })
})

describe('aggregateApps', () => {
  it('sums the same app across days and sorts biggest first', () => {
    const rows = [
      { allApps: [{ appName: 'TikTok', packageName: 'com.tiktok', timeSpent: 600 }] },
      {
        allApps: [
          { appName: 'TikTok', packageName: 'com.tiktok', timeSpent: 400 },
          { appName: 'Chrome', packageName: 'com.chrome', timeSpent: 900 },
        ],
      },
    ]
    const apps = aggregateApps(rows)
    expect(apps.map((a) => [a.appName, a.timeSpent])).toEqual([
      ['TikTok', 1000],
      ['Chrome', 900],
    ])
  })

  it('keys on packageName so a renamed display name still merges', () => {
    const rows = [
      { allApps: [{ appName: 'Instagram', packageName: 'com.insta', timeSpent: 60 }] },
      { allApps: [{ appName: 'instagram', packageName: 'com.insta', timeSpent: 60 }] },
    ]
    expect(aggregateApps(rows)).toHaveLength(1)
    expect(aggregateApps(rows)[0].timeSpent).toBe(120)
  })

  it('recomputes percentage across the range instead of reusing the daily one', () => {
    // Each row claims 100% for its own day; over both days it is 50/50.
    const rows = [
      { allApps: [{ appName: 'A', packageName: 'a', timeSpent: 100, percentage: 100 }] },
      { allApps: [{ appName: 'B', packageName: 'b', timeSpent: 100, percentage: 100 }] },
    ]
    expect(aggregateApps(rows).map((a) => a.percentage)).toEqual([50, 50])
  })

  it('falls back to topApps when allApps is absent', () => {
    const rows = [{ topApps: [{ appName: 'A', packageName: 'a', timeSpent: 10 }] }]
    expect(aggregateApps(rows)[0].appName).toBe('A')
  })

  it('prefers allApps over topApps so the same seconds are not double counted', () => {
    const rows = [
      {
        allApps: [{ appName: 'A', packageName: 'a', timeSpent: 10 }],
        topApps: [{ appName: 'A', packageName: 'a', timeSpent: 10 }],
      },
    ]
    expect(aggregateApps(rows)[0].timeSpent).toBe(10)
  })

  it('skips apps with unusable or zero time', () => {
    const rows = [
      {
        allApps: [
          { appName: 'A', packageName: 'a', timeSpent: 0 },
          { appName: 'B', packageName: 'b', timeSpent: NaN },
          { appName: 'C', packageName: 'c', timeSpent: 5 },
        ],
      },
    ]
    expect(aggregateApps(rows).map((a) => a.appName)).toEqual(['C'])
  })

  it('never divides by zero when nothing has time', () => {
    expect(aggregateApps([{ allApps: [] }])).toEqual([])
    expect(aggregateApps([])).toEqual([])
  })

  it('honours the limit', () => {
    const rows = [
      {
        allApps: Array.from({ length: 12 }, (_, i) => ({
          appName: `App${i}`,
          packageName: `p${i}`,
          timeSpent: i + 1,
        })),
      },
    ]
    expect(aggregateApps(rows)).toHaveLength(8)
    expect(aggregateApps(rows, 3)).toHaveLength(3)
  })
})
