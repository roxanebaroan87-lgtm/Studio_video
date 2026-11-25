/* Studio Montage — moteur d'animation déterministe.
 * Tout l'affichage est calculé à partir d'un temps t (secondes) : renderAt(t).
 * Le même code sert à la prévisualisation (navigateur) et au rendu image par image (tools/render.mjs).
 */
(() => {
  'use strict';

  // ---------- utilitaires ----------
  const $ = (s, r = document) => r.querySelector(s);
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const prog = (t, start, dur) => clamp((t - start) / dur);
  const easeOut = x => 1 - Math.pow(1 - x, 3);
  const easeInOut = x => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const easeBack = x => { const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const lerp = (a, b, x) => a + (b - a) * x;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // *italique accent*  **gras**  \n = retour ligne
  const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');
  const plain = s => String(s).replace(/\*/g, '');
  const el = (tag, cls, html, parent) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  };
  const pop = (e, t, start, { dur = .45, y = 14, s0 = .85, back = true } = {}) => {
    const p = prog(t, start, dur);
    const k = back ? easeBack(p) : easeOut(p);
    e.style.opacity = clamp(p * 2.2);
    e.style.transform = (e.dataset.base || '') + ` translateY(${lerp(y, 0, k)}px) scale(${lerp(s0, 1, k)})`;
    return p;
  };
  const typed = (text, t, start, cps) => {
    const s = plain(text);
    const n = Math.floor(Math.max(0, t - start) * cps);
    return { str: s.slice(0, n), done: n >= s.length, started: t >= start };
  };
  const rand = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  // ---------- icônes ----------
  const ICONS = {
    palette: '<path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.9 1.8-1.8 0-1.4-1.3-1.6-1.3-2.8 0-1 .8-1.6 1.8-1.6H16a5 5 0 0 0 5-5C21 6.3 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="15" cy="7.2" r="1.2"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    box: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M3 11h18M8 3h8l2 4H6z"/>',
    heart: '<path d="M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>',
    scissors: '<circle cx="6" cy="7" r="3"/><circle cx="6" cy="17" r="3"/><path d="M8.5 8.5L20 19M8.5 15.5L20 5"/>',
    film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>',
    drop: '<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>',
    hand: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4.5a1.5 1.5 0 0 1 3 0V11M14 10.5V6a1.5 1.5 0 0 1 3 0v8a7 7 0 0 1-7 7h-.5A6.5 6.5 0 0 1 4 15.5V12a1.5 1.5 0 0 1 3 0v2"/>',
    wave: '<path d="M3 9c3-3 6 3 9 0s6 3 9 0M3 15c3-3 6 3 9 0s6 3 9 0"/>',
    cup: '<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 3c0 2 2 2 2 4M12 3c0 2 2 2 2 4"/>',
    leaf: '<path d="M5 19C5 9 11 4 20 4c0 9-5 15-15 15zM5 19l8-8"/>',
    bag: '<path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  };
  const icon = name => `<svg viewBox="0 0 24 24">${ICONS[name] || ICONS.sparkle}</svg>`;

  const STICKERS = {
    grape: `<svg viewBox="0 0 64 64">
      <path d="M33 10c2-5 7-7 12-6-2 4-6 7-12 6z" fill="#E59AB4"/><path d="M32 13c0-4 1-7 3-9" stroke="#6b3b2c" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      ${[[22,18],[32,17],[42,19],[17,28],[27,27],[37,27],[47,28],[22,37],[32,36],[42,37],[27,46],[37,46],[32,55]]
        .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="6.2" fill="${i % 3 ? '#A3254F' : '#8C1B42'}"/><circle cx="${x - 2}" cy="${y - 2}" r="1.8" fill="#E486A7" opacity=".7"/>`).join('')}
    </svg>`,
    heart: `<svg viewBox="0 0 64 64"><path d="M32 54S8 40 8 23a12 12 0 0 1 24-4 12 12 0 0 1 24 4c0 17-24 31-24 31z" style="fill:var(--accent)"/><ellipse cx="20" cy="22" rx="5" ry="3" fill="#fff" opacity=".35"/></svg>`,
    cherry: `<svg viewBox="0 0 64 64"><path d="M30 8c-4 12-12 22-14 32M30 8c4 12 10 20 18 30" stroke="#4f6b3a" stroke-width="3" fill="none"/><path d="M30 8c6-4 14-3 18 1-6 3-12 3-18-1z" fill="#7DA05B"/><circle cx="16" cy="44" r="11" fill="#B0124B"/><circle cx="46" cy="42" r="11" fill="#C2185B"/><circle cx="12" cy="40" r="3" fill="#fff" opacity=".4"/><circle cx="42" cy="38" r="3" fill="#fff" opacity=".4"/></svg>`,
    bean: `<svg viewBox="-16 -16 32 32">${'<g transform="rotate(-25)"><ellipse rx="10" ry="13" fill="#4A2A18"/><path d="M0 -11 C -5 -4, 5 4, 0 11" stroke="#C99A6B" stroke-width="1.8" fill="none"/></g>'}</svg>`,
    star: `<svg viewBox="0 0 64 64"><path d="M32 6l7.6 16 17.4 2.2-12.8 12 3.3 17.3L32 45l-15.5 8.5 3.3-17.3L7 24.2 24.4 22z" fill="#E1B357"/></svg>`,
  };

  // ---------- illustrations ----------
  function landscapeSVG(pal, H = 230) {
    const p = Object.assign({ sky: '#E9E1C9', sun: '#E1B357', hill1: '#9DB38F', hill2: '#6F8F65' }, pal || {});
    const d = H - 230, tall = H > 300;
    return `<svg viewBox="0 0 300 ${H}" preserveAspectRatio="xMidYMid slice">
      <rect class="sky" width="300" height="${H}" fill="${p.sky}"/>
      <circle class="sun" cx="${tall ? 190 : 225}" cy="${tall ? 150 : 70}" r="34" fill="${p.sun}"/>
      <g class="h1"><path d="M-20 ${H} L-20 ${170 + d} C 40 ${120 + d}, 120 ${130 + d}, 190 ${190 + d} L 190 ${H} Z" fill="${p.hill1}"/></g>
      <g class="h2"><path d="M80 ${H} L 90 ${200 + d} C 150 ${150 + d}, 260 ${140 + d}, 320 ${170 + d} L 320 ${H} Z" fill="${p.hill2}"/></g>
    </svg>`;
  }
  function productSVG(pal) {
    const p = Object.assign({ bg: '#8FA886', bg2: '#6F8F68', item: '#F4EFE4', cap: '#C9A267' }, pal || {});
    return `<svg viewBox="0 0 300 230" preserveAspectRatio="xMidYMid slice">
      <defs><radialGradient id="pg" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="${p.bg}"/><stop offset="1" stop-color="${p.bg2}"/></radialGradient></defs>
      <rect width="300" height="230" fill="url(#pg)"/>
      <ellipse cx="150" cy="200" rx="58" ry="10" fill="#000" opacity=".15"/>
      <g class="prod">
        <rect x="120" y="92" width="60" height="104" rx="10" fill="${p.item}"/>
        <rect x="120" y="92" width="16" height="104" rx="8" fill="#fff" opacity=".45"/>
        <rect x="136" y="70" width="28" height="26" rx="4" fill="${p.cap}"/>
        <path d="M150 50c6 7 5 14 0 18-5-4-6-11 0-18z" fill="#F7D27A" class="flame"/>
        <rect x="132" y="130" width="36" height="22" rx="3" fill="none" stroke="${p.cap}" stroke-width="1.5"/>
      </g>
      <g class="sparks">${[[80, 70], [220, 60], [70, 150], [232, 140], [110, 40], [196, 104]].map(([x, y], i) =>
        `<path d="M${x} ${y - 8}l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#FBE7A8" data-i="${i}"/>`).join('')}</g>
    </svg>`;
  }

  // ---------- scènes ----------
  // Chaque fabrique reçoit (root, spec, cfg) et renvoie update(lt) où lt = temps local de la scène.
  const SCENES = {};

  SCENES.hook = (root, s) => {
    const title = el('div', 'title', md(s.title || 'Toute cette vidéo'), root); title.style.top = '190px';
    const acc = el('div', 'title', md(s.accent || '= *Claude*'), root); acc.style.top = '232px';
    const phone = el('div', 'phone', '<div class="notch"></div><div class="screen"></div>', root);
    Object.assign(phone.style, { left: '170px', top: '300px', width: '200px', height: '330px' });
    phone.dataset.base = 'rotate(-6deg)';
    const scr = $('.screen', phone);
    if (s.image) scr.innerHTML = `<img src="${esc(s.image)}" style="width:100%;height:100%;object-fit:cover">`;
    else scr.style.background = 'linear-gradient(160deg,#6E1840,#C03D7C 55%,#3B0A22)';
    el('div', '', '', scr).style.cssText = 'position:absolute;left:14px;right:14px;bottom:18px;height:8px;border-radius:4px;background:rgba(255,255,255,.55)';
    const badge = el('div', 'badge', '▶ ' + esc(s.views || '1,2 M vues'), root);
    Object.assign(badge.style, { left: '340px', top: '318px' });
    const accentAt = s.accentAt ?? 1.2;
    return lt => {
      pop(title, lt, .05, { y: 10 });
      pop(acc, lt, accentAt, { y: 10, s0: .6 });
      const p = pop(phone, lt, .2, { y: 40, s0: .7 });
      // léger flottement
      phone.style.transform += ` translateY(${Math.sin(lt * 2) * 4 * p}px)`;
      pop(badge, lt, .7, { s0: .4 });
    };
  };

  SCENES.chat = (root, s) => {
    const win = el('div', 'window', `
      <div class="bar"><i></i><i></i><i></i><span class="url">${esc(s.url || 'claude.ai')}</span></div>
      <div class="input"><span>${esc(s.placeholder || 'Écris à Claude…')}</span><div class="send"><svg viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></svg></div></div>`, root);
    let greet = null, bubble = null, txt = null, res = null, rtext = null;
    if (s.greeting) greet = el('div', 'greet', `<div style="height:48px;width:48px;margin:0 auto 8px">${STICKERS.grape}</div><div class="h">${md(s.greeting)}</div><div class="s">${esc(s.greetingSub || 'On monte quoi aujourd’hui ?')}</div>`, win);
    if (s.prompt) {
      bubble = el('div', 'prompt', `<div class="k">${esc(s.label || 'MON STYLE')}</div><div class="t"></div>`, win);
      txt = $('.t', bubble);
    }
    const r = s.result;
    if (r) {
      res = el('div', 'result', '', win);
      if (r.kind === 'product') res.innerHTML = productSVG(r.palette);
      else if (r.kind === 'image') res.innerHTML = `<img src="${esc(r.src)}" style="width:100%;height:100%;object-fit:cover">`;
      else res.innerHTML = landscapeSVG(r.palette);
      if (r.text) {
        rtext = el('div', 'typo' + (r.kind === 'product' ? '' : ' dark'), '', res);
        if (r.kind === 'product') Object.assign(rtext.style, { top: '14px', fontSize: '20px', color: '#F4EFE4', letterSpacing: '.08em' });
        else rtext.style.top = r.textTop || '96px';
      }
    }
    const typeAt = s.typeAt ?? .5, cps = s.cps ?? 20;
    const resAt = r ? (r.at ?? 2.4) : 0;
    return lt => {
      pop(win, lt, 0, { y: 30, s0: .9 });
      if (greet) {
        const gOut = bubble ? prog(lt, typeAt - .3, .3) : 0;
        greet.style.opacity = clamp(prog(lt, .25, .4) - gOut);
      }
      if (bubble) {
        const ty = typed(s.prompt, lt, typeAt + .2, cps);
        bubble.style.opacity = prog(lt, typeAt, .2);
        txt.innerHTML = esc(ty.str) + (ty.started && (!ty.done || Math.floor(lt * 2) % 2 === 0) ? '<span class="caret"></span>' : '');
      }
      if (res) {
        const p = prog(lt, resAt, .5);
        res.style.opacity = clamp(p * 2);
        res.style.transform = `scale(${lerp(.9, 1, easeBack(p))})`;
        if (r.kind !== 'product' && r.kind !== 'image') {
          const sun = $('.sun', res), h1 = $('.h1', res), h2 = $('.h2', res);
          const ps = easeBack(prog(lt, resAt + .35, .5));
          sun.setAttribute('r', 34 * ps);
          h1.setAttribute('transform', `translate(0 ${lerp(120, 0, easeOut(prog(lt, resAt + .6, .6)))})`);
          h2.setAttribute('transform', `translate(0 ${lerp(120, 0, easeOut(prog(lt, resAt + .8, .6)))})`);
        }
        if (r.kind === 'product') {
          const prod = $('.prod', res);
          const spin = Math.sin((lt - resAt) * 2.2) * prog(lt, resAt, .3);
          prod.setAttribute('transform', `translate(150 0) scale(${lerp(1, .82, Math.abs(spin) * .5)} 1) translate(-150 0)`);
          $('.flame', res).setAttribute('transform', `translate(150 68) scale(${1 + Math.sin(lt * 18) * .06} ${1 + Math.sin(lt * 13) * .1}) translate(-150 -68)`);
          const sparkAt = r.sparkAt ?? resAt + 1.8;
          res.querySelectorAll('.sparks path').forEach((p2, i) => {
            const k = prog(lt, sparkAt + i * .12, .4);
            p2.style.opacity = k * (.55 + .45 * Math.sin(lt * 6 + i));
            p2.setAttribute('transform', `translate(0 ${-6 * Math.sin(lt * 2 + i)})`);
          });
        }
        if (rtext) {
          const ty = typed(r.text, lt, r.textAt ?? resAt + 1.4, r.cps ?? 12);
          rtext.textContent = ty.str;
          rtext.style.visibility = ty.str ? 'visible' : 'hidden';
        }
      }
    };
  };

  SCENES.voice = (root, s) => {
    const phone = el('div', 'phone', '<div class="notch"></div><div class="screen"></div>', root);
    Object.assign(phone.style, { left: '160px', top: '196px', width: '220px', height: '420px' });
    const scr = $('.screen', phone);
    el('div', 'memo', esc(s.label || 'Mémo vocal'), scr);
    const timer = el('div', 'timer', '00:00', scr);
    const wave = el('div', 'wave', '', scr);
    const bars = Array.from({ length: 30 }, () => el('i', '', '', wave));
    el('div', 'rec', '<i></i>', scr);
    const recAt = s.recAt ?? .5;
    return lt => {
      pop(phone, lt, 0, { y: 40, s0: .85 });
      const rt = Math.max(0, lt - recAt);
      const sec = Math.floor(rt);
      timer.textContent = `00:${String(sec).padStart(2, '0')}`;
      bars.forEach((b, i) => {
        const env = Math.exp(-Math.pow((i - 14.5) / 9, 2));
        const v = lt < recAt ? .08 : (.15 + .85 * Math.abs(Math.sin(rt * 7 + i * 1.7) * Math.sin(rt * 3.1 + i * .6))) * env;
        b.style.height = `${Math.max(3, v * 64)}px`;
      });
    };
  };

  SCENES.storyboard = (root, s) => {
    const sc = el('div', 'script', `<div class="k">${esc(s.label || 'TA VOIX')}</div>`, root);
    const n = s.lines ?? 14;
    const lines = Array.from({ length: n }, (_, i) => {
      const l = el('div', 'l', '<i></i>', sc);
      l.style.width = `${70 + rand(i) * 30}%`;
      return $('i', l);
    });
    const pv = el('div', 'preview', landscapeSVG(s.palette, 530), root);
    let txt = null;
    if (s.text) { txt = el('div', 'typo dark', '', pv); txt.style.top = '200px'; }
    const sp = s.speed ?? .35;
    return lt => {
      pop(sc, lt, 0, { y: 20, s0: .95, back: false });
      pop(pv, lt, .15, { y: 20, s0: .95, back: false });
      lines.forEach((li, i) => { li.style.width = `${easeOut(prog(lt, .4 + i * sp * .5, sp)) * 100}%`; });
      const sun = $('.sun', pv), h1 = $('.h1', pv), h2 = $('.h2', pv), sky = $('.sky', pv);
      const a = s.hillsAt ?? 1.6;
      sky.style.opacity = .6 + .4 * prog(lt, .2, .5);
      sun.setAttribute('r', 34 * easeBack(prog(lt, .5, .6)));
      h1.setAttribute('transform', `translate(0 ${lerp(140, 0, easeOut(prog(lt, a, .7)))})`);
      h2.setAttribute('transform', `translate(0 ${lerp(140, 0, easeOut(prog(lt, a + .25, .7)))})`);
      if (txt) {
        const ty = typed(s.text, lt, s.textAt ?? a + 1.2, 12);
        txt.textContent = ty.str; txt.style.visibility = ty.str ? 'visible' : 'hidden';
      }
    };
  };

  SCENES.cards = (root, s) => {
    const title = el('div', 'title', md(s.title || 'Tous mes *prompts*'), root); title.style.top = '172px';
    const cards = (s.cards || []).slice(0, 2).map((c, i) => {
      const e = el('div', 'card' + (c.dark ? ' dark' : ''), `<div class="k">${esc(c.kicker || '')}</div><div class="t">${md(c.title || '')}</div>`, root);
      e.style.left = i === 0 ? '30px' : '282px';
      e.style.width = i === 0 ? '242px' : '230px';
      if (c.dark) {
        ['#F4ECE4', '#F6C9D8', '#C2185B'].forEach((col, j) => {
          const m = el('div', 'mini', 'PROMPT', e);
          Object.assign(m.style, { background: col, left: `${14 + j * 58}px`, top: `${92 + (j === 1 ? -6 : j * 8)}px`, color: j === 2 ? '#fff' : '' });
          m.dataset.base = `rotate(${[-6, 2, 7][j]}deg)`;
        });
      } else {
        el('div', 'ln', '', e); el('div', 'ln', '', e).style.width = '70%';
      }
      return e;
    });
    let studio = null;
    if (s.badge) studio = el('div', 'studio', md(s.badge), root);
    const cardsAt = s.cardsAt ?? .6;
    return lt => {
      pop(title, lt, 0, { y: 10 });
      cards.forEach((c, i) => {
        const p = pop(c, lt, cardsAt + i * .35, { y: 50, s0: .8 });
        c.querySelectorAll('.mini').forEach((m, j) => pop(m, lt, cardsAt + i * .35 + .3 + j * .15, { y: 20, s0: .5 }));
        void p;
      });
      if (studio) pop(studio, lt, s.badgeAt ?? 2.6, { y: 30, s0: .8 });
    };
  };

  SCENES.cta = (root, s) => {
    const top = el('div', 'cta-top', md(s.top || 'commente'), root);
    Object.assign(top.style, { position: 'absolute', left: 0, right: 0, top: '258px' });
    const wrap = el('div', '', `<span class="cta-word">${esc(s.word || 'MONTAGE')}</span>`, root);
    Object.assign(wrap.style, { position: 'absolute', left: 0, right: 0, top: '308px', textAlign: 'center' });
    const chip = el('div', 'chip', `<span style="color:var(--accent)">✦</span> ${esc(s.word || 'MONTAGE')}`, root); chip.style.top = '390px';
    chip.dataset.base = 'translateX(-50%)';
    let chip2 = null;
    if (s.pill) { chip2 = el('div', 'chip dark', esc(s.pill), root); chip2.style.top = '470px'; chip2.dataset.base = 'translateX(-50%)'; }
    const heart = el('div', 'abs', STICKERS.heart, root);
    Object.assign(heart.style, { left: '398px', top: '396px', width: '44px', height: '44px' });
    return lt => {
      pop(top, lt, .05, { y: 16 });
      pop(wrap, lt, .3, { y: 16, s0: .6 });
      pop(chip, lt, .7, { y: 10, s0: .6 });
      if (chip2) pop(chip2, lt, s.pillAt ?? 1.3, { y: 10, s0: .6 });
      const hp = pop(heart, lt, 1, { s0: .2 });
      heart.style.transform += ` scale(${1 + .08 * Math.sin(lt * 7) * hp})`;
    };
  };

  // ---------- publicité produit (illustrations) ----------
  function jarSVG(p) {
    p = Object.assign({ name: 'CAFÉ GLOW', sub: 'gommage au café', jar: '#6B3F23', lid: '#2E1B12', label: '#EFE2CF', ink: '#3B2418' }, p || {});
    return `<svg viewBox="0 0 120 120">
      <rect x="14" y="8" width="92" height="24" rx="6" fill="${p.lid}"/>
      <rect x="14" y="22" width="92" height="6" fill="#000" opacity=".15"/>
      <rect x="8" y="28" width="104" height="86" rx="14" fill="${p.jar}"/>
      <rect x="14" y="34" width="12" height="72" rx="6" fill="#fff" opacity=".18"/>
      <rect x="22" y="46" width="76" height="50" rx="5" fill="${p.label}"/>
      <text x="60" y="66" text-anchor="middle" font-family="Playfair" font-size="11" font-weight="500" fill="${p.ink}" letter-spacing=".3">${esc(p.name)}</text>
      <line x1="38" x2="82" y1="72" y2="72" stroke="${p.ink}" stroke-width=".6" opacity=".5"/>
      <text x="60" y="84" text-anchor="middle" font-family="Playfair" font-style="italic" font-size="8.5" fill="${p.ink}">${esc(p.sub)}</text>
      <g transform="translate(60 91)"><ellipse rx="3.4" ry="2.3" fill="${p.jar}"/><path d="M-2.6 0 Q0 -0.8 2.6 0" stroke="${p.label}" stroke-width=".6" fill="none"/></g>
    </svg>`;
  }
  const bean = (x, y, s = 1, r = 0, c = '#4A2A18') =>
    `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><ellipse rx="9" ry="12" fill="${c}"/><path d="M0 -10 C -4 -4, 4 4, 0 10" stroke="#C99A6B" stroke-width="1.6" fill="none" opacity=".7"/></g>`;

  // Femme illustrée tenant le pot (style flat). Vue buste, 400×520.
  function womanSVG(o) {
    o = Object.assign({ skin: '#B97A56', skinShade: '#A0654A', hair: '#2A1810', top: '#F3E6D6', lips: '#8E3B3B' }, o || {});
    return `<svg viewBox="0 0 400 520" class="woman">
      <path d="M118 150 C 110 60, 290 50, 286 150 L 300 330 C 260 350, 140 350, 100 330 Z" fill="${o.hair}"/>
      <rect x="178" y="200" width="44" height="70" rx="18" fill="${o.skinShade}"/>
      <path d="M60 520 C 60 380, 100 300, 175 282 L 225 282 C 300 300, 340 380, 340 520 Z" fill="${o.skin}"/>
      <path d="M70 520 C 74 430, 92 380, 120 360 C 170 384, 230 384, 280 360 C 308 380, 326 430, 330 520 Z" fill="${o.top}"/>
      <path d="M120 360 C 170 384, 230 384, 280 360" stroke="#E2CDB4" stroke-width="3" fill="none"/>
      <g class="head">
        <ellipse cx="200" cy="160" rx="56" ry="68" fill="${o.skin}"/>
        <ellipse cx="146" cy="166" rx="9" ry="14" fill="${o.skinShade}"/>
        <ellipse cx="254" cy="166" rx="9" ry="14" fill="${o.skinShade}"/>
        <circle cx="254" cy="184" r="4" fill="#E8C27A"/>
        <g class="eyes"><path d="M168 162 q12 9 24 0" stroke="${o.hair}" stroke-width="3.2" fill="none" stroke-linecap="round"/>
          <path d="M208 162 q12 9 24 0" stroke="${o.hair}" stroke-width="3.2" fill="none" stroke-linecap="round"/></g>
        <path d="M166 146 q14 -7 26 -2 M208 144 q12 -5 26 2" stroke="${o.hair}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M200 166 q-5 18 2 22" stroke="${o.skinShade}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        <path class="mouth" d="M184 200 q16 12 32 0 q-16 5 -32 0z" fill="${o.lips}"/>
        <ellipse cx="166" cy="188" rx="11" ry="6" fill="#E0805E" opacity=".35"/>
        <ellipse cx="234" cy="188" rx="11" ry="6" fill="#E0805E" opacity=".35"/>
        <path d="M144 150 C 140 80, 200 70, 230 96 C 250 86, 268 112, 258 150 C 248 120, 224 104, 196 108 C 170 112, 152 126, 144 150 Z" fill="${o.hair}"/>
      </g>
      <path d="M100 330 C 90 380, 84 440, 92 520 L 130 520 C 124 450, 126 400, 134 360 Z" fill="${o.skin}"/>
      <g class="arm">
        <path d="M282 300 C 340 330, 356 400, 332 420 C 316 400, 300 352, 268 330 Z" fill="${o.skin}"/>
        <path d="M318 420 C 338 410, 334 330, 318 268 L 292 268 C 300 330, 300 400, 318 420 Z" fill="${o.skin}"/>
        <g class="jar" transform="translate(250 168)">${jarSVG(o.jar).replace('<svg ', '<svg width="126" height="126" ')}</g>
        <rect x="262" y="262" width="60" height="18" rx="9" fill="${o.skin}"/>
        <rect x="266" y="276" width="52" height="16" rx="8" fill="${o.skinShade}"/>
        <rect x="258" y="232" width="22" height="34" rx="11" fill="${o.skin}"/>
      </g>
    </svg>`;
  }

  SCENES.portrait = (root, s, cfg) => {
    const title = el('div', 'title', md(s.title || 'Ta peau mérite\nun vrai *réveil*'), root); title.style.top = '176px';
    const arch = el('div', 'arch', womanSVG(Object.assign({}, cfg.woman, { jar: cfg.product })), root);
    const svg = $('svg', arch);
    const badges = (s.badges || []).map((b, i) => {
      const e = el('div', 'tag', md(b), root);
      const pos = [[34, 330], [346, 540], [40, 520], [350, 300]][i % 4];
      Object.assign(e.style, { left: pos[0] + 'px', top: pos[1] + 'px' });
      return e;
    });
    const beans = el('div', 'abs', `<svg viewBox="0 0 540 960" style="width:540px;height:960px">${Array.from({ length: 8 }, (_, i) => `<g class="b" data-i="${i}">${bean(0, 0, .9 + rand(i) * .5, rand(i + 9) * 180)}</g>`).join('')}</svg>`, root);
    Object.assign(beans.style, { left: 0, top: 0, pointerEvents: 'none' });
    const badgeAt = s.badgeAt ?? 1.2, gap = s.badgeGap ?? .9;
    return lt => {
      pop(title, lt, .05, { y: 10 });
      pop(arch, lt, .15, { y: 40, s0: .92, back: false });
      // respiration, bras qui monte le pot, clignement
      const head = $('.head', svg), arm = $('.arm', svg), eyes = $('.eyes', svg);
      head.setAttribute('transform', `rotate(${Math.sin(lt * 1.3) * 2} 200 220)`);
      const lift = easeBack(prog(lt, .3, .7));
      arm.setAttribute('transform', `translate(0 ${lerp(60, 0, lift) + Math.sin(lt * 2.2) * 3}) rotate(${Math.sin(lt * 1.8) * 2.5} 318 420)`);
      const bl = (lt % 3.1) > 2.95 ? .15 : 1;
      eyes.setAttribute('transform', `translate(0 162) scale(1 ${bl}) translate(0 -162)`);
      badges.forEach((b, i) => {
        pop(b, lt, badgeAt + i * gap, { y: 12, s0: .5 });
        b.style.transform += ` translateY(${Math.sin(lt * 2 + i) * 3}px)`;
      });
      beans.querySelectorAll('.b').forEach((g, i) => {
        const y = ((lt * (60 + rand(i) * 50) + rand(i + 3) * 960) % 1000) - 40;
        const x = 30 + rand(i + 5) * 480 + Math.sin(lt + i) * 10;
        g.setAttribute('transform', `translate(${x} ${y}) rotate(${lt * 40 * (i % 2 ? 1 : -1)})`);
        g.style.opacity = (s.beans === false ? 0 : .55) * prog(lt, .3, .6);
      });
    };
  };

  SCENES.product = (root, s, cfg) => {
    const p = cfg.product || {};
    const title = el('div', 'title', md(s.title || `*${p.name || 'Café Glow'}*`), root); title.style.top = '180px'; title.style.fontSize = '40px';
    const sub = el('div', 'kicker', esc(s.subtitle || 'GOMMAGE CORPS AU CAFÉ'), root); sub.style.top = '232px';
    const jar = el('div', 'abs', jarSVG(p), root);
    Object.assign(jar.style, { left: '150px', top: '300px', width: '240px', height: '240px', filter: 'drop-shadow(0 22px 24px rgba(59,36,24,.35))' });
    const sh = el('div', 'abs', '', root);
    Object.assign(sh.style, { left: '170px', top: '560px', width: '200px', height: '22px', borderRadius: '50%', background: 'rgba(59,36,24,.18)' });
    const beansEl = el('div', 'abs', `<svg viewBox="0 0 540 960" style="width:540px;height:960px">${Array.from({ length: 14 }, (_, i) => `<g class="b">${bean(0, 0, .8 + rand(i) * .7, 0)}</g>`).join('')}</svg>`, root);
    Object.assign(beansEl.style, { left: 0, top: 0 });
    return lt => {
      pop(title, lt, .4, { y: 10 });
      pop(sub, lt, .6, { y: 8, back: false });
      const p1 = easeBack(prog(lt, 0, .7));
      jar.style.opacity = clamp(prog(lt, 0, .3));
      jar.style.transform = `translateY(${lerp(120, 0, p1) + Math.sin(lt * 2) * 6}px) rotate(${lerp(-25, 0, p1) + Math.sin(lt * 1.5) * 3}deg) scale(${lerp(.6, 1, p1)})`;
      sh.style.transform = `scale(${.85 + Math.sin(lt * 2) * .06})`;
      // explosion de grains de café autour du pot
      beansEl.querySelectorAll('.b').forEach((g, i) => {
        const a = (i / 14) * Math.PI * 2 + rand(i) * .4;
        const k = easeOut(prog(lt, .35, 1.1));
        const r = lerp(10, 150 + rand(i + 2) * 70, k);
        const x = 270 + Math.cos(a) * r, y = 420 + Math.sin(a) * r * 1.15 + Math.max(0, lt - 1.2) * 18 * (1 + rand(i));
        g.setAttribute('transform', `translate(${x} ${y}) rotate(${a * 57 + lt * 50})`);
        g.style.opacity = clamp(prog(lt, .35, .15)) * (1 - prog(lt, s.duration - .6, .5));
      });
    };
  };

  SCENES.ingredients = (root, s) => {
    const title = el('div', 'title', md(s.title || '3 ingrédients, *c’est tout*'), root); title.style.top = '178px';
    const items = (s.items || []).slice(0, 3).map((it, i) => {
      const e = el('div', 'ingr', `<div class="disc">${it.emoji ? `<span>${esc(it.emoji)}</span>` : ''}</div><div><div class="n">${md(it.name)}</div><div class="d">${md(it.desc || '')}</div></div>`, root);
      e.style.top = `${262 + i * 118}px`;
      if (it.color) $('.disc', e).style.background = it.color;
      return e;
    });
    const at = s.itemsAt ?? .6, gap = s.itemGap ?? (s.duration ? (s.duration - at - .6) / 3 : 1);
    return lt => {
      pop(title, lt, 0, { y: 10 });
      items.forEach((e, i) => { const p = easeBack(prog(lt, at + i * gap, .5)); e.style.opacity = clamp(p * 2); e.style.transform = `translateX(${lerp(-60, 0, p)}px)`; });
    };
  };

  SCENES.routine = (root, s) => {
    const title = el('div', 'title', md(s.title || 'Ta *routine*'), root); title.style.top = '178px';
    const steps = (s.steps || []).slice(0, 3).map((st, i) => {
      const e = el('div', 'rstep', `<div class="num">${i + 1}</div><div class="ic">${icon(st.icon || 'sparkle')}</div><div class="n">${md(st.name)}</div><div class="d">${md(st.desc || '')}</div>`, root);
      e.style.left = `${36 + i * 160}px`;
      return e;
    });
    const at = s.stepsAt ?? .6, gap = s.stepGap ?? (s.duration ? (s.duration - at - .6) / 3 : 1);
    return lt => {
      pop(title, lt, 0, { y: 10 });
      steps.forEach((e, i) => {
        pop(e, lt, at + i * gap, { y: 40, s0: .7 });
        const active = lt >= at + i * gap && (i === steps.length - 1 || lt < at + (i + 1) * gap);
        e.classList.toggle('on', active);
      });
    };
  };

  // ---------- montage ----------
  const M = { cfg: null, scenes: [], captions: [], duration: 0, totalSteps: 5 };

  function applyTheme(cfg) {
    const th = cfg.theme || {};
    const map = { background: '--bg', circle: '--circle', accent: '--accent', dark: '--dark', text: '--ink', grid: '--grid', muted: '--muted', arch1: '--arch1', arch2: '--arch2' };
    for (const k in map) if (th[k]) document.documentElement.style.setProperty(map[k], th[k]);
  }

  function build(cfg) {
    M.cfg = cfg;
    applyTheme(cfg);
    const b = cfg.brand || {};
    $('#brand').innerHTML = `${STICKERS[cfg.sticker] ? STICKERS[cfg.sticker] : ''}<span>${esc((b.name || 'MON STUDIO MONTAGE').toUpperCase())}</span>${b.handle ? `<span class="handle">${esc(b.handle)}</span>` : ''}`;
    const st = cfg.sticker ?? 'grape';
    $('#sticker').innerHTML = STICKERS[st] || esc(st);
    if (cfg.avatar) { const a = $('#avatar'); a.src = cfg.avatar; a.style.display = 'block'; }
    else { document.body.classList.add('no-avatar'); }

    M.totalSteps = cfg.totalSteps || Math.max(1, ...cfg.scenes.map(s => s.step || 0));
    $('#steps').innerHTML = `<span class="label">ÉTAPE <em class="n">1</em>/${M.totalSteps}</span>` +
      Array.from({ length: M.totalSteps }, () => '<div class="seg"><i></i></div>').join('');

    const host = $('#scenes');
    host.innerHTML = '';
    let t = 0;
    M.scenes = cfg.scenes.map((spec, idx) => {
      const root = el('div', 'scene', '', host);
      const make = SCENES[spec.type];
      if (!make) throw new Error(`Type de scène inconnu : ${spec.type}`);
      const update = make(root, spec, cfg);
      const dur = spec.duration ?? 4;
      const sc = { spec, root, update, start: t, dur, idx };
      t += dur;
      return sc;
    });
    M.duration = t;

    // sous-titres : par scène, répartis automatiquement ou avec "at" explicite (secondes dans la scène)
    M.captions = [];
    M.scenes.forEach(sc => {
      const caps = sc.spec.captions || [];
      caps.forEach((c, i) => {
        const o = typeof c === 'string' ? { text: c } : c;
        const at = o.at ?? (i * sc.dur / caps.length);
        M.captions.push({ text: o.text, icon: o.icon || sc.spec.icon, t: sc.start + at });
      });
    });
    M.captions.sort((a, b) => a.t - b.t);
    M.captions.forEach((c, i) => { c.end = i + 1 < M.captions.length ? M.captions[i + 1].t : M.duration; });
    return M;
  }

  function sceneAt(t) {
    for (const sc of M.scenes) if (t < sc.start + sc.dur) return sc;
    return M.scenes[M.scenes.length - 1];
  }

  let lastCap = null, lastIcon = null;
  function renderAt(t) {
    t = clamp(t, 0, M.duration - 1e-4);
    const sc = sceneAt(t);
    const lt = t - sc.start;
    M.scenes.forEach(s => { s.root.style.display = s === sc ? 'block' : 'none'; });
    sc.update(lt);
    // sortie de scène : fondu + léger zoom
    const out = prog(lt, sc.dur - .22, .22);
    const isLast = sc.idx === M.scenes.length - 1;
    sc.root.style.opacity = isLast ? 1 : 1 - out;
    sc.root.style.transform = isLast ? '' : `scale(${1 + out * .04})`;

    // cercle rose : respire et se déplace selon la scène
    const circ = $('#circle');
    const cs = sc.spec.circle ?? (sc.spec.type === 'cta' ? { x: 270, y: 380, r: 160 } : { x: 270, y: 410, r: 200 });
    const cp = easeOut(prog(lt, 0, .5));
    const prev = M.scenes[sc.idx - 1];
    const ps = prev ? (prev.spec.circle ?? (prev.spec.type === 'cta' ? { x: 270, y: 380, r: 160 } : { x: 270, y: 410, r: 200 })) : cs;
    const cx = lerp(ps.x, cs.x, cp), cy = lerp(ps.y, cs.y, cp), r = lerp(ps.r, cs.r, cp) * (1 + .015 * Math.sin(t * 1.6));
    Object.assign(circ.style, { left: `${cx - r}px`, top: `${cy - r}px`, width: `${2 * r}px`, height: `${2 * r}px`, opacity: cs.r === 0 ? 1 - cp : 1 });

    // étapes
    const steps = $('#steps');
    const step = sc.spec.step;
    steps.style.opacity = step ? clamp(prog(lt, 0, .3) + (prev && prev.spec.step ? 1 : 0)) : 0;
    if (step) {
      $('.n', steps).textContent = step;
      // durée totale de l'étape (scènes consécutives avec même numéro)
      const same = M.scenes.filter(s => s.spec.step === step);
      const s0 = same[0].start, s1 = same[same.length - 1].start + same[same.length - 1].dur;
      steps.querySelectorAll('.seg i').forEach((f, i) => {
        f.style.width = i + 1 < step ? '100%' : i + 1 === step ? `${clamp((t - s0) / (s1 - s0)) * 100}%` : '0%';
      });
    }

    // sticker : petit balancement
    const stk = $('#sticker');
    stk.style.transform = `rotate(${Math.sin(t * 2.1) * 8}deg) translateY(${Math.sin(t * 1.4) * 4}px)`;
    stk.style.opacity = clamp(t / .4);

    // sous-titre + bulle icône
    const cap = M.captions.find(c => t >= c.t && t < c.end);
    const capEl = $('#caption'), bub = $('#bubble');
    if (cap) {
      if (cap !== lastCap) { capEl.innerHTML = md(cap.text); lastCap = cap; }
      const p = prog(t, cap.t, .22);
      capEl.style.opacity = 1;
      capEl.style.transform = `translateX(-50%) scale(${lerp(.82, 1, easeBack(p))})`;
      const ic = cap.icon || 'sparkle';
      if (ic !== lastIcon) { bub.innerHTML = icon(ic); lastIcon = ic; }
      const firstWithIcon = M.captions.find(c => (c.icon || 'sparkle') === ic && c.t <= t && !M.captions.some(d => d.t > c.t && d.t <= t && (d.icon || 'sparkle') !== ic));
      const bp = prog(t, firstWithIcon ? firstWithIcon.t : cap.t, .35);
      bub.style.opacity = 1;
      bub.style.transform = `scale(${lerp(.3, 1, easeBack(bp))}) translateY(${Math.sin(t * 2.4) * 3}px)`;
    } else {
      capEl.style.opacity = 0; bub.style.opacity = 0;
    }
  }

  // événements utilisés pour les bruitages (pops) au rendu
  function events() {
    const ev = [];
    M.scenes.forEach(s => ev.push({ t: s.start + .02, kind: 'whoosh' }));
    M.captions.forEach(c => ev.push({ t: c.t, kind: 'pop' }));
    return ev.sort((a, b) => a.t - b.t);
  }

  // ---------- démarrage ----------
  async function load() {
    const params = new URLSearchParams(location.search);
    let cfg = window.MONTAGE;
    if (!cfg) {
      const src = params.get('script') || '../scripts/exemple.json';
      cfg = await (await fetch(src)).json();
      // chemins relatifs au fichier JSON
      const base = new URL(src, location.href);
      const fix = p => (p && !/^(https?:|data:|\/)/.test(p) ? new URL(p, base).href : p);
      cfg.avatar = fix(cfg.avatar);
      if (cfg.audio) for (const k of ['voix', 'musique']) if (cfg.audio[k]) cfg.audio[k] = fix(cfg.audio[k]);
      cfg.scenes.forEach(s => { s.image = fix(s.image); if (s.result && s.result.src) s.result.src = fix(s.result.src); });
    }
    await document.fonts.ready;
    build(cfg);
    // attendre les images
    await Promise.all([...document.images].filter(i => i.src && !i.complete).map(i => new Promise(r => { i.onload = i.onerror = r; })));
    window.MONTAGE_INFO = { duration: M.duration, fps: cfg.fps || 30, events: events(), audio: cfg.audio || null };
    renderAt(0);

    if (params.has('render')) { document.body.classList.add('render'); window.renderAt = renderAt; window.READY = true; return; }
    preview(cfg);
  }

  function preview(cfg) {
    const stage = $('#stage'), vp = $('#viewport');
    const fit = () => { const s = Math.min(vp.clientWidth / 540, vp.clientHeight / 960); stage.style.transform = `scale(${s})`; };
    addEventListener('resize', fit); fit();
    const audios = [];
    if (cfg.audio) {
      if (cfg.audio.voix) audios.push(Object.assign(new Audio(cfg.audio.voix), { volume: 1 }));
      if (cfg.audio.musique) audios.push(Object.assign(new Audio(cfg.audio.musique), { volume: clamp(cfg.audio.volumeMusique ?? .25) }));
    }
    let playing = false, t0 = 0, tStart = 0, cur = 0;
    const btn = $('#play'), seek = $('#seek'), time = $('#time');
    const show = t => { cur = t; renderAt(t); seek.value = (t / M.duration) * 1000; time.textContent = `${t.toFixed(1)} / ${M.duration.toFixed(1)} s`; };
    const loop = now => {
      if (!playing) return;
      const t = tStart + (now - t0) / 1000;
      if (t >= M.duration) { playing = false; btn.textContent = '▶︎ Lecture'; show(M.duration); audios.forEach(a => a.pause()); return; }
      show(t); requestAnimationFrame(loop);
    };
    btn.onclick = () => {
      playing = !playing;
      btn.textContent = playing ? '❚❚ Pause' : '▶︎ Lecture';
      if (playing) {
        tStart = cur >= M.duration - .05 ? 0 : cur; t0 = performance.now();
        audios.forEach(a => { a.currentTime = tStart; a.play().catch(() => {}); });
        requestAnimationFrame(loop);
      } else audios.forEach(a => a.pause());
    };
    seek.oninput = () => { playing = false; btn.textContent = '▶︎ Lecture'; audios.forEach(a => a.pause()); show((seek.value / 1000) * M.duration); };
    addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); btn.click(); } });
    show(0);
  }

  load().catch(e => { document.body.innerHTML = `<pre style="color:#fff;padding:20px;white-space:pre-wrap">Erreur : ${esc(e.message)}</pre>`; window.ERROR = e.message; });
})();
