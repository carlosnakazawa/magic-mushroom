import { TUNING } from '../config';

/** Moedas pagas por um prato: preço + gorjeta proporcional à paciência restante (0..1). */
export function dishPayment(price: number, patience: number): number {
  const p = Math.min(1, Math.max(0, patience));
  return Math.round(price * (1 + TUNING.economy.maxTipRatio * p));
}

/** Bônus de banquete para grupos grandes que receberam tudo. */
export function banquetBonus(size: number): number {
  return size >= TUNING.economy.banquetMinSize ? size * TUNING.economy.banquetBonusPerMember : 0;
}

/** Estrelas (0..3) obtidas pelas metas do nível. */
export function starsFor(coins: number, goals: readonly [number, number, number]): number {
  return goals.filter((g) => coins >= g).length;
}
