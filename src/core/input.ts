import { DEFAULT_KEYS, type KeyBinds, type Settings } from '../sim/progress';
import { normalizePad, padFamily, type Device, type PadFamily } from './pad';
import { t } from '../i18n';

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
  Semicolon: ';',
  Backslash: '\\',
  Quote: '~',
  Numpad0: 'Num 0',
};

/** Nome amigável de uma tecla ("KeyE" → "E", "Space" → "Espaço"). */
export function keyLabel(code: string): string {
  if (!code) return '—';
  if (code === 'Space') return t('key.space');
  if (KEY_NAMES[code]) return KEY_NAMES[code]!;
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return `Num ${code.slice(6)}`;
  return code;
}

/** O jogador mexeu neste aparelho neste frame? (empurrãozinho no analógico não conta) */
function active(p: PlayerInput): boolean {
  return Math.abs(p.moveX) > 0.5 || Math.abs(p.moveZ) > 0.5 || p.pick || p.use || p.swap;
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
  private lastPads: ({ pause: boolean } | null)[] = [];
  private touch: TouchSource | null = null;
  /** Último aparelho usado por cada jogador (as dicas mostram os botões dele). */
  private devices: Device[] = ['keys', 'keys'];
  /** Muda sempre que algum jogador troca de aparelho (quem mostra dicas redesenha). */
  deviceVersion = 0;

  /** Liga os controles de toque (sempre controlam o jogador 1). */
  attachTouch(t: TouchSource): void {
    this.touch = t;
    this.setDevice(0, 'touch');
  }

  /** Aparelho que o jogador `slot` usou por último. */
  device(slot: number): Device {
    return this.devices[slot === 1 ? 1 : 0]!;
  }

  private setDevice(slot: number, d: Device): void {
    if (this.devices[slot] === d) return;
    this.devices[slot] = d;
    this.deviceVersion++;
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

  /** Avisa quando um controle é conectado (o navegador só mostra depois de apertar um botão). */
  onPadConnected(fn: (kind: PadFamily, slot: number) => void): void {
    window.addEventListener('gamepadconnected', (e) => {
      const kind = padFamily(e.gamepad.id);
      const slot = this.connectedPads().findIndex((p) => p.index === e.gamepad.index);
      // Ajuda a investigar controles que não respondem (console do navegador)
      console.info('[controle]', e.gamepad.id, `mapping="${e.gamepad.mapping}"`, `index=${e.gamepad.index}`);
      // Já mostra os botões do controle, mesmo que ele tenha sido "acordado" com outro botão
      this.setDevice(Math.min(Math.max(0, slot), 1), kind);
      fn(kind, Math.max(0, slot));
    });
  }

  /** Controles conectados, em ordem (o 1º é do jogador 1). Pode haver buracos na lista do navegador. */
  private connectedPads(): Gamepad[] {
    const list = navigator.getGamepads?.() ?? [];
    return Array.from(list).filter((p): p is Gamepad => !!p && p.connected);
  }

  private readPads(): ((PlayerInput & { pause: boolean; back: boolean; family: PadFamily }) | null)[] {
    const pads = this.connectedPads();
    return [0, 1, 2, 3].map((slot) => {
      const pad = pads[slot];
      if (!pad) return null;
      const norm = normalizePad({ id: pad.id, mapping: pad.mapping, buttons: pad.buttons.map((b) => b.pressed), axes: pad.axes });
      const prev = this.padPrev.get(pad.index) ?? [];
      const now = norm.buttons;
      this.padPrev.set(pad.index, now);
      const edge = (i: number) => !!now[i] && !prev[i];
      const dead = (v: number) => (Math.abs(v) < 0.25 ? 0 : v);
      const btn = (i: number) => (now[i] ? 1 : 0);
      return {
        moveX: dead(norm.axes[0]) || btn(15) - btn(14),
        moveZ: dead(norm.axes[1]) || btn(13) - btn(12),
        pick: edge(0),
        use: edge(2),
        swap: edge(3),
        pause: edge(9),
        back: edge(1),
        family: padFamily(pad.id),
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
      // Aparelhos mexidos neste frame; se o atual está entre eles, não troca
      // (teclado + controle juntos não ficam alternando as dicas a cada frame)
      const used: Device[] = [];
      if (active(k)) used.push('keys');
      let out = { ...k };
      const t = slot === 0 ? this.touch : null;
      if (t) {
        if (t.moveX || t.moveZ) used.push('touch');
        out = {
          moveX: out.moveX || t.moveX,
          moveZ: out.moveZ || t.moveZ,
          pick: out.pick || t.hit('pick'),
          use: out.use || t.hit('use'),
          swap: out.swap || t.hit('swap'),
        };
        if ((out.pick || out.use || out.swap) && !k.pick && !k.use && !k.swap) used.push('touch');
      }
      for (const p of padsForSlot) {
        if (!p) continue;
        if (active(p)) used.push(p.family);
        out = {
          moveX: out.moveX || p.moveX,
          moveZ: out.moveZ || p.moveZ,
          pick: out.pick || p.pick,
          use: out.use || p.use,
          swap: out.swap || p.swap,
        };
      }
      if (used.length && !used.includes(this.devices[slot]!)) this.setDevice(slot, used[used.length - 1]!);
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
    if (dx || dy || k(['Enter', 'Space', 'Escape'])) this.setDevice(0, 'keys');
    let confirm = false;
    let back = k(['Escape']);
    let pause = false;
    pads.forEach((p, i) => {
      if (!p) return;
      if (active(p) || p.back || p.pause) this.setDevice(Math.min(i, 1), p.family);
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
