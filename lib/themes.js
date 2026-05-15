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
