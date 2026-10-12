/**
 * Gera imagens dos heróis lado a lado (cores e silhueta) para avaliar o design.
 * Uso: node scripts/lineup.mjs [prefixo]   → .screenshots/<prefixo>-cores.png e <prefixo>-sombra.png
 */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const prefix = process.argv[2] ?? 'lineup';
mkdirSync('.screenshots', { recursive: true });
const server = await createServer({ server: { port: 5196, strictPort: true }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const [mode, q] of [['cores', 'lineup'], ['sombra', 'lineup=sombra']]) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 560 } });
  await page.goto(`http://localhost:5196/?${q}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForFunction(() => window.game?.state === 'lineup', null, { timeout: 90_000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `.screenshots/${prefix}-${mode}.png` });
  await page.close();
}
await browser.close();
await server.close();
console.log(`Imagens em .screenshots/${prefix}-cores.png e ${prefix}-sombra.png`);
