import { INGREDIENTS, type IngredientKind } from '../data/ingredients';
import { canAddToBowl, matchRecipe, type RecipeDef } from '../data/recipes';

let nextItemId = 1;

export interface IngredientItem {
  readonly id: number;
  type: 'ingredient';
  kind: IngredientKind;
  chopped: boolean;
  /** Incrementa quando o visual precisa ser reconstruído. */
  version: number;
}

export interface BowlItem {
  readonly id: number;
  type: 'bowl';
  contents: IngredientKind[];
  dirty: boolean;
  version: number;
}

export type Item = IngredientItem | BowlItem;

export function makeIngredient(kind: IngredientKind, chopped = false): IngredientItem {
  return { id: nextItemId++, type: 'ingredient', kind, chopped, version: 0 };
}

export function makeBowl(dirty = false): BowlItem {
  return { id: nextItemId++, type: 'bowl', contents: [], dirty, version: 0 };
}

export function bowlRecipe(item: Item | null): RecipeDef | null {
  if (!item || item.type !== 'bowl' || item.dirty) return null;
  return matchRecipe(item.contents);
}

export function itemName(item: Item): string {
  if (item.type === 'ingredient') {
    const n = INGREDIENTS[item.kind].name;
    return item.chopped ? `${n} picado` : n;
  }
  if (item.dirty) return 'Tigela suja';
  const r = matchRecipe(item.contents);
  if (r) return r.name;
  return item.contents.length ? 'Tigela montando' : 'Tigela vazia';
}

function canMerge(bowl: BowlItem, ing: IngredientItem): boolean {
  return !bowl.dirty && ing.chopped && canAddToBowl(bowl.contents, ing.kind);
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
  if (held.type === 'ingredient' && counter.type === 'bowl' && canMerge(counter, held)) {
    counter.contents.push(held.kind);
    counter.version++;
    return { held: null, counter };
  }
  if (held.type === 'bowl' && counter.type === 'ingredient' && canMerge(held, counter)) {
    held.contents.push(counter.kind);
    held.version++;
    return { held, counter: null };
  }
  return null;
}
