const { createClient } = require('../lib/github')
const { getTheme } = require('../lib/themes')
const { card, text, bar, errorCard } = require('../lib/svg')

const CLASSES = {
  Python: 'Data Alchemist', JavaScript: 'Web Architect', TypeScript: 'TypeScript Wizard',
  Go: 'Go Gopher Master', Rust: 'Memory Safe Guardian', Java: 'Enterprise Dragon',
  'C++': 'Performance Sorcerer', Ruby: 'Gem Collector', PHP: 'Hypertext Paladin',
  Shell: 'Shell Whisperer', Kotlin: 'Kotlin Knight', Swift: 'Swift Samurai',
}

function getClass(topLang) {
  return CLASSES[topLang] || 'Code Nomad'
}

function calculateRpg({ totalCommits, totalStars, totalRepos }) {
  const xp = totalCommits * 1 + totalStars * 50 + totalRepos * 5
  const level = Math.floor(Math.sqrt(xp / 100))
  const xpForNext = Math.pow(level + 1, 2) * 100
  return { xp, level, xpForNext }
}

async function fetchData(gh, username) {
  const [user, repos, calendar] = await Promise.all([
    gh.getUser(username),
    gh.getRepos(username),
    gh.getContributionsCalendar(username),
  ])
  const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0)
  const totalCommits = calendar?.totalContributions ?? 0
  const langTotals = {}
  for (const repo of repos.filter(r => !r.fork && r.language)) {
    langTotals[repo.language] = (langTotals[repo.language] || 0) + 1
  }
  const topLang = Object.entries(langTotals).sort(([, a], [, b]) => b - a)[0]?.[0] || ''
  const rpg = calculateRpg({ totalCommits, totalStars, totalRepos: repos.length })
  return { ...rpg, className: getClass(topLang) }
}

function renderCard(data, theme) {
  const progressPct = Math.min(100, Math.round((data.xp / data.xpForNext) * 100))
  const BAR_W = 400
  const filled = Math.round((progressPct / 100) * BAR_W)
  const body = [
    text({ x: 247, y: 80, content: `Level ${data.level}`, fill: theme.accent, size: 28, weight: '700', anchor: 'middle' }),
    text({ x: 247, y: 102, content: data.className, fill: theme.subtext, size: 13, anchor: 'middle' }),
    bar({ x: 47, y: 120, width: filled, height: 10, fill: theme.accent }),
    bar({ x: 47 + filled, y: 120, width: BAR_W - filled, height: 10, fill: theme.border }),
    text({ x: 47, y: 148, content: `XP: ${data.xp.toLocaleString()}`, fill: theme.text, size: 12 }),
    text({ x: 447, y: 148, content: `Next: ${data.xpForNext.toLocaleString()}`, fill: theme.subtext, size: 12, anchor: 'end' }),
  ].join('\n')
  return card({ theme, title: 'Coding RPG', body })
}

module.exports = async function handler(req, res) {
  const { user, theme: themeName = 'dark' } = req.query
  const theme = getTheme(themeName)
  res.setHeader('Content-Type', 'image/svg+xml')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=1800')
  if (!user) return res.end(errorCard('Usage: /api/rpg?user=YOUR_USERNAME', theme))
  try {
    const data = await fetchData(createClient(), user)
    res.end(renderCard(data, theme))
  } catch (err) {
    if (err.status === 404) return res.end(errorCard(`User "${user}" not found`, theme))
    if (err.status === 403) return res.end(errorCard('Rate limit reached. Add GITHUB_TOKEN.', theme))
    res.end(errorCard('Error fetching data. Try again later.', theme))
  }
}

module.exports.calculateRpg = calculateRpg
module.exports.getClass = getClass
module.exports.fetchData = fetchData
module.exports.renderCard = renderCard
