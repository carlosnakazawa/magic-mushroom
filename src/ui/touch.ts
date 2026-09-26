/**
 * Controles de toque para celular/tablet: joystick que aparece onde o polegar
 * encosta (metade esquerda) + botões grandes à direita. Usa Pointer Events,
 * então também funciona com mouse (útil para testar com `?touch`).
 */

/** O aparelho usa toque como entrada principal? (`?touch` força, `?touch=0` desliga) */
export function isTouchDevice(): boolean {
  const q = new URLSearchParams(location.search).get('touch');
  if (q !== null) return q !== '0';
  return window.matchMedia?.('(pointer: coarse)').matches || navigator.maxTouchPoints > 1;
}

/** Ícones dos botões — usados também nas dicas e no tutorial. */
export const TOUCH_ICONS = { pick: '✋', use: '⭐', swap: '🔄' } as const;

type Action = 'pick' | 'use' | 'swap';

export class TouchControls {
  readonly root: HTMLDivElement;
  moveX = 0;
  moveZ = 0;
  private pressed = new Set<Action>();
  private stickId: number | null = null;
  private origin = { x: 0, y: 0 };
  private base: HTMLDivElement;
  private knob: HTMLDivElement;
  private swapBtn: HTMLButtonElement;
  onPause: () => void = () => {};

  constructor(parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'touch-controls hidden';
    this.root.innerHTML = `
      <div class="stick-zone"><div class="stick-hint">👆 arraste para andar</div></div>
      <div class="stick-base"><div class="stick-knob"></div></div>
      <div class="touch-buttons">
        <button class="tbtn swap" data-act="swap">${TOUCH_ICONS.swap}<small>Trocar</small></button>
        <button class="tbtn use" data-act="use">${TOUCH_ICONS.use}<small>Usar</small></button>
        <button class="tbtn pick" data-act="pick">${TOUCH_ICONS.pick}<small>Pegar</small></button>
      </div>
      <button class="tbtn pause" aria-label="Pausa">⏸</button>`;
    parent.appendChild(this.root);
    this.base = this.root.querySelector('.stick-base')!;
    this.knob = this.root.querySelector('.stick-knob')!;
    this.swapBtn = this.root.querySelector('.tbtn.swap')!;

    const zone = this.root.querySelector<HTMLDivElement>('.stick-zone')!;
    zone.addEventListener('pointerdown', (e) => this.stickStart(e));
    window.addEventListener('pointermove', (e) => this.stickMove(e));
    window.addEventListener('pointerup', (e) => this.stickEnd(e));
    window.addEventListener('pointercancel', (e) => this.stickEnd(e));

    this.root.querySelectorAll<HTMLButtonElement>('.touch-buttons .tbtn').forEach((b) => {
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.pressed.add(b.dataset.act as Action);
        b.classList.add('down');
        navigator.vibrate?.(12);
      });
      const up = () => b.classList.remove('down');
      b.addEventListener('pointerup', up);
      b.addEventListener('pointerleave', up);
      b.addEventListener('pointercancel', up);
    });
    this.root.querySelector<HTMLButtonElement>('.tbtn.pause')!.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.onPause();
    });
    // Nada de menu de contexto / seleção ao segurar o dedo
    this.root.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  show(visible: boolean, solo = true): void {
    this.root.classList.toggle('hidden', !visible);
    this.swapBtn.classList.toggle('hidden', !solo);
    if (!visible) this.release();
  }

  private stickStart(e: PointerEvent): void {
    if (this.stickId !== null) return;
    e.preventDefault();
    this.stickId = e.pointerId;
    this.origin = { x: e.clientX, y: e.clientY };
    this.base.style.left = `${e.clientX}px`;
    this.base.style.top = `${e.clientY}px`;
    this.base.classList.add('on');
    this.root.classList.add('touched');
    this.stickMove(e);
  }

  private stickMove(e: PointerEvent): void {
    if (e.pointerId !== this.stickId) return;
    const radius = 56;
    let dx = e.clientX - this.origin.x;
    let dy = e.clientY - this.origin.y;
    const len = Math.hypot(dx, dy);
    if (len > radius) {
      dx = (dx / len) * radius;
      dy = (dy / len) * radius;
    }
    this.knob.style.transform = `translate(${dx}px, ${dy}px)`;
    const k = Math.min(1, len / radius);
    // Zona morta pequena; tela para a direita = +x no mundo, para baixo = +z
    const mag = k < 0.15 ? 0 : (k - 0.15) / 0.85;
    this.moveX = len > 0 ? (dx / Math.max(len, 1e-6)) * mag : 0;
    this.moveZ = len > 0 ? (dy / Math.max(len, 1e-6)) * mag : 0;
  }

  private stickEnd(e: PointerEvent): void {
    if (e.pointerId !== this.stickId) return;
    this.release();
  }

  private release(): void {
    this.stickId = null;
    this.moveX = 0;
    this.moveZ = 0;
    this.base.classList.remove('on');
    this.knob.style.transform = '';
  }

  /** Botão apertado desde o último quadro (borda). */
  hit(a: Action): boolean {
    return this.pressed.has(a);
  }

  endFrame(): void {
    this.pressed.clear();
  }
}
