const { card, text, bar, escape, errorCard } = require('../lib/svg')
const { getTheme } = require('../lib/themes')

const theme = getTheme('dark')

test('escape encodes HTML entities', () => {
  expect(escape('<script>&"')).toBe('&lt;script&gt;&amp;&quot;')
})

test('text returns svg text element with correct attributes', () => {
  const el = text({ x: 10, y: 20, content: 'Hello', fill: '#fff', size: 14 })
  expect(el).toContain('x="10"')
  expect(el).toContain('y="20"')
  expect(el).toContain('Hello')
  expect(el).toContain('fill="#fff"')
  expect(el).toContain('font-size="14"')
})

test('text escapes content', () => {
  const el = text({ x: 0, y: 0, content: '<b>', fill: '#fff' })
  expect(el).toContain('&lt;b&gt;')
  expect(el).not.toContain('<b>')
})

test('bar returns rect with correct dimensions', () => {
  const el = bar({ x: 5, y: 10, width: 100, height: 8, fill: '#58a6ff' })
  expect(el).toContain('width="100"')
  expect(el).toContain('height="8"')
  expect(el).toContain('fill="#58a6ff"')
})

test('card returns valid svg wrapper', () => {
  const svg = card({ width: 495, height: 195, theme, title: 'Test', body: '<g/>' })
  expect(svg).toMatch(/^<svg/)
  expect(svg).toContain('width="495"')
  expect(svg).toContain('Test')
  expect(svg).toContain(theme.bg)
})

test('errorCard returns svg with message', () => {
  const svg = errorCard('User not found', theme)
  expect(svg).toContain('User not found')
  expect(svg).toMatch(/^<svg/)
})
