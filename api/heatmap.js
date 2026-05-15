const { createClient } = require('../lib/github')
const { getTheme } = require('../lib/themes')
const { errorCard } = require('../lib/svg')

const GH_GREENS = ['#216e39', '#30a14e', '#40c463', '#9be9a8', '#ebedf0']

function extractSvg(html) {
  const match = html.match(/<svg[\s\S]*?<\/svg>/)
  return match ? match[0] : null
}

function recolor(svg, theme) {
  const palette = [
    theme.bg,
    theme.accent + '33',
    theme.accent + '66',
    theme.accent + 'aa',
    theme.accent,
  ]
  let result = svg
  for (let i = 0; i < GH_GREENS.length; i++) {
    result = result.split(GH_GREENS[i]).join(palette[i])
  }
  return result
}

async function fetchData(gh, username) {
  return gh.getContributionHeatmapHtml(username)
}

function renderCard(html, theme) {
  const raw = extractSvg(html)
  if (!raw) return errorCard('Could not load contribution graph', theme)
  const recolored = recolor(raw, theme)
  const inner = recolored.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')
  return `<svg width="495" height="195" viewBox="0 0 495 195" xmlns="http://www.w3.org/2000/svg">
  <rect width="495" height="195" rx="4.5" fill="${theme.bg}" stroke="${theme.border}" stroke-width="1"/>
  <text x="25" y="30" font-family="'Segoe UI',Ubuntu,sans-serif" font-size="15" font-weight="600" fill="${theme.title}">Contribution Heatmap</text>
  <g transform="translate(10,40) scale(0.93)">${inner}</g>
</svg>`
}

module.exports = async function handler(req, res) {
  const { user, theme: themeName = 'dark' } = req.query
  const theme = getTheme(themeName)
  res.setHeader('Content-Type', 'image/svg+xml')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=1800')
  if (!user) return res.end(errorCard('Usage: /api/heatmap?user=YOUR_USERNAME', theme))
  try {
    const html = await fetchData(createClient(), user)
    res.end(renderCard(html, theme))
  } catch (err) {
    if (err.status === 404) return res.end(errorCard(`User "${user}" not found`, theme))
    if (err.status === 403) return res.end(errorCard('Rate limit reached. Add GITHUB_TOKEN.', theme))
    res.end(errorCard('Error fetching heatmap. Try again later.', theme))
  }
}

module.exports.extractSvg = extractSvg
module.exports.recolor = recolor
module.exports.fetchData = fetchData
module.exports.renderCard = renderCard
