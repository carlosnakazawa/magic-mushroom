import { INGREDIENTS, type IngredientKind } from '../data/ingredients';
import { canAddIngredient, matchRecipe, type Method, type RecipeDef, type Vessel } from '../data/recipes';

let nextItemId = 1;

export interface IngredientItem {
  readonly id: number;
  type: 'ingredient';
  kind: IngredientKind;
  chopped: boolean;
  /** Incrementa quando o visual precisa ser reconstruído. */
  version: number;
}

/** Tigela, copo ou prato. `method` diz como o conteúdo foi feito (null = vazio). */
export interface VesselItem {
  readonly id: number;
  type: 'vessel';
  vessel: Vessel;
  contents: IngredientKind[];
  method: Method | null;
  dirty: boolean;
  version: number;
}

/** Ferramentas (por enquanto só o extintor mágico). */
export interface ToolItem {
  readonly id: number;
  type: 'tool';
  tool: 'extinguisher';
  version: number;
}

export type Item = IngredientItem | VesselItem | ToolItem;

export const VESSEL_NAMES: Record<Vessel, string> = { bowl: 'tigela', cup: 'copo', plate: 'prato' };

export function makeIngredient(kind: IngredientKind, chopped = false): IngredientItem {
  return { id: nextItemId++, type: 'ingredient', kind, chopped, version: 0 };
}

export function makeVessel(vessel: Vessel, dirty = false): VesselItem {
  return { id: nextItemId++, type: 'vessel', vessel, contents: [], method: null, dirty, version: 0 };
}

/** Compatibilidade com a Etapa 1. */
export function makeBowl(dirty = false): VesselItem {
  return makeVessel('bowl', dirty);
}

export function makeExtinguisher(): ToolItem {
  return { id: nextItemId++, type: 'tool', tool: 'extinguisher', version: 0 };
}

export function isEmptyVessel(item: Item | null, vessel?: Vessel): item is VesselItem {
  return !!item && item.type === 'vessel' && !item.dirty && item.contents.length === 0 && (!vessel || item.vessel === vessel);
}

/** Receita pronta dentro do recipiente (confere o recipiente certo), ou null. */
export function dishRecipe(item: Item | null): RecipeDef | null {
  if (!item || item.type !== 'vessel' || item.dirty || !item.method) return null;
  const r = matchRecipe(item.method, item.contents);
  return r && r.vessel === item.vessel ? r : null;
}

/** Suja o recipiente (cliente terminou de comer). */
export function soil(item: VesselItem): void {
  item.dirty = true;
  item.contents = [];
  item.method = null;
  item.version++;
}

/** Enche um recipiente vazio com o resultado de uma máquina. */
export function fillVessel(item: VesselItem, method: Method, contents: readonly IngredientKind[]): void {
  item.contents = [...contents];
  item.method = method;
  item.version++;
}

export function emptyVessel(item: VesselItem): void {
  item.contents = [];
  item.method = null;
  item.version++;
}

export function itemName(item: Item): string {
  if (item.type === 'tool') return 'Extintor mágico';
  if (item.type === 'ingredient') {
    const n = INGREDIENTS[item.kind].name;
    return item.chopped ? `${n} picado` : n;
  }
  if (item.dirty) return DIRTY_NAMES[item.vessel];
  const r = dishRecipe(item);
  if (r) return r.name;
  return item.contents.length ? 'Tigela montando' : EMPTY_NAMES[item.vessel];
}

const DIRTY_NAMES: Record<Vessel, string> = { bowl: 'Tigela suja', cup: 'Copo sujo', plate: 'Prato sujo' };
const EMPTY_NAMES: Record<Vessel, string> = { bowl: 'Tigela vazia', cup: 'Copo vazio', plate: 'Prato vazio' };

function canMerge(bowl: VesselItem, ing: IngredientItem): boolean {
  return (
    bowl.vessel === 'bowl' &&
    !bowl.dirty &&
    (bowl.method === null || bowl.method === 'assemble') &&
    ing.chopped &&
    canAddIngredient('assemble', bowl.contents, ing.kind)
  );
}

export interface MergeResult {
  held: Item | null;
  counter: Item | null;
}

/**
 * Tenta juntar o item da mão com o item do balcão (ingrediente picado ↔ tigela limpa,
 * em qualquer ordem). Retorna null se não combinam.
 */
export function tryMerge(held: Item, counter: Item): MergeResult | null {
  if (held.type === 'ingredient' && counter.type === 'vessel' && canMerge(counter, held)) {
    counter.contents.push(held.kind);
    counter.method = 'assemble';
    counter.version++;
    return { held: null, counter };
  }
  if (held.type === 'vessel' && counter.type === 'ingredient' && canMerge(held, counter)) {
    held.contents.push(counter.kind);
    held.method = 'assemble';
    held.version++;
    return { held, counter: null };
  }
  return null;
}
