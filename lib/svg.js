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

function chip({ x, y, width, height }, theme) {
  const rx = theme?.chipRx ?? 8
  const fill = theme?.chip || '#161b22'
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${rx}" fill="${fill}"/>`
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

function card({ width = 495, height = 195, theme, title, body, badge }) {
  const byline = `<text x="${width - 10}" y="${height - 8}" font-family="'Segoe UI',Ubuntu,sans-serif" font-size="8" fill="${theme.subtext}" text-anchor="end" opacity="0.45">made by: eltobsjr on github</text>`
  const badgeEl = badge && badge.lang
    ? `<text x="${width - 10}" y="30" font-family="'Segoe UI',Ubuntu,sans-serif" font-size="10" font-weight="600" fill="${badge.color}" text-anchor="end">&#x25CF; ${escape(badge.lang)}</text>`
    : ''

  if (theme.isPixel) {
    const b = theme.border
    const scanlines = `<defs>
      <pattern id="sl" x="0" y="0" width="${width}" height="3" patternUnits="userSpaceOnUse">
        <rect x="0" y="0" width="${width}" height="1" fill="#000000" opacity="0.10"/>
      </pattern>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#sl)"/>`
    const border = [
      `<rect x="0" y="0" width="${width}" height="2" fill="${b}"/>`,
      `<rect x="0" y="${height - 2}" width="${width}" height="2" fill="${b}"/>`,
      `<rect x="0" y="0" width="2" height="${height}" fill="${b}"/>`,
      `<rect x="${width - 2}" y="0" width="2" height="${height}" fill="${b}"/>`,
      `<rect x="2" y="2" width="4" height="4" fill="${b}" opacity="0.5"/>`,
      `<rect x="${width - 6}" y="2" width="4" height="4" fill="${b}" opacity="0.5"/>`,
      `<rect x="2" y="${height - 6}" width="4" height="4" fill="${b}" opacity="0.5"/>`,
      `<rect x="${width - 6}" y="${height - 6}" width="4" height="4" fill="${b}" opacity="0.5"/>`,
    ].join('\n')
    const pixelTitle = `<text x="18" y="28" font-family="'Courier New',Courier,monospace" font-size="13" font-weight="700" fill="${theme.accent}" letter-spacing="1">&#x25B6; ${escape(title.toUpperCase())}</text>`
    const pixelBadge = badge && badge.lang
      ? `<text x="${width - 12}" y="28" font-family="'Courier New',Courier,monospace" font-size="10" font-weight="600" fill="${badge.color}" text-anchor="end">&#x25CF; ${escape(badge.lang)}</text>`
      : ''
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${theme.bg}"/>
  ${scanlines}
  ${border}
  ${pixelTitle}
  ${pixelBadge}
  ${body}
  ${byline}
</svg>`
  }

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
  ${badgeEl}
  ${body}
  ${byline}
</svg>`
}

function donut({ cx, cy, outerR, innerR, segments, gapDeg = 1.5 }) {
  const gapRad = (gapDeg * Math.PI) / 180
  const total = segments.reduce((s, sg) => s + sg.pct, 0) || 1
  const f = (v) => v.toFixed(2)
  let angle = -Math.PI / 2
  return segments.map(seg => {
    const sliceFrac = seg.pct / total
    const sweep = Math.max(0.001, sliceFrac * 2 * Math.PI - gapRad)
    const startA = angle + gapRad / 2
    const endA = startA + sweep
    angle += sliceFrac * 2 * Math.PI
    const large = sweep > Math.PI ? 1 : 0
    const d = [
      `M ${f(cx + outerR * Math.cos(startA))} ${f(cy + outerR * Math.sin(startA))}`,
      `A ${outerR} ${outerR} 0 ${large} 1 ${f(cx + outerR * Math.cos(endA))} ${f(cy + outerR * Math.sin(endA))}`,
      `L ${f(cx + innerR * Math.cos(endA))} ${f(cy + innerR * Math.sin(endA))}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${f(cx + innerR * Math.cos(startA))} ${f(cy + innerR * Math.sin(startA))}`,
      'Z',
    ].join(' ')
    return `<path d="${d}" fill="${seg.color}"/>`
  }).join('\n')
}

function areaLine({ points, chartY, chartH, fill, stroke }) {
  if (points.length < 2) return ''
  const n = points.length
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
  const area = `${line} L ${points[n - 1].x.toFixed(2)} ${(chartY + chartH).toFixed(2)} L ${points[0].x.toFixed(2)} ${(chartY + chartH).toFixed(2)} Z`
  const dots = points.map(p => `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="3.5" fill="${stroke}"/>`)
  return [
    `<path d="${area}" fill="${fill}" opacity="0.15"/>`,
    `<path d="${line}" fill="none" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`,
    ...dots,
  ].join('\n')
}

function errorCard(message, theme) {
  return card({
    theme,
    title: 'GitHub Stats',
    body: text({ x: 25, y: 90, content: message, fill: theme.subtext }),
  })
}

module.exports = { card, text, bar, chip, dot, rainbowBar, donut, areaLine, escape, errorCard }
