import type { LevelDef } from '../data/levels';
import type { RecipeId } from '../data/recipes';

export type Rng = () => number;

export function pickWeighted<T>(items: readonly { value: T; weight: number }[], rng: Rng): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = rng() * total;
  for (const it of items) {
    r -= it.weight;
    if (r < 0) return it.value;
  }
  return items[items.length - 1]!.value;
}

/** Sorteia um grupo que caiba em `maxSeats` lugares. */
export function rollParty(level: LevelDef, maxSeats: number, rng: Rng): RecipeId[] {
  const sizes = level.partySizeWeights
    .map((weight, size) => ({ value: size, weight: size <= maxSeats ? weight : 0 }))
    .filter((s) => s.weight > 0);
  const size = sizes.length ? pickWeighted(sizes, rng) : 1;
  const recipes = level.recipes.map((r) => ({ value: r.id, weight: r.weight }));
  return Array.from({ length: size }, () => pickWeighted(recipes, rng));
}

export function nextSpawnDelay(level: LevelDef, rng: Rng): number {
  const [min, max] = level.spawnInterval;
  return min + (max - min) * rng();
}

/** RNG determinístico (mulberry32) — útil em testes e replays. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
