const { createClient } = require('../lib/github')
const { getTheme } = require('../lib/themes')
const { card, text, bar, dot, rainbowBar, errorCard } = require('../lib/svg')

const DNA_MAP = {
  backend:  ['Python', 'Go', 'Java', 'C#', 'Ruby', 'PHP', 'Rust', 'Elixir', 'Kotlin', 'Scala', 'Dart'],
  frontend: ['JavaScript', 'TypeScript', 'CSS', 'HTML', 'Vue', 'Svelte', 'CoffeeScript'],
  infra:    ['Shell', 'Dockerfile', 'HCL', 'Makefile', 'Nix', 'Batchfile', 'PowerShell'],
  data:     ['Jupyter Notebook', 'R', 'MATLAB', 'Julia', 'SAS'],
  systems:  ['C', 'C++', 'Assembly', 'Zig', 'Fortran', 'VHDL'],
}

const CATEGORY_COLORS = {
  backend: '#3fb950', frontend: '#58a6ff',
  infra: '#e3b341', data: '#d2a8ff', systems: '#f78166',
}

function classifyLangs(langs) {
  const profile = Object.fromEntries(Object.keys(DNA_MAP).map(k => [k, 0]))
  for (const { name, bytes } of langs) {
    for (const [cat, list] of Object.entries(DNA_MAP)) {
      if (list.includes(name)) { profile[cat] += bytes; break }
    }
  }
  const total = Object.values(profile).reduce((s, v) => s + v, 0) || 1
  return Object.fromEntries(Object.entries(profile).map(([k, v]) => [k, Math.round((v / total) * 100)]))
}

async function fetchData(gh, username) {
  const repos = await gh.getRepos(username)
  const nonFork = repos.filter(r => !r.fork).slice(0, 20)
  const langsPerRepo = await Promise.all(
    nonFork.map(r => gh.getRepoLanguages(username, r.name).catch(() => ({})))
  )
  const totals = {}
  for (const langs of langsPerRepo) {
    for (const [name, bytes] of Object.entries(langs)) {
      totals[name] = (totals[name] || 0) + bytes
    }
  }
  return classifyLangs(Object.entries(totals).map(([name, bytes]) => ({ name, bytes })))
}

function renderCard(profile, theme) {
  const BAR_X = 130
  const BAR_W = 305
  const PCT_X = 455

  const entries = Object.entries(profile).sort(([, a], [, b]) => b - a)
  const rows = entries.map(([cat, pct], i) => {
    const y = 52 + i * 29
    const midY = y + 8
    const w = Math.max(3, Math.round((pct / 100) * BAR_W))
    const fill = CATEGORY_COLORS[cat] || theme.accent
    const label = cat.charAt(0).toUpperCase() + cat.slice(1)
    return [
      dot({ cx: 35, cy: midY, fill }),
      text({ x: 47, y: midY + 4, content: label, fill: theme.text, size: 12 }),
      bar({ x: BAR_X, y, width: BAR_W, height: 16, fill: '#161b22' }),
      bar({ x: BAR_X, y, width: w, height: 16, fill }),
      text({ x: PCT_X, y: midY + 4, content: `${pct}%`, fill: theme.subtext, size: 11, anchor: 'end' }),
    ].join('\n')
  }).join('\n')

  const rbY = 52 + entries.length * 29 + 8
  const rbItems = entries.map(([cat, pct]) => ({ pct, color: CATEGORY_COLORS[cat] || theme.accent }))
  const rb = rainbowBar({ x: 25, y: rbY, totalWidth: 445, items: rbItems })

  return card({ height: rbY + 28, theme, title: 'Developer DNA', body: rows + '\n' + rb })
}

module.exports = async function handler(req, res) {
  const { user, theme: themeName = 'dark' } = req.query
  const theme = getTheme(themeName)
  res.setHeader('Content-Type', 'image/svg+xml')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=1800')
  if (!user) return res.end(errorCard('Usage: /api/dna?user=YOUR_USERNAME', theme))
  try {
    const profile = await fetchData(createClient(), user)
    res.end(renderCard(profile, theme))
  } catch (err) {
    if (err.status === 403) return res.end(errorCard('Rate limit reached. Add GITHUB_TOKEN.', theme))
    res.end(errorCard('Error fetching data. Try again later.', theme))
  }
}

module.exports.classifyLangs = classifyLangs
module.exports.fetchData = fetchData
module.exports.renderCard = renderCard
