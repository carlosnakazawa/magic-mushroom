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

/** Sorteia o tamanho do grupo entre `minSeats` e `maxSeats` (pesos do nível). */
export function rollPartySize(level: LevelDef, minSeats: number, maxSeats: number, rng: Rng): number {
  const sizes = level.partySizeWeights
    .map((weight, size) => ({ value: size, weight: size >= minSeats && size <= maxSeats ? weight : 0 }))
    .filter((s) => s.weight > 0);
  return sizes.length ? pickWeighted(sizes, rng) : Math.max(1, Math.min(minSeats, maxSeats));
}

export function rollRecipes(pool: readonly { id: RecipeId; weight: number }[], size: number, rng: Rng): RecipeId[] {
  const items = pool.map((r) => ({ value: r.id, weight: r.weight }));
  return Array.from({ length: size }, () => pickWeighted(items, rng));
}

/** Sorteia um grupo que caiba em `maxSeats` lugares (e tenha pelo menos `minSeats`). */
export function rollParty(level: LevelDef, maxSeats: number, rng: Rng, minSeats = 1): RecipeId[] {
  return rollRecipes(level.recipes, rollPartySize(level, minSeats, maxSeats, rng), rng);
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
