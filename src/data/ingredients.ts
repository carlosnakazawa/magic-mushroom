export type IngredientKind = 'lettuce' | 'tomato' | 'glowshroom' | 'berry' | 'carrot' | 'batter' | 'bamboo';

import { localize } from '../i18n';

export interface IngredientDef {
  kind: IngredientKind;
  name: string;
  emoji: string;
  /** Cor principal usada no modelo 3D. */
  color: number;
  /** Emissivo (brilho) — ingredientes mágicos brilham. */
  glow?: number;
  /** Pode ser picado na tábua? */
  choppable: boolean;
}

const RAW = {
  lettuce: { kind: 'lettuce', emoji: '🥬', color: 0x7ed957, choppable: true },
  tomato: { kind: 'tomato', emoji: '🍅', color: 0xff5a4e, choppable: true },
  glowshroom: { kind: 'glowshroom', emoji: '🍄', color: 0xb58cff, glow: 0x9d6bff, choppable: true },
  berry: { kind: 'berry', emoji: '🫐', color: 0x6a5cff, choppable: false },
  carrot: { kind: 'carrot', emoji: '🥕', color: 0xff9a3c, choppable: true },
  batter: { kind: 'batter', emoji: '🥚', color: 0xffe7a8, choppable: false },
  bamboo: { kind: 'bamboo', emoji: '🎍', color: 0x9ad86b, choppable: true },
} as Record<IngredientKind, IngredientDef>;

/** Nomes traduzidos (src/i18n): `name` é um getter. */
export const INGREDIENTS: Record<IngredientKind, IngredientDef> = RAW;
for (const d of Object.values(INGREDIENTS)) localize(d, { name: `ing.${d.kind}` });
