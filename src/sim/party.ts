import { TUNING } from '../config';
import { RECIPES, type RecipeId } from '../data/recipes';
import { banquetBonus, dishPayment } from './economy';

export type PartyPhase =
  | 'arriving' // andando até a mesa
  | 'waitingOrder' // sentados, esperando alguém anotar (balão ❗)
  | 'ordered' // comanda no topo da tela, esperando pratos
  | 'finished' // todos comeram: vão embora felizes
  | 'angry'; // paciência acabou: vão embora sem pagar

export interface PartyMember {
  recipe: RecipeId;
  served: boolean;
  /** Segundos restantes comendo (só vale depois de servido). */
  eatLeft: number;
  done: boolean;
}

export type PartyEvent =
  | { type: 'memberDone'; member: number; coins: number }
  | { type: 'banquet'; bonus: number }
  | { type: 'finished' }
  | { type: 'angry' };

let nextPartyId = 1;

/**
 * Um grupo de clientes. Cliente sozinho é um grupo de 1 — assim os fluxos
 * "pedido sozinho" e "pedido em grupo" do GDD usam a mesma lógica.
 * Pura (sem Three.js) para ser testável.
 */
export class Party {
  readonly id = nextPartyId++;
  readonly members: PartyMember[];
  phase: PartyPhase = 'arriving';
  /** 0..1, compartilhada pelo grupo. */
  patience = 1;

  constructor(recipes: readonly RecipeId[]) {
    if (recipes.length === 0) throw new Error('Party precisa de pelo menos 1 membro');
    this.members = recipes.map((recipe) => ({ recipe, served: false, eatLeft: 0, done: false }));
  }

  get size(): number {
    return this.members.length;
  }

  get allServed(): boolean {
    return this.members.every((m) => m.served);
  }

  get isLeaving(): boolean {
    return this.phase === 'finished' || this.phase === 'angry';
  }

  seated(): void {
    if (this.phase === 'arriving') this.phase = 'waitingOrder';
  }

  takeOrder(): boolean {
    if (this.phase !== 'waitingOrder') return false;
    this.phase = 'ordered';
    return true;
  }

  /** Índice do membro que aceita este prato, ou -1. */
  wants(recipe: RecipeId): number {
    if (this.phase !== 'ordered') return -1;
    return this.members.findIndex((m) => !m.served && m.recipe === recipe);
  }

  /** Entrega um prato. Retorna o índice do membro servido ou -1. */
  serve(recipe: RecipeId): number {
    const i = this.wants(recipe);
    if (i < 0) return -1;
    const m = this.members[i]!;
    m.served = true;
    m.eatLeft = TUNING.customer.eatTime;
    this.patience = Math.min(1, this.patience + TUNING.patience.serveRecovery);
    return i;
  }

  /** `drainScale` < 1 deixa os clientes mais pacientes (charme, modo sem pressa). */
  update(dt: number, drainScale = 1): PartyEvent[] {
    const events: PartyEvent[] = [];
    if (this.isLeaving || this.phase === 'arriving') return events;

    if (this.phase === 'waitingOrder' || (this.phase === 'ordered' && !this.allServed)) {
      const drain = this.phase === 'waitingOrder' ? TUNING.patience.orderDrain : TUNING.patience.foodDrain;
      this.patience = Math.max(0, this.patience - drain * dt * drainScale);
      if (this.patience <= 0) {
        this.phase = 'angry';
        events.push({ type: 'angry' });
        return events;
      }
    }

    this.members.forEach((m, i) => {
      if (!m.served || m.done) return;
      m.eatLeft -= dt;
      if (m.eatLeft <= 0) {
        m.done = true;
        events.push({ type: 'memberDone', member: i, coins: dishPayment(RECIPES[m.recipe].price, this.patience) });
      }
    });

    if (this.phase === 'ordered' && this.members.every((m) => m.done)) {
      this.phase = 'finished';
      const bonus = banquetBonus(this.size);
      if (bonus > 0) events.push({ type: 'banquet', bonus });
      events.push({ type: 'finished' });
    }
    return events;
  }
}
