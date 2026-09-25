import { describe, expect, it } from 'vitest';
import { Tutorial } from './tutorial';

describe('Tutorial', () => {
  it('avança pelo primeiro passo não concluído, mesmo fora de ordem', () => {
    const t = new Tutorial();
    expect(t.current).toBe(0);
    expect(t.handle('pickLettuce')).toBe(true);
    expect(t.current).toBe(0);
    t.handle('orderTaken');
    expect(t.current).toBe(2);
  });

  it('congela relógio e clientes até a primeira entrega', () => {
    const t = new Tutorial();
    expect(t.clockFrozen).toBe(true);
    expect(t.spawnsBlocked).toBe(true);
    t.handle('served');
    expect(t.clockFrozen).toBe(false);
    expect(t.spawnsBlocked).toBe(false);
  });

  it('termina quando todos os passos são feitos', () => {
    const t = new Tutorial();
    for (const s of t.steps) t.handle(s.event);
    expect(t.finished).toBe(true);
    expect(t.handle('served')).toBe(false);
  });
});
