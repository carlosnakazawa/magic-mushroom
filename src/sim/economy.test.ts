import { describe, expect, it } from 'vitest';
import { LEVELS } from '../data/levels';
import { banquetBonus, dishPayment, starsFor } from './economy';
import { rollParty, seededRng } from './spawner';

describe('economia', () => {
  it('gorjeta cresce com a paciência', () => {
    expect(dishPayment(10, 0)).toBe(10);
    expect(dishPayment(10, 1)).toBe(15);
  });

  it('bônus só para grupos grandes', () => {
    expect(banquetBonus(2)).toBe(0);
    expect(banquetBonus(4)).toBeGreaterThan(0);
  });

  it('estrelas por meta', () => {
    expect(starsFor(0, [10, 20, 30])).toBe(0);
    expect(starsFor(25, [10, 20, 30])).toBe(2);
  });
});

describe('spawner', () => {
  it('respeita o número de lugares da mesa', () => {
    const rng = seededRng(42);
    for (let i = 0; i < 50; i++) {
      const party = rollParty(LEVELS[0]!, 1, rng);
      expect(party.length).toBe(1);
    }
  });
});
