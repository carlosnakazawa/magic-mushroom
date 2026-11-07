import { TUNING } from '../config';

/**
 * Corrida automática (puro, testado): quanto mais tempo o jogador segura o
 * direcional sem parar, mais rápido o herói vai, até o limite `runBoost`.
 * Assim ninguém precisa decorar um botão de correr.
 */
export function runMultiplier(heldSeconds: number, p: { runAfter: number; runRamp: number; runBoost: number } = TUNING.player): number {
  if (heldSeconds <= p.runAfter) return 1;
  const k = Math.min(1, (heldSeconds - p.runAfter) / Math.max(0.001, p.runRamp));
  return 1 + (p.runBoost - 1) * k;
}
