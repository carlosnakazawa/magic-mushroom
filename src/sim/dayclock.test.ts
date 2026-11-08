import { describe, expect, it } from 'vitest';
import { clockPhase } from './dayclock';

const d = { lastCall: 30, overtimeMax: 45 };

describe('relógio do dia', () => {
  it('clientes chegam até os últimos segundos', () => {
    expect(clockPhase(120, 0, d)).toBe('open');
    expect(clockPhase(29, 3, d)).toBe('lastCall');
  });

  it('relógio zerado com clientes esperando vira hora extra', () => {
    expect(clockPhase(0, 2, d)).toBe('overtime');
    expect(clockPhase(-20, 1, d)).toBe('overtime');
  });

  it('acaba quando não há mais ninguém esperando', () => {
    expect(clockPhase(0, 0, d)).toBe('closed');
    expect(clockPhase(-10, 0, d)).toBe('closed');
  });

  it('hora extra tem limite (jogo gentil, mas não infinito)', () => {
    expect(clockPhase(-45, 2, d)).toBe('closed');
  });
});
