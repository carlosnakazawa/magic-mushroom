/** Eventos que o tutorial observa. */
export type TutorialEvent = 'orderTaken' | 'pickLettuce' | 'chopped' | 'saladReady' | 'served' | 'cleared' | 'washed';

/** Onde a setinha mágica deve apontar em cada passo. */
export type TutorialFocus = 'firstTable' | 'crateLettuce' | 'board' | 'bowls' | 'sink';

interface Step {
  /** Usa {pick}/{use}: o HUD troca pelas teclas dos jogadores ativos. */
  text: string;
  event: TutorialEvent;
  focus: TutorialFocus;
  done: boolean;
}

/**
 * Guia passo a passo do Dia 1. Os passos podem ser concluídos fora de ordem
 * (a criança pode explorar) — o "passo atual" é sempre o primeiro não concluído.
 */
export class Tutorial {
  readonly steps: Step[] = [
    { text: 'Chegue perto do cliente ❗ e aperte {use} para anotar o pedido', event: 'orderTaken', focus: 'firstTable', done: false },
    { text: 'Pegue uma alface 🥬 no caixote com {pick}', event: 'pickLettuce', focus: 'crateLettuce', done: false },
    { text: 'Coloque na tábua 🔪 ({pick}) e corte com {use}', event: 'chopped', focus: 'board', done: false },
    { text: 'Pegue uma tigela 🥣 e junte a alface picada', event: 'saladReady', focus: 'bowls', done: false },
    { text: 'Leve a salada até a mesa do cliente 🍽️', event: 'served', focus: 'firstTable', done: false },
    { text: 'Quando ele terminar, recolha a louça e as moedas 🪙', event: 'cleared', focus: 'firstTable', done: false },
    { text: 'Lave a tigela na pia 🫧 ({pick} coloca, {use} lava)', event: 'washed', focus: 'sink', done: false },
  ];

  get current(): number {
    const i = this.steps.findIndex((s) => !s.done);
    return i < 0 ? this.steps.length : i;
  }

  get finished(): boolean {
    return this.current >= this.steps.length;
  }

  /** O relógio só começa a correr depois da primeira entrega. */
  get clockFrozen(): boolean {
    return !this.isDone('served');
  }

  /** Novos clientes só chegam depois da primeira entrega. */
  get spawnsBlocked(): boolean {
    return !this.isDone('served');
  }

  get focus(): TutorialFocus | null {
    return this.steps[this.current]?.focus ?? null;
  }

  isDone(e: TutorialEvent): boolean {
    return this.steps.some((s) => s.event === e && s.done);
  }

  /** Marca o evento. Retorna true se algum passo foi concluído agora. */
  handle(e: TutorialEvent): boolean {
    const step = this.steps.find((s) => s.event === e && !s.done);
    if (!step) return false;
    step.done = true;
    return true;
  }
}
