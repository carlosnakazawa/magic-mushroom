import { describe, expect, it } from 'vitest';
import { TUNING } from '../config';
import { Machine } from './machine';

const m = TUNING.machines;

describe('Machine', () => {
  it('liquidificador precisa ser ligado e nunca queima', () => {
    const b = new Machine('blender');
    expect(b.canAdd('berry', false)).toBe(true);
    expect(b.canAdd('berry', true)).toBe(false);
    b.add('berry');
    expect(b.phase).toBe('idle');
    expect(b.start()).toBe(true);
    expect(b.update(m.blendTime + 0.01)).toEqual(['done']);
    b.update(999);
    expect(b.phase).toBe('done');
    expect(b.take()?.recipe.id).toBe('juice_berry');
    expect(b.phase).toBe('idle');
  });

  it('caldeirão começa sozinho quando a receita fica completa', () => {
    const c = new Machine('cauldron');
    expect(c.canAdd('carrot', false)).toBe(false);
    c.add('carrot');
    expect(c.phase).toBe('working');
  });

  it('chapa passa por pronto → aviso → queimado → fogo', () => {
    const g = new Machine('griddle');
    g.add('batter');
    expect(g.update(m.grillTime + 0.01)).toEqual(['done']);
    expect(g.update(m.safeTime + 0.01)).toEqual(['warning']);
    expect(g.ready).toBe(true);
    expect(g.update(m.warnTime + 0.01)).toEqual(['burnt']);
    expect(g.take()).toBeNull();
    expect(g.update(m.burntToFire + 0.01)).toEqual(['fire']);
    expect(g.spray(m.extinguishTime / 2)).toBe(false);
    expect(g.spray(m.extinguishTime)).toBe(true);
    expect(g.phase).toBe('idle');
    expect(g.contents).toEqual([]);
  });

  it('comida queimada pode ser jogada fora antes do fogo', () => {
    const g = new Machine('griddle');
    g.add('batter');
    g.update(m.grillTime + 0.01);
    g.update(m.safeTime + 0.01);
    g.update(m.warnTime + 0.01);
    expect(g.dump()).toBe(true);
    expect(g.phase).toBe('idle');
  });

  it('modo seguro não queima', () => {
    const g = new Machine('griddle');
    g.safe = true;
    g.add('batter');
    g.update(m.grillTime + 0.01);
    g.update(999);
    expect(g.phase).toBe('done');
  });

  it('bônus de velocidade acelera o trabalho', () => {
    const c = new Machine('cauldron');
    c.add('carrot');
    expect(c.update(m.cookTime / 2 + 0.01, 2)).toEqual(['done']);
  });
});
