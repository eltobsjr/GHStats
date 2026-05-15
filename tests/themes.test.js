const { getTheme, themes } = require('../lib/themes')

test('returns dark theme by default', () => {
  const t = getTheme()
  expect(t.bg).toBe('#0d1117')
})

test('returns correct theme by name', () => {
  const t = getTheme('dracula')
  expect(t.bg).toBe('#282a36')
})

test('falls back to dark for unknown theme', () => {
  const t = getTheme('nonexistent')
  expect(t.bg).toBe('#0d1117')
})

test('all themes have required keys', () => {
  const keys = ['bg', 'border', 'title', 'text', 'subtext', 'accent', 'accent2']
  for (const [name, theme] of Object.entries(themes)) {
    for (const key of keys) {
      expect(theme).toHaveProperty(key)
    }
  }
})
