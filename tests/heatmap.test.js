const { extractSvg, recolor } = require('../api/heatmap')
const { getTheme } = require('../lib/themes')

const theme = getTheme('dark')

test('extractSvg pulls svg element from html fragment', () => {
  const html = '<div><svg width="100"><rect fill="#ebedf0"/></svg></div>'
  const svg = extractSvg(html)
  expect(svg).toMatch(/^<svg/)
  expect(svg).toContain('<rect')
})

test('extractSvg returns null when no svg found', () => {
  expect(extractSvg('<div>no svg here</div>')).toBeNull()
})

test('recolor replaces github green palette with theme accent', () => {
  const svg = '<svg><rect fill="#216e39"/><rect fill="#ebedf0"/></svg>'
  const result = recolor(svg, theme)
  expect(result).toContain(theme.accent)
  expect(result).not.toContain('#216e39')
})
