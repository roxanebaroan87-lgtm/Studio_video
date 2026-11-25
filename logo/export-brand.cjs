// Exporte chaque support en PDF (impression, taille réelle en mm) et en PNG (~300 dpi).
// Usage : node logo/export-brand.cjs [doc ...]
const path = require('path');
let chromium; try { ({ chromium } = require('playwright')); } catch { console.error('npm install playwright'); process.exit(1); }
const ALL = ['affiche-A3', 'carte-visite-recto', 'carte-visite-verso', 'carte-merci-recto', 'carte-merci-verso', 'etiquette-ronde', 'etiquette-merci', 'papier-de-soie', 'sceau', 'sceau-fond-bordeaux', 'sceau-encre-blanche', 'monogramme'];
const docs = process.argv.slice(2).length ? process.argv.slice(2) : ALL;
const OUT = process.env.OUT || path.join(__dirname, 'impression');
require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch();
  for (const d of docs) {
    const page = await b.newPage();
    page.on('pageerror', e => console.log('ERR', d, e.message));
    const url = 'file://' + path.join(__dirname, 'brand.html') + '?doc=' + d;
    await page.goto(url); await page.waitForFunction(() => window.READY);
    const [w, h] = await page.evaluate(() => window.DOC_SIZE);
    const dpmm = d === 'affiche-A3' || d === 'papier-de-soie' ? 6 : 11.82; // affiche ~150 dpi, petits formats ~300 dpi
    await page.setViewportSize({ width: Math.round(w * 3.7795), height: Math.round(h * 3.7795) });
    const p2 = await b.newPage({ viewport: { width: Math.round(w * 3.7795), height: Math.round(h * 3.7795) }, deviceScaleFactor: dpmm / 3.7795 });
    await p2.goto(url); await p2.waitForFunction(() => window.READY);
    await p2.locator('#s').screenshot({ path: path.join(OUT, `by-lau-${d}.png`), omitBackground: true });
    if (!process.env.NOPDF) await page.pdf({ path: path.join(OUT, `by-lau-${d}.pdf`), width: w + 'mm', height: h + 'mm', printBackground: true, pageRanges: '1' });
    await page.close(); await p2.close();
    console.log('✔', d);
  }
  await b.close();
})();
