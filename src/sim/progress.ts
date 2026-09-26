import { TUNING } from '../config';
import { FAMILIES, type FamilyId } from '../data/families';
import { DECOR_SLOTS, FURNITURE, WALLS, furnitureDef, wallDef, type FurnitureId, type WallId } from '../data/furniture';
import { LEVELS } from '../data/levels';

/** Teclas de ação de um jogador (movimento é fixo: WASD / setas). */
export interface KeyBinds {
  pick: string;
  use: string;
  swap: string;
}

export interface Settings {
  /** Modo sem pressa: paciência infinita e nada queima. */
  noRush: boolean;
  /** Textos maiores. */
  bigText: boolean;
  /** Menos partículas, sem tremer a tela, brilho mais suave. */
  reducedFx: boolean;
  music: boolean;
  keys: { p1: KeyBinds; p2: KeyBinds };
}

export interface SaveData {
  version: 1;
  /** Dias já jogados. */
  day: number;
  /** Moedas para gastar na loja noturna. */
  wallet: number;
  /** Moedas ganhas no total (histórico). */
  totalCoins: number;
  /** Melhor resultado (estrelas) por nível. */
  bestStars: Record<string, number>;
  /** Níveis já jogados ao menos uma vez (para mostrar dicas só na primeira vez). */
  played: number[];
  tutorialDone: boolean;
  owned: Partial<Record<FurnitureId, number>>;
  /** slotId → móvel colocado. */
  placed: Record<string, FurnitureId>;
  wall: WallId;
  wallsOwned: WallId[];
  families: FamilyId[];
  /** Os ajudantes descansaram na noite anterior (bônus no próximo dia). */
  rested: boolean;
  settings: Settings;
}

export const DEFAULT_KEYS: Settings['keys'] = {
  p1: { pick: 'Space', use: 'KeyE', swap: 'KeyQ' },
  p2: { pick: 'Enter', use: 'ShiftRight', swap: '' },
};

export function defaultSave(): SaveData {
  return {
    version: 1,
    day: 1,
    wallet: 0,
    totalCoins: 0,
    bestStars: {},
    played: [],
    tutorialDone: false,
    owned: { rug_round: 1 },
    placed: { rug1: 'rug_round' },
    wall: 'peach',
    wallsOwned: ['peach'],
    families: [],
    rested: false,
    settings: { noRush: false, bigText: false, reducedFx: false, music: true, keys: structuredClone(DEFAULT_KEYS) },
  };
}

/** Lê o save (JSON) com validação: qualquer coisa estranha volta ao padrão, sem quebrar o jogo. */
export function parseSave(json: string | null | undefined): SaveData {
  const base = defaultSave();
  if (!json) return base;
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return base;
  }
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<SaveData>;
  const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : d);
  const furnitureIds = new Set<string>(FURNITURE.map((f) => f.id));
  const slotIds = new Set(DECOR_SLOTS.map((s) => s.id));
  const owned: SaveData['owned'] = {};
  for (const [k, v] of Object.entries(r.owned ?? {})) if (furnitureIds.has(k)) owned[k as FurnitureId] = num(v, 0);
  const placed: SaveData['placed'] = {};
  for (const [slot, f] of Object.entries(r.placed ?? {})) {
    if (slotIds.has(slot) && furnitureIds.has(f as string)) placed[slot] = f as FurnitureId;
  }
  const wallIds = new Set<string>(WALLS.map((w) => w.id));
  const familyIds = new Set<string>(FAMILIES.map((f) => f.id));
  const s = (r.settings ?? {}) as Partial<Settings>;
  const keys = (k: Partial<KeyBinds> | undefined, d: KeyBinds): KeyBinds => ({
    pick: typeof k?.pick === 'string' && k.pick ? k.pick : d.pick,
    use: typeof k?.use === 'string' && k.use ? k.use : d.use,
    swap: typeof k?.swap === 'string' ? k.swap : d.swap,
  });
  const save: SaveData = {
    version: 1,
    day: Math.max(1, num(r.day, 1)),
    wallet: num(r.wallet, 0),
    totalCoins: num(r.totalCoins, 0),
    bestStars: Object.fromEntries(Object.entries(r.bestStars ?? {}).map(([k, v]) => [k, Math.min(3, num(v, 0))])),
    played: Array.isArray(r.played) ? r.played.filter((n): n is number => typeof n === 'number') : [],
    tutorialDone: !!r.tutorialDone,
    owned,
    placed,
    wall: wallIds.has(r.wall as string) ? (r.wall as WallId) : 'peach',
    wallsOwned: Array.isArray(r.wallsOwned) ? (r.wallsOwned.filter((w) => wallIds.has(w)) as WallId[]) : ['peach'],
    families: Array.isArray(r.families) ? (r.families.filter((f) => familyIds.has(f)) as FamilyId[]) : [],
    rested: !!r.rested,
    settings: {
      noRush: !!s.noRush,
      bigText: !!s.bigText,
      reducedFx: !!s.reducedFx,
      music: s.music !== false,
      keys: { p1: keys(s.keys?.p1, DEFAULT_KEYS.p1), p2: keys(s.keys?.p2, DEFAULT_KEYS.p2) },
    },
  };
  if (!save.wallsOwned.includes('peach')) save.wallsOwned.unshift('peach');
  // Colocados precisam existir no inventário
  for (const [slot, f] of Object.entries(save.placed)) {
    if (placedCount(save, f) > (save.owned[f] ?? 0)) delete save.placed[slot];
  }
  return save;
}

export function totalStars(save: SaveData): number {
  return Object.values(save.bestStars).reduce((a, b) => a + b, 0);
}

export function isLevelUnlocked(save: SaveData, levelId: number): boolean {
  return levelId <= 1 || (save.bestStars[levelId - 1] ?? 0) >= 1;
}

export interface DayResult {
  save: SaveData;
  /** Nível que acabou de ser liberado (ou null). */
  unlockedLevel: number | null;
  newFamilies: FamilyId[];
  newBest: boolean;
}

/** Registra o fim de um dia: moedas, estrelas, desbloqueios. Não altera o save de entrada. */
export function recordDay(input: SaveData, levelId: number, coins: number, stars: number): DayResult {
  const save = structuredClone(input);
  const wasUnlocked = LEVELS.map((l) => isLevelUnlocked(save, l.id));
  save.day += 1;
  save.wallet += coins;
  save.totalCoins += coins;
  if (!save.played.includes(levelId)) save.played.push(levelId);
  if (levelId === 1) save.tutorialDone = true;
  const prev = save.bestStars[levelId] ?? 0;
  const newBest = stars > prev;
  if (newBest) save.bestStars[levelId] = stars;
  save.rested = false;
  const unlockedLevel = LEVELS.find((l, i) => !wasUnlocked[i] && isLevelUnlocked(save, l.id))?.id ?? null;
  const newFamilies = FAMILIES.filter((f) => f.available && !save.families.includes(f.id) && totalStars(save) >= f.starsToUnlock).map((f) => f.id);
  save.families.push(...newFamilies);
  return { save, unlockedLevel, newFamilies, newBest };
}

/** Próxima família a desbloquear (para mostrar a meta). */
export function nextFamily(save: SaveData) {
  return FAMILIES.find((f) => !save.families.includes(f.id)) ?? null;
}

export function placedCount(save: SaveData, id: FurnitureId): number {
  return Object.values(save.placed).filter((f) => f === id).length;
}

/** Móveis visíveis na loja (exclusivos de família só depois de liberada). */
export function shopCatalog(save: SaveData) {
  return FURNITURE.filter((f) => !f.family || save.families.includes(f.family));
}

export type ShopError = 'noMoney' | 'locked' | 'owned';

export function buyFurniture(input: SaveData, id: FurnitureId): SaveData | ShopError {
  const def = furnitureDef(id);
  if (def.family && !input.families.includes(def.family)) return 'locked';
  if (input.wallet < def.price) return 'noMoney';
  const save = structuredClone(input);
  save.wallet -= def.price;
  save.owned[id] = (save.owned[id] ?? 0) + 1;
  return save;
}

export function buyWall(input: SaveData, id: WallId): SaveData | ShopError {
  if (input.wallsOwned.includes(id)) return 'owned';
  const def = wallDef(id);
  if (input.wallet < def.price) return 'noMoney';
  const save = structuredClone(input);
  save.wallet -= def.price;
  save.wallsOwned.push(id);
  save.wall = id;
  return save;
}

/** Coloca um móvel num espaço. Se o espaço estava ocupado, o antigo volta para o inventário. */
export function placeFurniture(input: SaveData, slotId: string, id: FurnitureId): SaveData | null {
  const slot = DECOR_SLOTS.find((s) => s.id === slotId);
  const def = furnitureDef(id);
  if (!slot || slot.kind !== def.kind) return null;
  const save = structuredClone(input);
  const alreadyHere = save.placed[slotId] === id;
  if (!alreadyHere && placedCount(save, id) >= (save.owned[id] ?? 0)) return null;
  save.placed[slotId] = id;
  return save;
}

export function removeFurniture(input: SaveData, slotId: string): SaveData {
  const save = structuredClone(input);
  delete save.placed[slotId];
  return save;
}

/** Móveis comprados que ainda não estão no salão. */
export function unplaced(save: SaveData): FurnitureId[] {
  const out: FurnitureId[] = [];
  for (const [id, n] of Object.entries(save.owned) as [FurnitureId, number][]) {
    for (let i = placedCount(save, id); i < n; i++) out.push(id);
  }
  return out;
}

/** Charme ✨ do salão: soma dos móveis colocados + parede. */
export function charm(save: SaveData): number {
  const furniture = Object.values(save.placed).reduce((sum, id) => sum + furnitureDef(id).charm, 0);
  return furniture + wallDef(save.wall).charm;
}

/** Multiplicador da perda de paciência (charme deixa os clientes mais calmos). */
export function patienceScale(charmPoints: number, noRush: boolean): number {
  if (noRush) return 0;
  return 1 - Math.min(TUNING.decor.maxCharmBonus, charmPoints * TUNING.decor.charmPerPoint);
}

/** Lugares na maior mesa de família colocada (0 se nenhuma). */
export function familySeats(save: SaveData): number {
  const id = save.placed['family1'];
  return id ? (furnitureDef(id).seats ?? 0) : 0;
}
