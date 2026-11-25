/* By Lau — kit d'identité visuelle (monogramme calligraphique, sceau, logotype, supports imprimés). */
const NS = 'http://www.w3.org/2000/svg';
const BDX = '#5A0A17', CREAM = '#FBF7F4', BLUSH = '#F2E4E1';
const mk = (tag, attrs = {}, parent, text) => {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (text != null) e.textContent = text;
  if (parent) parent.appendChild(e);
  return e;
};
const uid = p => p + Math.random().toString(36).slice(2, 8);

// ---------- monogramme BL : tracé à la plume large (calligraphie) ----------
// Chaque trait est une ligne centrale ; la plume (segment incliné) balaie le trait :
// les pleins et les déliés apparaissent naturellement, comme un ruban.
const MONO_STROKES = [
  // L + fût commun : boucle d'attaque, fût, pied qui file en ruban
  'M 120 118 C 70 92, 96 30, 156 44 C 196 54, 192 104, 184 150 C 174 214, 160 282, 150 336 C 144 372, 176 390, 214 372 C 262 350, 300 336, 352 352 C 372 358, 380 372, 370 384',
  // B : panse haute, retour au fût, panse basse, sortie en boucle croisant le pied
  'M 186 92 C 250 52, 318 82, 296 140 C 282 176, 236 190, 192 192',
  'M 192 192 C 270 188, 334 226, 312 290 C 294 342, 220 356, 170 330 C 126 306, 98 330, 112 360',
];
function broadNib(parent, d, { nib = 26, angle = -38, thin = 2.2, fill = 'currentColor' } = {}) {
  const tmp = mk('path', { d, fill: 'none' }, parent);
  const L = tmp.getTotalLength();
  const a = angle * Math.PI / 180, nx = Math.cos(a) * nib / 2, ny = Math.sin(a) * nib / 2;
  const N = Math.ceil(L / 1.5);
  let prev = null, dd = '';
  for (let i = 0; i <= N; i++) {
    const tpos = i / N, p = tmp.getPointAtLength(tpos * L);
    // affinage des extrémités (attaque et sortie du trait)
    const taper = Math.min(1, tpos / .06, (1 - tpos) / .08);
    const k = .22 + .78 * Math.sqrt(Math.max(0, taper));
    const cur = [p.x - nx * k, p.y - ny * k, p.x + nx * k, p.y + ny * k];
    if (prev) dd += `M${prev[0].toFixed(1)} ${prev[1].toFixed(1)}L${cur[0].toFixed(1)} ${cur[1].toFixed(1)}L${cur[2].toFixed(1)} ${cur[3].toFixed(1)}L${prev[2].toFixed(1)} ${prev[3].toFixed(1)}Z`;
    prev = cur;
  }
  tmp.remove();
  // chaque petit quadrilatère = un coup de plume ; leur union forme le ruban
  mk('path', { d: dd, fill, stroke: fill, 'stroke-width': .6, 'stroke-linejoin': 'round' }, parent);
  mk('path', { d, fill: 'none', stroke: fill, 'stroke-width': thin, 'stroke-linecap': 'round' }, parent);
}
function monogram(parent, { x = 0, y = 0, size = 400, color = BDX } = {}) {
  const g = mk('g', { transform: `translate(${x - size / 2} ${y - size / 2}) scale(${size / 420})` }, parent);
  // le tracé est dessiné dans une boîte ~ 60..380 ; on le recentre
  const inner = mk('g', { transform: 'translate(-30 -2)' }, g);
  MONO_STROKES.forEach(d => broadNib(inner, d, { fill: color }));
  return g;
}

// ---------- texte sur ellipse ----------
function ellipsePath(cx, cy, rx, ry, startDeg = -90) {
  // ellipse complète démarrant à startDeg, sens horaire
  const a = startDeg * Math.PI / 180;
  const p = t => [cx + rx * Math.cos(a + t), cy + ry * Math.sin(a + t)];
  const [x0, y0] = p(0), [x1, y1] = p(Math.PI);
  return `M ${x0} ${y0} A ${rx} ${ry} 0 1 1 ${x1} ${y1} A ${rx} ${ry} 0 1 1 ${x0} ${y0}`;
}
function textOnPath(parent, d, txt, { size = 30, family = 'Cormorant', weight = 500, style = 'normal', spacing = 1, offset = '0%', anchor = 'start', color = BDX } = {}) {
  const id = uid('p');
  mk('path', { id, d, fill: 'none' }, parent);
  const t = mk('text', { 'font-family': family, 'font-size': size, 'font-weight': weight, 'font-style': style, 'letter-spacing': spacing, fill: color }, parent);
  mk('textPath', { href: '#' + id, startOffset: offset, 'text-anchor': anchor }, t, txt);
  return t;
}

// ---------- sceau ovale (comme le 2e modèle) ----------
function seal(parent, { x = 0, y = 0, w = 520, h = 760, color = '#fff', top = 'By Lau', left = 'bienvenue chez vous', right = 'élégance · qualité · confiance' } = {}) {
  const g = mk('g', { transform: `translate(${x} ${y})` }, parent);
  const rx = w / 2, ry = h / 2;
  monogram(g, { x: 0, y: h * .01, size: w * .92, color });
  // haut : nom en italique
  const d = ellipsePath(0, 0, rx, ry, 90); // départ en bas, sens horaire : gauche 25 %, haut 50 %, droite 75 %
  textOnPath(g, d, top, { size: w * .1, family: 'Cormorant', style: 'italic', weight: 500, offset: '50%', anchor: 'middle', color, spacing: 1 });
  textOnPath(g, d, left, { size: w * .062, family: 'Cormorant', weight: 500, offset: '25%', anchor: 'middle', color, spacing: 2 });
  textOnPath(g, d, right, { size: w * .062, family: 'Cormorant', weight: 500, offset: '75%', anchor: 'middle', color, spacing: 2 });
  // petits séparateurs
  const tp = mk('path', { d, fill: 'none' }, g), TL = tp.getTotalLength();
  [.395, .605, 0].forEach(f => { const q = tp.getPointAtLength(f * TL); mk('rect', { x: q.x - w * .014, y: q.y - .8, width: w * .028, height: 1.6, fill: color, transform: `rotate(${f === 0 ? 0 : f < .5 ? -50 : 50} ${q.x} ${q.y})` }, g); });
  return g;
}

// ---------- logotype "by Lau" ----------
function wordmark(parent, { x = 0, y = 0, size = 300, color = BDX, sub = 'ENTREPRISE', arc = 'bienvenue chez vous', line = 'rgba(90,10,23,.42)' } = {}) {
  const g = mk('g', {}, parent);
  const by = mk('text', { 'font-family': 'Cormorant', 'font-style': 'italic', 'font-weight': 300, 'font-size': size, fill: color, x: 150 * size / 330, y: 300 * size / 330 }, g, 'by');
  const lau = mk('text', { 'font-family': 'Bodoni', 'font-size': size, 'letter-spacing': -6 * size / 330, fill: color, x: 0, y: 560 * size / 330 }, g, 'Lau');
  const lb = lau.getBBox(), b2 = by.getBBox();
  const xr = lb.x + lb.width + 46 * size / 330, top = b2.y + 40 * size / 330, bottom = lb.y + lb.height - 8 * size / 330;
  mk('line', { x1: xr, y1: top, x2: xr, y2: bottom, stroke: line, 'stroke-width': 1.6 * size / 330 }, g);
  if (sub) {
    const vg = mk('g', { transform: `translate(${xr + 30 * size / 330} ${top}) rotate(90)` }, g);
    const ent = mk('text', { 'font-family': 'Josefin', 'font-weight': 300, 'font-size': 44 * size / 330, fill: color, x: 0, y: 0 }, vg, sub);
    const len = bottom - top, w0 = ent.getComputedTextLength();
    ent.setAttribute('letter-spacing', Math.max(2, (len - w0) / Math.max(1, sub.length - .4)));
  }
  if (arc) {
    const cx = b2.x + 95 * size / 330, cy = b2.y + b2.height * .5, r = b2.height * .6;
    const a0 = 185 * Math.PI / 180, a1 = 330 * Math.PI / 180;
    textOnPath(g, `M ${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)}`, arc,
      { size: 38 * size / 330, family: 'Josefin', weight: 300, spacing: 6 * size / 330, offset: '50%', anchor: 'middle', color });
  }
  const b = g.getBBox();
  g.setAttribute('transform', `translate(${x - (b.x + b.width / 2)} ${y - (b.y + b.height / 2)})`);
  return g;
}
function fitInto(g, cx, cy, maxW, maxH) {
  g.removeAttribute('transform');
  const b = g.getBBox(), s = Math.min(maxW / b.width, maxH / b.height);
  g.setAttribute('transform', `translate(${cx - (b.x + b.width / 2) * s} ${cy - (b.y + b.height / 2) * s}) scale(${s})`);
}

// ---------- fond luxe (satin + reflets + pétales) ----------
function rnd(i) { const x = Math.sin(i * 91.7 + 13.3) * 43758.5453; return x - Math.floor(x); }
function luxeBackground(parent, w, h, { dark = true, frame = true, petals = true, seed = 11 } = {}) {
  const defs = mk('defs', {}, parent), u = uid('x');
  const f = mk('filter', { id: 'satin' + u, x: 0, y: 0, width: '100%', height: '100%', 'color-interpolation-filters': 'sRGB' }, defs);
  const sc = Math.max(w, h) / 1350;
  mk('feTurbulence', { type: 'fractalNoise', baseFrequency: `${0.0011 / sc} ${0.0052 / sc}`, numOctaves: 3, seed, result: 'n' }, f);
  const li = mk('feDiffuseLighting', { in: 'n', surfaceScale: 34 * sc, diffuseConstant: 1.05, 'lighting-color': '#fff' }, f);
  mk('feDistantLight', { azimuth: 225, elevation: 42 }, li);
  mk('feGaussianBlur', { stdDeviation: 5 * sc }, f);
  mk('feColorMatrix', { type: 'matrix', values: dark ? '.62 0 0 0 .02  .05 0 0 0 0  .10 0 0 0 .02  0 0 0 1 0' : '.14 0 0 0 .86  .26 0 0 0 .72  .26 0 0 0 .71  0 0 0 1 0' }, f);
  [3, 8, 16, 28].forEach(s => { const b = mk('filter', { id: `b${s}${u}`, x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs); mk('feGaussianBlur', { stdDeviation: s * sc }, b); });
  const pg = (id, c1, c2) => { const g = mk('radialGradient', { id: id + u, cx: '35%', cy: '40%', r: '75%' }, defs); mk('stop', { offset: 0, 'stop-color': c1 }, g); mk('stop', { offset: 1, 'stop-color': c2 }, g); };
  pg('R', '#A3192F', '#4A0612'); pg('W', '#FFFFFF', '#EBD9D6'); pg('P', '#E7B9BF', '#B9707C');
  const vg = mk('radialGradient', { id: 'v' + u, cx: '50%', cy: '48%', r: '75%' }, defs);
  mk('stop', { offset: .55, 'stop-color': dark ? '#000' : '#fff', 'stop-opacity': 0 }, vg);
  mk('stop', { offset: 1, 'stop-color': dark ? '#1a0005' : BDX, 'stop-opacity': dark ? .7 : .18 }, vg);
  const gl = mk('radialGradient', { id: 'g' + u, cx: '50%', cy: '50%', r: '50%' }, defs);
  mk('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': dark ? .22 : .75 }, gl); mk('stop', { offset: 1, 'stop-color': '#fff', 'stop-opacity': 0 }, gl);
  const bg = mk('g', {}, parent);
  mk('rect', { width: w, height: h, fill: dark ? '#3A0510' : '#F3E6E3' }, bg);
  const sat = mk('g', { transform: `rotate(-24 ${w / 2} ${h / 2})` }, bg);
  mk('rect', { x: -w * .8, y: -h * .8, width: w * 2.6, height: h * 2.6, filter: `url(#satin${u})` }, sat);
  mk('ellipse', { cx: w * .5, cy: h * .45, rx: w * .55, ry: h * .4, fill: `url(#g${u})` }, bg);
  for (let i = 0; i < 26; i++) {
    const r = (14 + rnd(i + seed) * 60) * sc;
    mk('circle', { cx: rnd(i + 40 + seed) * w, cy: rnd(i + 80 + seed) * h, r, fill: dark ? '#FFD9DF' : '#fff', opacity: (dark ? .07 : .35) + rnd(i + 5) * .25, filter: `url(#b${r > 45 * sc ? 16 : 8}${u})` }, bg);
  }
  if (petals) {
    const petal = 'M0 0 C 26 -46, 96 -50, 118 -6 C 126 18, 92 46, 52 40 C 26 36, 8 20, 0 0 Z';
    [[.06, .08, 1.9, 28, 'R'], [-.02, .8, 2.3, 28, 'R'], [.8, .94, 2.0, 16, 'R'], [.22, .96, 1.1, 8, 'P'], [.74, .04, 1.3, 16, 'P'],
     [.14, .2, .7, 3, 'R'], [.64, .87, .6, 3, 'R'], [.07, .6, .55, 3, 'W'], [.86, .4, .8, 8, 'W'], [.9, .72, .5, 3, 'R']].forEach(([x, y, s, bl, c], i) => {
      const g = mk('g', { transform: `translate(${x * w} ${y * h}) rotate(${rnd(i + seed) * 360}) scale(${s * sc})`, filter: `url(#b${bl}${u})`, opacity: .9 }, bg);
      mk('path', { d: petal, fill: `url(#${dark && c === 'R' ? 'P' : c}${u})` }, g);
    });
  }
  mk('rect', { width: w, height: h, fill: dark ? '#2A0009' : '#fff', opacity: dark ? .28 : .42 }, bg);
  mk('rect', { width: w, height: h, fill: `url(#v${u})` }, bg);
  if (frame) {
    const m = Math.min(w, h) * .035, c = dark ? '#fff' : BDX;
    mk('rect', { x: m, y: m, width: w - 2 * m, height: h - 2 * m, fill: 'none', stroke: c, 'stroke-opacity': dark ? .38 : .3, 'stroke-width': 1.4 * sc }, bg);
    mk('rect', { x: m * 1.3, y: m * 1.3, width: w - 2.6 * m, height: h - 2.6 * m, fill: 'none', stroke: c, 'stroke-opacity': dark ? .2 : .15, 'stroke-width': .9 * sc }, bg);
  }
  return bg;
}
const T = (parent, x, y, txt, o = {}) => mk('text', Object.assign({ x, y, 'text-anchor': 'middle', 'font-family': 'Cormorant', 'font-weight': 500, fill: BDX }, o), parent, txt);
