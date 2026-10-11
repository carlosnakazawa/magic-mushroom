import { describe, expect, it } from 'vitest';
import {
  buyFurniture,
  buyWall,
  charm,
  defaultSave,
  familySeats,
  isLevelUnlocked,
  parseSave,
  patienceScale,
  placeFurniture,
  recordDay,
  removeFurniture,
  unplaced,
  type SaveData,
} from './progress';

describe('save', () => {
  it('lê saves quebrados sem travar', () => {
    expect(parseSave('isso nao e json').day).toBe(1);
    expect(parseSave(null).wallet).toBe(0);
    const s = parseSave(JSON.stringify({ wallet: -5, owned: { xyz: 3 }, placed: { rug1: 'rug_star' } }));
    expect(s.wallet).toBe(0);
    expect(s.owned).toEqual({});
    expect(s.placed).toEqual({});
  });

  it('ida e volta preserva os dados', () => {
    const s = defaultSave();
    s.wallet = 42;
    s.bestStars = { '1': 2 };
    expect(parseSave(JSON.stringify(s))).toEqual(s);
  });
});

describe('progressão', () => {
  it('libera o nível seguinte com 1 estrela', () => {
    const s = defaultSave();
    expect(isLevelUnlocked(s, 2)).toBe(false);
    const r = recordDay(s, 1, 50, 1);
    expect(r.unlockedLevel).toBe(2);
    expect(r.save.wallet).toBe(50);
    expect(r.save.tutorialDone).toBe(true);
    expect(s.wallet).toBe(0);
  });

  it('desbloqueia a Família Panda com 4 estrelas', () => {
    let s = defaultSave();
    s = recordDay(s, 1, 150, 3).save;
    const r = recordDay(s, 2, 60, 1);
    expect(r.newFamilies).toEqual(['panda']);
    expect(recordDay(r.save, 2, 60, 1).newFamilies).toEqual([]);
  });
});

describe('loja e decoração', () => {
  it('compra, coloca e troca móveis', () => {
    let s = defaultSave();
    expect(buyFurniture(s, 'lamp_crystal')).toBe('noMoney');
    s.wallet = 200;
    s = buyFurniture(s, 'enchanted_log') as SaveData;
    expect(s.wallet).toBe(80);
    expect(unplaced(s)).toEqual(['enchanted_log']);
    expect(placeFurniture(s, 'light1', 'enchanted_log')).toBeNull();
    s = placeFurniture(s, 'family1', 'enchanted_log')!;
    expect(familySeats(s)).toBe(6);
    expect(unplaced(s)).toEqual([]);
    s = removeFurniture(s, 'family1');
    expect(familySeats(s)).toBe(0);
  });

  it('móveis de família ficam bloqueados até liberar a família', () => {
    const s = defaultSave();
    s.wallet = 999;
    expect(buyFurniture(s, 'panda_lantern')).toBe('locked');
  });

  it('charme deixa clientes mais pacientes (com limite)', () => {
    let s = defaultSave();
    s.wallet = 100;
    s = buyWall(s, 'mint') as SaveData;
    expect(charm(s)).toBe(2);
    expect(patienceScale(10, false)).toBeCloseTo(0.9);
    expect(patienceScale(500, false)).toBeCloseTo(0.7);
    expect(patienceScale(0, true)).toBe(0);
  });
});

describe('heróis e presente', () => {
  it('contrata heróis com moedas do jogo', async () => {
    const { hireHero, teamHeroes, heroesForSale } = await import('./progress');
    let s = defaultSave();
    expect(teamHeroes(s).map((h) => h.id)).toEqual(['puff', 'florzinha', 'pipoca', 'astro', 'estrelinha']);
    expect(hireHero(s, 'bolota')).toBe('noMoney');
    expect(hireHero(s, 'puff')).toBe('locked');
    s.wallet = 200;
    s = hireHero(s, 'bolota') as SaveData;
    expect(s.wallet).toBe(80);
    expect(teamHeroes(s).some((h) => h.id === 'bolota')).toBe(true);
    expect(heroesForSale(s).some((h) => h.id === 'bolota')).toBe(false);
    expect(hireHero(s, 'bolota')).toBe('owned');
  });

  it('presente de boas-vindas só uma vez', async () => {
    const { claimWelcomeGift } = await import('./progress');
    const first = claimWelcomeGift(defaultSave());
    expect(first.amount).toBeGreaterThan(0);
    expect(claimWelcomeGift(first.save).amount).toBe(0);
  });

  it('save antigo (sem campos novos) continua válido', () => {
    const old = JSON.parse(JSON.stringify(defaultSave()));
    delete old.heroesOwned;
    delete old.welcomeGift;
    const s = parseSave(JSON.stringify({ ...old, heroesOwned: ['xyz', 'puff', 'gota'] }));
    expect(s.heroesOwned).toEqual(['gota']);
    expect(parseSave(JSON.stringify(old)).welcomeGift).toBe(false);
  });
});
