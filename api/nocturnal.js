const { createClient } = require('../lib/github')
const { getTheme } = require('../lib/themes')
const { card, text, errorCard } = require('../lib/svg')

const CHIP_X = [16, 173, 330]
const CHIP_Y = 48
const CHIP_W = 148
const CHIP_H = 120

function analyzeNocturnal(contribs) {
  const hourCounts = Array(24).fill(0)
  let nightCommits = 0
  const events = contribs
    .flatMap(r => r.contributions.nodes)
    .sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt))

  for (const e of events) {
    const h = new Date(e.occurredAt).getUTCHours()
    hourCounts[h] += e.commitCount
    if (h < 6) nightCommits += e.commitCount
  }

  const mostActiveHour = hourCounts.indexOf(Math.max(...hourCounts))

  let longestSessionMs = 0
  if (events.length) {
    let sessionStart = new Date(events[0].occurredAt)
    let sessionEnd = sessionStart
    for (let i = 1; i < events.length; i++) {
      const cur = new Date(events[i].occurredAt)
      if (cur - sessionEnd < 2 * 3600000) {
        sessionEnd = cur
      } else {
        longestSessionMs = Math.max(longestSessionMs, sessionEnd - sessionStart)
        sessionStart = cur
        sessionEnd = cur
      }
    }
    longestSessionMs = Math.max(longestSessionMs, sessionEnd - sessionStart)
  }

  return { nightCommits, mostActiveHour, longestSessionMs }
}

async function fetchData(gh, username) {
  const contribs = await gh.getCommitContributionsByRepo(username)
  if (!contribs) return { hasToken: false }
  return { ...analyzeNocturnal(contribs), hasToken: true }
}

function formatHour(h) {
  if (h === 0) return '12am'
  if (h < 12) return `${h}am`
  if (h === 12) return '12pm'
  return `${h - 12}pm`
}

function formatDuration(ms) {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function renderCard(data, theme) {
  if (!data.hasToken) {
    return card({
      theme, title: 'Night Owl Stats',
      body: text({ x: 25, y: 90, content: 'Add GITHUB_TOKEN to enable night owl stats', fill: theme.subtext }),
    })
  }

  const chipDefs = [
    { label: 'COMMITS NOTURNOS', sublabel: 'após meia-noite', value: String(data.nightCommits),                 color: theme.accent  },
    { label: 'HORA PEAK',         sublabel: 'mais ativo',     value: formatHour(data.mostActiveHour),            color: theme.accent2 },
    { label: 'SESSÃO MAIS LONGA', sublabel: 'contínua',       value: formatDuration(data.longestSessionMs),      color: '#e3b341'     },
  ]

  const body = chipDefs.map((c, i) => {
    const x = CHIP_X[i]
    const cx = x + CHIP_W / 2
    return [
      `<rect x="${x}" y="${CHIP_Y}" width="${CHIP_W}" height="${CHIP_H}" rx="8" fill="#161b22"/>`,
      `<rect x="${x}" y="${CHIP_Y}" width="${CHIP_W}" height="4" rx="2" fill="${c.color}"/>`,
      text({ x: cx, y: CHIP_Y + 62, content: c.value,    fill: c.color,       size: 24, weight: '800', anchor: 'middle' }),
      text({ x: cx, y: CHIP_Y + 84, content: c.label,    fill: theme.subtext, size: 9,                anchor: 'middle' }),
      text({ x: cx, y: CHIP_Y + 99, content: c.sublabel, fill: theme.subtext, size: 9,                anchor: 'middle' }),
    ].join('\n')
  }).join('\n')

  return card({ height: 185, theme, title: 'Night Owl Stats', body })
}

module.exports = async function handler(req, res) {
  const { user, theme: themeName = 'dark' } = req.query
  const theme = getTheme(themeName)
  res.setHeader('Content-Type', 'image/svg+xml')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=1800')
  if (!user) return res.end(errorCard('Usage: /api/nocturnal?user=YOUR_USERNAME', theme))
  try {
    const data = await fetchData(createClient(), user)
    res.end(renderCard(data, theme))
  } catch (err) {
    if (err.status === 404) return res.end(errorCard(`User "${user}" not found`, theme))
    if (err.status === 403) return res.end(errorCard('Rate limit reached. Add GITHUB_TOKEN.', theme))
    res.end(errorCard('Error fetching data. Try again later.', theme))
  }
}

module.exports.analyzeNocturnal = analyzeNocturnal
module.exports.fetchData = fetchData
module.exports.renderCard = renderCard
