const { createClient } = require('../lib/github')
const { getTheme } = require('../lib/themes')
const { card, text, bar, errorCard } = require('../lib/svg')

const CHIP_X = [16, 173, 330]
const CHIP_Y = 48
const CHIP_W = 148
const CHIP_H = 120

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
  const BAR_W = 110
  const filled = Math.round((progressPct / 100) * BAR_W)
  const barX = CHIP_X[2] + Math.round((CHIP_W - BAR_W) / 2)

  const body = [
    // Chip 1 — Level
    `<rect x="${CHIP_X[0]}" y="${CHIP_Y}" width="${CHIP_W}" height="${CHIP_H}" rx="8" fill="#161b22"/>`,
    `<rect x="${CHIP_X[0]}" y="${CHIP_Y}" width="${CHIP_W}" height="4" rx="2" fill="${theme.accent}"/>`,
    text({ x: CHIP_X[0] + CHIP_W / 2, y: CHIP_Y + 66, content: `Level ${data.level}`, fill: theme.accent,  size: 26, weight: '800', anchor: 'middle' }),
    text({ x: CHIP_X[0] + CHIP_W / 2, y: CHIP_Y + 88, content: 'LEVEL',               fill: theme.subtext, size: 10,               anchor: 'middle' }),

    // Chip 2 — Class
    `<rect x="${CHIP_X[1]}" y="${CHIP_Y}" width="${CHIP_W}" height="${CHIP_H}" rx="8" fill="#161b22"/>`,
    `<rect x="${CHIP_X[1]}" y="${CHIP_Y}" width="${CHIP_W}" height="4" rx="2" fill="#d2a8ff"/>`,
    text({ x: CHIP_X[1] + CHIP_W / 2, y: CHIP_Y + 62, content: data.className,         fill: '#d2a8ff',     size: 12, weight: '600', anchor: 'middle' }),
    text({ x: CHIP_X[1] + CHIP_W / 2, y: CHIP_Y + 88, content: 'CLASSE',               fill: theme.subtext, size: 10,               anchor: 'middle' }),

    // Chip 3 — XP
    `<rect x="${CHIP_X[2]}" y="${CHIP_Y}" width="${CHIP_W}" height="${CHIP_H}" rx="8" fill="#161b22"/>`,
    `<rect x="${CHIP_X[2]}" y="${CHIP_Y}" width="${CHIP_W}" height="4" rx="2" fill="${theme.accent2}"/>`,
    text({ x: CHIP_X[2] + CHIP_W / 2, y: CHIP_Y + 52, content: data.xp.toLocaleString('en-US'), fill: theme.accent2, size: 18, weight: '700', anchor: 'middle' }),
    text({ x: CHIP_X[2] + CHIP_W / 2, y: CHIP_Y + 66, content: 'XP',                            fill: theme.subtext, size: 9,                anchor: 'middle' }),
    bar({ x: barX, y: CHIP_Y + 76, width: BAR_W,    height: 8, fill: '#21262d', rx: 4 }),
    bar({ x: barX, y: CHIP_Y + 76, width: filled,   height: 8, fill: theme.accent2, rx: 4 }),
    text({ x: CHIP_X[2] + CHIP_W / 2, y: CHIP_Y + 101, content: `${progressPct}% to next`, fill: theme.subtext, size: 9, anchor: 'middle' }),
  ].join('\n')

  return card({ height: 185, theme, title: 'Coding RPG', body })
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
