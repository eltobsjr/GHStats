const { fetchData, renderCard } = require('../api/stats')
const { getTheme } = require('../lib/themes')

const theme = getTheme('dark')

const mockGh = {
  getUser: jest.fn(),
  getRepos: jest.fn(),
  getContributionsCalendar: jest.fn(),
}

beforeEach(() => jest.clearAllMocks())

test('fetchData aggregates stars from repos', async () => {
  mockGh.getUser.mockResolvedValue({ name: 'Elton', login: 'eltobsjr', followers: 5, public_repos: 10 })
  mockGh.getRepos.mockResolvedValue([{ stargazers_count: 10 }, { stargazers_count: 20 }])
  mockGh.getContributionsCalendar.mockResolvedValue({ totalContributions: 300, weeks: [] })
  const data = await fetchData(mockGh, 'eltobsjr')
  expect(data.totalStars).toBe(30)
  expect(data.totalCommits).toBe(300)
  expect(data.name).toBe('Elton')
  expect(data.followers).toBe(5)
})

test('fetchData handles null calendar (no token)', async () => {
  mockGh.getUser.mockResolvedValue({ name: 'X', login: 'x', followers: 0, public_repos: 0 })
  mockGh.getRepos.mockResolvedValue([])
  mockGh.getContributionsCalendar.mockResolvedValue(null)
  const data = await fetchData(mockGh, 'x')
  expect(data.totalCommits).toBeNull()
})

test('renderCard returns valid SVG with stats', () => {
  const data = { name: 'Elton', totalStars: 42, totalCommits: 500, followers: 7, totalRepos: 15 }
  const svg = renderCard(data, theme)
  expect(svg).toMatch(/^<svg/)
  expect(svg).toContain('42')
  expect(svg).toContain('500')
  expect(svg).toContain('Elton')
})

test('renderCard shows token hint when commits null', () => {
  const data = { name: 'X', totalStars: 0, totalCommits: null, followers: 0, totalRepos: 0 }
  const svg = renderCard(data, theme)
  expect(svg).toContain('GITHUB_TOKEN')
})
