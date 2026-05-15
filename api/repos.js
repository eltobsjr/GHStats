const { createClient } = require('../lib/github')
const { getTheme } = require('../lib/themes')
const { card, text, errorCard } = require('../lib/svg')

function pickTopRepos(repos) {
  return repos.filter(r => !r.fork).sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 6)
}

async function fetchData(gh, username) {
  const repos = await gh.getRepos(username)
  return pickTopRepos(repos)
}

function renderCard(repos, theme) {
  const body = repos.map((r, i) => {
    const y = 55 + i * 28
    return [
      text({ x: 25, y: y + 13, content: r.name, fill: theme.accent, size: 13, weight: '600' }),
      text({ x: 250, y: y + 13, content: `★ ${r.stargazers_count}`, fill: theme.subtext, size: 12 }),
      text({ x: 320, y: y + 13, content: `⑂ ${r.forks_count}`, fill: theme.subtext, size: 12 }),
      text({ x: 390, y: y + 13, content: r.language || '', fill: theme.text, size: 12 }),
    ].join('\n')
  }).join('\n')
  return card({ height: 55 + repos.length * 28 + 15, theme, title: 'Top Repositories', body })
}

module.exports = async function handler(req, res) {
  const { user, theme: themeName = 'dark' } = req.query
  const theme = getTheme(themeName)
  res.setHeader('Content-Type', 'image/svg+xml')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=1800')
  if (!user) return res.end(errorCard('Usage: /api/repos?user=YOUR_USERNAME', theme))
  try {
    const repos = await fetchData(createClient(), user)
    res.end(renderCard(repos, theme))
  } catch (err) {
    if (err.status === 404) return res.end(errorCard(`User "${user}" not found`, theme))
    if (err.status === 403) return res.end(errorCard('Rate limit reached. Add GITHUB_TOKEN.', theme))
    res.end(errorCard('Error fetching data. Try again later.', theme))
  }
}

module.exports.pickTopRepos = pickTopRepos
module.exports.fetchData = fetchData
module.exports.renderCard = renderCard
