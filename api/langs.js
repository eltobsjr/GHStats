const { createClient } = require('../lib/github')
const { getTheme, langColors } = require('../lib/themes')
const { card, text, dot, donut, errorCard } = require('../lib/svg')

const CX = 110, CY = 118, OUTER_R = 74, INNER_R = 50

function aggregateLangs(langsPerRepo) {
  const totals = {}
  for (const langs of langsPerRepo) {
    for (const [name, bytes] of Object.entries(langs)) {
      totals[name] = (totals[name] || 0) + bytes
    }
  }
  const sorted = Object.entries(totals).sort(([, a], [, b]) => b - a).slice(0, 6)
  const grand = sorted.reduce((s, [, b]) => s + b, 0)
  return sorted.map(([name, bytes]) => ({
    name, bytes, pct: Math.round((bytes / grand) * 1000) / 10,
  }))
}

async function fetchData(gh, username) {
  const repos = await gh.getRepos(username)
  const nonFork = repos.filter(r => !r.fork).slice(0, 30)
  const langsPerRepo = await Promise.all(
    nonFork.map(r => gh.getRepoLanguages(username, r.name).catch(() => ({})))
  )
  return aggregateLangs(langsPerRepo)
}

function renderCard(langs, theme) {
  const segments = langs.map(l => ({ pct: l.pct, color: langColors[l.name] || theme.accent }))
  const chart = donut({ cx: CX, cy: CY, outerR: OUTER_R, innerR: INNER_R, segments })

  const centerCount = text({ x: CX, y: CY - 4, content: String(langs.length), fill: theme.text, size: 24, weight: '700', anchor: 'middle' })
  const centerLabel = text({ x: CX, y: CY + 16, content: 'langs', fill: theme.subtext, size: 11, anchor: 'middle' })

  const LIST_X = 210
  const rows = langs.map((lang, i) => {
    const y = 52 + i * 27
    const color = langColors[lang.name] || theme.accent
    return [
      dot({ cx: LIST_X + 6, cy: y + 7, r: 5, fill: color }),
      text({ x: LIST_X + 20, y: y + 12, content: lang.name, fill: theme.text, size: 12 }),
      text({ x: 468, y: y + 12, content: `${lang.pct}%`, fill: theme.subtext, size: 11, anchor: 'end' }),
    ].join('\n')
  }).join('\n')

  const height = Math.max(220, 52 + langs.length * 27 + 24)
  return card({ height, theme, title: 'Top Languages', body: [chart, centerCount, centerLabel, rows].join('\n') })
}

module.exports = async function handler(req, res) {
  const { user, theme: themeName = 'dark' } = req.query
  const theme = getTheme(themeName)
  res.setHeader('Content-Type', 'image/svg+xml')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=1800')
  if (!user) return res.end(errorCard('Usage: /api/langs?user=YOUR_USERNAME', theme))
  try {
    const langs = await fetchData(createClient(), user)
    res.end(renderCard(langs, theme))
  } catch (err) {
    if (err.status === 404) return res.end(errorCard(`User "${user}" not found`, theme))
    if (err.status === 403) return res.end(errorCard('Rate limit reached. Add GITHUB_TOKEN.', theme))
    res.end(errorCard('Error fetching data. Try again later.', theme))
  }
}

module.exports.aggregateLangs = aggregateLangs
module.exports.fetchData = fetchData
module.exports.renderCard = renderCard
