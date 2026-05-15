const { createClient } = require('../lib/github')
const { getTheme, langColors } = require('../lib/themes')
const { card, text, chip, errorCard } = require('../lib/svg')

const CHIP_W = 214
const CHIP_H = 56
const COL2_X = 256

const STAT_DEFS = [
  { key: 'totalStars',   label: 'STARS',          colorKey: 'accent',  x: 25,     y: 48  },
  { key: 'totalCommits', label: 'COMMITS (ANO)',   colorKey: 'accent2', x: COL2_X, y: 48  },
  { key: 'followers',    label: 'SEGUIDORES',      color: '#d2a8ff',    x: 25,     y: 116 },
  { key: 'totalRepos',   label: 'REPOS PÚBLICOS',  color: '#e3b341',    x: COL2_X, y: 116 },
]

async function fetchData(gh, username) {
  const [user, repos, calendar] = await Promise.all([
    gh.getUser(username),
    gh.getRepos(username),
    gh.getContributionsCalendar(username),
  ])
  const langTotals = {}
  for (const repo of repos.filter(r => !r.fork && r.language)) {
    langTotals[repo.language] = (langTotals[repo.language] || 0) + 1
  }
  const topLang = Object.entries(langTotals).sort(([, a], [, b]) => b - a)[0]?.[0] || ''
  return {
    name: user.name || user.login,
    followers: user.followers,
    totalRepos: user.public_repos,
    totalStars: repos.reduce((s, r) => s + r.stargazers_count, 0),
    totalCommits: calendar ? calendar.totalContributions : null,
    topLang,
  }
}

function renderCard(data, theme) {
  const chips = STAT_DEFS.map(s => {
    const val = data[s.key]
    const display = val === null ? '?' : (typeof val === 'number' ? val.toLocaleString('en-US') : String(val))
    const color = s.color || theme[s.colorKey]
    return [
      chip({ x: s.x, y: s.y, width: CHIP_W, height: CHIP_H }, theme),
      text({ x: s.x + 12, y: s.y + 17, content: s.label, fill: theme.subtext, size: 10 }),
      text({ x: s.x + 12, y: s.y + 42, content: display, fill: color, size: 22, weight: '700' }),
    ].join('\n')
  }).join('\n')

  const tokenHint = data.totalCommits === null
    ? text({ x: 25, y: 208, content: 'Add GITHUB_TOKEN for commit count', fill: theme.subtext, size: 11 })
    : ''

  const badge = data.topLang
    ? { lang: data.topLang, color: langColors[data.topLang] || '#8b949e' }
    : null
  const height = data.totalCommits === null ? 222 : 190
  return card({ height, theme, title: `${data.name}'s GitHub Stats`, body: chips + tokenHint, badge })
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
