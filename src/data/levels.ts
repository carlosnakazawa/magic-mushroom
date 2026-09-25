import type { RecipeId } from './recipes';

export interface LevelDef {
  id: number;
  name: string;
  /** Duração do dia em segundos. */
  dayLength: number;
  /** Mapa ASCII — legenda em docs/GDD.md (B3). Linha 0 = parede do fundo. */
  map: readonly string[];
  /** Receitas sorteadas e seus pesos. */
  recipes: readonly { id: RecipeId; weight: number }[];
  /** Pesos por tamanho de grupo (índice = tamanho). */
  partySizeWeights: readonly number[];
  /** Intervalo entre chegadas [min, max] em segundos. */
  spawnInterval: readonly [number, number];
  /** Metas de moedas para 1, 2 e 3 estrelas. */
  starGoals: readonly [number, number, number];
  tutorial: boolean;
}

export const LEVELS: readonly LevelDef[] = [
  {
    id: 1,
    name: 'Salada Feérica',
    dayLength: 210,
    // Cozinha à esquerda, salão à direita. `W` parede, `P` spawn dos heróis, `D` porta.
    map: [
      'WWWWWWWWWWWWWWWW',
      'WLTM#CC#BS#X####',
      'W..............D',
      'W......##.......',
      'WP.........t..t.',
      'W......#........',
      'WP.....#........',
      'W..........t..t.',
      'W......##.......',
      'W...............',
    ],
    recipes: [
      { id: 'salad_green', weight: 4 },
      { id: 'salad_ruby', weight: 3 },
      { id: 'salad_fairy', weight: 2 },
    ],
    partySizeWeights: [0, 3, 1],
    spawnInterval: [14, 22],
    starGoals: [40, 90, 150],
    tutorial: true,
  },
];
