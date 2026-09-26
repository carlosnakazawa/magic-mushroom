/**
 * Teste de fumaça visual: sobe o Vite, abre o jogo num Chromium headless e percorre
 * o ciclo completo, salvando screenshots em .screenshots/. Falha (exit 1) se algo quebrar.
 *
 *  1. Título → mapa de níveis → Nível 1: tutorial inteiro (anotar → alface → cortar →
 *     tigela → servir → recolher → lavar)
 *  2. Fim do dia → resultado → noite: compra e posiciona o Tronco Encantado e uma luminária
 *  3. Mapa de níveis → Nível 3: chapa pega fogo e o extintor apaga; família de pandas
 *     senta na mesa grande
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

  const until = async (fn, label, ms = 90_000, arg) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      if (await page.evaluate(fn, arg)) return;
      await page.waitForTimeout(200);
    }
    throw new Error(`Timeout esperando: ${label}`);
  };
  // Teleporta o herói 1 (atalho de teste — o jogo expõe window.game)
  const tp = (x, z, facing) =>
    page.evaluate(([x, z, f]) => {
      const c = window.game.day.chefs[0];
      c.pos.set(x, 0, z);
      c.vel.set(0, 0, 0);
      c.facing = f;
    }, [x, z, facing]);
  // Segura a tecla um pouco: o WebGL por software roda a poucos quadros por segundo.
  const press = async (key, hold = 600) => {
    await page.waitForTimeout(400);
    await page.keyboard.down(key);
    await page.waitForTimeout(hold);
    await page.keyboard.up(key);
    await page.waitForTimeout(300);
  };
  const N = Math.PI;
  const S = 0;
  const W = -Math.PI / 2;
  const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` });
  const click = async (text) => {
    await page.getByText(text, { exact: false }).first().click();
    await page.waitForTimeout(600);
  };

  // ───────── 1. Nível 1 com tutorial ─────────
  await page.goto('http://localhost:5199/?speed=4');
  await page.waitForSelector('text=Jogar sozinho', { timeout: 60_000 });
  await page.waitForTimeout(2500);
  await shot('01-titulo');
  await click('Jogar sozinho');
  await page.waitForSelector('.level-card');
  await shot('02-niveis');
  await click('Salada Feérica');

  await until(() => window.game.state === 'day', 'dia começar');
  await until(() => window.game.day.parties[0]?.party.phase === 'waitingOrder', 'cliente sentar');
  const [tx, tz] = await page.evaluate(() => {
    const t = window.game.day.parties[0].table;
    return [t.x, t.z];
  });
  await tp(tx, tz - 0.85, S);
  await shot('03-cliente-esperando');
  await press('KeyE'); // anotar
  await until(() => window.game.day.parties[0].party.phase === 'ordered', 'pedido anotado');
  await tp(1, 2, N);
  await press('Space'); // alface
  await tp(5, 2, N);
  await press('Space'); // na tábua
  await press('KeyE'); // cortar
  await shot('04-cortando');
  await until(() => window.game.world.stations.some((s) => s.kind === 'board' && s.item?.chopped), 'alface picada');
  await press('Space'); // pega picada
  await tp(4, 2, N);
  await press('Space'); // deixa no balcão
  await tp(8, 2, N);
  await press('Space'); // tigela
  await tp(4, 2, N);
  await press('Space'); // junta
  await tp(tx, tz - 0.85, S);
  await press('Space'); // serve
  await shot('05-comendo');
  await until(() => window.game.world.tables.some((t) => t.hasDirty), 'louça suja');
  await press('Space'); // recolhe + moedas
  await tp(9, 2, N);
  await press('Space'); // pia
  await press('KeyE'); // lava
  await until(() => !window.game.day.tutorial, 'tutorial completo', 30_000);
  const day1 = await page.evaluate(() => ({ coins: window.game.day.coins, stats: window.game.day.stats }));
  console.log('Nível 1:', JSON.stringify(day1));
  if (day1.coins <= 0 || day1.stats.served < 1) throw new Error('Nenhuma moeda/prato após o tutorial');

  // ───────── 2. Resultado e noite ─────────
  await page.evaluate(() => (window.game.day.timeLeft = 0.3));
  await page.waitForSelector('.results', { timeout: 30_000 });
  await page.waitForTimeout(2000);
  await shot('06-resultado');
  await click('Ir para a noite');
  await page.waitForSelector('.night-panel', { timeout: 30_000 });
  await page.evaluate(() => {
    const n = window.game.night;
    n.save = { ...n.save, wallet: 400 };
    n.panel.render(n.save);
  });
  await page.waitForTimeout(3500);
  await shot('07-noite');
  await click('Tronco Encantado');
  await page.locator('.np-card', { hasText: 'Tronco Encantado' }).locator('button.buy').click();
  await page.waitForSelector('.np-slots button');
  await page.waitForTimeout(800);
  await shot('08-posicionando');
  await page.locator('.np-slots button').first().click();
  await page.waitForTimeout(800);
  await click('💡 Luzes');
  await page.locator('.np-card', { hasText: 'Luminária de Cristal' }).locator('button.buy').click();
  await page.locator('.np-slots button').first().click();
  await page.waitForTimeout(1500);
  await shot('09-decorado');
  const placed = await page.evaluate(() => window.game.save.placed);
  console.log('Decoração:', JSON.stringify(placed));
  if (placed.family1 !== 'enchanted_log' || placed.light1 !== 'lamp_crystal') throw new Error('Móveis não foram posicionados');
  await click('Abrir o bistrô');
  await page.waitForSelector('.level-card');

  // ───────── 3. Nível 3: fogo, extintor e família panda ─────────
  await page.evaluate(() => {
    const g = window.game;
    g.save = { ...g.save, bestStars: { 1: 3, 2: 2 }, families: ['panda'] };
    g.showLevels();
  });
  await page.waitForTimeout(500);
  await click('Caldeirão & Chapa');
  await until(() => window.game.state === 'day' && window.game.level.id === 3, 'nível 3');
  await page.evaluate(() => {
    const d = window.game.day;
    d.tipsLeft = 0.1;
    d.spawnIn = 999;
  });
  await tp(6, 2, N);
  await press('Space'); // massa
  await tp(2, 7, W);
  await press('Space'); // na chapa
  await until(() => window.game.world.stations.some((s) => s.machine?.kind === 'griddle' && s.machine.phase === 'working'), 'chapa ligada');
  await page.evaluate(() => {
    const m = window.game.world.stations.find((s) => s.machine?.kind === 'griddle' && s.machine.contents.length).machine;
    m.phase = 'fire';
    m.version++;
  });
  await page.waitForTimeout(1500);
  await shot('10-fogo');
  await tp(2, 8, W);
  await press('Space'); // extintor
  await tp(2, 7, W);
  await press('KeyE', 400);
  await until(() => !window.game.world.stations.some((s) => s.machine?.phase === 'fire'), 'fogo apagado', 30_000);
  await shot('11-apagado');

  await page.evaluate(() => {
    const g = window.game;
    const table = g.world.tables.find((t) => t.isFamily);
    g.day.spawnParty(table, ['soup_bamboo', 'pancake', 'juice_berry', 'soup_carrot', 'salad_ruby'], { species: 'panda', body: 0xfbfbf8, belly: 0xffffff, accent: 0x2e2c36 });
  });
  await until(() => window.game.day.parties.some((p) => p.party.size > 2 && p.party.phase === 'waitingOrder'), 'família sentar', 120_000);
  await page.evaluate(() => {
    const d = window.game.day;
    const ap = d.parties.find((p) => p.party.size > 2);
    d.takeOrder(ap.table, d.chefs[0]);
  });
  await page.waitForTimeout(1500);
  await shot('12-familia-panda');

  if (errors.length) throw new Error(`Erros no console:\n${errors.join('\n')}`);
  ok = true;
  console.log(`✅ Smoke OK — screenshots em ${OUT}/`);
} catch (e) {
  console.error('❌ Smoke falhou:', e.message);
  if (errors.length) console.error(errors.join('\n'));
} finally {
  await browser.close();
  await server.close();
}
process.exit(ok ? 0 : 1);
