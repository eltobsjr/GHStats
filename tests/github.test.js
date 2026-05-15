const { createClient } = require('../lib/github')

beforeEach(() => {
  global.fetch = jest.fn()
  delete process.env.GITHUB_TOKEN
})

function mockFetch(data, status = 200) {
  global.fetch.mockResolvedValue({
    ok: status < 400,
    status,
    json: async () => data,
    text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
  })
}

test('getUser fetches correct endpoint', async () => {
  mockFetch({ login: 'eltobsjr', followers: 10 })
  const gh = createClient()
  const user = await gh.getUser('eltobsjr')
  expect(user.login).toBe('eltobsjr')
  expect(fetch).toHaveBeenCalledWith(
    'https://api.github.com/users/eltobsjr',
    expect.objectContaining({ headers: expect.any(Object) })
  )
})

test('getUser throws with status on 404', async () => {
  mockFetch({ message: 'Not Found' }, 404)
  const gh = createClient()
  await expect(gh.getUser('nobody')).rejects.toMatchObject({ status: 404 })
})

test('getRepos paginates until batch < 100', async () => {
  global.fetch
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => Array(100).fill({ name: 'r', stargazers_count: 1 }) })
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => Array(30).fill({ name: 'r', stargazers_count: 1 }) })
  const gh = createClient()
  const repos = await gh.getRepos('user')
  expect(repos).toHaveLength(130)
  expect(fetch).toHaveBeenCalledTimes(2)
})

test('getContributionsCalendar returns null without token', async () => {
  const gh = createClient()
  const result = await gh.getContributionsCalendar('user')
  expect(result).toBeNull()
  expect(fetch).not.toHaveBeenCalled()
})

test('getContributionsCalendar calls GraphQL with token', async () => {
  process.env.GITHUB_TOKEN = 'test-token'
  mockFetch({
    data: {
      user: {
        contributionsCollection: {
          contributionCalendar: { totalContributions: 500, weeks: [] },
        },
      },
    },
  })
  const gh = createClient()
  const cal = await gh.getContributionsCalendar('user')
  expect(cal.totalContributions).toBe(500)
  expect(fetch).toHaveBeenCalledWith(
    'https://api.github.com/graphql',
    expect.objectContaining({ method: 'POST' })
  )
})

test('includes Authorization header when GITHUB_TOKEN set', async () => {
  process.env.GITHUB_TOKEN = 'my-token'
  mockFetch({ login: 'user' })
  const gh = createClient()
  await gh.getUser('user')
  const [, options] = fetch.mock.calls[0]
  expect(options.headers['Authorization']).toBe('Bearer my-token')
})

test('omits Authorization header without token', async () => {
  mockFetch({ login: 'user' })
  const gh = createClient()
  await gh.getUser('user')
  const [, options] = fetch.mock.calls[0]
  expect(options.headers['Authorization']).toBeUndefined()
})
