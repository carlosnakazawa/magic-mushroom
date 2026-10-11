import type { RecipeId, Vessel } from './recipes';
import { tk, tl } from '../i18n';

export interface LevelDef {
  id: number;
  name: string;
  emoji: string;
  /** Frase curta no mapa de níveis. */
  blurb: string;
  /** Duração do dia em segundos. */
  dayLength: number;
  /**
   * Mapa ASCII — legenda em docs/GDD.md (B3). Linha 0 = parede do fundo.
   * O salão (colunas 10–17) é igual em todos os níveis: decoração e mesas persistem.
   */
  map: readonly string[];
  /** Receitas sorteadas e seus pesos (receitas de família entram só com a família). */
  recipes: readonly { id: RecipeId; weight: number }[];
  /** Pesos por tamanho de grupo (índice = tamanho). Grupos 3+ só vêm se houver mesa família livre. */
  partySizeWeights: readonly number[];
  /** Intervalo entre chegadas [min, max] em segundos. */
  spawnInterval: readonly [number, number];
  /** Metas de moedas para 1, 2 e 3 estrelas. */
  starGoals: readonly [number, number, number];
  /** Recipientes limpos no começo do dia. */
  vessels: Partial<Record<Vessel, number>>;
  tutorial: boolean;
  /** Dicas mostradas na primeira vez que o nível é jogado. */
  intro: readonly string[];
}

export const LEVELS: readonly LevelDef[] = ([
  {
    id: 1,
    emoji: '🥗',
    dayLength: 210,
    map: [
      'WWWWWWWWWWWWWWWWWW',
      'WLTM#CC#BS#.......',
      'W................D',
      'W#.......##.......',
      'WX.........t....t.',
      'W#..P....#........',
      'W........#...FF...',
      'W#..P....#........',
      'W..........t....t.',
      'W#.......##.......',
      'W.................',
    ],
    recipes: [
      { id: 'salad_green', weight: 4 },
      { id: 'salad_ruby', weight: 3 },
      { id: 'salad_fairy', weight: 2 },
    ],
    partySizeWeights: [0, 4, 2, 1.2, 1, 0.6, 0.4],
    spawnInterval: [13, 21],
    starGoals: [40, 90, 150],
    vessels: { bowl: 3 },
    tutorial: true,
  },
  {
    id: 2,
    emoji: '🧃',
    dayLength: 210,
    map: [
      'WWWWWWWWWWWWWWWWWW',
      'WLTMR#CCBUS.......',
      'W................D',
      'WJ.......##.......',
      'WX.........t....t.',
      'W#..P....#........',
      'W........#...FF...',
      'WJ..P....#........',
      'W..........t....t.',
      'W#.......##.......',
      'W.................',
    ],
    recipes: [
      { id: 'salad_green', weight: 2 },
      { id: 'salad_ruby', weight: 2 },
      { id: 'salad_fairy', weight: 1.5 },
      { id: 'juice_berry', weight: 3 },
      { id: 'potion_bubbly', weight: 2 },
    ],
    partySizeWeights: [0, 4, 2.2, 1.2, 1, 0.6, 0.4],
    spawnInterval: [12, 19],
    starGoals: [60, 130, 210],
    vessels: { bowl: 3, cup: 3 },
    tutorial: false,
  },
  {
    id: 3,
    emoji: '🔥',
    dayLength: 240,
    map: [
      'WWWWWWWWWWWWWWWWWW',
      'WLTMRNACCBS.......',
      'W................D',
      'WK.......UO.......',
      'WY.........t....t.',
      'WK..P....#........',
      'WX.......J...FF...',
      'WG..P....#........',
      'WZ.........t....t.',
      'WG.......#J.......',
      'W.................',
    ],
    recipes: [
      { id: 'salad_ruby', weight: 1.5 },
      { id: 'salad_fairy', weight: 1 },
      { id: 'juice_berry', weight: 1.5 },
      { id: 'potion_bubbly', weight: 1 },
      { id: 'soup_carrot', weight: 3 },
      { id: 'soup_cauldron', weight: 2 },
      { id: 'pancake', weight: 3 },
    ],
    partySizeWeights: [0, 4, 2.2, 1.2, 1, 0.6, 0.4],
    spawnInterval: [11, 18],
    starGoals: [80, 170, 270],
    vessels: { bowl: 4, cup: 3, plate: 3 },
    tutorial: false,
  },
] as unknown as LevelDef[]).map((l) =>
  Object.defineProperties(l, {
    name: { get: () => tk(`level.${l.id}.name`), enumerable: true },
    blurb: { get: () => tk(`level.${l.id}.blurb`), enumerable: true },
    // Lista de dicas; vazia quando o dicionário não tem dicas para o nível
    intro: { get: () => tl(`level.${l.id}.intro`).filter(Boolean), enumerable: true },
  }),
);

export function levelDef(id: number): LevelDef {
  return LEVELS.find((l) => l.id === id) ?? LEVELS[0]!;
}
