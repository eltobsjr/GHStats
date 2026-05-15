const { pickTopRepos, renderCard } = require('../api/repos')
const { getTheme } = require('../lib/themes')

const theme = getTheme('dark')

test('pickTopRepos returns top 6 sorted by stars, skipping forks', () => {
  const repos = [
    { name: 'a', stargazers_count: 10, forks_count: 2, language: 'Go', fork: false },
    { name: 'b', stargazers_count: 50, forks_count: 5, language: 'JS', fork: false },
    { name: 'c', stargazers_count: 5, forks_count: 0, language: 'Py', fork: true },
    ...Array(5).fill({ name: 'x', stargazers_count: 1, forks_count: 0, language: 'Go', fork: false }),
    { name: 'z', stargazers_count: 100, forks_count: 10, language: 'Rust', fork: false },
  ]
  const top = pickTopRepos(repos)
  expect(top[0].name).toBe('z')
  expect(top.some(r => r.name === 'c')).toBe(false)
  expect(top.length).toBeLessThanOrEqual(6)
})

test('renderCard shows repo names and stars', () => {
  const repos = [{ name: 'cool-project', stargazers_count: 99, forks_count: 10, language: 'Go' }]
  const svg = renderCard(repos, theme)
  expect(svg).toContain('cool-project')
  expect(svg).toContain('99')
})
