import { DEFAULT_KEYS, type KeyBinds, type Settings } from '../sim/progress';

/** Estado de controle de um jogador em um frame. */
export interface PlayerInput {
  moveX: number;
  moveZ: number;
  /** Pegar / soltar / entregar (borda: só no frame em que apertou). */
  pick: boolean;
  /** Usar estação / anotar pedido (borda). */
  use: boolean;
  /** Trocar de personagem no modo solo (borda). */
  swap: boolean;
}

/** Fonte de toque (joystick + botões na tela) — implementada por ui/touch.ts. */
export interface TouchSource {
  moveX: number;
  moveZ: number;
  hit(action: 'pick' | 'use' | 'swap'): boolean;
  endFrame(): void;
}

/** Navegação em menus (teclado ou controle). */
export interface MenuInput {
  dx: number;
  dy: number;
  confirm: boolean;
  back: boolean;
  pause: boolean;
}

const MOVE = {
  p1: { up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'] },
  p2: { up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'] },
};

const KEY_NAMES: Record<string, string> = {
  Space: 'Espaço',
  Enter: 'Enter',
  NumpadEnter: 'Enter',
  ShiftRight: 'Shift',
  ShiftLeft: 'Shift esq.',
  ControlRight: 'Ctrl',
  ControlLeft: 'Ctrl esq.',
  AltRight: 'Alt Gr',
  Slash: '/',
  Period: '.',
  Comma: ',',
  Semicolon: 'Ç',
  Backslash: '\\',
  Quote: '~',
  Numpad0: 'Num 0',
};

/** Nome amigável de uma tecla ("KeyE" → "E", "Space" → "Espaço"). */
export function keyLabel(code: string): string {
  if (!code) return '—';
  if (KEY_NAMES[code]) return KEY_NAMES[code]!;
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return `Num ${code.slice(6)}`;
  return code;
}

/** Teclas que o jogo nunca deixa remapear (usadas por menus). */
const RESERVED = new Set(['Escape', 'KeyP', 'KeyM', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab']);

/**
 * Teclado + gamepads. No modo solo, WASD e setas (e as teclas dos dois jogadores)
 * controlam o mesmo herói. Gamepad i controla o jogador i (no solo, qualquer um).
 */
export class Input {
  private down = new Set<string>();
  private pressed = new Set<string>();
  private padPrev = new Map<number, boolean[]>();
  private padAxisHeld = new Map<number, { dir: string; t: number }>();
  private listeners: ((code: string) => void)[] = [];
  private capture: ((code: string) => void) | null = null;
  private keys: Settings['keys'] = structuredClone(DEFAULT_KEYS);
  private lastPads: ((PlayerInput & { pause: boolean; back: boolean }) | null)[] = [];
  private touch: TouchSource | null = null;

  /** Liga os controles de toque (sempre controlam o jogador 1). */
  attachTouch(t: TouchSource): void {
    this.touch = t;
  }

  /** Jogando por toque: dicas mostram ícones dos botões em vez de teclas. */
  get touchMode(): boolean {
    return !!this.touch;
  }

  constructor() {
    window.addEventListener('keydown', (e) => {
      if (this.capture) {
        e.preventDefault();
        if (e.code === 'Escape' || !RESERVED.has(e.code)) {
          const cb = this.capture;
          this.capture = null;
          cb(e.code === 'Escape' ? '' : e.code);
        }
        return;
      }
      const target = e.target as HTMLElement | null;
      const onButton = target?.tagName === 'BUTTON';
      if (onButton && (e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter')) return;
      if (this.isGameKey(e.code)) e.preventDefault();
      if (!e.repeat) {
        this.pressed.add(e.code);
        this.listeners.forEach((l) => l(e.code));
      }
      this.down.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.down.delete(e.code));
    window.addEventListener('blur', () => this.down.clear());
  }

  setKeys(keys: Settings['keys']): void {
    this.keys = structuredClone(keys);
  }

  binds(slot: 0 | 1): KeyBinds {
    return slot === 0 ? this.keys.p1 : this.keys.p2;
  }

  /** Espera a próxima tecla (tela de remapear). Esc cancela (retorna ''). */
  captureNextKey(cb: (code: string) => void): void {
    this.capture = cb;
  }

  private isGameKey(code: string): boolean {
    const all = [...Object.values(MOVE.p1).flat(), ...Object.values(MOVE.p2).flat(), ...Object.values(this.keys.p1), ...Object.values(this.keys.p2)];
    return all.includes(code);
  }

  /** Callback para teclas globais (pausa, música...). */
  onKey(fn: (code: string) => void): void {
    this.listeners.push(fn);
  }

  private axis(neg: string[], pos: string[]): number {
    const n = neg.some((k) => this.down.has(k)) ? 1 : 0;
    const p = pos.some((k) => this.down.has(k)) ? 1 : 0;
    return p - n;
  }

  private hit(keys: string[]): boolean {
    return keys.some((k) => !!k && this.pressed.has(k));
  }

  private readKeys(slots: ('p1' | 'p2')[]): PlayerInput {
    const move = (d: 'up' | 'down' | 'left' | 'right') => slots.flatMap((s) => MOVE[s][d]);
    return {
      moveX: this.axis(move('left'), move('right')),
      moveZ: this.axis(move('up'), move('down')),
      pick: this.hit(slots.map((s) => this.keys[s].pick)),
      use: this.hit(slots.map((s) => this.keys[s].use)),
      swap: this.hit(slots.map((s) => this.keys[s].swap)),
    };
  }

  private readPads(): ((PlayerInput & { pause: boolean; back: boolean }) | null)[] {
    const pads = navigator.getGamepads?.() ?? [];
    return [0, 1, 2, 3].map((index) => {
      const pad = pads[index];
      if (!pad || !pad.connected) return null;
      const prev = this.padPrev.get(index) ?? [];
      const now = pad.buttons.map((b) => b.pressed);
      this.padPrev.set(index, now);
      const edge = (i: number) => !!now[i] && !prev[i];
      const dead = (v: number) => (Math.abs(v) < 0.25 ? 0 : v);
      const btn = (i: number) => (now[i] ? 1 : 0);
      return {
        moveX: dead(pad.axes[0] ?? 0) || btn(15) - btn(14),
        moveZ: dead(pad.axes[1] ?? 0) || btn(13) - btn(12),
        pick: edge(0),
        use: edge(2),
        swap: edge(3),
        pause: edge(9),
        back: edge(1),
      };
    });
  }

  /** Estado de cada jogador neste frame. Chamar uma vez por frame, depois `endFrame()`. */
  read(playerCount: number): PlayerInput[] {
    const keys = playerCount === 1 ? [this.readKeys(['p1', 'p2'])] : [this.readKeys(['p1']), this.readKeys(['p2'])];
    const pads = this.readPads();
    this.lastPads = pads;
    return keys.map((k, slot) => {
      const padsForSlot = playerCount === 1 ? pads : [pads[slot] ?? null];
      let out = { ...k };
      const t = slot === 0 ? this.touch : null;
      if (t) {
        out = {
          moveX: out.moveX || t.moveX,
          moveZ: out.moveZ || t.moveZ,
          pick: out.pick || t.hit('pick'),
          use: out.use || t.hit('use'),
          swap: out.swap || t.hit('swap'),
        };
      }
      for (const p of padsForSlot) {
        if (!p) continue;
        out = {
          moveX: out.moveX || p.moveX,
          moveZ: out.moveZ || p.moveZ,
          pick: out.pick || p.pick,
          use: out.use || p.use,
          swap: out.swap || p.swap,
        };
      }
      return out;
    });
  }

  /** Algum botão Start apertado no último `read()`? */
  padPausePressed(): boolean {
    return this.lastPads.some((p) => !!p?.pause);
  }

  /**
   * Entrada para menus: setas/WASD/D-pad/analógico movem o foco (com repetição),
   * Enter/A confirma, Esc/B volta. Chamar uma vez por frame fora do jogo.
   */
  menu(dt: number): MenuInput {
    const pads = this.readPads();
    this.lastPads = pads;
    let dx = 0;
    let dy = 0;
    const k = (codes: string[]) => codes.some((c) => this.pressed.has(c));
    if (k(['ArrowLeft', 'KeyA'])) dx = -1;
    if (k(['ArrowRight', 'KeyD'])) dx = 1;
    if (k(['ArrowUp', 'KeyW'])) dy = -1;
    if (k(['ArrowDown', 'KeyS'])) dy = 1;
    let confirm = false;
    let back = k(['Escape']);
    let pause = false;
    pads.forEach((p, i) => {
      if (!p) return;
      confirm ||= p.pick;
      back ||= p.back;
      pause ||= p.pause;
      // Direção com repetição automática enquanto segura
      const dir = Math.abs(p.moveX) > Math.abs(p.moveZ) ? (p.moveX > 0.5 ? 'r' : p.moveX < -0.5 ? 'l' : '') : p.moveZ > 0.5 ? 'd' : p.moveZ < -0.5 ? 'u' : '';
      const held = this.padAxisHeld.get(i);
      let fire = false;
      if (dir && (!held || held.dir !== dir)) {
        this.padAxisHeld.set(i, { dir, t: 0.4 });
        fire = true;
      } else if (dir && held) {
        held.t -= dt;
        if (held.t <= 0) {
          held.t = 0.14;
          fire = true;
        }
      } else if (!dir) this.padAxisHeld.delete(i);
      if (fire) {
        if (dir === 'l') dx = -1;
        if (dir === 'r') dx = 1;
        if (dir === 'u') dy = -1;
        if (dir === 'd') dy = 1;
      }
    });
    return { dx, dy, confirm, back, pause };
  }

  endFrame(): void {
    this.pressed.clear();
    this.touch?.endFrame();
  }
}
