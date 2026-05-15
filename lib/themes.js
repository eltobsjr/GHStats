const themes = {
  dark: {
    bg: '#0d1117', border: '#30363d', title: '#58a6ff',
    text: '#c9d1d9', subtext: '#8b949e', accent: '#58a6ff', accent2: '#3fb950',
    chip: '#161b22', chipRx: 8,
  },
  light: {
    bg: '#ffffff', border: '#d0d7de', title: '#0969da',
    text: '#24292f', subtext: '#57606a', accent: '#0969da', accent2: '#2da44e',
    chip: '#f6f8fa', chipRx: 8,
  },
  dracula: {
    bg: '#282a36', border: '#44475a', title: '#bd93f9',
    text: '#f8f8f2', subtext: '#6272a4', accent: '#bd93f9', accent2: '#50fa7b',
    chip: '#1e1f29', chipRx: 8,
  },
  radical: {
    bg: '#141321', border: '#fe428e', title: '#fe428e',
    text: '#a9fef7', subtext: '#f8d847', accent: '#fe428e', accent2: '#f8d847',
    chip: '#1c1a2e', chipRx: 8,
  },
  tokyonight: {
    bg: '#1a1b27', border: '#414868', title: '#70a5fd',
    text: '#c0caf5', subtext: '#787c99', accent: '#70a5fd', accent2: '#73daca',
    chip: '#1f2335', chipRx: 8,
  },
  pixel: {
    bg: '#0c0c1e', border: '#4466ff', title: '#ffffff',
    text: '#e2e8f0', subtext: '#8892b0', accent: '#ffdd44', accent2: '#44ffaa',
    chip: '#12122e', chipRx: 0,
    isPixel: true,
  },
}

const langColors = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#701516',
  CSS: '#563d7c',
  HTML: '#e34c26',
  Shell: '#89e051',
  Java: '#b07219',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  Kotlin: '#A97BFF',
  Swift: '#F05138',
  PHP: '#4F5D95',
  Scala: '#c22d40',
  Dart: '#00B4AB',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Elixir: '#6e4a7e',
}

function getTheme(name = 'dark') {
  return themes[name] ?? themes.dark
}

module.exports = { getTheme, themes, langColors }
