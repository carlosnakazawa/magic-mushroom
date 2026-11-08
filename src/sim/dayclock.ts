import { TUNING } from '../config';

/**
 * Fases do relógio do dia:
 * - `open`: clientes chegando;
 * - `lastCall`: últimos segundos, não entra mais ninguém;
 * - `overtime`: o relógio zerou, mas ainda há clientes esperando — dá para atendê-los;
 * - `closed`: o dia acabou.
 *
 * Por quê: as crianças viram o dia acabar com clientes que tinham acabado de pedir.
 */
export type ClockPhase = 'open' | 'lastCall' | 'overtime' | 'closed';

export function clockPhase(timeLeft: number, waitingParties: number, d: { lastCall: number; overtimeMax: number } = TUNING.day): ClockPhase {
  if (timeLeft > d.lastCall) return 'open';
  if (timeLeft > 0) return 'lastCall';
  if (waitingParties > 0 && -timeLeft < d.overtimeMax) return 'overtime';
  return 'closed';
}
