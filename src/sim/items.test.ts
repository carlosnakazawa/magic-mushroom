import { describe, expect, it } from 'vitest';
import { canAddToBowl, matchRecipe } from '../data/recipes';
import { bowlRecipe, makeBowl, makeIngredient, tryMerge } from './items';

describe('receitas', () => {
  it('reconhece receitas em qualquer ordem', () => {
    expect(matchRecipe(['tomato', 'lettuce'])?.id).toBe('salad_ruby');
    expect(matchRecipe(['glowshroom', 'lettuce', 'tomato'])?.id).toBe('salad_fairy');
    expect(matchRecipe(['tomato'])).toBeNull();
  });

  it('não deixa montar tigelas impossíveis ou repetidas', () => {
    expect(canAddToBowl([], 'tomato')).toBe(true);
    expect(canAddToBowl(['lettuce'], 'lettuce')).toBe(false);
  });
});

describe('tryMerge', () => {
  it('coloca ingrediente picado na tigela do balcão', () => {
    const bowl = makeBowl();
    const res = tryMerge(makeIngredient('lettuce', true), bowl);
    expect(res).toEqual({ held: null, counter: bowl });
    expect(bowlRecipe(bowl)?.id).toBe('salad_green');
  });

  it('pega ingrediente do balcão com a tigela na mão', () => {
    const bowl = makeBowl();
    const res = tryMerge(bowl, makeIngredient('tomato', true));
    expect(res?.held).toBe(bowl);
    expect(res?.counter).toBeNull();
  });

  it('não aceita ingrediente cru nem tigela suja', () => {
    expect(tryMerge(makeIngredient('lettuce'), makeBowl())).toBeNull();
    expect(tryMerge(makeIngredient('lettuce', true), makeBowl(true))).toBeNull();
  });
});
