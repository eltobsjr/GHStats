const { buildGrid, renderCard } = require('../api/hours')
const { getTheme } = require('../lib/themes')

const theme = getTheme('dark')

test('buildGrid counts commits by day and hour', () => {
  const contribs = [
    { contributions: { nodes: [{ occurredAt: '2026-01-05T02:30:00Z', commitCount: 3 }] } },
    { contributions: { nodes: [{ occurredAt: '2026-01-05T02:45:00Z', commitCount: 2 }] } },
  ]
  const grid = buildGrid(contribs)
  expect(grid[1][2]).toBe(5)
})

test('buildGrid returns 7x24 grid', () => {
  const grid = buildGrid([])
  expect(grid).toHaveLength(7)
  expect(grid[0]).toHaveLength(24)
})

test('renderCard returns SVG with grid', () => {
  const grid = Array(7).fill(null).map(() => Array(24).fill(0))
  grid[1][14] = 10
  const svg = renderCard({ grid, hasToken: true }, theme)
  expect(svg).toMatch(/^<svg/)
  expect(svg).toContain('<rect')
})

test('renderCard shows token hint without token', () => {
  const svg = renderCard({ grid: null, hasToken: false }, theme)
  expect(svg).toContain('GITHUB_TOKEN')
})
