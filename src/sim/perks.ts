import { TUNING } from '../config';
import type { PerkId } from '../data/characters';

/** Multiplicadores e bônus que o super-poder de um herói aplica (puro, testado). */
export interface PerkMods {
  /** Velocidade de andar. */
  speed: number;
  /** Velocidade de cortar na tábua. */
  chop: number;
  /** Velocidade de lavar na pia. */
  wash: number;
  /** Velocidade do extintor. */
  spray: number;
  /** Moedas extras por prato servido. */
  tips: number;
  /** Paciência recuperada ao anotar o pedido (0..1). */
  orderPatience: number;
  /** Alcance extra para mirar estações. */
  reach: number;
  /** Máquina abastecida por este herói trabalha mais rápido. */
  machineBoost: number;
}

export function perkMods(perk: PerkId): PerkMods {
  const p = TUNING.perks;
  const m: PerkMods = { speed: 1, chop: 1, wash: 1, spray: 1, tips: 0, orderPatience: 0, reach: 0, machineBoost: 1 };
  switch (perk) {
    case 'tips':
      m.tips = p.tipsBonus;
      break;
    case 'speed':
      m.speed = p.speed;
      break;
    case 'chop':
      m.chop = p.chop;
      break;
    case 'firefighter':
      m.spray = p.fireSpray;
      m.wash = p.fireWash;
      break;
    case 'memory':
      m.orderPatience = p.memoryPatience;
      break;
    case 'soup':
      m.machineBoost = p.soupBoost;
      break;
    case 'wash':
      m.wash = p.wash;
      break;
    case 'reach':
      m.reach = p.reachExtra;
      break;
    case 'calm':
      break;
  }
  return m;
}

/** Aura de equipe: Lumi no time deixa todos os clientes mais calmos. */
export function teamDrainScale(perks: readonly PerkId[]): number {
  return perks.includes('calm') ? TUNING.perks.calmDrain : 1;
}
