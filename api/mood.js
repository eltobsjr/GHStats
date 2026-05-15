const { createClient } = require('../lib/github')
const { getTheme } = require('../lib/themes')
const { card, text, bar, dot, rainbowBar, errorCard } = require('../lib/svg')

const CATEGORIES = {
  feat:     ['feat', 'add', 'new', 'implement', 'create', 'build', 'initial'],
  fix:      ['fix', 'bug', 'patch', 'resolve', 'correct', 'repair'],
  refactor: ['refactor', 'clean', 'improve', 'optimize', 'simplify', 'reorganize'],
  chaos:    ['wtf', 'hack', 'hotfix', 'revert', 'oops', 'shit', 'fuck', 'undo'],
  docs:     ['docs', 'readme', 'doc', 'documentation', 'comment'],
  wip:      ['wip', 'progress', 'todo', 'working'],
}

const COLORS = {
  feat: '#3fb950', fix: '#f78166', refactor: '#d2a8ff',
  chaos: '#ff7b72', docs: '#79c0ff', wip: '#e3b341',
}

function analyzeMessages(messages) {
  const counts = Object.fromEntries(Object.keys(CATEGORIES).map(k => [k, 0]))
  for (const msg of messages) {
    const lower = msg.toLowerCase()
    for (const [cat, keywords] of Object.entries(CATEGORIES)) {
      if (keywords.some(kw => lower.includes(kw))) { counts[cat]++; break }
    }
  }
  return counts
}

async function fetchData(gh, username) {
  const repos = await gh.getRepos(username)
  const topRepos = repos.filter(r => !r.fork).slice(0, 10)
  const commitArrays = await Promise.all(
    topRepos.map(r => gh.getRepoCommits(username, r.name).catch(() => []))
  )
  const messages = commitArrays.flat().map(c => c.commit?.message?.split('\n')[0] || '')
  const counts = analyzeMessages(messages)
  const total = Object.values(counts).reduce((s, v) => s + v, 0) || 1
  return { counts, total }
}

function renderCard(data, theme) {
  const BAR_X = 120
  const BAR_W = 305
  const PCT_X = 445

  const entries = Object.entries(data.counts).sort(([, a], [, b]) => b - a)
  const rows = entries.map(([cat, count], i) => {
    const y = 52 + i * 29
    const midY = y + 8
    const pct = Math.round((count / data.total) * 100)
    const w = Math.max(3, Math.round((count / data.total) * BAR_W))
    const fill = COLORS[cat] || theme.accent
    return [
      dot({ cx: 35, cy: midY, fill }),
      text({ x: 47, y: midY + 4, content: cat, fill: theme.text, size: 12 }),
      bar({ x: BAR_X, y, width: BAR_W, height: 16, fill: '#161b22' }),
      bar({ x: BAR_X, y, width: w, height: 16, fill }),
      text({ x: PCT_X, y: midY + 4, content: `${pct}%`, fill: theme.subtext, size: 11, anchor: 'end' }),
    ].join('\n')
  }).join('\n')

  const rbY = 52 + entries.length * 29 + 8
  const rbItems = entries.map(([cat, count]) => ({
    pct: Math.round((count / data.total) * 100),
    color: COLORS[cat] || theme.accent,
  }))
  const rb = rainbowBar({ x: 25, y: rbY, totalWidth: 445, items: rbItems })

  return card({ height: rbY + 28, theme, title: 'Commit Mood', body: rows + '\n' + rb })
}

module.exports = async function handler(req, res) {
  const { user, theme: themeName = 'dark' } = req.query
  const theme = getTheme(themeName)
  res.setHeader('Content-Type', 'image/svg+xml')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=1800')
  if (!user) return res.end(errorCard('Usage: /api/mood?user=YOUR_USERNAME', theme))
  try {
    const data = await fetchData(createClient(), user)
    res.end(renderCard(data, theme))
  } catch (err) {
    if (err.status === 403) return res.end(errorCard('Rate limit reached. Add GITHUB_TOKEN.', theme))
    res.end(errorCard('Error fetching data. Try again later.', theme))
  }
}

module.exports.analyzeMessages = analyzeMessages
module.exports.fetchData = fetchData
module.exports.renderCard = renderCard
