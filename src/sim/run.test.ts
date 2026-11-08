import { describe, expect, it } from 'vitest';
import { runMultiplier } from './run';

const p = { runAfter: 0.5, runRamp: 0.5, runBoost: 1.4 };

describe('corrida automática', () => {
  it('anda normal logo que começa a mover', () => {
    expect(runMultiplier(0, p)).toBe(1);
    expect(runMultiplier(0.5, p)).toBe(1);
  });
  it('acelera aos poucos depois de segurar', () => {
    expect(runMultiplier(0.75, p)).toBeCloseTo(1.2);
  });
  it('não passa do limite', () => {
    expect(runMultiplier(1, p)).toBeCloseTo(1.4);
    expect(runMultiplier(10, p)).toBeCloseTo(1.4);
  });
});
