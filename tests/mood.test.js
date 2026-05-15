const { analyzeMessages, renderCard } = require('../api/mood')
const { getTheme } = require('../lib/themes')

const theme = getTheme('dark')

test('analyzeMessages categorizes commit messages', () => {
  const messages = ['feat: add login', 'fix bug', 'fix typo', 'refactor auth', 'wtf why']
  const result = analyzeMessages(messages)
  expect(result.feat).toBe(1)
  expect(result.fix).toBe(2)
  expect(result.refactor).toBe(1)
  expect(result.chaos).toBe(1)
})

test('analyzeMessages returns zero counts for uncategorized', () => {
  const result = analyzeMessages(['random message'])
  expect(result.feat).toBe(0)
})

test('renderCard shows category bars', () => {
  const counts = { feat: 40, fix: 30, refactor: 15, chaos: 5, docs: 5, wip: 5 }
  const svg = renderCard({ counts, total: 100 }, theme)
  expect(svg).toMatch(/^<svg/)
  expect(svg).toContain('feat')
  expect(svg).toContain('fix')
})
