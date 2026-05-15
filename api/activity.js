const { createClient } = require('../lib/github')
const { getTheme } = require('../lib/themes')
const { card, text, areaLine, errorCard } = require('../lib/svg')

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function aggregateByMonth(calendar) {
  const monthly = {}
  for (const week of calendar.weeks) {
    for (const day of week.contributionDays) {
      const d = new Date(day.date)
      const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`
      if (!monthly[key]) monthly[key] = { year: d.getUTCFullYear(), month: d.getUTCMonth(), count: 0 }
      monthly[key].count += day.contributionCount
    }
  }
  return Object.values(monthly)
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
    .slice(-12)
}

async function fetchData(gh, username) {
  const calendar = await gh.getContributionsCalendar(username)
  if (!calendar) return { months: null, hasToken: false }
  return {
    months: aggregateByMonth(calendar),
    total: calendar.totalContributions,
    hasToken: true,
  }
}

function renderCard(data, theme) {
  if (!data.hasToken) {
    return card({
      theme,
      title: 'Activity — últimos 12 meses',
      body: text({ x: 25, y: 90, content: 'Add GITHUB_TOKEN to enable', fill: theme.subtext }),
    })
  }

  const months = data.months
  const n = months.length
  const CHART_X = 25
  const CHART_Y = 50
  const CHART_H = 110
  const CHART_W = 445
  const LABEL_Y = CHART_Y + CHART_H + 15
  const maxCount = Math.max(...months.map(m => m.count), 1)

  const svgPoints = months.map((m, i) => ({
    x: CHART_X + (n === 1 ? CHART_W / 2 : (i / (n - 1)) * CHART_W),
    y: CHART_Y + CHART_H - (m.count / maxCount) * CHART_H,
  }))

  const chart = areaLine({
    points: svgPoints,
    chartY: CHART_Y,
    chartH: CHART_H,
    fill: theme.accent,
    stroke: theme.accent,
  })

  const labels = months.map((m, i) => {
    const x = CHART_X + (n === 1 ? CHART_W / 2 : (i / (n - 1)) * CHART_W)
    return text({ x, y: LABEL_Y, content: MONTH_LABELS[m.month], fill: theme.subtext, size: 9, anchor: 'middle' })
  }).join('\n')

  const baseline = `<line x1="${CHART_X}" y1="${CHART_Y + CHART_H}" x2="${CHART_X + CHART_W}" y2="${CHART_Y + CHART_H}" stroke="${theme.border}" stroke-width="1"/>`

  const totalLabel = text({
    x: 470, y: 32,
    content: `${data.total.toLocaleString('en-US')} contribuições`,
    fill: theme.subtext, size: 11, anchor: 'end',
  })

  return card({
    height: LABEL_Y + 18,
    theme,
    title: 'Activity — últimos 12 meses',
    body: [baseline, chart, labels, totalLabel].join('\n'),
  })
}

module.exports = async function handler(req, res) {
  const { user, theme: themeName = 'dark' } = req.query
  const theme = getTheme(themeName)
  res.setHeader('Content-Type', 'image/svg+xml')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=1800')
  if (!user) return res.end(errorCard('Usage: /api/activity?user=YOUR_USERNAME', theme))
  try {
    const data = await fetchData(createClient(), user)
    res.end(renderCard(data, theme))
  } catch (err) {
    if (err.status === 404) return res.end(errorCard(`User "${err.message || user}" not found`, theme))
    if (err.status === 403) return res.end(errorCard('Rate limit reached. Add GITHUB_TOKEN.', theme))
    res.end(errorCard('Error fetching data. Try again later.', theme))
  }
}

module.exports.aggregateByMonth = aggregateByMonth
module.exports.fetchData = fetchData
module.exports.renderCard = renderCard
