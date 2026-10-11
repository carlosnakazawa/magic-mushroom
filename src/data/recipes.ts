import type { IngredientKind } from './ingredients';
import type { FamilyId } from './families';
import { localize } from '../i18n';

export type RecipeId =
  | 'salad_green'
  | 'salad_ruby'
  | 'salad_fairy'
  | 'juice_berry'
  | 'potion_bubbly'
  | 'soup_carrot'
  | 'soup_cauldron'
  | 'pancake'
  | 'soup_bamboo';

/** Recipiente onde o prato é servido. */
export type Vessel = 'bowl' | 'cup' | 'plate';

/**
 * Como o prato é feito:
 * - assemble: ingredientes picados juntados na tigela (balcão)
 * - blend: liquidificador (ingredientes crus) → copo
 * - cook: caldeirão (ingredientes picados) → tigela
 * - grill: chapa (ingrediente cru) → prato
 */
export type Method = 'assemble' | 'blend' | 'cook' | 'grill';

export interface RecipeDef {
  id: RecipeId;
  name: string;
  emoji: string;
  vessel: Vessel;
  method: Method;
  /** Ingredientes necessários (conjunto, sem repetição). */
  ingredients: readonly IngredientKind[];
  price: number;
  /** Nível em que a receita aparece pela primeira vez. */
  level: number;
  /** Cor do líquido/comida pronta (sucos, sopas, panquecas). */
  color?: number;
  /** Receita temática de uma família desbloqueável. */
  family?: FamilyId;
}

export const RECIPES: Record<RecipeId, RecipeDef> = ({
  salad_green: { id: 'salad_green', emoji: '🥗', vessel: 'bowl', method: 'assemble', ingredients: ['lettuce'], price: 5, level: 1 },
  salad_ruby: { id: 'salad_ruby', emoji: '🥗', vessel: 'bowl', method: 'assemble', ingredients: ['lettuce', 'tomato'], price: 8, level: 1 },
  salad_fairy: {
    id: 'salad_fairy',
    emoji: '✨',
    vessel: 'bowl',
    method: 'assemble',
    ingredients: ['lettuce', 'tomato', 'glowshroom'],
    price: 12,
    level: 1,
  },
  juice_berry: { id: 'juice_berry', emoji: '🧃', vessel: 'cup', method: 'blend', ingredients: ['berry'], price: 7, level: 2, color: 0x8a5cff },
  potion_bubbly: {
    id: 'potion_bubbly',
    emoji: '🧪',
    vessel: 'cup',
    method: 'blend',
    ingredients: ['berry', 'glowshroom'],
    price: 12,
    level: 2,
    color: 0xff6bd6,
  },
  soup_carrot: { id: 'soup_carrot', emoji: '🥕', vessel: 'bowl', method: 'cook', ingredients: ['carrot'], price: 10, level: 3, color: 0xffa24a },
  soup_cauldron: {
    id: 'soup_cauldron',
    emoji: '🍲',
    vessel: 'bowl',
    method: 'cook',
    ingredients: ['carrot', 'glowshroom'],
    price: 15,
    level: 3,
    color: 0xc77dff,
  },
  pancake: { id: 'pancake', emoji: '🥞', vessel: 'plate', method: 'grill', ingredients: ['batter'], price: 11, level: 3, color: 0xf2b45c },
  soup_bamboo: {
    id: 'soup_bamboo',
    emoji: '🎍',
    vessel: 'bowl',
    method: 'cook',
    ingredients: ['bamboo', 'carrot'],
    price: 16,
    level: 3,
    color: 0x9ad86b,
    family: 'panda',
  },
}) as unknown as Record<RecipeId, RecipeDef>;
for (const r of Object.values(RECIPES)) localize(r, { name: `recipe.${r.id}` });

export const RECIPE_LIST: readonly RecipeDef[] = Object.values(RECIPES);

/** Recipiente de saída de cada método. */
export const METHOD_VESSEL: Record<Method, Vessel> = { assemble: 'bowl', blend: 'cup', cook: 'bowl', grill: 'plate' };

/** Ingredientes entram picados neste método? (senão, crus) */
export function needsChopped(method: Method): boolean {
  return method === 'assemble' || method === 'cook';
}

function sameSet(a: readonly IngredientKind[], b: readonly IngredientKind[]): boolean {
  return a.length === b.length && a.every((k) => b.includes(k));
}

/** Receita que corresponde exatamente ao método + conteúdo, ou null. */
export function matchRecipe(method: Method, contents: readonly IngredientKind[]): RecipeDef | null {
  return RECIPE_LIST.find((r) => r.method === method && sameSet(r.ingredients, contents)) ?? null;
}

/**
 * Pode adicionar este ingrediente? Só se não for repetido e se o resultado ainda
 * puder virar alguma receita desse método (evita "misturas impossíveis").
 */
export function canAddIngredient(method: Method, contents: readonly IngredientKind[], kind: IngredientKind): boolean {
  if (contents.includes(kind)) return false;
  const next = [...contents, kind];
  return RECIPE_LIST.some((r) => r.method === method && next.every((k) => r.ingredients.includes(k)));
}

/** Atalho para a montagem na tigela (Etapa 1). */
export function canAddToBowl(contents: readonly IngredientKind[], kind: IngredientKind): boolean {
  return canAddIngredient('assemble', contents, kind);
}
