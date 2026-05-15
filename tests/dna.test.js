const { classifyLangs, renderCard } = require('../api/dna')
const { getTheme } = require('../lib/themes')

const theme = getTheme('dark')

test('classifyLangs maps languages to categories', () => {
  const langs = [
    { name: 'Python', bytes: 5000 },
    { name: 'JavaScript', bytes: 3000 },
    { name: 'Shell', bytes: 1000 },
  ]
  const result = classifyLangs(langs)
  expect(result.backend).toBeGreaterThan(0)
  expect(result.frontend).toBeGreaterThan(0)
  expect(result.infra).toBeGreaterThan(0)
})

test('renderCard shows categories as bars', () => {
  const profile = { backend: 60, frontend: 30, infra: 10, data: 0, systems: 0 }
  const svg = renderCard(profile, theme)
  expect(svg).toMatch(/^<svg/)
  expect(svg).toContain('Backend')
  expect(svg).toContain('Frontend')
})
