export type IngredientKind = 'lettuce' | 'tomato' | 'glowshroom';

export interface IngredientDef {
  kind: IngredientKind;
  name: string;
  emoji: string;
  /** Cor principal usada no modelo 3D. */
  color: number;
  /** Emissivo (brilho) — ingredientes mágicos brilham. */
  glow?: number;
}

export const INGREDIENTS: Record<IngredientKind, IngredientDef> = {
  lettuce: { kind: 'lettuce', name: 'Alface', emoji: '🥬', color: 0x7ed957 },
  tomato: { kind: 'tomato', name: 'Tomate', emoji: '🍅', color: 0xff5a4e },
  glowshroom: { kind: 'glowshroom', name: 'Cogumelo-brilhante', emoji: '🍄', color: 0xb58cff, glow: 0x9d6bff },
};
