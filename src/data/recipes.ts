import type { IngredientKind } from './ingredients';

export type RecipeId = 'salad_green' | 'salad_ruby' | 'salad_fairy';

export interface RecipeDef {
  id: RecipeId;
  name: string;
  emoji: string;
  /** Ingredientes picados necessários (conjunto, sem repetição). */
  ingredients: readonly IngredientKind[];
  price: number;
  /** Nível em que a receita aparece pela primeira vez. */
  level: number;
}

export const RECIPES: Record<RecipeId, RecipeDef> = {
  salad_green: { id: 'salad_green', name: 'Salada Verde', emoji: '🥬', ingredients: ['lettuce'], price: 5, level: 1 },
  salad_ruby: { id: 'salad_ruby', name: 'Salada Rubi', emoji: '🍅', ingredients: ['lettuce', 'tomato'], price: 8, level: 1 },
  salad_fairy: {
    id: 'salad_fairy',
    name: 'Salada Feérica',
    emoji: '✨',
    ingredients: ['lettuce', 'tomato', 'glowshroom'],
    price: 12,
    level: 1,
  },
};

export const RECIPE_LIST: readonly RecipeDef[] = Object.values(RECIPES);

function sameSet(a: readonly IngredientKind[], b: readonly IngredientKind[]): boolean {
  return a.length === b.length && a.every((k) => b.includes(k));
}

/** Receita que corresponde exatamente ao conteúdo da tigela, ou null. */
export function matchRecipe(contents: readonly IngredientKind[]): RecipeDef | null {
  return RECIPE_LIST.find((r) => sameSet(r.ingredients, contents)) ?? null;
}

/**
 * Pode colocar este ingrediente na tigela? Só se não for repetido e se o resultado
 * ainda puder virar alguma receita (evita "tigelas impossíveis" — mais amigável para crianças).
 */
export function canAddToBowl(contents: readonly IngredientKind[], kind: IngredientKind): boolean {
  if (contents.includes(kind)) return false;
  const next = [...contents, kind];
  return RECIPE_LIST.some((r) => next.every((k) => r.ingredients.includes(k)));
}
