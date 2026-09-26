import type { RecipeId, Vessel } from './recipes';

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

export const LEVELS: readonly LevelDef[] = [
  {
    id: 1,
    name: 'Salada Feérica',
    emoji: '🥗',
    blurb: 'Aprenda a cortar e montar saladas.',
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
    intro: [],
  },
  {
    id: 2,
    name: 'Liquidificador de Cristal',
    emoji: '🧃',
    blurb: 'Sucos e poções que batem sozinhos.',
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
    intro: [
      'Novo: <b>Liquidificador de Cristal</b> 🧃',
      'Coloque 🫐 frutinhas (e 🍄 para a poção) no liquidificador',
      'Aperte {use} para ligar — ele trabalha sozinho!',
      'Quando ficar pronto, leve um <b>copo</b> 🥤 até ele com {pick}',
    ],
  },
  {
    id: 3,
    name: 'Caldeirão & Chapa',
    emoji: '🔥',
    blurb: 'Sopas e panquecas… sem deixar queimar!',
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
    intro: [
      'Novo: <b>Caldeirão</b> 🍲 e <b>Chapa Mágica</b> 🥞',
      'Caldeirão: cenoura 🥕 picada (e 🍄 picado) — cozinha sozinho',
      'Chapa: massa 🥚 crua vira panqueca — sirva no <b>prato</b> 🍽️',
      'Cuidado: esqueceu? ⚠️ queima e pega 🔥! Use o <b>extintor mágico</b> 🧯 com {use}',
    ],
  },
];

export function levelDef(id: number): LevelDef {
  return LEVELS.find((l) => l.id === id) ?? LEVELS[0]!;
}
