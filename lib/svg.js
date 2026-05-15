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

function bar({ x, y, width, height, fill, rx = 4 }) {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${rx}" fill="${fill}"/>`
}

function chip({ x, y, width, height }) {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8" fill="#161b22"/>`
}

function dot({ cx, cy, r = 5, fill }) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`
}

function rainbowBar({ x, y, totalWidth, items, height = 8 }) {
  const total = items.reduce((s, i) => s + (i.pct || 0), 0) || 1
  let curX = x
  const segs = items.map(item => {
    const w = Math.max(1, Math.round((item.pct / total) * totalWidth))
    const seg = `<rect x="${curX}" y="${y}" width="${w}" height="${height}" fill="${item.color}" clip-path="url(#rb)"/>`
    curX += w
    return seg
  })
  return [
    `<defs><clipPath id="rb"><rect x="${x}" y="${y}" width="${totalWidth}" height="${height}" rx="${height / 2}"/></clipPath></defs>`,
    `<rect x="${x}" y="${y}" width="${totalWidth}" height="${height}" rx="${height / 2}" fill="#21262d"/>`,
    ...segs,
  ].join('\n')
}

function card({ width = 495, height = 195, theme, title, body }) {
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${theme.accent}"/>
      <stop offset="100%" stop-color="${theme.accent2}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" rx="14" fill="${theme.bg}" stroke="${theme.border}" stroke-width="1"/>
  <rect x="0" y="0" width="${width}" height="3" rx="1.5" fill="url(#tg)"/>
  ${text({ x: 25, y: 30, content: title, fill: '#ffffff', size: 15, weight: '700' })}
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

module.exports = { card, text, bar, chip, dot, rainbowBar, escape, errorCard }
