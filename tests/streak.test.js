const { calculateStreaks, renderCard } = require('../api/streak')
const { getTheme } = require('../lib/themes')

const theme = getTheme('dark')

function makeDays(counts) {
  const base = new Date('2026-01-01')
  return counts.map((c, i) => {
    const d = new Date(base)
    d.setDate(d.getDate() + i)
    return { date: d.toISOString().split('T')[0], contributionCount: c }
  })
}

test('calculateStreaks finds longest run', () => {
  const days = makeDays([1, 0, 1, 1, 1, 0, 1])
  const { longestStreak } = calculateStreaks({ weeks: [{ contributionDays: days }], totalContributions: 5 })
  expect(longestStreak).toBe(3)
})

test('calculateStreaks counts current streak from end', () => {
  const days = makeDays([0, 1, 1, 1])
  const { currentStreak } = calculateStreaks({ weeks: [{ contributionDays: days }], totalContributions: 3 })
  expect(currentStreak).toBe(3)
})

test('renderCard shows both streak values', () => {
  const svg = renderCard({ currentStreak: 7, longestStreak: 42, totalContributions: 300, hasToken: true }, theme)
  expect(svg).toContain('7')
  expect(svg).toContain('42')
  expect(svg).toMatch(/^<svg/)
})

test('renderCard shows token hint when no token', () => {
  const svg = renderCard({ currentStreak: 0, longestStreak: 0, totalContributions: 0, hasToken: false }, theme)
  expect(svg).toContain('GITHUB_TOKEN')
})
