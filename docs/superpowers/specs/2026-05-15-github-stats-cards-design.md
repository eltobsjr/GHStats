# GitHub Stats Cards — Design Spec

**Data:** 2026-05-15
**Stack:** Node.js + Vercel Serverless Functions
**Output:** SVG embeddável em README do GitHub

---

## Objetivo

API que gera cards SVG com estatísticas do GitHub de qualquer usuário público.
Cada card é uma URL independente que retorna `image/svg+xml`.

Uso no README:
```markdown
![stats](https://seu-app.vercel.app/api/stats?user=eltobsjr&theme=dark)
```

---

## Cards

### Grupo 1 — Essenciais

| Card | Rota | Descrição |
|---|---|---|
| Stats gerais | `/api/stats` | Stars totais, commits, PRs, issues, seguidores |
| Linguagens | `/api/langs` | Top linguagens com barras de % |
| Top repos | `/api/repos` | Repos com mais stars |
| Heatmap anual | `/api/heatmap` | Calendário de contribuições do ano |

### Grupo 2 — Diferenciais

| Card | Rota | Descrição |
|---|---|---|
| Streak | `/api/streak` | Sequência atual e maior sequência de commits |
| Heatmap de horários | `/api/hours` | Commits por hora e dia da semana |
| Mood detector | `/api/mood` | Análise de palavras nas mensagens de commit |
| Developer DNA | `/api/dna` | Perfil: backend/frontend/infra/AI/etc. |
| Coding RPG | `/api/rpg` | Level e XP baseados em atividade |
| Night Owl | `/api/nocturnal` | Commits após meia-noite, sessão mais longa |
| Graveyard | `/api/graveyard` | Repos abandonados vs ativos |

---

## Arquitetura

```
github-stats/
├── api/
│   ├── stats.js
│   ├── langs.js
│   ├── repos.js
│   ├── heatmap.js
│   ├── streak.js
│   ├── hours.js
│   ├── mood.js
│   ├── dna.js
│   ├── rpg.js
│   ├── nocturnal.js
│   └── graveyard.js
├── lib/
│   ├── github.js     # wrapper da GitHub API (REST + GraphQL)
│   ├── themes.js     # definição dos temas
│   └── svg.js        # helpers de renderização SVG
├── vercel.json
└── package.json
```

### Fluxo por request

```
README img tag
    → GET /api/<card>?user=:user&theme=:theme
    → api/<card>.js valida params
    → chama github.js para buscar dados
    → monta SVG com svg.js + themes.js
    → retorna image/svg+xml (Cache-Control: s-maxage=3600)
```

---

## Query Parameters

| Parâmetro | Obrigatório | Valores | Default |
|---|---|---|---|
| `user` | Sim | qualquer username GitHub | — |
| `theme` | Não | `dark`, `light`, `dracula`, `radical`, `tokyonight` | `dark` |

---

## Fontes de dados

| Card | Endpoints | Token obrigatório? |
|---|---|---|
| `stats` | `GET /users/:user` + GraphQL `contributionsCollection` | Não (commits precisos com token) |
| `langs` | `GET /users/:user/repos` + `/repos/:u/:r/languages` | Não (mais repos com token) |
| `repos` | `GET /users/:user/repos?sort=stargazers_count` | Não |
| `heatmap` | Scraping de `github.com/users/:user/contributions` | Não |
| `streak` | GraphQL `contributionsCollection.contributionCalendar` | Sim |
| `hours` | GraphQL `commitContributionsByRepository` + timestamps | Sim |
| `mood` | `GET /repos/:u/:r/commits` (mensagens) | Não |
| `dna` | Linguagens + topics dos repos | Não |
| `rpg` | Agregação de commits, stars, PRs, issues | Não |
| `nocturnal` | Timestamps dos commits | Sim |
| `graveyard` | `pushed_at` de todos os repos | Não |

### Autenticação

Token pessoal (`PAT`) configurado como variável de ambiente `GITHUB_TOKEN` no Vercel.
Opcional — aumenta rate limit de 60 para 5000 req/h e habilita cards que dependem de GraphQL autenticado.

```js
// lib/github.js
const headers = {
  'Accept': 'application/vnd.github+json',
  ...(process.env.GITHUB_TOKEN && {
    'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`
  })
}
```

---

## Temas

Cinco temas iniciais, cada um com as seguintes propriedades:

```js
{
  bg: string,          // cor de fundo
  border: string,      // cor da borda
  title: string,       // cor do título
  text: string,        // cor do texto principal
  subtext: string,     // cor do texto secundário
  accent: string,      // cor de destaque (barras, ícones)
  accent2: string,     // cor de destaque secundária
}
```

| Tema | Inspiração |
|---|---|
| `dark` | GitHub dark mode |
| `light` | GitHub light mode |
| `dracula` | Dracula theme |
| `radical` | Rosa/roxo neon |
| `tokyonight` | Tokyo Night VS Code |

---

## Cache

Header `Cache-Control: s-maxage=3600, stale-while-revalidate=1800` em todos os cards.
A Vercel armazena na edge — reduz chamadas à API do GitHub e melhora latência.

---

## Error handling

| Situação | Resposta |
|---|---|
| `user` ausente | SVG: "Usage: /api/stats?user=YOUR_USERNAME" |
| Usuário não encontrado (404) | SVG de erro estilizado no tema solicitado |
| Rate limit atingido (403) | SVG: "Rate limit reached. Add GITHUB_TOKEN." |
| Card requer token ausente | SVG parcial com banner "Add GITHUB_TOKEN for full data" |
| Timeout (>10s) | SVG de erro genérico |

Todos os erros retornam SVG válido — o README nunca quebra.

---

## Degradação sem token

Cards que dependem de GraphQL autenticado (`streak`, `hours`, `nocturnal`) não falham — exibem dados parciais ou mensagem de instrução dentro do próprio SVG.

---

## Fora do escopo

- Dashboard web interativo
- Visualizações 3D (Three.js/WebGL)
- Suporte a GitLab/Bitbucket
- Autenticação de usuários
- Banco de dados / persistência
- Streaming / websockets
