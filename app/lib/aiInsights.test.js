import { describe, it, expect, vi, beforeEach } from 'vitest'

const getDoc = vi.fn()
vi.mock('./firebase', () => ({ db: {} }))
vi.mock('firebase/firestore', () => ({
  doc: (...args) => ({ path: args.slice(1).join('/') }),
  getDoc: (...args) => getDoc(...args),
}))

const { fetchInsightsForChild, hasInsightContent } = await import('./aiInsights')

/** "YYYY-MM-DD" local, `offsetDays` from today — the format GuardParent writes. */
function dateKey(offsetDays = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function mockDoc(data) {
  getDoc.mockResolvedValue({
    exists: () => data !== null,
    id: 'child-1',
    data: () => data,
  })
}

describe('fetchInsightsForChild', () => {
  beforeEach(() => getDoc.mockReset())

  it('returns null without a childId, and does not hit Firestore', async () => {
    expect(await fetchInsightsForChild(undefined)).toBeNull()
    expect(getDoc).not.toHaveBeenCalled()
  })

  it('returns null when the child has no insight doc', async () => {
    mockDoc(null)
    expect(await fetchInsightsForChild('child-1')).toBeNull()
  })

  it("returns today's insight with ageInDays 0", async () => {
    mockDoc({ tip: 'Ask about school.', date: dateKey(0) })
    const result = await fetchInsightsForChild('child-1')
    expect(result.tip).toBe('Ask about school.')
    expect(result.ageInDays).toBe(0)
  })

  it("returns yesterday's insight, labelled as a day old", async () => {
    mockDoc({ tip: 'Ask about school.', date: dateKey(-1) })
    expect((await fetchInsightsForChild('child-1')).ageInDays).toBe(1)
  })

  it('drops anything older than a day', async () => {
    mockDoc({ tip: 'Stale.', date: dateKey(-2) })
    expect(await fetchInsightsForChild('child-1')).toBeNull()
  })

  it('keeps a future date — the phone may be a timezone ahead — and floors the age', async () => {
    mockDoc({ tip: 'Fresh.', date: dateKey(1) })
    expect((await fetchInsightsForChild('child-1')).ageInDays).toBe(0)
  })

  it('drops a doc with a missing or unparseable date', async () => {
    mockDoc({ tip: 'No date.' })
    expect(await fetchInsightsForChild('child-1')).toBeNull()
    mockDoc({ tip: 'Bad date.', date: 'yesterday' })
    expect(await fetchInsightsForChild('child-1')).toBeNull()
  })

  it('keeps the snake_case mood_insight field Android writes', async () => {
    mockDoc({ mood_insight: 'Steady week.', date: dateKey(0) })
    expect((await fetchInsightsForChild('child-1')).mood_insight).toBe('Steady week.')
  })
})

describe('hasInsightContent', () => {
  it('is false for null, empty, and whitespace-only docs', () => {
    expect(hasInsightContent(null)).toBe(false)
    expect(hasInsightContent({})).toBe(false)
    expect(hasInsightContent({ tip: '   ' })).toBe(false)
  })

  it('is true when any one of the four fields has text', () => {
    expect(hasInsightContent({ tip: 'x' })).toBe(true)
    expect(hasInsightContent({ mood_insight: 'x' })).toBe(true)
    expect(hasInsightContent({ conversationStarter: 'x' })).toBe(true)
    expect(hasInsightContent({ suggestedConversation: 'x' })).toBe(true)
  })

  it('ignores fields that are not strings', () => {
    expect(hasInsightContent({ tip: 42, date: '2026-07-21' })).toBe(false)
  })
})
