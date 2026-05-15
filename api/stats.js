const { createClient } = require('../lib/github')
const { getTheme } = require('../lib/themes')
const { card, text, errorCard } = require('../lib/svg')

const STATS = [
  { key: 'totalStars', label: 'Total Stars' },
  { key: 'totalCommits', label: 'Commits (year)' },
  { key: 'followers', label: 'Followers' },
  { key: 'totalRepos', label: 'Public Repos' },
]

async function fetchData(gh, username) {
  const [user, repos, calendar] = await Promise.all([
    gh.getUser(username),
    gh.getRepos(username),
    gh.getContributionsCalendar(username),
  ])
  return {
    name: user.name || user.login,
    followers: user.followers,
    totalRepos: user.public_repos,
    totalStars: repos.reduce((s, r) => s + r.stargazers_count, 0),
    totalCommits: calendar ? calendar.totalContributions : null,
  }
}

function renderCard(data, theme) {
  const rows = STATS.map((s, i) => {
    const val = data[s.key]
    const display = val === null ? '?' : String(val)
    const col = i % 2 === 0 ? 25 : 260
    const row = Math.floor(i / 2)
    const y = 75 + row * 40
    return [
      text({ x: col, y, content: s.label, fill: theme.subtext, size: 12 }),
      text({ x: col, y: y + 18, content: display, fill: theme.text, size: 16, weight: '600' }),
    ].join('\n')
  }).join('\n')

  const tokenHint = data.totalCommits === null
    ? text({ x: 25, y: 190, content: 'Add GITHUB_TOKEN for commit count', fill: theme.subtext, size: 11 })
    : ''

  return card({ height: 205, theme, title: `${data.name}'s GitHub Stats`, body: rows + tokenHint })
}

module.exports = async function handler(req, res) {
  const { user, theme: themeName = 'dark' } = req.query
  const theme = getTheme(themeName)
  res.setHeader('Content-Type', 'image/svg+xml')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=1800')
  if (!user) return res.end(errorCard('Usage: /api/stats?user=YOUR_USERNAME', theme))
  try {
    const data = await fetchData(createClient(), user)
    res.end(renderCard(data, theme))
  } catch (err) {
    if (err.status === 404) return res.end(errorCard(`User "${user}" not found`, theme))
    if (err.status === 403) return res.end(errorCard('Rate limit reached. Add GITHUB_TOKEN.', theme))
    res.end(errorCard('Error fetching data. Try again later.', theme))
  }
}

module.exports.fetchData = fetchData
module.exports.renderCard = renderCard
