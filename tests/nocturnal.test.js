const { analyzeNocturnal, renderCard } = require('../api/nocturnal')
const { getTheme } = require('../lib/themes')

const theme = getTheme('dark')

test('analyzeNocturnal counts commits between 00:00-05:59', () => {
  const contribs = [{
    contributions: { nodes: [
      { occurredAt: '2026-01-05T02:00:00Z', commitCount: 5 },
      { occurredAt: '2026-01-05T14:00:00Z', commitCount: 3 },
    ]}
  }]
  const result = analyzeNocturnal(contribs)
  expect(result.nightCommits).toBe(5)
})

test('analyzeNocturnal finds most active hour', () => {
  const contribs = [{
    contributions: { nodes: [
      { occurredAt: '2026-01-05T23:00:00Z', commitCount: 10 },
      { occurredAt: '2026-01-06T23:00:00Z', commitCount: 8 },
      { occurredAt: '2026-01-05T14:00:00Z', commitCount: 3 },
    ]}
  }]
  const result = analyzeNocturnal(contribs)
  expect(result.mostActiveHour).toBe(23)
})

test('renderCard shows night commits and peak hour', () => {
  const data = { nightCommits: 234, mostActiveHour: 2, longestSessionMs: 6 * 3600000, hasToken: true }
  const svg = renderCard(data, theme)
  expect(svg).toMatch(/^<svg/)
  expect(svg).toContain('234')
  expect(svg).toContain('2am')
})

test('renderCard shows token hint without token', () => {
  const svg = renderCard({ hasToken: false }, theme)
  expect(svg).toContain('GITHUB_TOKEN')
})
