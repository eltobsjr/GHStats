const fs = require('fs')
const { getTheme } = require('./lib/themes')

const dark    = getTheme('dark')
const light   = getTheme('light')
const dracula = getTheme('dracula')
const radical = getTheme('radical')
const tokyo   = getTheme('tokyonight')
const pixel   = getTheme('pixel')

// --- mock data ---
const mockStats = { name: 'eltobsjr', totalStars: 1247, totalCommits: 843, followers: 312, totalRepos: 58, topLang: 'TypeScript' }

const mockLangs = [
  { name: 'TypeScript', bytes: 45000, pct: 41.5 },
  { name: 'Python',     bytes: 28000, pct: 25.8 },
  { name: 'Go',         bytes: 18000, pct: 16.6 },
  { name: 'Shell',      bytes: 10000, pct: 9.2  },
  { name: 'CSS',        bytes: 5000,  pct: 4.6  },
  { name: 'HTML',       bytes: 2700,  pct: 2.3  },
]

const mockRepos = [
  { name: 'github-stats',   stargazers_count: 312, forks_count: 48, language: 'TypeScript' },
  { name: 'my-portfolio',   stargazers_count: 187, forks_count: 23, language: 'JavaScript' },
  { name: 'dotfiles',       stargazers_count: 94,  forks_count: 12, language: 'Shell'      },
  { name: 'advent-of-code', stargazers_count: 56,  forks_count: 7,  language: 'Python'     },
  { name: 'blog-engine',    stargazers_count: 42,  forks_count: 5,  language: 'Go'         },
  { name: 'snippets',       stargazers_count: 28,  forks_count: 3,  language: 'TypeScript' },
]

const mockStreak = { currentStreak: 42, longestStreak: 97, totalContributions: 1843, hasToken: true }

const mockHours = {
  hasToken: true,
  grid: (() => {
    const g = Array(7).fill(null).map(() => Array(24).fill(0))
    // Simulate typical dev activity patterns
    for (let day = 1; day <= 5; day++) {
      for (let h = 9; h <= 18; h++) g[day][h] = Math.floor(Math.random() * 8 + 1)
    }
    g[6][22] = 5; g[6][23] = 8; g[0][1] = 3
    return g
  })(),
}

const mockMood = {
  counts: { feat: 48, fix: 31, refactor: 22, docs: 15, chaos: 8, wip: 6 },
  total: 130,
}

const mockDna = { frontend: 42, backend: 35, infra: 12, data: 8, systems: 3 }

const mockRpgMage      = { xp: 820,   level: 2,  xpForNext: 900,   className: 'Type Wizard',     topLang: 'TypeScript' }
const mockRpgEngineer  = { xp: 4820,  level: 6,  xpForNext: 4900,  className: 'Goroutine Monk',  topLang: 'Go'         }
const mockRpgWarrior   = { xp: 12400, level: 11, xpForNext: 14400, className: 'Borrow Keeper',   topLang: 'Rust'       }
const mockRpgSamurai   = { xp: 45000, level: 21, xpForNext: 48400, className: 'Swift Blade',     topLang: 'Swift'      }
const mockRpgRogue     = { xp: 72000, level: 30, xpForNext: 96100, className: 'Shadow Operator', topLang: 'Python'     }
const mockRpgAlchemist = { xp: 9800,  level: 9,  xpForNext: 10000, className: 'Data Alchemist',  topLang: 'Python'     }

const mockNocturnal = { nightCommits: 234, mostActiveHour: 23, longestSessionMs: 4 * 3600000 + 20 * 60000, hasToken: true }

const mockGraveyard = { active: ['github-stats', 'blog'], dormant: ['old-api', 'scripts'], dead: ['todo-app', 'calc', 'weather-bot', 'rss-reader', 'cli-tools'] }

const mockActivity = {
  hasToken: true,
  total: 843,
  months: [
    { year: 2024, month: 5,  count: 45  },
    { year: 2024, month: 6,  count: 78  },
    { year: 2024, month: 7,  count: 92  },
    { year: 2024, month: 8,  count: 67  },
    { year: 2024, month: 9,  count: 110 },
    { year: 2024, month: 10, count: 88  },
    { year: 2024, month: 11, count: 134 },
    { year: 2025, month: 0,  count: 72  },
    { year: 2025, month: 1,  count: 56  },
    { year: 2025, month: 2,  count: 98  },
    { year: 2025, month: 3,  count: 143 },
    { year: 2025, month: 4,  count: 60  },
  ],
}

// heatmap uses scraped SVG — skip with a placeholder
const mockHeatmapSvg = `<svg width="722" height="112" viewBox="0 0 722 112" xmlns="http://www.w3.org/2000/svg">
  ${Array(52).fill(0).map((_, w) =>
    Array(7).fill(0).map((_, d) => {
      const count = Math.random() > 0.4 ? Math.floor(Math.random() * 8) : 0
      const opacity = count === 0 ? 0 : 0.2 + 0.8 * (count / 8)
      return `<rect x="${w * 14}" y="${d * 14 + 2}" width="12" height="12" rx="2" fill="#216e39" opacity="${opacity.toFixed(2)}"/>`
    }).join('')
  ).join('')}
</svg>`

// --- render ---
const { renderCard: renderStats }     = require('./api/stats')
const { renderCard: renderLangs }     = require('./api/langs')
const { renderCard: renderRepos }     = require('./api/repos')
const { renderCard: renderStreak }    = require('./api/streak')
const { renderCard: renderHours }     = require('./api/hours')
const { renderCard: renderMood }      = require('./api/mood')
const { renderCard: renderDna }       = require('./api/dna')
const { renderCard: renderRpg }       = require('./api/rpg')
const { renderCard: renderNocturnal } = require('./api/nocturnal')
const { renderCard: renderGraveyard } = require('./api/graveyard')
const { renderCard: renderHeatmap }   = require('./api/heatmap')
const { renderCard: renderActivity }  = require('./api/activity')

const themes = [
  { name: 'dark',       theme: dark    },
  { name: 'light',      theme: light   },
  { name: 'dracula',    theme: dracula },
  { name: 'radical',    theme: radical },
  { name: 'tokyonight', theme: tokyo   },
  { name: 'pixel',      theme: pixel   },
]

function renderAll(theme) {
  return [
    { title: 'Stats',      svg: renderStats(mockStats, theme)         },
    { title: 'Languages',  svg: renderLangs(mockLangs, theme)         },
    { title: 'Repos',      svg: renderRepos(mockRepos, theme)         },
    { title: 'Streak',     svg: renderStreak(mockStreak, theme)       },
    { title: 'Hours',      svg: renderHours(mockHours, theme)         },
    { title: 'Mood',       svg: renderMood(mockMood, theme)           },
    { title: 'DNA',        svg: renderDna(mockDna, theme)             },
    { title: 'RPG — Mage (lv2)',       svg: renderRpg(mockRpgMage,      theme) },
    { title: 'RPG — Engineer (lv6)',   svg: renderRpg(mockRpgEngineer,  theme) },
    { title: 'RPG — Warrior (lv11)',   svg: renderRpg(mockRpgWarrior,   theme) },
    { title: 'RPG — Samurai (lv21)',   svg: renderRpg(mockRpgSamurai,   theme) },
    { title: 'RPG — Rogue (lv30)',     svg: renderRpg(mockRpgRogue,     theme) },
    { title: 'RPG — Alchemist (lv9)',  svg: renderRpg(mockRpgAlchemist, theme) },
    { title: 'Night Owl',  svg: renderNocturnal(mockNocturnal, theme) },
    { title: 'Graveyard',  svg: renderGraveyard(mockGraveyard, theme) },
    { title: 'Heatmap',    svg: renderHeatmap(mockHeatmapSvg, theme)     },
    { title: 'Activity',   svg: renderActivity(mockActivity, theme)      },
  ]
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>GitHub Stats — Card Preview</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #090d14; font-family: 'Segoe UI', Ubuntu, sans-serif; color: #c9d1d9; padding: 40px 24px; }
  h1 { font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 8px; }
  .meta { font-size: 13px; color: #484f58; margin-bottom: 40px; }
  .theme-section { margin-bottom: 56px; }
  .theme-title {
    display: inline-block;
    font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em;
    color: #8b949e; border: 1px solid #30363d; border-radius: 6px;
    padding: 4px 12px; margin-bottom: 20px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, 495px);
    gap: 20px;
  }
  .card-wrap { display: flex; flex-direction: column; gap: 6px; }
  .card-label { font-size: 11px; color: #484f58; text-transform: uppercase; letter-spacing: .06em; }
  svg { display: block; max-width: 100%; border-radius: 14px; }
  .divider { border: none; border-top: 1px solid #21262d; margin: 0 0 40px; }
</style>
</head>
<body>
<h1>GitHub Stats — Card Preview</h1>
<p class="meta">Todos os 13 cards com dados mock — 5 temas</p>

${themes.map(({ name, theme }) => `
<section class="theme-section">
  <div class="theme-title">${name}</div>
  <div class="grid">
    ${renderAll(theme).map(({ title, svg }) => `
    <div class="card-wrap">
      <span class="card-label">${title}</span>
      ${svg}
    </div>`).join('\n')}
  </div>
</section>
<hr class="divider"/>
`).join('')}

</body>
</html>`

fs.writeFileSync('preview.html', html)
console.log('preview.html gerado — abra no navegador')
