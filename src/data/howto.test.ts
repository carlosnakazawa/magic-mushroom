import { describe, expect, it } from 'vitest';
import { recipeSteps } from './howto';
import { RECIPES, RECIPE_LIST } from './recipes';

describe('como fazer cada receita', () => {
  it('salada: corta cada ingrediente, junta na tigela e serve', () => {
    expect(recipeSteps(RECIPES.salad_ruby).map((s) => s.key)).toEqual(['chop', 'chop', 'bowl', 'serve']);
  });
  it('suco: liquidificador e copo (sem cortar)', () => {
    expect(recipeSteps(RECIPES.juice_berry).map((s) => s.key)).toEqual(['blend', 'cup', 'serve']);
  });
  it('sopa e panqueca avisam do fogo', () => {
    expect(recipeSteps(RECIPES.soup_carrot).map((s) => s.key)).toEqual(['chop', 'cook', 'ladle', 'fire', 'serve']);
    expect(recipeSteps(RECIPES.pancake).map((s) => s.key)).toEqual(['grill', 'plate', 'fire', 'serve']);
  });
  it('toda receita termina servindo na mesa', () => {
    for (const r of RECIPE_LIST) expect(recipeSteps(r).at(-1)!.key).toBe('serve');
  });
});
