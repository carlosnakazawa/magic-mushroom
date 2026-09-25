/**
 * Teste de fumaça visual: sobe o Vite, abre o jogo num Chromium headless, joga o
 * tutorial inteiro (anotar → alface → cortar → tigela → servir → recolher → lavar)
 * e salva screenshots em .screenshots/. Falha (exit 1) se algo quebrar.
 *
 * Uso:  npm run smoke            (1ª vez: npx playwright install chromium)
 * Dica: abra as imagens em .screenshots/ para conferir o visual depois de mudanças.
 */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const OUT = '.screenshots';
mkdirSync(OUT, { recursive: true });

const server = await createServer({ server: { port: 5199, strictPort: true }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({
  // WebGL por software: funciona em qualquer máquina/CI (lento, por isso ?speed=4).
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const errors = [];
let ok = false;
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 810 } });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  const until = async (fn, label, ms = 90_000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      if (await page.evaluate(fn)) return;
      await page.waitForTimeout(200);
    }
    throw new Error(`Timeout esperando: ${label}`);
  };
  // Teleporta o herói 1 (atalho de teste — o jogo expõe window.game)
  const tp = (x, z, facing) =>
    page.evaluate(([x, z, f]) => {
      const c = window.game.chefs[0];
      c.pos.set(x, 0, z);
      c.vel.set(0, 0, 0);
      c.facing = f;
    }, [x, z, facing]);
  // Segura a tecla um pouco: o WebGL por software roda a poucos quadros por segundo.
  const press = async (key) => {
    await page.waitForTimeout(400);
    await page.keyboard.down(key);
    await page.waitForTimeout(600);
    await page.keyboard.up(key);
    await page.waitForTimeout(300);
  };
  const NORTH = Math.PI;
  const SOUTH = 0;
  const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` });

  await page.goto('http://localhost:5199/?speed=4');
  await page.waitForSelector('text=Jogar sozinho', { timeout: 60_000 });
  await page.waitForTimeout(2500);
  await shot('01-titulo');
  await page.click('text=Jogar sozinho');

  await until(() => window.game.state === 'playing', 'dia começar');
  await until(() => window.game.parties[0]?.party.phase === 'waitingOrder', 'cliente sentar');
  const [tx, tz] = await page.evaluate(() => {
    const t = window.game.parties[0].table;
    return [t.x, t.z];
  });
  await tp(tx, tz - 0.85, SOUTH);
  await shot('02-cliente-esperando');
  await press('KeyE'); // anotar
  await until(() => window.game.parties[0].party.phase === 'ordered', 'pedido anotado');
  await tp(1, 2, NORTH);
  await press('Space'); // alface
  await tp(5, 2, NORTH);
  await press('Space'); // na tábua
  await press('KeyE'); // cortar
  await shot('03-cortando');
  await until(() => window.game.world.stations.some((s) => s.kind === 'board' && s.item?.chopped), 'alface picada');
  await press('Space'); // pega picada
  await tp(4, 2, NORTH);
  await press('Space'); // deixa no balcão
  await tp(8, 2, NORTH);
  await press('Space'); // tigela
  await tp(4, 2, NORTH);
  await press('Space'); // junta
  await tp(tx, tz - 0.85, SOUTH);
  await press('Space'); // serve
  await shot('04-comendo');
  await until(() => window.game.world.tables.some((t) => t.hasDirty), 'louça suja');
  await press('Space'); // recolhe + moedas
  await tp(9, 2, NORTH);
  await press('Space'); // pia
  await press('KeyE'); // lava
  await until(() => !window.game.tutorial, 'tutorial completo', 30_000);
  await page.waitForTimeout(1500);
  await shot('05-depois-do-tutorial');

  const result = await page.evaluate(() => ({ coins: window.game.coins, stats: window.game.stats }));
  console.log('Resultado:', JSON.stringify(result));
  if (result.coins <= 0 || result.stats.served < 1) throw new Error('Nenhuma moeda/prato após o tutorial');

  await page.evaluate(() => (window.game.timeLeft = 0.3));
  await page.waitForSelector('.results', { timeout: 30_000 });
  await page.waitForTimeout(2000);
  await shot('06-resultado');
  if (errors.length) throw new Error(`Erros no console:\n${errors.join('\n')}`);
  ok = true;
  console.log(`✅ Smoke OK — screenshots em ${OUT}/`);
} catch (e) {
  console.error('❌ Smoke falhou:', e.message);
} finally {
  await browser.close();
  await server.close();
}
process.exit(ok ? 0 : 1);
