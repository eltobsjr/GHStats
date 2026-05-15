const { createClient } = require('../lib/github')
const { getTheme } = require('../lib/themes')
const { card, text, errorCard } = require('../lib/svg')

function calculateStreaks(calendar) {
  const days = calendar.weeks.flatMap(w => w.contributionDays)
  let longestStreak = 0, streak = 0
  for (const d of days) {
    streak = d.contributionCount > 0 ? streak + 1 : 0
    longestStreak = Math.max(longestStreak, streak)
  }
  let currentStreak = 0
  for (const d of [...days].reverse()) {
    if (d.contributionCount > 0) currentStreak++
    else break
  }
  return { currentStreak, longestStreak, totalContributions: calendar.totalContributions }
}

async function fetchData(gh, username) {
  const calendar = await gh.getContributionsCalendar(username)
  if (!calendar) return { currentStreak: 0, longestStreak: 0, totalContributions: 0, hasToken: false }
  return { ...calculateStreaks(calendar), hasToken: true }
}

function renderCard(data, theme) {
  if (!data.hasToken) {
    return card({
      theme, title: 'GitHub Streak',
      body: text({ x: 25, y: 90, content: 'Add GITHUB_TOKEN to enable streak tracking', fill: theme.subtext }),
    })
  }
  const body = [
    text({ x: 247, y: 85, content: String(data.currentStreak), fill: theme.accent, size: 32, weight: '700', anchor: 'middle' }),
    text({ x: 247, y: 105, content: 'Current Streak (days)', fill: theme.subtext, size: 12, anchor: 'middle' }),
    text({ x: 100, y: 145, content: `Longest: ${data.longestStreak} days`, fill: theme.text, size: 13, anchor: 'middle' }),
    text({ x: 380, y: 145, content: `Total: ${data.totalContributions}`, fill: theme.text, size: 13, anchor: 'middle' }),
  ].join('\n')
  return card({ theme, title: 'GitHub Streak', body })
}

module.exports = async function handler(req, res) {
  const { user, theme: themeName = 'dark' } = req.query
  const theme = getTheme(themeName)
  res.setHeader('Content-Type', 'image/svg+xml')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=1800')
  if (!user) return res.end(errorCard('Usage: /api/streak?user=YOUR_USERNAME', theme))
  try {
    const data = await fetchData(createClient(), user)
    res.end(renderCard(data, theme))
  } catch (err) {
    if (err.status === 404) return res.end(errorCard(`User "${user}" not found`, theme))
    if (err.status === 403) return res.end(errorCard('Rate limit reached. Add GITHUB_TOKEN.', theme))
    res.end(errorCard('Error fetching data. Try again later.', theme))
  }
}

module.exports.calculateStreaks = calculateStreaks
module.exports.fetchData = fetchData
module.exports.renderCard = renderCard
