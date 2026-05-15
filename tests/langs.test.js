const { aggregateLangs, renderCard } = require('../api/langs')
const { getTheme } = require('../lib/themes')

const theme = getTheme('dark')

test('aggregateLangs sums bytes per language across repos', () => {
  const langsPerRepo = [
    { Python: 5000, JavaScript: 2000 },
    { Python: 3000, Go: 4000 },
  ]
  const result = aggregateLangs(langsPerRepo)
  expect(result[0]).toEqual({ name: 'Python', bytes: 8000, pct: expect.any(Number) })
  expect(result[1].name).toBe('Go')
  expect(result.reduce((s, l) => s + l.pct, 0)).toBeCloseTo(100)
})

test('aggregateLangs returns top 6 max', () => {
  const langs = {}
  for (let i = 0; i < 10; i++) langs[`Lang${i}`] = 1000
  const result = aggregateLangs([langs])
  expect(result.length).toBeLessThanOrEqual(6)
})

test('renderCard returns SVG with language names', () => {
  const langs = [
    { name: 'Python', bytes: 8000, pct: 57.1 },
    { name: 'Go', bytes: 4000, pct: 28.6 },
    { name: 'JS', bytes: 2000, pct: 14.3 },
  ]
  const svg = renderCard(langs, theme)
  expect(svg).toMatch(/^<svg/)
  expect(svg).toContain('Python')
  expect(svg).toContain('57.1%')
})
