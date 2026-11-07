import { describe, expect, it } from 'vitest';
import { hatToDpad, normalizePad, padFamily } from './pad';

const btns = (on: number[], n = 14) => Array.from({ length: n }, (_, i) => on.includes(i));

describe('controles', () => {
  it('reconhece controles do PlayStation', () => {
    expect(padFamily('DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)')).toBe('ps');
    expect(padFamily('Xbox 360 Controller (XInput STANDARD GAMEPAD)')).toBe('xbox');
  });

  it('mapa padrão passa direto', () => {
    const n = normalizePad({ id: 'x', mapping: 'standard', buttons: btns([0]), axes: [0.5, -0.5] });
    expect(n.buttons[0]).toBe(true);
    expect(n.axes).toEqual([0.5, -0.5]);
  });

  it('DualSense sem mapa: ✕ (cru 1) vira pegar (0) e □ (cru 0) vira usar (2)', () => {
    const id = 'Wireless Controller (Vendor: 054c Product: 0ce6)';
    expect(normalizePad({ id, mapping: '', buttons: btns([1]), axes: [] }).buttons[0]).toBe(true);
    const sq = normalizePad({ id, mapping: '', buttons: btns([0]), axes: [] });
    expect(sq.buttons[2]).toBe(true);
    expect(sq.buttons[0]).toBe(false);
    expect(normalizePad({ id, mapping: '', buttons: btns([9]), axes: [] }).buttons[9]).toBe(true);
  });

  it('direcional chapéu', () => {
    expect(hatToDpad(-1)).toEqual([true, false, false, false]);
    expect(hatToDpad(-3 / 7)).toEqual([false, false, false, true]);
    expect(hatToDpad(1 / 7)).toEqual([false, true, false, false]);
    expect(hatToDpad(5 / 7)).toEqual([false, false, true, false]);
    expect(hatToDpad(1.2857)).toEqual([false, false, false, false]);
    expect(hatToDpad(0)).toEqual([false, false, false, false]);
    const axes = [0, 0, 0, 0, 0, 0, 0, 0, 0, -1];
    expect(normalizePad({ id: 'Wireless Controller 054c', mapping: '', buttons: btns([]), axes }).buttons[12]).toBe(true);
  });
});
