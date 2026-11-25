// Rendu d'un montage en MP4 vertical 1080×1920.
// Usage : node tools/render.mjs scripts/mon-montage.json [sortie.mp4] [--workers 4] [--from 0 --to 5]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { startServer, ROOT } from './server.mjs';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch {
  try { ({ chromium } = require(path.join(process.env.NODE_PATH || '', 'playwright'))); } catch {
    console.error('Playwright est requis : npm install playwright && npx playwright install chromium'); process.exit(1);
  }
}

// ---------- arguments ----------
const argv = process.argv.slice(2);
const opt = (name, def) => { const i = argv.indexOf(`--${name}`); if (i < 0) return def; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const workers = Number(opt('workers', Math.max(1, Math.min(4, os.cpus().length))));
const from = Number(opt('from', 0));
const toArg = opt('to', null);
const scriptPath = argv[0] || 'scripts/exemple.json';
const out = path.resolve(argv[1] || path.join('out', path.basename(scriptPath, '.json') + '.mp4'));
const scriptAbs = path.resolve(scriptPath);
if (!scriptAbs.startsWith(ROOT)) { console.error('Le script doit se trouver dans le dossier du projet.'); process.exit(1); }
const scriptUrl = '/' + path.relative(ROOT, scriptAbs).split(path.sep).join('/');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'montage-'));
fs.mkdirSync(path.dirname(out), { recursive: true });

const run = (cmd, args, input) => new Promise((res, rej) => {
  const p = spawn(cmd, args, { stdio: [input ? 'pipe' : 'ignore', 'ignore', 'pipe'] });
  let err = ''; p.stderr.on('data', d => { err += d; });
  p.on('close', c => (c === 0 ? res() : rej(new Error(`${cmd} a échoué :\n${err.slice(-2000)}`))));
  if (input) input(p.stdin);
});

// ---------- rendu vidéo ----------
const server = await startServer(0);
const base = `http://127.0.0.1:${server.address().port}/engine/engine.html?render&script=${encodeURIComponent(scriptUrl)}`;
const browser = await chromium.launch();

async function openPage() {
  const page = await browser.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => console.error('Erreur page :', e.message));
  await page.goto(base);
  await page.waitForFunction(() => window.READY || window.ERROR, null, { timeout: 30000 });
  const err = await page.evaluate(() => window.ERROR);
  if (err) throw new Error(err);
  return page;
}

const first = await openPage();
const info = await first.evaluate(() => window.MONTAGE_INFO);
const fps = info.fps;
const end = Math.min(info.duration, toArg != null ? Number(toArg) : info.duration);
const f0 = Math.round(from * fps), f1 = Math.round(end * fps);
const total = f1 - f0;
console.log(`Montage : ${info.duration.toFixed(1)} s, ${total} images à ${fps} i/s, ${workers} processus de rendu`);

let done = 0;
const t0 = Date.now();
const chunk = Math.ceil(total / workers);
const segs = [];
await Promise.all(Array.from({ length: workers }, async (_, w) => {
  const a = f0 + w * chunk, b = Math.min(f1, a + chunk);
  if (a >= b) return;
  const page = w === 0 ? first : await openPage();
  const seg = path.join(tmp, `seg${w}.mp4`);
  segs[w] = seg;
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(fps), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(fps), seg], async stdin => {
    for (let f = a; f < b; f++) {
      await page.evaluate(t => window.renderAt(t), f / fps);
      const buf = await page.screenshot({ type: 'jpeg', quality: 93 });
      if (!stdin.write(buf)) await new Promise(r => stdin.once('drain', r));
      done++;
      if (done % 30 === 0) process.stdout.write(`\r  ${Math.round((done / total) * 100)} % (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
    }
    stdin.end();
  });
}));
process.stdout.write('\n');
await browser.close();
server.close();

const list = path.join(tmp, 'list.txt');
fs.writeFileSync(list, segs.filter(Boolean).map(s => `file '${s}'`).join('\n'));
const video = path.join(tmp, 'video.mp4');
await run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', video]);

// ---------- bruitages synthétisés (pops + whoosh) ----------
const SR = 44100;
const dur = (f1 - f0) / fps;
const pcm = new Float32Array(Math.ceil(dur * SR));
const audioCfg = info.audio || {};
if (audioCfg.bruitages !== false) {
  let seed = 1; const noise = () => { seed = (seed * 16807) % 2147483647; return seed / 1073741823.5 - 1; };
  for (const e of info.events) {
    const st = Math.round((e.t - from) * SR);
    if (st < 0 || st >= pcm.length) continue;
    if (e.kind === 'pop') {
      let ph = 0;
      for (let i = 0; i < SR * .12 && st + i < pcm.length; i++) {
        const t = i / SR; ph += 2 * Math.PI * (380 + 700 * Math.exp(-t * 45)) / SR;
        pcm[st + i] += Math.sin(ph) * Math.exp(-t * 38) * Math.min(1, t * 900) * .22;
      }
    } else {
      let lp = 0;
      const L = SR * .32;
      for (let i = 0; i < L && st + i < pcm.length; i++) {
        const x = i / L, env = Math.sin(Math.PI * x) ** 2;
        const k = .02 + .12 * Math.sin(Math.PI * x);
        lp += k * (noise() - lp);
        pcm[st + i] += lp * env * .9;
      }
    }
  }
}
const wav = Buffer.alloc(44 + pcm.length * 2);
wav.write('RIFF', 0); wav.writeUInt32LE(36 + pcm.length * 2, 4); wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(SR, 24);
wav.writeUInt32LE(SR * 2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(pcm.length * 2, 40);
pcm.forEach((v, i) => wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), 44 + i * 2));
const sfx = path.join(tmp, 'sfx.wav');
fs.writeFileSync(sfx, wav);

// ---------- mixage final ----------
const local = u => (u ? path.join(ROOT, decodeURIComponent(new URL(u).pathname)) : null);
const inputs = ['-i', video, '-i', sfx];
const filters = ['[1:a]volume=1[a0]'];
const mixIn = ['[a0]'];
let n = 2;
const voix = local(audioCfg.voix), musique = local(audioCfg.musique);
if (voix) { inputs.push('-ss', String(from), '-i', voix); filters.push(`[${n}:a]volume=1.0[a${n}]`); mixIn.push(`[a${n}]`); n++; }
if (musique) {
  inputs.push('-stream_loop', '-1', '-i', musique);
  const v = audioCfg.volumeMusique ?? .25;
  filters.push(`[${n}:a]volume=${v},afade=t=out:st=${Math.max(0, dur - 1.2)}:d=1.2[a${n}]`); mixIn.push(`[a${n}]`); n++;
}
filters.push(`${mixIn.join('')}amix=inputs=${mixIn.length}:duration=first:normalize=0,alimiter=limit=0.95[aout]`);
await run('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', filters.join(';'),
  '-map', '0:v', '-map', '[aout]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', String(dur), '-movflags', '+faststart', out]);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`✔ Vidéo : ${out} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
