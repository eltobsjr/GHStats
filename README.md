# GHStats

Cards SVG com estatísticas do GitHub para usar no seu README. Basta copiar a URL com o seu username.

## Uso

```markdown
![Card](https://gh-stats-ruddy.vercel.app/api/stats?user=SEU_USERNAME&theme=dark)
```

**Temas disponíveis:** `dark` · `light` · `dracula` · `radical` · `tokyonight`

---

## Cards

### Top Linguagens
![Langs](https://gh-stats-ruddy.vercel.app/api/langs?user=eltobsjr&theme=dark)

```markdown
![Langs](https://gh-stats-ruddy.vercel.app/api/langs?user=SEU_USERNAME&theme=dark)
```

---

### Stats Gerais
![Stats](https://gh-stats-ruddy.vercel.app/api/stats?user=eltobsjr&theme=dark)

```markdown
![Stats](https://gh-stats-ruddy.vercel.app/api/stats?user=SEU_USERNAME&theme=dark)
```

---

### Top Repositórios
![Repos](https://gh-stats-ruddy.vercel.app/api/repos?user=eltobsjr&theme=dark)

```markdown
![Repos](https://gh-stats-ruddy.vercel.app/api/repos?user=SEU_USERNAME&theme=dark)
```

---

### Heatmap de Contribuições
![Heatmap](https://gh-stats-ruddy.vercel.app/api/heatmap?user=eltobsjr&theme=dark)

```markdown
![Heatmap](https://gh-stats-ruddy.vercel.app/api/heatmap?user=SEU_USERNAME&theme=dark)
```

---

### Streak de Commits
> Requer `GITHUB_TOKEN`

![Streak](https://gh-stats-ruddy.vercel.app/api/streak?user=eltobsjr&theme=dark)

```markdown
![Streak](https://gh-stats-ruddy.vercel.app/api/streak?user=SEU_USERNAME&theme=dark)
```

---

### Horários de Código
> Requer `GITHUB_TOKEN`

![Hours](https://gh-stats-ruddy.vercel.app/api/hours?user=eltobsjr&theme=dark)

```markdown
![Hours](https://gh-stats-ruddy.vercel.app/api/hours?user=SEU_USERNAME&theme=dark)
```

---

### Mood dos Commits
![Mood](https://gh-stats-ruddy.vercel.app/api/mood?user=eltobsjr&theme=dark)

```markdown
![Mood](https://gh-stats-ruddy.vercel.app/api/mood?user=SEU_USERNAME&theme=dark)
```

---

### Developer DNA
![DNA](https://gh-stats-ruddy.vercel.app/api/dna?user=eltobsjr&theme=dark)

```markdown
![DNA](https://gh-stats-ruddy.vercel.app/api/dna?user=SEU_USERNAME&theme=dark)
```

---

### Coding RPG
![RPG](https://gh-stats-ruddy.vercel.app/api/rpg?user=eltobsjr&theme=dark)

```markdown
![RPG](https://gh-stats-ruddy.vercel.app/api/rpg?user=SEU_USERNAME&theme=dark)
```

---

### Night Owl Stats
> Requer `GITHUB_TOKEN`

![Night Owl](https://gh-stats-ruddy.vercel.app/api/nocturnal?user=eltobsjr&theme=dark)

```markdown
![Night Owl](https://gh-stats-ruddy.vercel.app/api/nocturnal?user=SEU_USERNAME&theme=dark)
```

---

### Project Graveyard
![Graveyard](https://gh-stats-ruddy.vercel.app/api/graveyard?user=eltobsjr&theme=dark)

```markdown
![Graveyard](https://gh-stats-ruddy.vercel.app/api/graveyard?user=SEU_USERNAME&theme=dark)
```

---

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/eltobsjr/github-stats)

Após o deploy, adicione a variável de ambiente opcional:

| Variável | Descrição |
|---|---|
| `GITHUB_TOKEN` | Personal Access Token do GitHub. Aumenta o rate limit de 60 para 5.000 req/h e habilita os cards de Streak, Hours e Night Owl. |

## Parâmetros

| Parâmetro | Obrigatório | Exemplo |
|---|---|---|
| `user` | Sim | `?user=eltobsjr` |
| `theme` | Não | `&theme=dracula` |
