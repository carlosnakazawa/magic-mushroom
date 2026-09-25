import { describe, expect, it } from 'vitest';
import { TUNING } from '../config';
import { Party } from './party';

function orderedParty(recipes: ConstructorParameters<typeof Party>[0]) {
  const p = new Party(recipes);
  p.seated();
  p.takeOrder();
  return p;
}

describe('Party', () => {
  it('segue o fluxo chegar → anotar → comer → terminar', () => {
    const p = new Party(['salad_green']);
    expect(p.phase).toBe('arriving');
    expect(p.takeOrder()).toBe(false);
    p.seated();
    expect(p.phase).toBe('waitingOrder');
    expect(p.takeOrder()).toBe(true);
    expect(p.serve('salad_green')).toBe(0);
    const events = p.update(TUNING.customer.eatTime + 0.01);
    expect(events.map((e) => e.type)).toEqual(['memberDone', 'finished']);
    expect(p.phase).toBe('finished');
  });

  it('recusa pratos que ninguém pediu', () => {
    const p = orderedParty(['salad_green']);
    expect(p.serve('salad_fairy')).toBe(-1);
  });

  it('entrega prato a prato e recupera paciência do grupo todo', () => {
    const p = orderedParty(['salad_green', 'salad_ruby', 'salad_green']);
    p.patience = 0.3;
    expect(p.serve('salad_green')).toBe(0);
    expect(p.patience).toBeCloseTo(0.3 + TUNING.patience.serveRecovery);
    expect(p.serve('salad_green')).toBe(2);
    expect(p.allServed).toBe(false);
  });

  it('paga bônus de banquete para grupos de 3+', () => {
    const p = orderedParty(['salad_green', 'salad_green', 'salad_green']);
    p.serve('salad_green');
    p.serve('salad_green');
    p.serve('salad_green');
    const events = p.update(TUNING.customer.eatTime + 0.01);
    expect(events.some((e) => e.type === 'banquet')).toBe(true);
  });

  it('vai embora bravo quando a paciência acaba', () => {
    const p = new Party(['salad_green']);
    p.seated();
    const events = p.update(1 / TUNING.patience.orderDrain + 1);
    expect(events).toEqual([{ type: 'angry' }]);
    expect(p.isLeaving).toBe(true);
  });

  it('para de perder paciência quando todos já foram servidos', () => {
    const p = orderedParty(['salad_green']);
    p.serve('salad_green');
    const before = p.patience;
    p.update(1);
    expect(p.patience).toBe(before);
  });
});
