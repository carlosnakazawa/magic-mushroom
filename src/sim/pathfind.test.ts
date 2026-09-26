import { describe, expect, it } from 'vitest';
import { findPath, simplify } from './pathfind';

const grid = ['.....', '.###.', '.....'];
const walk = (x: number, z: number) => grid[z]?.[x] === '.';

describe('pathfind', () => {
  it('contorna obstáculos', () => {
    const p = findPath(walk, [0, 1], [4, 1]);
    expect(p).not.toBeNull();
    expect(p!.every(([x, z]) => walk(x, z))).toBe(true);
    expect(p![p!.length - 1]).toEqual([4, 1]);
  });

  it('não corta quinas na diagonal', () => {
    const p = findPath(walk, [0, 0], [4, 2])!;
    for (let i = 1; i < p.length; i++) {
      const [ax, az] = p[i - 1]!;
      const [bx, bz] = p[i]!;
      if (ax !== bx && az !== bz) expect(walk(bx, az) && walk(ax, bz)).toBe(true);
    }
  });

  it('retorna null quando não há caminho', () => {
    const closed = (x: number, z: number) => x < 2 && x >= 0 && z === 0;
    expect(findPath(closed, [0, 0], [4, 0])).toBeNull();
  });

  it('simplifica trechos retos', () => {
    const open = () => true;
    expect(
      simplify(open, [
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0],
      ]),
    ).toEqual([
      [0, 0],
      [3, 0],
    ]);
  });
});
