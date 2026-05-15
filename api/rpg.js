const { createClient } = require('../lib/github')
const { getTheme, langColors } = require('../lib/themes')
const { card, text, bar, errorCard } = require('../lib/svg')
const { renderSprite, getClass, getLevelTier } = require('../lib/sprites')

const CARD_W = 495
const CARD_H = 250

// Sprite: centered on top
const SPR_W  = 90
const SPR_H  = 110
const SPR_X  = Math.round((CARD_W - SPR_W) / 2)
const SPR_Y  = 36

// Three chips below the sprite
const CHIP_Y = 158
const CHIP_H = 82
const CHIP_W = 147
const CHIP_GAP = 7
const CHIP_X = [
  20,
  20 + CHIP_W + CHIP_GAP,
  20 + (CHIP_W + CHIP_GAP) * 2,
]

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
  return { ...rpg, className: getClass(topLang).name, topLang }
}

function renderCard(data, theme) {
  const progressPct = Math.min(100, Math.round((data.xp / data.xpForNext) * 100))
  const BAR_W  = Math.round(CHIP_W * 0.78)
  const filled = Math.round((progressPct / 100) * BAR_W)
  const barX   = CHIP_X[2] + Math.round((CHIP_W - BAR_W) / 2)
  const tier   = getLevelTier(data.level)

  const sprite = renderSprite(data.className, data.level, SPR_X, SPR_Y, SPR_W, SPR_H)

  const chipRx = theme.chipRx ?? 10
  const chipFill = theme.chip || '#161b22'

  // Chip 1 — Level
  const chip1 = [
    `<rect x="${CHIP_X[0]}" y="${CHIP_Y}" width="${CHIP_W}" height="${CHIP_H}" rx="${chipRx}" fill="${chipFill}"/>`,
    `<rect x="${CHIP_X[0]}" y="${CHIP_Y}" width="${CHIP_W}" height="3" rx="1.5" fill="${theme.accent}"/>`,
    text({ x: CHIP_X[0] + CHIP_W / 2, y: CHIP_Y + 42, content: `Level ${data.level}`, fill: theme.accent, size: 20, weight: '800', anchor: 'middle' }),
    text({ x: CHIP_X[0] + CHIP_W / 2, y: CHIP_Y + 58, content: 'LEVEL', fill: theme.subtext, size: 9, anchor: 'middle' }),
  ].join('\n')

  const langColor2 = (data.topLang && langColors[data.topLang]) || '#8b949e'
  const langBadgeEl = data.topLang
    ? text({ x: CHIP_X[1] + CHIP_W / 2, y: CHIP_Y + 49, content: `● ${data.topLang}`, fill: langColor2, size: 9, weight: '600', anchor: 'middle' })
    : ''

  // Chip 2 — Class + lang badge + tier
  const chip2 = [
    `<rect x="${CHIP_X[1]}" y="${CHIP_Y}" width="${CHIP_W}" height="${CHIP_H}" rx="${chipRx}" fill="${chipFill}"/>`,
    `<rect x="${CHIP_X[1]}" y="${CHIP_Y}" width="${CHIP_W}" height="3" rx="1.5" fill="#d2a8ff"/>`,
    text({ x: CHIP_X[1] + CHIP_W / 2, y: CHIP_Y + 22, content: data.className, fill: '#d2a8ff', size: 11, weight: '700', anchor: 'middle' }),
    text({ x: CHIP_X[1] + CHIP_W / 2, y: CHIP_Y + 35, content: 'CLASSE', fill: theme.subtext, size: 9, anchor: 'middle' }),
    langBadgeEl,
    tier ? `<rect x="${CHIP_X[1] + CHIP_W / 2 - 22}" y="${CHIP_Y + 60}" width="44" height="14" rx="${Math.min(7, chipRx)}" fill="${tier.color}" opacity="0.18"/>` : '',
    tier ? text({ x: CHIP_X[1] + CHIP_W / 2, y: CHIP_Y + 71, content: tier.label, fill: tier.color, size: 8, weight: '700', anchor: 'middle' }) : '',
  ].join('\n')

  // Chip 3 — XP + progress bar
  const chip3 = [
    `<rect x="${CHIP_X[2]}" y="${CHIP_Y}" width="${CHIP_W}" height="${CHIP_H}" rx="${chipRx}" fill="${chipFill}"/>`,
    `<rect x="${CHIP_X[2]}" y="${CHIP_Y}" width="${CHIP_W}" height="3" rx="1.5" fill="${theme.accent2}"/>`,
    text({ x: CHIP_X[2] + CHIP_W / 2, y: CHIP_Y + 30, content: data.xp.toLocaleString('en-US'), fill: theme.accent2, size: 18, weight: '800', anchor: 'middle' }),
    text({ x: CHIP_X[2] + CHIP_W / 2, y: CHIP_Y + 43, content: 'XP', fill: theme.subtext, size: 9, anchor: 'middle' }),
    bar({ x: barX, y: CHIP_Y + 52, width: BAR_W, height: 8, fill: '#21262d', rx: 4 }),
    bar({ x: barX, y: CHIP_Y + 52, width: filled, height: 8, fill: theme.accent2, rx: 4 }),
    text({ x: CHIP_X[2] + CHIP_W / 2, y: CHIP_Y + 72, content: `${progressPct}% até o próximo`, fill: theme.subtext, size: 8, anchor: 'middle' }),
  ].join('\n')

  const body = [sprite, chip1, chip2, chip3].join('\n')

  return card({ width: CARD_W, height: CARD_H, theme, title: 'Coding RPG', body })
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
module.exports.fetchData = fetchData
module.exports.renderCard = renderCard
