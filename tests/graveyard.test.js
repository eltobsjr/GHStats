const { classifyRepos, renderCard } = require('../api/graveyard')
const { getTheme } = require('../lib/themes')

const theme = getTheme('dark')

function makeRepo(name, daysAgo, fork = false) {
  const d = new Date(Date.now() - daysAgo * 86400000)
  return { name, pushed_at: d.toISOString(), fork }
}

test('classifyRepos splits into active/dormant/dead', () => {
  const repos = [
    makeRepo('fresh', 10),
    makeRepo('old', 200),
    makeRepo('ancient', 500),
    makeRepo('forked', 10, true),
  ]
  const result = classifyRepos(repos)
  expect(result.active).toContain('fresh')
  expect(result.dormant).toContain('old')
  expect(result.dead).toContain('ancient')
  expect(result.active).not.toContain('forked')
})

test('renderCard shows counts for each category', () => {
  const data = { active: ['a', 'b'], dormant: ['c'], dead: ['d', 'e', 'f'] }
  const svg = renderCard(data, theme)
  expect(svg).toMatch(/^<svg/)
  expect(svg).toContain('Active')
  expect(svg).toContain('Dead')
  expect(svg).toContain('3')
})
