import type { FamilyId } from './families';

/**
 * Tipos de espaço de decoração no salão:
 * - family: mesa grande para famílias (4–6 lugares)
 * - light: luminária mágica pendurada (acende à noite)
 * - corner: móvel/planta no chão (ocupa a célula)
 * - rug: tapete
 * - wall: enfeite na parede do fundo
 */
export type SlotKind = 'family' | 'light' | 'corner' | 'rug' | 'wall';

export type FurnitureId =
  | 'double_mushroom'
  | 'enchanted_log'
  | 'lamp_crystal'
  | 'lamp_firefly'
  | 'lamp_moon'
  | 'plant_fern'
  | 'plant_flowers'
  | 'mushroom_statue'
  | 'bookshelf'
  | 'panda_lantern'
  | 'rug_round'
  | 'rug_star'
  | 'rug_leaf'
  | 'garland'
  | 'painting'
  | 'wreath';

export interface FurnitureDef {
  id: FurnitureId;
  name: string;
  emoji: string;
  kind: SlotKind;
  price: number;
  /** Charme ✨: deixa os clientes mais pacientes (ver sim/progress.ts). */
  charm: number;
  /** Lugares (mesas de família). */
  seats?: number;
  /** Cor principal (luzes/tapetes). */
  color?: number;
  /** Exclusivo de uma família desbloqueada. */
  family?: FamilyId;
  blurb: string;
}

export const FURNITURE: readonly FurnitureDef[] = [
  { id: 'double_mushroom', name: 'Mesa Cogumelo Duplo', emoji: '🍄', kind: 'family', price: 60, charm: 3, seats: 4, blurb: 'Para famílias de até 4.' },
  { id: 'enchanted_log', name: 'Tronco Encantado', emoji: '🪵', kind: 'family', price: 120, charm: 6, seats: 6, blurb: 'Famílias grandes de até 6!' },
  { id: 'lamp_crystal', name: 'Luminária de Cristal', emoji: '💎', kind: 'light', price: 30, charm: 3, color: 0x7fd8ff, blurb: 'Brilho azul de cristal.' },
  { id: 'lamp_firefly', name: 'Pote de Vaga-lumes', emoji: '🫙', kind: 'light', price: 25, charm: 2, color: 0xfff27a, blurb: 'Luzinhas amarelas dançantes.' },
  { id: 'lamp_moon', name: 'Lua Pendente', emoji: '🌙', kind: 'light', price: 45, charm: 4, color: 0xd9c8ff, blurb: 'Uma lua só para o bistrô.' },
  { id: 'plant_fern', name: 'Samambaia', emoji: '🌿', kind: 'corner', price: 15, charm: 1, blurb: 'Verdinha e fofa.' },
  { id: 'plant_flowers', name: 'Flores Mágicas', emoji: '🌷', kind: 'corner', price: 20, charm: 2, blurb: 'Flores que brilham de leve.' },
  { id: 'mushroom_statue', name: 'Estátua de Cogumelo', emoji: '🗿', kind: 'corner', price: 35, charm: 3, blurb: 'O mascote do bistrô!' },
  { id: 'bookshelf', name: 'Estante de Receitas', emoji: '📚', kind: 'corner', price: 40, charm: 3, blurb: 'Livros de receitas mágicas.' },
  {
    id: 'panda_lantern',
    name: 'Lanterna de Bambu',
    emoji: '🏮',
    kind: 'corner',
    price: 50,
    charm: 5,
    family: 'panda',
    blurb: 'Presente da Família Panda.',
  },
  { id: 'rug_round', name: 'Tapete Rosinha', emoji: '⭕', kind: 'rug', price: 10, charm: 1, color: 0xf7c6d9, blurb: 'Redondo e macio.' },
  { id: 'rug_star', name: 'Tapete Estrela', emoji: '⭐', kind: 'rug', price: 30, charm: 3, color: 0xffe07a, blurb: 'Uma estrela no chão!' },
  { id: 'rug_leaf', name: 'Tapete Folha', emoji: '🍃', kind: 'rug', price: 25, charm: 2, color: 0xa8e6a1, blurb: 'Folha gigante da floresta.' },
  { id: 'garland', name: 'Bandeirinhas', emoji: '🎏', kind: 'wall', price: 20, charm: 2, blurb: 'Festa todo dia.' },
  { id: 'painting', name: 'Quadro do Bosque', emoji: '🖼️', kind: 'wall', price: 25, charm: 2, blurb: 'Uma paisagem da floresta.' },
  { id: 'wreath', name: 'Guirlanda de Flores', emoji: '💐', kind: 'wall', price: 20, charm: 2, blurb: 'Flores na parede.' },
];

export function furnitureDef(id: FurnitureId): FurnitureDef {
  return FURNITURE.find((f) => f.id === id)!;
}

export type WallId = 'peach' | 'mint' | 'lavender' | 'sky';

export interface WallDef {
  id: WallId;
  name: string;
  base: string;
  stripe: string;
  motif: string;
  price: number;
  charm: number;
}

export const WALLS: readonly WallDef[] = [
  { id: 'peach', name: 'Pêssego', base: '#ffe9d2', stripe: '#ffd9bd', motif: '#ff9b8a', price: 0, charm: 0 },
  { id: 'mint', name: 'Menta', base: '#e3f7ea', stripe: '#cdeed9', motif: '#5fbf8a', price: 15, charm: 1 },
  { id: 'lavender', name: 'Lavanda', base: '#efe6ff', stripe: '#e0d2ff', motif: '#a07cff', price: 15, charm: 1 },
  { id: 'sky', name: 'Céu', base: '#e3f1ff', stripe: '#cfe5ff', motif: '#5fa8ff', price: 15, charm: 1 },
];

export function wallDef(id: WallId): WallDef {
  return WALLS.find((w) => w.id === id) ?? WALLS[0]!;
}

export interface DecorSlot {
  id: string;
  kind: SlotKind;
  /** Posição no mundo (centro). Para `corner`, é uma célula que fica sólida quando ocupada. */
  x: number;
  z: number;
}

/**
 * Espaços de decoração do salão — iguais em todos os níveis (o salão é o mesmo).
 * Coordenadas batem com os mapas de data/levels.ts (colunas 10–17).
 */
export const DECOR_SLOTS: readonly DecorSlot[] = [
  { id: 'family1', kind: 'family', x: 13.5, z: 6 },
  { id: 'light1', kind: 'light', x: 13.5, z: 3 },
  { id: 'light2', kind: 'light', x: 13.5, z: 9 },
  { id: 'light3', kind: 'light', x: 11, z: 6 },
  { id: 'light4', kind: 'light', x: 16, z: 6 },
  { id: 'corner1', kind: 'corner', x: 11, z: 1 },
  { id: 'corner2', kind: 'corner', x: 15, z: 1 },
  { id: 'corner3', kind: 'corner', x: 17, z: 7 },
  { id: 'corner4', kind: 'corner', x: 10, z: 10 },
  { id: 'corner5', kind: 'corner', x: 14, z: 10 },
  { id: 'corner6', kind: 'corner', x: 17, z: 10 },
  { id: 'rug1', kind: 'rug', x: 13.5, z: 6 },
  { id: 'rug2', kind: 'rug', x: 15.8, z: 2.2 },
  { id: 'wall1', kind: 'wall', x: 13, z: 0.53 },
  { id: 'wall2', kind: 'wall', x: 16.9, z: 0.53 },
];
