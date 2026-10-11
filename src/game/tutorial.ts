import { t, type TKey } from '../i18n';

/** Eventos que o tutorial observa. */
export type TutorialEvent = 'orderTaken' | 'pickLettuce' | 'chopped' | 'saladReady' | 'served' | 'cleared' | 'washed';

/** Onde a setinha mágica deve apontar em cada passo. */
export type TutorialFocus = 'firstTable' | 'crateLettuce' | 'board' | 'bowls' | 'sink';

interface Step {
  /** Chave da frase em src/i18n (usa {pick}/{use}: o HUD troca pelas teclas). */
  key: TKey;
  event: TutorialEvent;
  focus: TutorialFocus;
  done: boolean;
}

/**
 * Guia passo a passo do Dia 1. Os passos podem ser concluídos fora de ordem
 * (a criança pode explorar) — o "passo atual" é sempre o primeiro não concluído.
 */
export class Tutorial {
  /** Passos com o texto no idioma atual. */
  get view(): { text: string; done: boolean }[] {
    return this.steps.map((s) => ({ text: t(s.key), done: s.done }));
  }

  readonly steps: Step[] = [
    { key: 'tut.1', event: 'orderTaken', focus: 'firstTable', done: false },
    { key: 'tut.2', event: 'pickLettuce', focus: 'crateLettuce', done: false },
    { key: 'tut.3', event: 'chopped', focus: 'board', done: false },
    { key: 'tut.4', event: 'saladReady', focus: 'bowls', done: false },
    { key: 'tut.5', event: 'served', focus: 'firstTable', done: false },
    { key: 'tut.6', event: 'cleared', focus: 'firstTable', done: false },
    { key: 'tut.7', event: 'washed', focus: 'sink', done: false },
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
