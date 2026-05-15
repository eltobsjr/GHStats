const { calculateRpg, renderCard } = require('../api/rpg')
const { getClass } = require('../lib/sprites')
const { getTheme } = require('../lib/themes')

const theme = getTheme('dark')

test('calculateRpg computes xp and level', () => {
  const data = { totalCommits: 500, totalStars: 10, totalRepos: 20 }
  const result = calculateRpg(data)
  expect(result.xp).toBe(1100)
  expect(result.level).toBe(Math.floor(Math.sqrt(1100 / 100)))
})

test('getClass maps top language to class name', () => {
  expect(getClass('Python').name).toBe('Data Alchemist')
  expect(getClass('Go').name).toBe('Goroutine Monk')
  expect(getClass('UnknownLang').name).toBe('Code Nomad')
})

test('renderCard returns SVG with level', () => {
  const rpg = { xp: 1100, level: 3, xpForNext: 1600, className: 'Goroutine Monk' }
  const svg = renderCard(rpg, theme)
  expect(svg).toMatch(/^<svg/)
  expect(svg).toContain('Level 3')
  expect(svg).toContain('Goroutine Monk')
})
