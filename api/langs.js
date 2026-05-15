const { createClient } = require('../lib/github')
const { getTheme, langColors } = require('../lib/themes')
const { card, text, bar, dot, rainbowBar, errorCard } = require('../lib/svg')

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
  const BAR_X = 150
  const BAR_W = 295
  const PCT_X = 468

  const rows = langs.map((lang, i) => {
    const y = 52 + i * 29
    const midY = y + 8
    const w = Math.max(3, Math.round((lang.pct / 100) * BAR_W))
    const color = langColors[lang.name] || theme.accent
    return [
      dot({ cx: 35, cy: midY, fill: color }),
      text({ x: 47, y: midY + 4, content: lang.name, fill: theme.text, size: 12 }),
      bar({ x: BAR_X, y, width: BAR_W, height: 16, fill: '#161b22' }),
      bar({ x: BAR_X, y, width: w, height: 16, fill: color }),
      text({ x: PCT_X, y: midY + 4, content: `${lang.pct}%`, fill: theme.subtext, size: 11, anchor: 'end' }),
    ].join('\n')
  }).join('\n')

  const rbY = 52 + langs.length * 29 + 8
  const rbItems = langs.map(l => ({ pct: l.pct, color: langColors[l.name] || theme.accent }))
  const rb = rainbowBar({ x: 25, y: rbY, totalWidth: 445, items: rbItems })

  return card({ height: rbY + 28, theme, title: 'Top Languages', body: rows + '\n' + rb })
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
