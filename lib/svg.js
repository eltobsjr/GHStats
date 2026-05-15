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
