# SVG Cards Redesign Spec

**Data:** 2026-05-15
**Escopo:** Redesign visual de todos os 11 cards SVG

---

## Objetivo

Modernizar o visual de todos os cards sem alterar lógica de dados ou APIs. Melhorar hierarquia tipográfica, legibilidade dos números e consistência visual entre cards.

---

## Design System

### Mudanças globais (`lib/svg.js`)

| Propriedade | Antes | Depois |
|---|---|---|
| `rx` do card | `4.5` | `14` |
| Título `font-size` | `17` | `15` |
| Título `font-weight` | `600` | `700` |
| Título `fill` | `theme.title` | `#ffffff` |
| Título `y` | `35` | `30` |
| Borda `stroke-width` | `1` | `1` |

### Novos elementos visuais

**Faixa gradiente no topo** (todos os cards):
```svg
<rect x="0" y="0" width="495" height="3" rx="1.5"
  fill="url(#topGradient)"/>
<!-- topGradient: #58a6ff (0%) → #3fb950 (100%), horizontal -->
```

**Chip de conteúdo:**
```svg
<rect x="X" y="Y" width="W" height="H" rx="8" fill="#161b22"/>
```

**Dot colorido** (para listas):
```svg
<circle cx="CX" cy="CY" r="5" fill="COLOR"/>
```

**Barra com gradiente individual:**
- `height: 16px`, `rx: 4`
- Fill: gradiente horizontal da cor da categoria (0%) → versão 20% mais escura (100%)
- Fundo vazio: `#161b22`, mesma altura e rx

**Números:** todos com `.toLocaleString('en-US')` para separador de milhar (1247 → 1,247)

---

## Cards por tipo

### Tipo 1 — Grade de chips (Stats)

**`/api/stats`** — largura 495, altura 195

Layout: grade 2×2. Cada chip ocupa ~220×58px com 12px de gap.

```
┌─────────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ ← faixa gradiente 3px
│                                                     │
│  eltobsjr's GitHub Stats                           │ ← y=30 white bold
│                                                     │
│  ┌──────────────────────┐  ┌──────────────────────┐ │
│  │ STARS                │  │ COMMITS (ANO)         │ │ ← label 10px uppercase subtext
│  │ 1,247                │  │ 843                   │ │ ← valor 22px bold accent
│  └──────────────────────┘  └──────────────────────┘ │
│                                                     │
│  ┌──────────────────────┐  ┌──────────────────────┐ │
│  │ SEGUIDORES           │  │ REPOS PÚBLICOS        │ │
│  │ 312                  │  │ 58                    │ │
│  └──────────────────────┘  └──────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Cores dos valores por stat:
- Stars → `theme.accent` (#58a6ff no dark)
- Commits → `theme.accent2` (#3fb950 no dark)
- Followers → `#d2a8ff`
- Repos → `#e3b341`

---

### Tipo 2 — Barras com dot (`/api/langs`, `/api/dna`, `/api/mood`, `/api/graveyard`)

Estrutura por linha:
```
[dot r=5] [nome 12px]    [══════════░░░░░░░░░░░░░░░░░░░] [XX%]
  x=32     x=44          x=160 bar   fill=#161b22 vazio   x=418 end
```

- Dot `cx=32`, linha centralizada no dot
- Nome: `x=44`, `size=12`, `fill=theme.text`
- Barra cheia: `x=160`, `height=16`, `rx=4`, `fill=cor_da_categoria` (cor sólida, sem gradiente)
- Barra vazia: `x=160+w`, `height=16`, `rx=4`, `fill=#161b22`
- Porcentagem: `x=418`, `anchor=end`, `size=11`, `fill=theme.subtext`
- Espaçamento entre linhas: `29px`

**Barra arco-íris no rodapé** (resume proporção de todas as categorias):
- y = altura_conteudo - 14
- Segmentos proporcionais em sequência, `height=8`, `rx=4` nas extremidades

**Langs:** cores por linguagem definidas em `lib/themes.js` (`langColors`):
```js
JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
Go: '#00ADD8', Rust: '#dea584', Ruby: '#701516',
CSS: '#563d7c', HTML: '#e34c26', Shell: '#89e051',
Java: '#b07219', C: '#555555', 'C++': '#f34b7d',
// fallback: theme.accent
```

**DNA:** usa `CATEGORY_COLORS` existente (backend=#3fb950, frontend=#58a6ff, etc.)

**Mood:** usa `COLORS` existente (feat=#3fb950, fix=#f78166, etc.)

**Graveyard:** Active=#3fb950, Dormant=theme.accent, Dead=#f78166

---

### Tipo 3 — Três chips horizontais (`/api/streak`, `/api/nocturnal`, `/api/rpg`)

3 chips de 140×120px lado a lado com 11px gap. Layout: `x=22`, `x=173`, `x=324`, `width=140`, `height=120`. Card height=185.

```
┌─────────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│  GitHub Streak                                      │
│                                                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐    │
│  │░░░░░░░░░░░░│  │░░░░░░░░░░░░│  │░░░░░░░░░░░░│    │ ← borda top 4px colorida
│  │            │  │            │  │            │    │
│  │     42     │  │     67     │  │   1,247    │    │ ← valor 36px bold
│  │            │  │            │  │            │    │
│  │STREAK ATUAL│  │MAIOR STREAK│  │   TOTAL    │    │ ← label 10px uppercase
│  │    dias    │  │    dias    │  │contribuições│   │ ← sublabel 10px subtext
│  └────────────┘  └────────────┘  └────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Cada chip tem `rect` de borda colorida no topo (4px, `rx=2`).

**Streak** — chips:
1. Streak atual → `theme.accent`
2. Maior streak → `theme.accent2`
3. Total contribuições → `#d2a8ff`

**Nocturnal** — chips:
1. Commits noturnos → `theme.accent`
2. Hora peak (ex: "11pm") → `theme.accent2`
3. Sessão mais longa (ex: "2h 40m") → `#e3b341`

**RPG** — chips:
1. Level (número 36px bold) → `theme.accent`
2. Classe (ex: "Web Architect", 14px, quebra em duas linhas se longo) → `#d2a8ff`
3. XP: valor `xp.toLocaleString()` em 18px bold + barra de progresso `width=110`, `height=8`, `rx=4` — fill=`theme.accent2`, bg=`#21262d` — label "% to next level" abaixo

---

### Tipo 4 — Grid (Horas) — `/api/hours`

Mantém a grade de células existente. Melhorias:
- Aplica faixa gradiente no topo
- `rx=14` no frame
- Labels de dia: `size=11` (de 10), melhor espaçamento
- Labels de hora: `size=10` (de 9)
- Células: `width=16`, `height=16`, `rx=3`

---

### Tipo 5 — Heatmap — `/api/heatmap`

Mantém lógica de scraping e recoloração. Melhorias:
- `rx=14` no frame
- Faixa gradiente no topo
- Título reposicionado para `y=28`

---

### Tipo 6 — Lista de repos — `/api/repos`

Cada repo em chip com borda lateral esquerda colorida (4px):

```
┌───────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│  Top Repositories                                 │
│                                                   │
│  ▌ github-stats          ★ 124   ⑂ 8   TypeScript │ ← chip com left border accent
│  ▌ my-portfolio          ★ 87    ⑂ 14  JavaScript  │
│  ▌ dotfiles              ★ 42    ⑂ 3   Shell       │
│  ...                                              │
└───────────────────────────────────────────────────┘
```

- Cada linha em rect `height=30`, `rx=6`, `fill=#161b22`
- Borda esquerda `width=3`, `height=30`, `rx=1.5`, `fill=theme.accent`
- Nome: `fill=theme.accent`, `size=13`, `weight=600`
- Stars/Forks: `fill=theme.subtext`, `size=12`
- Linguagem: `fill=theme.text`, `size=12`
- Espaçamento entre linhas: `38px`

---

## Alterações de código necessárias

### `lib/svg.js`

1. Adicionar `<defs>` com gradiente `topGradient` dentro do `card()`
2. Adicionar faixa gradiente no card base
3. Atualizar `rx`, posição e estilo do título
4. Adicionar helpers: `chip()`, `dot()`, `gradientBar()`, `rainbowBar()`
5. Adicionar mapeamento `langColors` em `lib/themes.js`

### Por card

| Arquivo | Mudança principal |
|---|---|
| `api/stats.js` | `renderCard` → grade 2×2 de chips com cores por stat |
| `api/langs.js` | `renderCard` → dot + barra gradiente + rainbow bar; usar `langColors` |
| `api/repos.js` | `renderCard` → chip por repo com left border |
| `api/heatmap.js` | `renderCard` → só melhora frame (rx, gradiente) |
| `api/streak.js` | `renderCard` → 3 chips horizontais |
| `api/hours.js` | `renderCard` → melhora frame e labels |
| `api/mood.js` | `renderCard` → dot + barra gradiente + rainbow bar |
| `api/dna.js` | `renderCard` → dot + barra gradiente + rainbow bar |
| `api/rpg.js` | `renderCard` → 3 chips (level, classe, XP bar) |
| `api/nocturnal.js` | `renderCard` → 3 chips horizontais |
| `api/graveyard.js` | `renderCard` → dot + barra gradiente |

---

## Fora do escopo

- Alterar lógica de fetch de dados
- Alterar rotas, parâmetros ou cache headers
- Adicionar animações SVG
- Alterar temas existentes (apenas o visual dos componentes muda)
- Criar novos temas
