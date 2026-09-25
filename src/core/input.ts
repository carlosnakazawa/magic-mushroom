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

interface KeyScheme {
  up: string[];
  down: string[];
  left: string[];
  right: string[];
  pick: string[];
  use: string[];
  swap: string[];
}

const SCHEME_P1: KeyScheme = {
  up: ['KeyW'],
  down: ['KeyS'],
  left: ['KeyA'],
  right: ['KeyD'],
  pick: ['Space'],
  use: ['KeyE'],
  swap: ['KeyQ'],
};

const SCHEME_P2: KeyScheme = {
  up: ['ArrowUp'],
  down: ['ArrowDown'],
  left: ['ArrowLeft'],
  right: ['ArrowRight'],
  pick: ['Enter', 'NumpadEnter'],
  use: ['ShiftRight', 'Numpad0'],
  swap: [],
};

function mergeSchemes(a: KeyScheme, b: KeyScheme): KeyScheme {
  return {
    up: [...a.up, ...b.up],
    down: [...a.down, ...b.down],
    left: [...a.left, ...b.left],
    right: [...a.right, ...b.right],
    pick: [...a.pick, ...b.pick],
    use: [...a.use, ...b.use],
    swap: [...a.swap, ...b.swap],
  };
}

const GAME_KEYS = new Set(
  [SCHEME_P1, SCHEME_P2].flatMap((s) => [...s.up, ...s.down, ...s.left, ...s.right, ...s.pick, ...s.use]),
);

const EMPTY: PlayerInput = { moveX: 0, moveZ: 0, pick: false, use: false, swap: false };

/**
 * Teclado + gamepads. No modo solo, WASD e setas controlam o mesmo jogador.
 * Gamepad i controla o jogador i (no solo, qualquer gamepad controla o jogador 1).
 */
export class Input {
  private down = new Set<string>();
  private pressed = new Set<string>();
  private padPrev = new Map<number, boolean[]>();
  private listeners: ((code: string) => void)[] = [];

  constructor() {
    window.addEventListener('keydown', (e) => {
      const target = e.target as HTMLElement | null;
      if (target?.tagName === 'BUTTON' && (e.code === 'Space' || e.code === 'Enter')) {
        // Deixa o botão focado receber o clique, mas não repassa ao jogo.
        return;
      }
      if (GAME_KEYS.has(e.code)) e.preventDefault();
      if (!e.repeat) {
        this.pressed.add(e.code);
        this.listeners.forEach((l) => l(e.code));
      }
      this.down.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.down.delete(e.code));
    window.addEventListener('blur', () => this.down.clear());
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

  private any(keys: string[]): boolean {
    return keys.some((k) => this.pressed.has(k));
  }

  private readKeys(s: KeyScheme): PlayerInput {
    return {
      moveX: this.axis(s.left, s.right),
      moveZ: this.axis(s.up, s.down),
      pick: this.any(s.pick),
      use: this.any(s.use),
      swap: this.any(s.swap),
    };
  }

  private readPads(): (PlayerInput | null)[] {
    const pads = navigator.getGamepads?.() ?? [];
    return [0, 1, 2, 3].map((index) => {
      const pad = pads[index];
      if (!pad || !pad.connected) return null;
      const prev = this.padPrev.get(index) ?? [];
      const now = pad.buttons.map((b) => b.pressed);
      this.padPrev.set(index, now);
      const edge = (i: number) => !!now[i] && !prev[i];
      const dead = (v: number) => (Math.abs(v) < 0.2 ? 0 : v);
      const btn = (i: number) => (now[i] ? 1 : 0);
      return {
        moveX: dead(pad.axes[0] ?? 0) || btn(15) - btn(14),
        moveZ: dead(pad.axes[1] ?? 0) || btn(13) - btn(12),
        pick: edge(0),
        use: edge(2),
        swap: edge(3),
        pause: edge(9),
      } as PlayerInput & { pause: boolean };
    });
  }

  private lastPads: (PlayerInput | null)[] = [];

  /** Estado de cada jogador neste frame. Chamar uma vez por frame, depois `endFrame()`. */
  read(playerCount: number): PlayerInput[] {
    const keys =
      playerCount === 1
        ? [this.readKeys(mergeSchemes(SCHEME_P1, SCHEME_P2))]
        : [this.readKeys(SCHEME_P1), this.readKeys(SCHEME_P2)];
    const pads = this.readPads();
    this.lastPads = pads;
    return keys.map((k, slot) => {
      const padsForSlot = playerCount === 1 ? pads : [pads[slot] ?? null];
      let out = { ...k };
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
    return this.lastPads.some((p) => !!p && (p as PlayerInput & { pause?: boolean }).pause);
  }

  /** Lê gamepads fora do jogo (menus/pausa) para detectar Start. */
  pollMenuPads(): { confirm: boolean; pause: boolean } {
    const pads = this.readPads();
    this.lastPads = pads;
    return {
      confirm: pads.some((p) => !!p?.pick),
      pause: this.padPausePressed(),
    };
  }

  endFrame(): void {
    this.pressed.clear();
  }

  static readonly empty = EMPTY;
}
