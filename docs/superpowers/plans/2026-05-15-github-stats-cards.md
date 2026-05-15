# GitHub Stats Cards — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** API Node.js no Vercel que gera 11 cards SVG com estatísticas do GitHub, embeddáveis em README.

**Architecture:** Cada card é uma Vercel serverless function independente em `api/`. Lógica de busca fica em `lib/github.js`, renderização SVG em `lib/svg.js`, temas em `lib/themes.js`. Cada handler exporta `fetchData` e `renderCard` como funções puras para facilitar testes.

**Tech Stack:** Node.js 20, Vercel Serverless Functions, Jest, GitHub REST API, GitHub GraphQL API.

---

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `lib/themes.js` | Definições de cor dos 5 temas |
| `lib/svg.js` | Helpers: `card()`, `text()`, `bar()`, `escape()`, `errorCard()` |
| `lib/github.js` | `createClient()` — wrapper REST + GraphQL com token opcional |
| `api/stats.js` | Stars, commits, PRs, issues, seguidores |
| `api/langs.js` | Top linguagens com barras de % |
| `api/repos.js` | Top repos por stars |
| `api/heatmap.js` | Calendário anual via scraping |
| `api/streak.js` | Streak atual e maior (requer token) |
| `api/hours.js` | Heatmap de horários (requer token) |
| `api/mood.js` | Análise de mensagens de commit |
| `api/dna.js` | Perfil de desenvolvedor por categoria |
| `api/rpg.js` | Level e XP baseados em atividade |
| `api/nocturnal.js` | Commits após meia-noite (requer token) |
| `api/graveyard.js` | Repos ativos vs abandonados |
| `tests/*.test.js` | Testes Jest para cada módulo |

---

## Task 1: Project setup

**Files:**
- Create: `package.json`
- Create: `vercel.json`
- Create: `.gitignore`
- Create: `jest.config.js`

- [ ] **Step 1: Inicializar git e criar estrutura**

```bash
cd /home/eltobsjr/Dev/github-stats
git init
mkdir -p api lib tests
```

- [ ] **Step 2: Criar package.json**

```json
{
  "name": "github-stats",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "devDependencies": {
    "jest": "^29.7.0"
  },
  "engines": {
    "node": "20.x"
  }
}
```

- [ ] **Step 3: Criar vercel.json**

```json
{
  "functions": {
    "api/*.js": {
      "memory": 256,
      "maxDuration": 10
    }
  }
}
```

- [ ] **Step 4: Criar jest.config.js**

```js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  clearMocks: true,
}
```

- [ ] **Step 5: Criar .gitignore**

```
node_modules/
.vercel/
.env
.env.local
coverage/
```

- [ ] **Step 6: Instalar dependências e commit**

```bash
npm install
git add .
git commit -m "feat: project setup"
```

---

## Task 2: lib/themes.js

**Files:**
- Create: `lib/themes.js`
- Create: `tests/themes.test.js`

- [ ] **Step 1: Escrever teste**

```js
// tests/themes.test.js
const { getTheme, themes } = require('../lib/themes')

test('returns dark theme by default', () => {
  const t = getTheme()
  expect(t.bg).toBe('#0d1117')
})

test('returns correct theme by name', () => {
  const t = getTheme('dracula')
  expect(t.bg).toBe('#282a36')
})

test('falls back to dark for unknown theme', () => {
  const t = getTheme('nonexistent')
  expect(t.bg).toBe('#0d1117')
})

test('all themes have required keys', () => {
  const keys = ['bg', 'border', 'title', 'text', 'subtext', 'accent', 'accent2']
  for (const [name, theme] of Object.entries(themes)) {
    for (const key of keys) {
      expect(theme).toHaveProperty(key), `${name} missing ${key}`
    }
  }
})
```

- [ ] **Step 2: Rodar e verificar FAIL**

```bash
npx jest tests/themes.test.js
```
Expected: FAIL — `Cannot find module '../lib/themes'`

- [ ] **Step 3: Implementar lib/themes.js**

```js
const themes = {
  dark: {
    bg: '#0d1117', border: '#30363d', title: '#58a6ff',
    text: '#c9d1d9', subtext: '#8b949e', accent: '#58a6ff', accent2: '#3fb950',
  },
  light: {
    bg: '#ffffff', border: '#d0d7de', title: '#0969da',
    text: '#24292f', subtext: '#57606a', accent: '#0969da', accent2: '#2da44e',
  },
  dracula: {
    bg: '#282a36', border: '#44475a', title: '#bd93f9',
    text: '#f8f8f2', subtext: '#6272a4', accent: '#bd93f9', accent2: '#50fa7b',
  },
  radical: {
    bg: '#141321', border: '#fe428e', title: '#fe428e',
    text: '#a9fef7', subtext: '#f8d847', accent: '#fe428e', accent2: '#f8d847',
  },
  tokyonight: {
    bg: '#1a1b27', border: '#414868', title: '#70a5fd',
    text: '#c0caf5', subtext: '#787c99', accent: '#70a5fd', accent2: '#73daca',
  },
}

function getTheme(name = 'dark') {
  return themes[name] ?? themes.dark
}

module.exports = { getTheme, themes }
```

- [ ] **Step 4: Rodar e verificar PASS**

```bash
npx jest tests/themes.test.js
```
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/themes.js tests/themes.test.js
git commit -m "feat: add themes"
```

---

## Task 3: lib/svg.js

**Files:**
- Create: `lib/svg.js`
- Create: `tests/svg.test.js`

- [ ] **Step 1: Escrever teste**

```js
// tests/svg.test.js
const { card, text, bar, escape, errorCard } = require('../lib/svg')
const { getTheme } = require('../lib/themes')

const theme = getTheme('dark')

test('escape encodes HTML entities', () => {
  expect(escape('<script>&"')).toBe('&lt;script&gt;&amp;&quot;')
})

test('text returns svg text element with correct attributes', () => {
  const el = text({ x: 10, y: 20, content: 'Hello', fill: '#fff', size: 14 })
  expect(el).toContain('x="10"')
  expect(el).toContain('y="20"')
  expect(el).toContain('Hello')
  expect(el).toContain('fill="#fff"')
  expect(el).toContain('font-size="14"')
})

test('text escapes content', () => {
  const el = text({ x: 0, y: 0, content: '<b>', fill: '#fff' })
  expect(el).toContain('&lt;b&gt;')
  expect(el).not.toContain('<b>')
})

test('bar returns rect with correct dimensions', () => {
  const el = bar({ x: 5, y: 10, width: 100, height: 8, fill: '#58a6ff' })
  expect(el).toContain('width="100"')
  expect(el).toContain('height="8"')
  expect(el).toContain('fill="#58a6ff"')
})

test('card returns valid svg wrapper', () => {
  const svg = card({ width: 495, height: 195, theme, title: 'Test', body: '<g/>' })
  expect(svg).toMatch(/^<svg/)
  expect(svg).toContain('width="495"')
  expect(svg).toContain('Test')
  expect(svg).toContain(theme.bg)
})

test('errorCard returns svg with message', () => {
  const svg = errorCard('User not found', theme)
  expect(svg).toContain('User not found')
  expect(svg).toMatch(/^<svg/)
})
```

- [ ] **Step 2: Rodar e verificar FAIL**

```bash
npx jest tests/svg.test.js
```

- [ ] **Step 3: Implementar lib/svg.js**

```js
function escape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function text({ x, y, content, fill, size = 13, weight = 'normal', anchor = 'start' }) {
  return `<text x="${x}" y="${y}" font-family="'Segoe UI',Ubuntu,sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${escape(content)}</text>`
}

function bar({ x, y, width, height, fill, rx = 3 }) {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${rx}" fill="${fill}"/>`
}

function card({ width = 495, height = 195, theme, title, body }) {
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" rx="4.5" fill="${theme.bg}" stroke="${theme.border}" stroke-width="1"/>
  ${text({ x: 25, y: 35, content: title, fill: theme.title, size: 17, weight: '600' })}
  ${body}
</svg>`
}

function errorCard(message, theme) {
  return card({
    theme,
    title: 'GitHub Stats',
    body: text({ x: 25, y: 90, content: message, fill: theme.subtext }),
  })
}

module.exports = { card, text, bar, escape, errorCard }
```

- [ ] **Step 4: Rodar e verificar PASS**

```bash
npx jest tests/svg.test.js
```
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/svg.js tests/svg.test.js
git commit -m "feat: add svg helpers"
```

---

## Task 4: lib/github.js

**Files:**
- Create: `lib/github.js`
- Create: `tests/github.test.js`

- [ ] **Step 1: Escrever teste**

```js
// tests/github.test.js
const { createClient } = require('../lib/github')

beforeEach(() => {
  global.fetch = jest.fn()
  delete process.env.GITHUB_TOKEN
})

function mockFetch(data, status = 200) {
  global.fetch.mockResolvedValue({
    ok: status < 400,
    status,
    json: async () => data,
    text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
  })
}

test('getUser fetches correct endpoint', async () => {
  mockFetch({ login: 'eltobsjr', followers: 10 })
  const gh = createClient()
  const user = await gh.getUser('eltobsjr')
  expect(user.login).toBe('eltobsjr')
  expect(fetch).toHaveBeenCalledWith(
    'https://api.github.com/users/eltobsjr',
    expect.objectContaining({ headers: expect.any(Object) })
  )
})

test('getUser throws with status on 404', async () => {
  mockFetch({ message: 'Not Found' }, 404)
  const gh = createClient()
  await expect(gh.getUser('nobody')).rejects.toMatchObject({ status: 404 })
})

test('getRepos paginates until batch < 100', async () => {
  global.fetch
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => Array(100).fill({ name: 'r', stargazers_count: 1 }) })
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => Array(30).fill({ name: 'r', stargazers_count: 1 }) })
  const gh = createClient()
  const repos = await gh.getRepos('user')
  expect(repos).toHaveLength(130)
  expect(fetch).toHaveBeenCalledTimes(2)
})

test('getContributionsCalendar returns null without token', async () => {
  const gh = createClient()
  const result = await gh.getContributionsCalendar('user')
  expect(result).toBeNull()
  expect(fetch).not.toHaveBeenCalled()
})

test('getContributionsCalendar calls GraphQL with token', async () => {
  process.env.GITHUB_TOKEN = 'test-token'
  mockFetch({
    data: {
      user: {
        contributionsCollection: {
          contributionCalendar: { totalContributions: 500, weeks: [] },
        },
      },
    },
  })
  const gh = createClient()
  const cal = await gh.getContributionsCalendar('user')
  expect(cal.totalContributions).toBe(500)
  expect(fetch).toHaveBeenCalledWith(
    'https://api.github.com/graphql',
    expect.objectContaining({ method: 'POST' })
  )
})

test('includes Authorization header when GITHUB_TOKEN set', async () => {
  process.env.GITHUB_TOKEN = 'my-token'
  mockFetch({ login: 'user' })
  const gh = createClient()
  await gh.getUser('user')
  const [, options] = fetch.mock.calls[0]
  expect(options.headers['Authorization']).toBe('Bearer my-token')
})

test('omits Authorization header without token', async () => {
  mockFetch({ login: 'user' })
  const gh = createClient()
  await gh.getUser('user')
  const [, options] = fetch.mock.calls[0]
  expect(options.headers['Authorization']).toBeUndefined()
})
```

- [ ] **Step 2: Rodar e verificar FAIL**

```bash
npx jest tests/github.test.js
```

- [ ] **Step 3: Implementar lib/github.js**

```js
const BASE = 'https://api.github.com'

function buildHeaders() {
  return {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(process.env.GITHUB_TOKEN && { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}` }),
  }
}

async function rest(path) {
  const res = await fetch(`${BASE}${path}`, { headers: buildHeaders() })
  if (!res.ok) {
    const err = new Error(`GitHub API ${res.status}`)
    err.status = res.status
    throw err
  }
  return res.json()
}

async function graphql(query, variables = {}) {
  if (!process.env.GITHUB_TOKEN) return null
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) {
    const err = new Error(`GraphQL ${res.status}`)
    err.status = res.status
    throw err
  }
  const json = await res.json()
  if (json.errors) throw new Error(json.errors[0].message)
  return json.data
}

function createClient() {
  return {
    async getUser(username) {
      return rest(`/users/${username}`)
    },

    async getRepos(username) {
      let page = 1, repos = []
      while (true) {
        const batch = await rest(`/users/${username}/repos?per_page=100&page=${page}&type=owner`)
        repos = repos.concat(batch)
        if (batch.length < 100) break
        page++
      }
      return repos
    },

    async getRepoLanguages(username, repo) {
      return rest(`/repos/${username}/${repo}/languages`)
    },

    async getRepoCommits(username, repo, page = 1) {
      return rest(`/repos/${username}/${repo}/commits?author=${username}&per_page=100&page=${page}`)
    },

    async getContributionsCalendar(username) {
      const data = await graphql(`
        query($login: String!) {
          user(login: $login) {
            contributionsCollection {
              contributionCalendar {
                totalContributions
                weeks { contributionDays { date contributionCount } }
              }
            }
          }
        }`, { login: username })
      return data?.user?.contributionsCollection?.contributionCalendar ?? null
    },

    async getCommitContributionsByRepo(username) {
      const data = await graphql(`
        query($login: String!) {
          user(login: $login) {
            contributionsCollection {
              commitContributionsByRepository {
                contributions(first: 100) {
                  nodes { occurredAt commitCount }
                }
              }
            }
          }
        }`, { login: username })
      return data?.user?.contributionsCollection?.commitContributionsByRepository ?? null
    },

    async getContributionHeatmapHtml(username) {
      const res = await fetch(`https://github.com/users/${username}/contributions`)
      if (!res.ok) {
        const err = new Error(`Heatmap fetch ${res.status}`)
        err.status = res.status
        throw err
      }
      return res.text()
    },
  }
}

module.exports = { createClient }
```

- [ ] **Step 4: Rodar e verificar PASS**

```bash
npx jest tests/github.test.js
```
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/github.js tests/github.test.js
git commit -m "feat: add github api client"
```

---

## Task 5: api/stats.js

**Files:**
- Create: `api/stats.js`
- Create: `tests/stats.test.js`

- [ ] **Step 1: Escrever teste**

```js
// tests/stats.test.js
const { fetchData, renderCard } = require('../api/stats')
const { getTheme } = require('../lib/themes')

const theme = getTheme('dark')

const mockGh = {
  getUser: jest.fn(),
  getRepos: jest.fn(),
  getContributionsCalendar: jest.fn(),
}

beforeEach(() => jest.clearAllMocks())

test('fetchData aggregates stars from repos', async () => {
  mockGh.getUser.mockResolvedValue({ name: 'Elton', login: 'eltobsjr', followers: 5, public_repos: 10 })
  mockGh.getRepos.mockResolvedValue([
    { stargazers_count: 10 }, { stargazers_count: 20 },
  ])
  mockGh.getContributionsCalendar.mockResolvedValue({ totalContributions: 300, weeks: [] })

  const data = await fetchData(mockGh, 'eltobsjr')
  expect(data.totalStars).toBe(30)
  expect(data.totalCommits).toBe(300)
  expect(data.name).toBe('Elton')
  expect(data.followers).toBe(5)
})

test('fetchData handles null calendar (no token)', async () => {
  mockGh.getUser.mockResolvedValue({ name: 'X', login: 'x', followers: 0, public_repos: 0 })
  mockGh.getRepos.mockResolvedValue([])
  mockGh.getContributionsCalendar.mockResolvedValue(null)

  const data = await fetchData(mockGh, 'x')
  expect(data.totalCommits).toBeNull()
})

test('renderCard returns valid SVG with stats', () => {
  const data = { name: 'Elton', totalStars: 42, totalCommits: 500, followers: 7, totalRepos: 15 }
  const svg = renderCard(data, theme)
  expect(svg).toMatch(/^<svg/)
  expect(svg).toContain('42')
  expect(svg).toContain('500')
  expect(svg).toContain('Elton')
})

test('renderCard shows token hint when commits null', () => {
  const data = { name: 'X', totalStars: 0, totalCommits: null, followers: 0, totalRepos: 0 }
  const svg = renderCard(data, theme)
  expect(svg).toContain('GITHUB_TOKEN')
})
```

- [ ] **Step 2: Rodar e verificar FAIL**

```bash
npx jest tests/stats.test.js
```

- [ ] **Step 3: Implementar api/stats.js**

```js
const { createClient } = require('../lib/github')
const { getTheme } = require('../lib/themes')
const { card, text, bar, errorCard } = require('../lib/svg')

const STATS = [
  { key: 'totalStars', label: 'Total Stars' },
  { key: 'totalCommits', label: 'Commits (year)' },
  { key: 'followers', label: 'Followers' },
  { key: 'totalRepos', label: 'Public Repos' },
]

async function fetchData(gh, username) {
  const [user, repos, calendar] = await Promise.all([
    gh.getUser(username),
    gh.getRepos(username),
    gh.getContributionsCalendar(username),
  ])
  return {
    name: user.name || user.login,
    followers: user.followers,
    totalRepos: user.public_repos,
    totalStars: repos.reduce((s, r) => s + r.stargazers_count, 0),
    totalCommits: calendar ? calendar.totalContributions : null,
  }
}

function renderCard(data, theme) {
  const rows = STATS.map((s, i) => {
    const val = data[s.key]
    const display = val === null ? '?' : String(val)
    const col = i % 2 === 0 ? 25 : 260
    const row = Math.floor(i / 2)
    const y = 75 + row * 40
    return [
      text({ x: col, y, content: s.label, fill: theme.subtext, size: 12 }),
      text({ x: col, y: y + 18, content: display, fill: theme.text, size: 16, weight: '600' }),
    ].join('\n')
  }).join('\n')

  const tokenHint = data.totalCommits === null
    ? text({ x: 25, y: 185, content: 'Add GITHUB_TOKEN for commit count', fill: theme.subtext, size: 11 })
    : ''

  return card({
    height: 205,
    theme,
    title: `${data.name}'s GitHub Stats`,
    body: rows + tokenHint,
  })
}

module.exports = async function handler(req, res) {
  const { user, theme: themeName = 'dark' } = req.query
  const theme = getTheme(themeName)
  res.setHeader('Content-Type', 'image/svg+xml')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=1800')
  if (!user) return res.end(errorCard('Usage: /api/stats?user=YOUR_USERNAME', theme))
  try {
    const data = await fetchData(createClient(), user)
    res.end(renderCard(data, theme))
  } catch (err) {
    if (err.status === 404) return res.end(errorCard(`User "${user}" not found`, theme))
    if (err.status === 403) return res.end(errorCard('Rate limit reached. Add GITHUB_TOKEN.', theme))
    res.end(errorCard('Error fetching data. Try again later.', theme))
  }
}

module.exports.fetchData = fetchData
module.exports.renderCard = renderCard
```

- [ ] **Step 4: Rodar e verificar PASS**

```bash
npx jest tests/stats.test.js
```
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add api/stats.js tests/stats.test.js
git commit -m "feat: add stats card"
```

---

## Task 6: api/langs.js

**Files:**
- Create: `api/langs.js`
- Create: `tests/langs.test.js`

- [ ] **Step 1: Escrever teste**

```js
// tests/langs.test.js
const { aggregateLangs, renderCard } = require('../api/langs')
const { getTheme } = require('../lib/themes')

const theme = getTheme('dark')

test('aggregateLangs sums bytes per language across repos', () => {
  const langsPerRepo = [
    { Python: 5000, JavaScript: 2000 },
    { Python: 3000, Go: 4000 },
  ]
  const result = aggregateLangs(langsPerRepo)
  expect(result[0]).toEqual({ name: 'Python', bytes: 8000, pct: expect.any(Number) })
  expect(result[1].name).toBe('Go')
  expect(result.reduce((s, l) => s + l.pct, 0)).toBeCloseTo(100)
})

test('aggregateLangs returns top 6 max', () => {
  const langs = {}
  for (let i = 0; i < 10; i++) langs[`Lang${i}`] = 1000
  const result = aggregateLangs([langs])
  expect(result.length).toBeLessThanOrEqual(6)
})

test('renderCard returns SVG with language names', () => {
  const langs = [
    { name: 'Python', bytes: 8000, pct: 57.1 },
    { name: 'Go', bytes: 4000, pct: 28.6 },
    { name: 'JS', bytes: 2000, pct: 14.3 },
  ]
  const svg = renderCard(langs, theme)
  expect(svg).toMatch(/^<svg/)
  expect(svg).toContain('Python')
  expect(svg).toContain('57.1%')
})
```

- [ ] **Step 2: Rodar e verificar FAIL**

```bash
npx jest tests/langs.test.js
```

- [ ] **Step 3: Implementar api/langs.js**

```js
const { createClient } = require('../lib/github')
const { getTheme } = require('../lib/themes')
const { card, text, bar, errorCard } = require('../lib/svg')

function aggregateLangs(langsPerRepo) {
  const totals = {}
  for (const langs of langsPerRepo) {
    for (const [name, bytes] of Object.entries(langs)) {
      totals[name] = (totals[name] || 0) + bytes
    }
  }
  const sorted = Object.entries(totals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
  const grand = sorted.reduce((s, [, b]) => s + b, 0)
  return sorted.map(([name, bytes]) => ({
    name,
    bytes,
    pct: Math.round((bytes / grand) * 1000) / 10,
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
  const BAR_MAX = 340
  const body = langs.map((lang, i) => {
    const y = 55 + i * 25
    const w = Math.max(2, Math.round((lang.pct / 100) * BAR_MAX))
    return [
      text({ x: 25, y: y + 12, content: lang.name, fill: theme.text, size: 12 }),
      bar({ x: 120, y, width: w, height: 14, fill: theme.accent }),
      bar({ x: 120 + w, y, width: BAR_MAX - w, height: 14, fill: theme.border }),
      text({ x: 470, y: y + 12, content: `${lang.pct}%`, fill: theme.subtext, size: 11, anchor: 'end' }),
    ].join('\n')
  }).join('\n')

  return card({ height: 60 + langs.length * 25 + 20, theme, title: 'Top Languages', body })
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
```

- [ ] **Step 4: Rodar e verificar PASS**

```bash
npx jest tests/langs.test.js
```

- [ ] **Step 5: Commit**

```bash
git add api/langs.js tests/langs.test.js
git commit -m "feat: add langs card"
```

---

## Task 7: api/repos.js

**Files:**
- Create: `api/repos.js`
- Create: `tests/repos.test.js`

- [ ] **Step 1: Escrever teste**

```js
// tests/repos.test.js
const { pickTopRepos, renderCard } = require('../api/repos')
const { getTheme } = require('../lib/themes')

const theme = getTheme('dark')

test('pickTopRepos returns top 6 sorted by stars, skipping forks', () => {
  const repos = [
    { name: 'a', stargazers_count: 10, forks_count: 2, language: 'Go', fork: false },
    { name: 'b', stargazers_count: 50, forks_count: 5, language: 'JS', fork: false },
    { name: 'c', stargazers_count: 5,  forks_count: 0, language: 'Py', fork: true },
    ...Array(5).fill({ name: 'x', stargazers_count: 1, forks_count: 0, language: 'Go', fork: false }),
    { name: 'z', stargazers_count: 100, forks_count: 10, language: 'Rust', fork: false },
  ]
  const top = pickTopRepos(repos)
  expect(top[0].name).toBe('z')
  expect(top.some(r => r.name === 'c')).toBe(false)
  expect(top.length).toBeLessThanOrEqual(6)
})

test('renderCard shows repo names and stars', () => {
  const repos = [
    { name: 'cool-project', stargazers_count: 99, forks_count: 10, language: 'Go' },
  ]
  const svg = renderCard(repos, theme)
  expect(svg).toContain('cool-project')
  expect(svg).toContain('99')
})
```

- [ ] **Step 2: Rodar e verificar FAIL**

```bash
npx jest tests/repos.test.js
```

- [ ] **Step 3: Implementar api/repos.js**

```js
const { createClient } = require('../lib/github')
const { getTheme } = require('../lib/themes')
const { card, text, errorCard } = require('../lib/svg')

function pickTopRepos(repos) {
  return repos
    .filter(r => !r.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 6)
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
```

- [ ] **Step 4: Rodar e verificar PASS**

```bash
npx jest tests/repos.test.js
```

- [ ] **Step 5: Commit**

```bash
git add api/repos.js tests/repos.test.js
git commit -m "feat: add repos card"
```

---

## Task 8: api/heatmap.js

**Files:**
- Create: `api/heatmap.js`
- Create: `tests/heatmap.test.js`

- [ ] **Step 1: Escrever teste**

```js
// tests/heatmap.test.js
const { extractSvg, recolor } = require('../api/heatmap')
const { getTheme } = require('../lib/themes')

const theme = getTheme('dark')

test('extractSvg pulls svg element from html fragment', () => {
  const html = '<div><svg width="100"><rect fill="#ebedf0"/></svg></div>'
  const svg = extractSvg(html)
  expect(svg).toMatch(/^<svg/)
  expect(svg).toContain('<rect')
})

test('extractSvg returns null when no svg found', () => {
  expect(extractSvg('<div>no svg here</div>')).toBeNull()
})

test('recolor replaces github green palette with theme accent', () => {
  const svg = '<svg><rect fill="#216e39"/><rect fill="#ebedf0"/></svg>'
  const result = recolor(svg, theme)
  expect(result).toContain(theme.accent)
  expect(result).toContain(theme.border)
  expect(result).not.toContain('#216e39')
})
```

- [ ] **Step 2: Rodar e verificar FAIL**

```bash
npx jest tests/heatmap.test.js
```

- [ ] **Step 3: Implementar api/heatmap.js**

```js
const { createClient } = require('../lib/github')
const { getTheme } = require('../lib/themes')
const { errorCard } = require('../lib/svg')

// GitHub's contribution green palette, darkest to lightest
const GH_GREENS = ['#216e39', '#30a14e', '#40c463', '#9be9a8', '#ebedf0']

function extractSvg(html) {
  const match = html.match(/<svg[\s\S]*?<\/svg>/)
  return match ? match[0] : null
}

function recolor(svg, theme) {
  // Map GitHub greens to theme accent with 4 intensity levels + empty
  const palette = [
    theme.bg,       // ebedf0 = empty
    theme.accent + '33',
    theme.accent + '66',
    theme.accent + 'aa',
    theme.accent,
  ]
  const pairs = GH_GREENS.map((gh, i) => [gh, palette[i]])
  let result = svg
  for (const [from, to] of pairs) {
    result = result.split(from).join(to)
  }
  return result
}

async function fetchData(gh, username) {
  const html = await gh.getContributionHeatmapHtml(username)
  return html
}

function renderCard(html, theme) {
  const raw = extractSvg(html)
  if (!raw) return errorCard('Could not load contribution graph', theme)

  const recolored = recolor(raw, theme)
  // Wrap in our card frame
  const inner = recolored
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>$/, '')

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
```

- [ ] **Step 4: Rodar e verificar PASS**

```bash
npx jest tests/heatmap.test.js
```

- [ ] **Step 5: Commit**

```bash
git add api/heatmap.js tests/heatmap.test.js
git commit -m "feat: add heatmap card"
```

---

## Task 9: api/streak.js

**Files:**
- Create: `api/streak.js`
- Create: `tests/streak.test.js`

- [ ] **Step 1: Escrever teste**

```js
// tests/streak.test.js
const { calculateStreaks, renderCard } = require('../api/streak')
const { getTheme } = require('../lib/themes')

const theme = getTheme('dark')

function makeDays(counts) {
  const base = new Date('2026-01-01')
  return counts.map((c, i) => {
    const d = new Date(base)
    d.setDate(d.getDate() + i)
    return { date: d.toISOString().split('T')[0], contributionCount: c }
  })
}

test('calculateStreaks finds longest run', () => {
  const days = makeDays([1, 0, 1, 1, 1, 0, 1])
  const { longestStreak } = calculateStreaks({ weeks: [{ contributionDays: days }], totalContributions: 5 })
  expect(longestStreak).toBe(3)
})

test('calculateStreaks counts current streak from end', () => {
  // Last 3 days have contributions
  const days = makeDays([0, 1, 1, 1])
  const { currentStreak } = calculateStreaks({ weeks: [{ contributionDays: days }], totalContributions: 3 })
  expect(currentStreak).toBe(3)
})

test('renderCard shows both streak values', () => {
  const svg = renderCard({ currentStreak: 7, longestStreak: 42, totalContributions: 300, hasToken: true }, theme)
  expect(svg).toContain('7')
  expect(svg).toContain('42')
  expect(svg).toMatch(/^<svg/)
})

test('renderCard shows token hint when no token', () => {
  const svg = renderCard({ currentStreak: 0, longestStreak: 0, totalContributions: 0, hasToken: false }, theme)
  expect(svg).toContain('GITHUB_TOKEN')
})
```

- [ ] **Step 2: Rodar e verificar FAIL**

```bash
npx jest tests/streak.test.js
```

- [ ] **Step 3: Implementar api/streak.js**

```js
const { createClient } = require('../lib/github')
const { getTheme } = require('../lib/themes')
const { card, text, bar, errorCard } = require('../lib/svg')

function calculateStreaks(calendar) {
  const days = calendar.weeks.flatMap(w => w.contributionDays)
  let longestStreak = 0, streak = 0
  for (const d of days) {
    streak = d.contributionCount > 0 ? streak + 1 : 0
    longestStreak = Math.max(longestStreak, streak)
  }
  const reversed = [...days].reverse()
  let currentStreak = 0
  for (const d of reversed) {
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
```

- [ ] **Step 4: Rodar e verificar PASS**

```bash
npx jest tests/streak.test.js
```

- [ ] **Step 5: Commit**

```bash
git add api/streak.js tests/streak.test.js
git commit -m "feat: add streak card"
```

---

## Task 10: api/hours.js

**Files:**
- Create: `api/hours.js`
- Create: `tests/hours.test.js`

- [ ] **Step 1: Escrever teste**

```js
// tests/hours.test.js
const { buildGrid, renderCard } = require('../api/hours')
const { getTheme } = require('../lib/themes')

const theme = getTheme('dark')

test('buildGrid counts commits by day and hour', () => {
  const contribs = [
    { contributions: { nodes: [{ occurredAt: '2026-01-05T02:30:00Z', commitCount: 3 }] } },
    { contributions: { nodes: [{ occurredAt: '2026-01-05T02:45:00Z', commitCount: 2 }] } },
  ]
  const grid = buildGrid(contribs)
  // 2026-01-05 is a Monday (day 1), hour 2 UTC
  expect(grid[1][2]).toBe(5)
})

test('buildGrid returns 7x24 grid', () => {
  const grid = buildGrid([])
  expect(grid).toHaveLength(7)
  expect(grid[0]).toHaveLength(24)
})

test('renderCard returns SVG with grid', () => {
  const grid = Array(7).fill(null).map(() => Array(24).fill(0))
  grid[1][14] = 10
  const svg = renderCard({ grid, hasToken: true }, theme)
  expect(svg).toMatch(/^<svg/)
  expect(svg).toContain('<rect')
})

test('renderCard shows token hint without token', () => {
  const svg = renderCard({ grid: null, hasToken: false }, theme)
  expect(svg).toContain('GITHUB_TOKEN')
})
```

- [ ] **Step 2: Rodar e verificar FAIL**

```bash
npx jest tests/hours.test.js
```

- [ ] **Step 3: Implementar api/hours.js**

```js
const { createClient } = require('../lib/github')
const { getTheme } = require('../lib/themes')
const { card, text, errorCard } = require('../lib/svg')

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function buildGrid(contribs) {
  const grid = Array(7).fill(null).map(() => Array(24).fill(0))
  for (const repo of contribs) {
    for (const node of repo.contributions.nodes) {
      const d = new Date(node.occurredAt)
      grid[d.getDay()][d.getHours()] += node.commitCount
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
```

- [ ] **Step 4: Rodar e verificar PASS**

```bash
npx jest tests/hours.test.js
```

- [ ] **Step 5: Commit**

```bash
git add api/hours.js tests/hours.test.js
git commit -m "feat: add hours heatmap card"
```

---

## Task 11: api/mood.js

**Files:**
- Create: `api/mood.js`
- Create: `tests/mood.test.js`

- [ ] **Step 1: Escrever teste**

```js
// tests/mood.test.js
const { analyzeMessages, renderCard } = require('../api/mood')
const { getTheme } = require('../lib/themes')

const theme = getTheme('dark')

test('analyzeMessages categorizes commit messages', () => {
  const messages = ['feat: add login', 'fix bug', 'fix typo', 'refactor auth', 'wtf why']
  const result = analyzeMessages(messages)
  expect(result.feat).toBe(1)
  expect(result.fix).toBe(2)
  expect(result.refactor).toBe(1)
  expect(result.chaos).toBe(1)
})

test('analyzeMessages returns zero counts for uncategorized', () => {
  const result = analyzeMessages(['random message'])
  expect(result.feat).toBe(0)
})

test('renderCard shows category bars', () => {
  const counts = { feat: 40, fix: 30, refactor: 15, chaos: 5, docs: 5, wip: 5 }
  const svg = renderCard({ counts, total: 100 }, theme)
  expect(svg).toMatch(/^<svg/)
  expect(svg).toContain('feat')
  expect(svg).toContain('fix')
})
```

- [ ] **Step 2: Rodar e verificar FAIL**

```bash
npx jest tests/mood.test.js
```

- [ ] **Step 3: Implementar api/mood.js**

```js
const { createClient } = require('../lib/github')
const { getTheme } = require('../lib/themes')
const { card, text, bar, errorCard } = require('../lib/svg')

const CATEGORIES = {
  feat:    ['feat', 'add', 'new', 'implement', 'create', 'build', 'initial'],
  fix:     ['fix', 'bug', 'patch', 'resolve', 'correct', 'repair'],
  refactor:['refactor', 'clean', 'improve', 'optimize', 'simplify', 'reorganize'],
  chaos:   ['wtf', 'hack', 'hotfix', 'revert', 'oops', 'shit', 'fuck', 'undo'],
  docs:    ['docs', 'readme', 'doc', 'documentation', 'comment'],
  wip:     ['wip', 'progress', 'todo', 'wip:', 'working'],
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
      if (keywords.some(kw => lower.includes(kw))) {
        counts[cat]++
        break
      }
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
  const BAR_MAX = 340
  const entries = Object.entries(data.counts).sort(([, a], [, b]) => b - a)
  const body = entries.map(([cat, count], i) => {
    const y = 55 + i * 23
    const pct = Math.round((count / data.total) * 100)
    const w = Math.max(2, Math.round((count / data.total) * BAR_MAX))
    const fill = COLORS[cat] || theme.accent
    return [
      text({ x: 25, y: y + 12, content: cat, fill: theme.text, size: 12 }),
      bar({ x: 90, y, width: w, height: 14, fill }),
      bar({ x: 90 + w, y, width: BAR_MAX - w, height: 14, fill: theme.border }),
      text({ x: 440, y: y + 12, content: `${pct}%`, fill: theme.subtext, size: 11, anchor: 'end' }),
    ].join('\n')
  }).join('\n')

  return card({ height: 60 + entries.length * 23 + 15, theme, title: 'Commit Mood', body })
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
```

- [ ] **Step 4: Rodar e verificar PASS**

```bash
npx jest tests/mood.test.js
```

- [ ] **Step 5: Commit**

```bash
git add api/mood.js tests/mood.test.js
git commit -m "feat: add mood card"
```

---

## Task 12: api/dna.js

**Files:**
- Create: `api/dna.js`
- Create: `tests/dna.test.js`

- [ ] **Step 1: Escrever teste**

```js
// tests/dna.test.js
const { classifyLangs, renderCard } = require('../api/dna')
const { getTheme } = require('../lib/themes')

const theme = getTheme('dark')

test('classifyLangs maps languages to categories', () => {
  const langs = [
    { name: 'Python', bytes: 5000 },
    { name: 'JavaScript', bytes: 3000 },
    { name: 'Shell', bytes: 1000 },
  ]
  const result = classifyLangs(langs)
  expect(result.backend).toBeGreaterThan(0)
  expect(result.frontend).toBeGreaterThan(0)
  expect(result.infra).toBeGreaterThan(0)
})

test('renderCard shows categories as bars', () => {
  const profile = { backend: 60, frontend: 30, infra: 10, data: 0, systems: 0 }
  const svg = renderCard(profile, theme)
  expect(svg).toMatch(/^<svg/)
  expect(svg).toContain('Backend')
  expect(svg).toContain('Frontend')
})
```

- [ ] **Step 2: Rodar e verificar FAIL**

```bash
npx jest tests/dna.test.js
```

- [ ] **Step 3: Implementar api/dna.js**

```js
const { createClient } = require('../lib/github')
const { getTheme } = require('../lib/themes')
const { card, text, bar, errorCard } = require('../lib/svg')

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
  const sorted = Object.entries(totals).map(([name, bytes]) => ({ name, bytes }))
  return classifyLangs(sorted)
}

function renderCard(profile, theme) {
  const BAR_MAX = 340
  const entries = Object.entries(profile).sort(([, a], [, b]) => b - a)
  const body = entries.map(([cat, pct], i) => {
    const y = 55 + i * 25
    const w = Math.max(2, Math.round((pct / 100) * BAR_MAX))
    const fill = CATEGORY_COLORS[cat] || theme.accent
    const label = cat.charAt(0).toUpperCase() + cat.slice(1)
    return [
      text({ x: 25, y: y + 13, content: label, fill: theme.text, size: 12 }),
      bar({ x: 110, y, width: w, height: 14, fill }),
      bar({ x: 110 + w, y, width: BAR_MAX - w, height: 14, fill: theme.border }),
      text({ x: 460, y: y + 13, content: `${pct}%`, fill: theme.subtext, size: 11, anchor: 'end' }),
    ].join('\n')
  }).join('\n')

  return card({ height: 60 + entries.length * 25 + 15, theme, title: 'Developer DNA', body })
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
```

- [ ] **Step 4: Rodar e verificar PASS**

```bash
npx jest tests/dna.test.js
```

- [ ] **Step 5: Commit**

```bash
git add api/dna.js tests/dna.test.js
git commit -m "feat: add dna card"
```

---

## Task 13: api/rpg.js

**Files:**
- Create: `api/rpg.js`
- Create: `tests/rpg.test.js`

- [ ] **Step 1: Escrever teste**

```js
// tests/rpg.test.js
const { calculateRpg, getClass, renderCard } = require('../api/rpg')
const { getTheme } = require('../lib/themes')

const theme = getTheme('dark')

test('calculateRpg computes xp and level', () => {
  const data = { totalCommits: 500, totalStars: 10, totalRepos: 20 }
  const result = calculateRpg(data)
  // XP = 500*1 + 10*50 + 20*5 = 500+500+100 = 1100
  expect(result.xp).toBe(1100)
  expect(result.level).toBe(Math.floor(Math.sqrt(1100 / 100)))
})

test('getClass maps top language to class name', () => {
  expect(getClass('Python')).toBe('Data Alchemist')
  expect(getClass('Go')).toBe('Go Gopher Master')
  expect(getClass('UnknownLang')).toBe('Code Nomad')
})

test('renderCard returns SVG with level', () => {
  const rpg = { xp: 1100, level: 3, xpForNext: 1600, className: 'Go Gopher Master' }
  const svg = renderCard(rpg, theme)
  expect(svg).toMatch(/^<svg/)
  expect(svg).toContain('Level 3')
  expect(svg).toContain('Go Gopher Master')
})
```

- [ ] **Step 2: Rodar e verificar FAIL**

```bash
npx jest tests/rpg.test.js
```

- [ ] **Step 3: Implementar api/rpg.js**

```js
const { createClient } = require('../lib/github')
const { getTheme } = require('../lib/themes')
const { card, text, bar, errorCard } = require('../lib/svg')

const CLASSES = {
  Python: 'Data Alchemist', JavaScript: 'Web Architect', TypeScript: 'TypeScript Wizard',
  Go: 'Go Gopher Master', Rust: 'Memory Safe Guardian', Java: 'Enterprise Dragon',
  'C++': 'Performance Sorcerer', Ruby: 'Gem Collector', PHP: 'Hypertext Paladin',
  Shell: 'Shell Whisperer', Kotlin: 'Kotlin Knight', Swift: 'Swift Samurai',
}

function getClass(topLang) {
  return CLASSES[topLang] || 'Code Nomad'
}

function calculateRpg({ totalCommits, totalStars, totalRepos }) {
  const xp = totalCommits * 1 + totalStars * 50 + totalRepos * 5
  const level = Math.floor(Math.sqrt(xp / 100))
  const xpForNext = Math.pow(level + 1, 2) * 100
  return { xp, level, xpForNext }
}

async function fetchData(gh, username) {
  const [user, repos, calendar] = await Promise.all([
    gh.getUser(username),
    gh.getRepos(username),
    gh.getContributionsCalendar(username),
  ])
  const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0)
  const totalCommits = calendar?.totalContributions ?? 0
  const langTotals = {}
  for (const repo of repos.filter(r => !r.fork && r.language)) {
    langTotals[repo.language] = (langTotals[repo.language] || 0) + 1
  }
  const topLang = Object.entries(langTotals).sort(([, a], [, b]) => b - a)[0]?.[0] || ''
  const rpg = calculateRpg({ totalCommits, totalStars, totalRepos: repos.length })
  return { ...rpg, className: getClass(topLang) }
}

function renderCard(data, theme) {
  const progressPct = Math.min(100, Math.round((data.xp / data.xpForNext) * 100))
  const BAR_W = 400
  const filled = Math.round((progressPct / 100) * BAR_W)
  const body = [
    text({ x: 247, y: 80, content: `Level ${data.level}`, fill: theme.accent, size: 28, weight: '700', anchor: 'middle' }),
    text({ x: 247, y: 102, content: data.className, fill: theme.subtext, size: 13, anchor: 'middle' }),
    bar({ x: 47, y: 120, width: filled, height: 10, fill: theme.accent }),
    bar({ x: 47 + filled, y: 120, width: BAR_W - filled, height: 10, fill: theme.border }),
    text({ x: 47, y: 148, content: `XP: ${data.xp.toLocaleString()}`, fill: theme.text, size: 12 }),
    text({ x: 447, y: 148, content: `Next: ${data.xpForNext.toLocaleString()}`, fill: theme.subtext, size: 12, anchor: 'end' }),
  ].join('\n')
  return card({ theme, title: 'Coding RPG', body })
}

module.exports = async function handler(req, res) {
  const { user, theme: themeName = 'dark' } = req.query
  const theme = getTheme(themeName)
  res.setHeader('Content-Type', 'image/svg+xml')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=1800')
  if (!user) return res.end(errorCard('Usage: /api/rpg?user=YOUR_USERNAME', theme))
  try {
    const data = await fetchData(createClient(), user)
    res.end(renderCard(data, theme))
  } catch (err) {
    if (err.status === 404) return res.end(errorCard(`User "${user}" not found`, theme))
    if (err.status === 403) return res.end(errorCard('Rate limit reached. Add GITHUB_TOKEN.', theme))
    res.end(errorCard('Error fetching data. Try again later.', theme))
  }
}

module.exports.calculateRpg = calculateRpg
module.exports.getClass = getClass
module.exports.fetchData = fetchData
module.exports.renderCard = renderCard
```

- [ ] **Step 4: Rodar e verificar PASS**

```bash
npx jest tests/rpg.test.js
```

- [ ] **Step 5: Commit**

```bash
git add api/rpg.js tests/rpg.test.js
git commit -m "feat: add rpg card"
```

---

## Task 14: api/nocturnal.js

**Files:**
- Create: `api/nocturnal.js`
- Create: `tests/nocturnal.test.js`

- [ ] **Step 1: Escrever teste**

```js
// tests/nocturnal.test.js
const { analyzeNocturnal, renderCard } = require('../api/nocturnal')
const { getTheme } = require('../lib/themes')

const theme = getTheme('dark')

test('analyzeNocturnal counts commits between 00:00-05:59', () => {
  const contribs = [{
    contributions: { nodes: [
      { occurredAt: '2026-01-05T02:00:00Z', commitCount: 5 },
      { occurredAt: '2026-01-05T14:00:00Z', commitCount: 3 },
    ]}
  }]
  const result = analyzeNocturnal(contribs)
  expect(result.nightCommits).toBe(5)
})

test('analyzeNocturnal finds most active hour', () => {
  const contribs = [{
    contributions: { nodes: [
      { occurredAt: '2026-01-05T23:00:00Z', commitCount: 10 },
      { occurredAt: '2026-01-06T23:00:00Z', commitCount: 8 },
      { occurredAt: '2026-01-05T14:00:00Z', commitCount: 3 },
    ]}
  }]
  const result = analyzeNocturnal(contribs)
  expect(result.mostActiveHour).toBe(23)
})

test('renderCard shows night commits and peak hour', () => {
  const data = { nightCommits: 234, mostActiveHour: 2, longestSessionMs: 6 * 3600000, hasToken: true }
  const svg = renderCard(data, theme)
  expect(svg).toMatch(/^<svg/)
  expect(svg).toContain('234')
  expect(svg).toContain('2am')
})

test('renderCard shows token hint without token', () => {
  const svg = renderCard({ hasToken: false }, theme)
  expect(svg).toContain('GITHUB_TOKEN')
})
```

- [ ] **Step 2: Rodar e verificar FAIL**

```bash
npx jest tests/nocturnal.test.js
```

- [ ] **Step 3: Implementar api/nocturnal.js**

```js
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
    const h = new Date(e.occurredAt).getHours()
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
```

- [ ] **Step 4: Rodar e verificar PASS**

```bash
npx jest tests/nocturnal.test.js
```

- [ ] **Step 5: Commit**

```bash
git add api/nocturnal.js tests/nocturnal.test.js
git commit -m "feat: add nocturnal card"
```

---

## Task 15: api/graveyard.js

**Files:**
- Create: `api/graveyard.js`
- Create: `tests/graveyard.test.js`

- [ ] **Step 1: Escrever teste**

```js
// tests/graveyard.test.js
const { classifyRepos, renderCard } = require('../api/graveyard')
const { getTheme } = require('../lib/themes')

const theme = getTheme('dark')

function makeRepo(name, daysAgo, fork = false) {
  const d = new Date(Date.now() - daysAgo * 86400000)
  return { name, pushed_at: d.toISOString(), fork }
}

test('classifyRepos splits into active/dormant/dead', () => {
  const repos = [
    makeRepo('fresh', 10),
    makeRepo('old', 200),
    makeRepo('ancient', 500),
    makeRepo('forked', 10, true),
  ]
  const result = classifyRepos(repos)
  expect(result.active).toContain('fresh')
  expect(result.dormant).toContain('old')
  expect(result.dead).toContain('ancient')
  expect(result.active).not.toContain('forked')
})

test('renderCard shows counts for each category', () => {
  const data = {
    active: ['a', 'b'],
    dormant: ['c'],
    dead: ['d', 'e', 'f'],
  }
  const svg = renderCard(data, theme)
  expect(svg).toMatch(/^<svg/)
  expect(svg).toContain('Active')
  expect(svg).toContain('Dead')
  expect(svg).toContain('3')
})
```

- [ ] **Step 2: Rodar e verificar FAIL**

```bash
npx jest tests/graveyard.test.js
```

- [ ] **Step 3: Implementar api/graveyard.js**

```js
const { createClient } = require('../lib/github')
const { getTheme } = require('../lib/themes')
const { card, text, bar, errorCard } = require('../lib/svg')

const DAY_MS = 86400000

function classifyRepos(repos) {
  const now = Date.now()
  const active = [], dormant = [], dead = []
  for (const r of repos) {
    if (r.fork) continue
    const age = (now - new Date(r.pushed_at).getTime()) / DAY_MS
    if (age < 90) active.push(r.name)
    else if (age < 365) dormant.push(r.name)
    else dead.push(r.name)
  }
  return { active, dormant, dead }
}

async function fetchData(gh, username) {
  const repos = await gh.getRepos(username)
  return classifyRepos(repos)
}

function renderCard(data, theme) {
  const total = data.active.length + data.dormant.length + data.dead.length || 1
  const BAR_MAX = 340
  const categories = [
    { label: 'Active', list: data.active, color: '#3fb950' },
    { label: 'Dormant', list: data.dormant, color: theme.accent },
    { label: 'Dead', list: data.dead, color: '#f78166' },
  ]
  const bars = categories.map((cat, i) => {
    const y = 55 + i * 35
    const w = Math.max(2, Math.round((cat.list.length / total) * BAR_MAX))
    return [
      text({ x: 25, y: y + 14, content: `${cat.label} (${cat.list.length})`, fill: theme.text, size: 12 }),
      bar({ x: 130, y, width: w, height: 16, fill: cat.color }),
      bar({ x: 130 + w, y, width: BAR_MAX - w, height: 16, fill: theme.border }),
    ].join('\n')
  }).join('\n')

  const deadList = data.dead.slice(0, 4).join(', ') + (data.dead.length > 4 ? '...' : '')
  const rip = data.dead.length
    ? text({ x: 25, y: 170, content: `RIP: ${deadList}`, fill: theme.subtext, size: 11 })
    : ''

  return card({ height: 185, theme, title: 'Project Graveyard', body: bars + rip })
}

module.exports = async function handler(req, res) {
  const { user, theme: themeName = 'dark' } = req.query
  const theme = getTheme(themeName)
  res.setHeader('Content-Type', 'image/svg+xml')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=1800')
  if (!user) return res.end(errorCard('Usage: /api/graveyard?user=YOUR_USERNAME', theme))
  try {
    const data = await fetchData(createClient(), user)
    res.end(renderCard(data, theme))
  } catch (err) {
    if (err.status === 404) return res.end(errorCard(`User "${user}" not found`, theme))
    if (err.status === 403) return res.end(errorCard('Rate limit reached. Add GITHUB_TOKEN.', theme))
    res.end(errorCard('Error fetching data. Try again later.', theme))
  }
}

module.exports.classifyRepos = classifyRepos
module.exports.fetchData = fetchData
module.exports.renderCard = renderCard
```

- [ ] **Step 4: Rodar e verificar PASS**

```bash
npx jest tests/graveyard.test.js
```

- [ ] **Step 5: Commit**

```bash
git add api/graveyard.js tests/graveyard.test.js
git commit -m "feat: add graveyard card"
```

---

## Task 16: Deploy na Vercel

**Files:** nenhum novo

- [ ] **Step 1: Rodar todos os testes**

```bash
npx jest
```
Expected: todos os testes PASS antes de fazer deploy.

- [ ] **Step 2: Instalar Vercel CLI**

```bash
npm install -g vercel
```

- [ ] **Step 3: Login e link do projeto**

```bash
vercel login
vercel link
```
Responder: criar novo projeto, nome `github-stats`.

- [ ] **Step 4: (Opcional) Adicionar GITHUB_TOKEN**

```bash
vercel env add GITHUB_TOKEN
```
Colar o token quando solicitado. Selecionar todos os ambientes (Production, Preview, Development).

- [ ] **Step 5: Deploy preview**

```bash
vercel
```
Vercel retorna uma URL preview. Testar no browser:
```
https://<preview-url>/api/stats?user=eltobsjr&theme=dark
https://<preview-url>/api/langs?user=eltobsjr&theme=dracula
https://<preview-url>/api/mood?user=eltobsjr
```

- [ ] **Step 6: Deploy production**

```bash
vercel --prod
```

- [ ] **Step 7: Adicionar cards ao README do perfil GitHub**

No README do repo `eltobsjr/eltobsjr`:
```markdown
![Stats](https://github-stats.vercel.app/api/stats?user=eltobsjr&theme=dark)
![Langs](https://github-stats.vercel.app/api/langs?user=eltobsjr&theme=dark)
![Repos](https://github-stats.vercel.app/api/repos?user=eltobsjr&theme=dark)
![Heatmap](https://github-stats.vercel.app/api/heatmap?user=eltobsjr&theme=dark)
![Streak](https://github-stats.vercel.app/api/streak?user=eltobsjr&theme=dark)
![Hours](https://github-stats.vercel.app/api/hours?user=eltobsjr&theme=dark)
![Mood](https://github-stats.vercel.app/api/mood?user=eltobsjr&theme=dark)
![DNA](https://github-stats.vercel.app/api/dna?user=eltobsjr&theme=dark)
![RPG](https://github-stats.vercel.app/api/rpg?user=eltobsjr&theme=dark)
![Nocturnal](https://github-stats.vercel.app/api/nocturnal?user=eltobsjr&theme=dark)
![Graveyard](https://github-stats.vercel.app/api/graveyard?user=eltobsjr&theme=dark)
```

- [ ] **Step 8: Commit final**

```bash
git add .
git commit -m "feat: initial release — 11 svg cards deployed"
```
