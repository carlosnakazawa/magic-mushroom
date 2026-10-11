import type { FamilyId } from './families';
import { localize } from '../i18n';

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

export const FURNITURE: readonly FurnitureDef[] = ([
  { id: 'double_mushroom', emoji: '🍄', kind: 'family', price: 60, charm: 3, seats: 4 },
  { id: 'enchanted_log', emoji: '🪵', kind: 'family', price: 120, charm: 6, seats: 6 },
  { id: 'lamp_crystal', emoji: '💎', kind: 'light', price: 30, charm: 3, color: 0x7fd8ff },
  { id: 'lamp_firefly', emoji: '🫙', kind: 'light', price: 25, charm: 2, color: 0xfff27a },
  { id: 'lamp_moon', emoji: '🌙', kind: 'light', price: 45, charm: 4, color: 0xd9c8ff },
  { id: 'plant_fern', emoji: '🌿', kind: 'corner', price: 15, charm: 1 },
  { id: 'plant_flowers', emoji: '🌷', kind: 'corner', price: 20, charm: 2 },
  { id: 'mushroom_statue', emoji: '🗿', kind: 'corner', price: 35, charm: 3 },
  { id: 'bookshelf', emoji: '📚', kind: 'corner', price: 40, charm: 3 },
  {
    id: 'panda_lantern',
    emoji: '🏮',
    kind: 'corner',
    price: 50,
    charm: 5,
    family: 'panda',
  },
  { id: 'rug_round', emoji: '⭕', kind: 'rug', price: 10, charm: 1, color: 0xf7c6d9 },
  { id: 'rug_star', emoji: '⭐', kind: 'rug', price: 30, charm: 3, color: 0xffe07a },
  { id: 'rug_leaf', emoji: '🍃', kind: 'rug', price: 25, charm: 2, color: 0xa8e6a1 },
  { id: 'garland', emoji: '🎏', kind: 'wall', price: 20, charm: 2 },
  { id: 'painting', emoji: '🖼️', kind: 'wall', price: 25, charm: 2 },
  { id: 'wreath', emoji: '💐', kind: 'wall', price: 20, charm: 2 },
] as FurnitureDef[]).map((f) => localize(f, { name: `furn.${f.id}.name`, blurb: `furn.${f.id}.blurb` }));

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

export const WALLS: readonly WallDef[] = ([
  { id: 'peach', base: '#ffe9d2', stripe: '#ffd9bd', motif: '#ff9b8a', price: 0, charm: 0 },
  { id: 'mint', base: '#e3f7ea', stripe: '#cdeed9', motif: '#5fbf8a', price: 15, charm: 1 },
  { id: 'lavender', base: '#efe6ff', stripe: '#e0d2ff', motif: '#a07cff', price: 15, charm: 1 },
  { id: 'sky', base: '#e3f1ff', stripe: '#cfe5ff', motif: '#5fa8ff', price: 15, charm: 1 },
] as WallDef[]).map((w) => localize(w, { name: `wall.${w.id}` }));

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
