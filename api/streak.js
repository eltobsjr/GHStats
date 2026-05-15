const { createClient } = require('../lib/github')
const { getTheme } = require('../lib/themes')
const { card, text, errorCard } = require('../lib/svg')

const CHIP_X = [16, 173, 330]
const CHIP_Y = 48
const CHIP_W = 148
const CHIP_H = 120

function calculateStreaks(calendar) {
  const days = calendar.weeks.flatMap(w => w.contributionDays)
  let longestStreak = 0, streak = 0
  for (const d of days) {
    streak = d.contributionCount > 0 ? streak + 1 : 0
    longestStreak = Math.max(longestStreak, streak)
  }
  let currentStreak = 0
  for (const d of [...days].reverse()) {
    if (d.contributionCount > 0) currentStreak++
    else break
  }
  return { currentStreak, longestStreak, totalContributions: calendar.totalContributions }
}

async function fetchData(gh, username) {
  const calendar = await gh.getContributionsCalendar(username)
  if (!calendar) return { currentStreak: 0, longestStreak: 0, totalContributions: 0, hasToken: false }
  return { ...calculateStreaks(calendar), hasToken: true }
}

function renderCard(data, theme) {
  if (!data.hasToken) {
    return card({
      theme, title: 'GitHub Streak',
      body: text({ x: 25, y: 90, content: 'Add GITHUB_TOKEN to enable streak tracking', fill: theme.subtext }),
    })
  }

  const chipDefs = [
    { label: 'STREAK ATUAL', sublabel: 'dias',          value: String(data.currentStreak),                    color: theme.accent  },
    { label: 'MAIOR STREAK', sublabel: 'dias',          value: String(data.longestStreak),                    color: theme.accent2 },
    { label: 'TOTAL',        sublabel: 'contribuições', value: data.totalContributions.toLocaleString('en-US'), color: '#d2a8ff'     },
  ]

  const body = chipDefs.map((c, i) => {
    const x = CHIP_X[i]
    const cx = x + CHIP_W / 2
    return [
      `<rect x="${x}" y="${CHIP_Y}" width="${CHIP_W}" height="${CHIP_H}" rx="${theme.chipRx ?? 8}" fill="${theme.chip || '#161b22'}"/>`,
      `<rect x="${x}" y="${CHIP_Y}" width="${CHIP_W}" height="4" rx="2" fill="${c.color}"/>`,
      text({ x: cx, y: CHIP_Y + 64, content: c.value,    fill: c.color,       size: 32, weight: '800', anchor: 'middle' }),
      text({ x: cx, y: CHIP_Y + 86, content: c.label,    fill: theme.subtext, size: 10,               anchor: 'middle' }),
      text({ x: cx, y: CHIP_Y + 100, content: c.sublabel, fill: theme.subtext, size: 10,               anchor: 'middle' }),
    ].join('\n')
  }).join('\n')

  return card({ height: 185, theme, title: 'GitHub Streak', body })
}

module.exports = async function handler(req, res) {
  const { user, theme: themeName = 'dark' } = req.query
  const theme = getTheme(themeName)
  res.setHeader('Content-Type', 'image/svg+xml')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=1800')
  if (!user) return res.end(errorCard('Usage: /api/streak?user=YOUR_USERNAME', theme))
  try {
    const data = await fetchData(createClient(), user)
    res.end(renderCard(data, theme))
  } catch (err) {
    if (err.status === 404) return res.end(errorCard(`User "${user}" not found`, theme))
    if (err.status === 403) return res.end(errorCard('Rate limit reached. Add GITHUB_TOKEN.', theme))
    res.end(errorCard('Error fetching data. Try again later.', theme))
  }
}

module.exports.calculateStreaks = calculateStreaks
module.exports.fetchData = fetchData
module.exports.renderCard = renderCard
