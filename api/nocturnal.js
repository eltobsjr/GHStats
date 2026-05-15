const { createClient } = require('../lib/github')
const { getTheme } = require('../lib/themes')
const { card, text, errorCard } = require('../lib/svg')

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
  const body = [
    text({ x: 247, y: 80, content: String(data.nightCommits), fill: theme.accent, size: 32, weight: '700', anchor: 'middle' }),
    text({ x: 247, y: 100, content: 'commits after midnight', fill: theme.subtext, size: 12, anchor: 'middle' }),
    text({ x: 100, y: 145, content: `Peak: ${formatHour(data.mostActiveHour)}`, fill: theme.text, size: 13, anchor: 'middle' }),
    text({ x: 380, y: 145, content: `Longest session: ${formatDuration(data.longestSessionMs)}`, fill: theme.text, size: 13, anchor: 'middle' }),
  ].join('\n')
  return card({ theme, title: 'Night Owl Stats', body })
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
