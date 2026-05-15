const { calculateRpg, getClass, renderCard } = require('../api/rpg')
const { getTheme } = require('../lib/themes')

const theme = getTheme('dark')

test('calculateRpg computes xp and level', () => {
  const data = { totalCommits: 500, totalStars: 10, totalRepos: 20 }
  const result = calculateRpg(data)
  expect(result.xp).toBe(1100)
  expect(result.level).toBe(Math.floor(Math.sqrt(1100 / 100)))
})

test('getClass maps top language to class name', () => {
  expect(getClass('Python')).toBe('Data Alchemist')
  expect(getClass('Go')).toBe('Go Gopher Master')
  expect(getClass('UnknownLang')).toBe('Code Nomad')
})

test('renderCard returns SVG with level', () => {
  const rpg = { xp: 1100, level: 3, xpForNext: 1600, className: 'Go Gopher Master' }
  const svg = renderCard(rpg, theme)
  expect(svg).toMatch(/^<svg/)
  expect(svg).toContain('Level 3')
  expect(svg).toContain('Go Gopher Master')
})
