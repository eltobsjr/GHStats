const { createClient } = require('../lib/github')
const { getTheme } = require('../lib/themes')
const { card, text, errorCard } = require('../lib/svg')

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function buildGrid(contribs) {
  const grid = Array(7).fill(null).map(() => Array(24).fill(0))
  for (const repo of contribs) {
    for (const node of repo.contributions.nodes) {
      const d = new Date(node.occurredAt)
      grid[d.getUTCDay()][d.getUTCHours()] += node.commitCount
    }
  }
  return grid
}

async function fetchData(gh, username) {
  const contribs = await gh.getCommitContributionsByRepo(username)
  if (!contribs) return { grid: null, hasToken: false }
  return { grid: buildGrid(contribs), hasToken: true }
}

function renderCard(data, theme) {
  if (!data.hasToken) {
    return card({
      theme, title: 'Coding Hours',
      body: text({ x: 25, y: 90, content: 'Add GITHUB_TOKEN to enable hour heatmap', fill: theme.subtext }),
    })
  }
  const max = Math.max(...data.grid.flat(), 1)
  const CELL = 16, GAP = 2, LABEL_W = 30, TOP = 55
  const cells = data.grid.flatMap((row, day) =>
    row.map((count, hour) => {
      const x = LABEL_W + hour * (CELL + GAP)
      const y = TOP + day * (CELL + GAP)
      const opacity = count === 0 ? 0.08 : 0.2 + 0.8 * (count / max)
      const fill = count === 0 ? theme.border : theme.accent
      return `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="${fill}" opacity="${opacity.toFixed(2)}"/>`
    })
  )
  const dayLabels = DAYS.map((d, i) =>
    text({ x: LABEL_W - 4, y: TOP + i * (CELL + GAP) + 12, content: d, fill: theme.subtext, size: 10, anchor: 'end' })
  )
  const hourLabels = [0, 6, 12, 18, 23].map(h =>
    text({ x: LABEL_W + h * (CELL + GAP), y: TOP - 6, content: `${h}h`, fill: theme.subtext, size: 9 })
  )
  return card({
    height: 220,
    theme,
    title: 'Coding Hours',
    body: [...dayLabels, ...hourLabels, ...cells].join('\n'),
  })
}

module.exports = async function handler(req, res) {
  const { user, theme: themeName = 'dark' } = req.query
  const theme = getTheme(themeName)
  res.setHeader('Content-Type', 'image/svg+xml')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=1800')
  if (!user) return res.end(errorCard('Usage: /api/hours?user=YOUR_USERNAME', theme))
  try {
    const data = await fetchData(createClient(), user)
    res.end(renderCard(data, theme))
  } catch (err) {
    if (err.status === 404) return res.end(errorCard(`User "${user}" not found`, theme))
    if (err.status === 403) return res.end(errorCard('Rate limit reached. Add GITHUB_TOKEN.', theme))
    res.end(errorCard('Error fetching data. Try again later.', theme))
  }
}

module.exports.buildGrid = buildGrid
module.exports.fetchData = fetchData
module.exports.renderCard = renderCard
