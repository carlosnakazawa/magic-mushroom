import { describe, expect, it } from 'vitest';
import { HEROES } from '../data/characters';
import { perkMods, teamDrainScale } from './perks';

describe('super-poderes', () => {
  it('todo herói tem um super-poder que muda alguma coisa (exceto a aura da Lumi, que é de equipe)', () => {
    const neutral = JSON.stringify(perkMods('calm'));
    for (const h of HEROES) {
      if (h.perk === 'calm') continue;
      expect(JSON.stringify(perkMods(h.perk))).not.toBe(neutral);
    }
  });

  it('super-poderes são leves (nenhum dobra tudo)', () => {
    for (const h of HEROES) {
      const m = perkMods(h.perk);
      expect(m.speed).toBeLessThanOrEqual(1.2);
      expect(m.chop).toBeLessThanOrEqual(1.5);
      expect(m.tips).toBeLessThanOrEqual(3);
    }
  });

  it('a aura calma vale para a equipe toda', () => {
    expect(teamDrainScale(['speed', 'chop'])).toBe(1);
    expect(teamDrainScale(['speed', 'calm'])).toBeLessThan(1);
  });

  it('heróis à venda têm preço e não dependem de família', () => {
    const forSale = HEROES.filter((h) => h.price);
    expect(forSale.length).toBeGreaterThanOrEqual(3);
    for (const h of forSale) expect(h.family).toBeUndefined();
    expect(new Set(HEROES.map((h) => h.id)).size).toBe(HEROES.length);
  });
});
