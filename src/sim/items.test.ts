import { describe, expect, it } from 'vitest';
import { canAddToBowl, matchRecipe } from '../data/recipes';
import { dishRecipe, fillVessel, makeBowl, makeIngredient, makeVessel, soil, tryMerge } from './items';

describe('receitas', () => {
  it('reconhece receitas em qualquer ordem', () => {
    expect(matchRecipe('assemble', ['tomato', 'lettuce'])?.id).toBe('salad_ruby');
    expect(matchRecipe('assemble', ['glowshroom', 'lettuce', 'tomato'])?.id).toBe('salad_fairy');
    expect(matchRecipe('assemble', ['tomato'])).toBeNull();
    expect(matchRecipe('blend', ['glowshroom', 'berry'])?.id).toBe('potion_bubbly');
  });

  it('não deixa montar tigelas impossíveis ou repetidas', () => {
    expect(canAddToBowl([], 'tomato')).toBe(true);
    expect(canAddToBowl(['lettuce'], 'lettuce')).toBe(false);
    expect(canAddToBowl([], 'berry')).toBe(false);
  });
});

describe('tryMerge', () => {
  it('coloca ingrediente picado na tigela do balcão', () => {
    const bowl = makeBowl();
    const res = tryMerge(makeIngredient('lettuce', true), bowl);
    expect(res).toEqual({ held: null, counter: bowl });
    expect(dishRecipe(bowl)?.id).toBe('salad_green');
  });

  it('pega ingrediente do balcão com a tigela na mão', () => {
    const bowl = makeBowl();
    const res = tryMerge(bowl, makeIngredient('tomato', true));
    expect(res?.held).toBe(bowl);
    expect(res?.counter).toBeNull();
  });

  it('não aceita ingrediente cru, tigela suja, copo ou sopa', () => {
    expect(tryMerge(makeIngredient('lettuce'), makeBowl())).toBeNull();
    expect(tryMerge(makeIngredient('lettuce', true), makeBowl(true))).toBeNull();
    expect(tryMerge(makeIngredient('lettuce', true), makeVessel('cup'))).toBeNull();
    const soup = makeBowl();
    fillVessel(soup, 'cook', ['carrot']);
    expect(tryMerge(makeIngredient('lettuce', true), soup)).toBeNull();
  });
});

describe('recipientes', () => {
  it('prato só vale no recipiente certo', () => {
    const cup = makeVessel('cup');
    fillVessel(cup, 'blend', ['berry']);
    expect(dishRecipe(cup)?.id).toBe('juice_berry');
    const wrong = makeVessel('plate');
    fillVessel(wrong, 'blend', ['berry']);
    expect(dishRecipe(wrong)).toBeNull();
  });

  it('suja depois de comer', () => {
    const plate = makeVessel('plate');
    fillVessel(plate, 'grill', ['batter']);
    soil(plate);
    expect(plate.dirty).toBe(true);
    expect(dishRecipe(plate)).toBeNull();
  });
});
