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
  <defs>
    <linearGradient id="tg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${theme.accent}"/>
      <stop offset="100%" stop-color="${theme.accent2}"/>
    </linearGradient>
  </defs>
  <rect width="495" height="195" rx="14" fill="${theme.bg}" stroke="${theme.border}" stroke-width="1"/>
  <rect x="0" y="0" width="495" height="3" rx="1.5" fill="url(#tg)"/>
  <text x="25" y="28" font-family="'Segoe UI',Ubuntu,sans-serif" font-size="15" font-weight="700" fill="#ffffff">Contribution Heatmap</text>
  <g transform="translate(10,38) scale(0.93)">${inner}</g>
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
