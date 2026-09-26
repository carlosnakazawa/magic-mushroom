export type IngredientKind = 'lettuce' | 'tomato' | 'glowshroom' | 'berry' | 'carrot' | 'batter' | 'bamboo';

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

export const INGREDIENTS: Record<IngredientKind, IngredientDef> = {
  lettuce: { kind: 'lettuce', name: 'Alface', emoji: '🥬', color: 0x7ed957, choppable: true },
  tomato: { kind: 'tomato', name: 'Tomate', emoji: '🍅', color: 0xff5a4e, choppable: true },
  glowshroom: { kind: 'glowshroom', name: 'Cogumelo-brilhante', emoji: '🍄', color: 0xb58cff, glow: 0x9d6bff, choppable: true },
  berry: { kind: 'berry', name: 'Frutinhas', emoji: '🫐', color: 0x6a5cff, choppable: false },
  carrot: { kind: 'carrot', name: 'Cenoura', emoji: '🥕', color: 0xff9a3c, choppable: true },
  batter: { kind: 'batter', name: 'Massa', emoji: '🥚', color: 0xffe7a8, choppable: false },
  bamboo: { kind: 'bamboo', name: 'Bambu', emoji: '🎍', color: 0x9ad86b, choppable: true },
};
