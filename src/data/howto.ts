import { INGREDIENTS } from './ingredients';
import type { RecipeDef } from './recipes';

/**
 * Passo a passo de cada receita, em figuras, para o cartão "Como fazer".
 * Gerado a partir do método da receita: uma receita nova já ganha o seu guia.
 * O texto de cada passo é a chave `how.<key>` do dicionário (src/i18n).
 */
export type HowKey = 'chop' | 'bowl' | 'blend' | 'cup' | 'cook' | 'ladle' | 'grill' | 'plate' | 'fire' | 'serve';

export interface HowStep {
  key: HowKey;
  /** Figuras do passo, lidas da esquerda para a direita (➜ separa antes/depois). */
  icons: string[];
  /** Ingrediente citado no texto ({ing}). */
  ing?: string;
}

/** Ícones das estações (os mesmos das dicas de nível). */
export const STATION_ICON = {
  board: '🔪',
  bowl: '🥣',
  cup: '🥤',
  plate: '🍽️',
  blender: '🧃',
  cauldron: '🍲',
  griddle: '🥞',
  table: '🐾',
} as const;

export function recipeSteps(r: RecipeDef): HowStep[] {
  const ings = r.ingredients.map((k) => INGREDIENTS[k]);
  const all = ings.map((i) => i.emoji);
  const steps: HowStep[] = [];
  const chopEach = () => {
    for (const i of ings) steps.push({ key: 'chop', icons: [i.emoji, '➜', STATION_ICON.board], ing: `${i.emoji} ${i.name}` });
  };
  switch (r.method) {
    case 'assemble':
      chopEach();
      steps.push({ key: 'bowl', icons: [...all, '➜', STATION_ICON.bowl] });
      break;
    case 'blend':
      steps.push({ key: 'blend', icons: [...all, '➜', STATION_ICON.blender] });
      steps.push({ key: 'cup', icons: [STATION_ICON.cup, '➜', STATION_ICON.blender] });
      break;
    case 'cook':
      chopEach();
      steps.push({ key: 'cook', icons: [...all, '➜', STATION_ICON.cauldron] });
      steps.push({ key: 'ladle', icons: [STATION_ICON.bowl, '➜', STATION_ICON.cauldron] });
      break;
    case 'grill':
      steps.push({ key: 'grill', icons: [...all, '➜', STATION_ICON.griddle] });
      steps.push({ key: 'plate', icons: [STATION_ICON.plate, '➜', STATION_ICON.griddle] });
      break;
  }
  if (r.method === 'cook' || r.method === 'grill') steps.push({ key: 'fire', icons: ['⚠️', '🔥', '➜', '🧯'] });
  steps.push({ key: 'serve', icons: [r.emoji, '➜', STATION_ICON.table] });
  return steps;
}
