const { createClient } = require('../lib/github')
const { getTheme } = require('../lib/themes')
const { card, text, bar, errorCard } = require('../lib/svg')

const DAY_MS = 86400000

function classifyRepos(repos) {
  const now = Date.now()
  const active = [], dormant = [], dead = []
  for (const r of repos) {
    if (r.fork) continue
    const age = (now - new Date(r.pushed_at).getTime()) / DAY_MS
    if (age < 90) active.push(r.name)
    else if (age < 365) dormant.push(r.name)
    else dead.push(r.name)
  }
  return { active, dormant, dead }
}

async function fetchData(gh, username) {
  const repos = await gh.getRepos(username)
  return classifyRepos(repos)
}

function renderCard(data, theme) {
  const total = data.active.length + data.dormant.length + data.dead.length || 1
  const BAR_MAX = 340
  const categories = [
    { label: 'Active', list: data.active, color: '#3fb950' },
    { label: 'Dormant', list: data.dormant, color: theme.accent },
    { label: 'Dead', list: data.dead, color: '#f78166' },
  ]
  const bars = categories.map((cat, i) => {
    const y = 55 + i * 35
    const w = Math.max(2, Math.round((cat.list.length / total) * BAR_MAX))
    return [
      text({ x: 25, y: y + 14, content: `${cat.label} (${cat.list.length})`, fill: theme.text, size: 12 }),
      bar({ x: 130, y, width: w, height: 16, fill: cat.color }),
      bar({ x: 130 + w, y, width: BAR_MAX - w, height: 16, fill: theme.border }),
    ].join('\n')
  }).join('\n')

  const deadList = data.dead.slice(0, 4).join(', ') + (data.dead.length > 4 ? '...' : '')
  const rip = data.dead.length
    ? text({ x: 25, y: 170, content: `RIP: ${deadList}`, fill: theme.subtext, size: 11 })
    : ''

  return card({ height: 185, theme, title: 'Project Graveyard', body: bars + rip })
}

module.exports = async function handler(req, res) {
  const { user, theme: themeName = 'dark' } = req.query
  const theme = getTheme(themeName)
  res.setHeader('Content-Type', 'image/svg+xml')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=1800')
  if (!user) return res.end(errorCard('Usage: /api/graveyard?user=YOUR_USERNAME', theme))
  try {
    const data = await fetchData(createClient(), user)
    res.end(renderCard(data, theme))
  } catch (err) {
    if (err.status === 404) return res.end(errorCard(`User "${user}" not found`, theme))
    if (err.status === 403) return res.end(errorCard('Rate limit reached. Add GITHUB_TOKEN.', theme))
    res.end(errorCard('Error fetching data. Try again later.', theme))
  }
}

module.exports.classifyRepos = classifyRepos
module.exports.fetchData = fetchData
module.exports.renderCard = renderCard
