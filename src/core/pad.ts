/**
 * Normaliza controles para o "mapa padrão" do navegador (A/✕ = 0, B/○ = 1, X/□ = 2,
 * Y/△ = 3, Start/Options = 9, direcional = 12..15). Puro e testado.
 *
 * Por quê: no Windows, o Chrome às vezes entrega o DualSense/DualShock sem o mapa
 * padrão (`mapping === ''`). Aí o ✕ vira o botão 1, o □ vira o 0 e o direcional
 * chega como um eixo "chapéu" — e o jogo parecia não responder ao controle.
 */

export type PadFamily = 'ps' | 'xbox';

/** Controles da Sony (vendor 054c) e nomes comuns que o Windows mostra. */
export function padFamily(id: string): PadFamily {
  return /054c|dualsense|dualshock|playstation|wireless controller/i.test(id) ? 'ps' : 'xbox';
}

export interface RawPad {
  id: string;
  mapping: string;
  buttons: readonly boolean[];
  axes: readonly number[];
}

export interface NormPad {
  /** Botões no mapa padrão (índices 0..15). */
  buttons: boolean[];
  /** Analógico esquerdo (x, y). */
  axes: [number, number];
}

/** Ordem dos botões crus da Sony (DirectInput) → mapa padrão. */
const SONY_RAW_TO_STD: Record<number, number> = { 1: 0, 2: 1, 0: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, 11: 11, 12: 16 };

/**
 * Direcional que chega como eixo "chapéu" (valores de -1 a 1 em 8 passos; parado ≈ 1.28).
 * Devolve [cima, baixo, esquerda, direita].
 */
export function hatToDpad(v: number): [boolean, boolean, boolean, boolean] {
  if (!Number.isFinite(v) || v > 1.1 || v < -1.1) return [false, false, false, false];
  // 8 direções em sentido horário a partir de "cima": passo de 2/7
  const step = ((v + 1) * 7) / 2;
  // Só aceita valores perto dos 8 passos: um eixo comum parado em 0 não pode virar "baixo"
  if (Math.abs(step - Math.round(step)) > 0.15) return [false, false, false, false];
  const i = Math.round(step) % 8;
  const up = i === 0 || i === 1 || i === 7;
  const right = i === 1 || i === 2 || i === 3;
  const down = i === 3 || i === 4 || i === 5;
  const left = i === 5 || i === 6 || i === 7;
  return [up, down, left, right];
}

export function normalizePad(p: RawPad): NormPad {
  const axes: [number, number] = [p.axes[0] ?? 0, p.axes[1] ?? 0];
  if (p.mapping === 'standard') return { buttons: [...p.buttons], axes };
  const buttons: boolean[] = [];
  if (padFamily(p.id) === 'ps') {
    p.buttons.forEach((b, i) => {
      const to = SONY_RAW_TO_STD[i];
      if (to !== undefined) buttons[to] = b;
    });
  } else {
    p.buttons.forEach((b, i) => (buttons[i] = b));
  }
  // Direcional como chapéu: no DirectInput do Windows (DualSense/DualShock) ele fica no eixo 9
  const hatAxis = p.axes.length > 9 ? 9 : -1;
  if (hatAxis >= 0) {
    const [u, d, l, r] = hatToDpad(p.axes[hatAxis]!);
    buttons[12] ||= u;
    buttons[13] ||= d;
    buttons[14] ||= l;
    buttons[15] ||= r;
  }
  for (let i = 0; i < 16; i++) buttons[i] ??= false;
  return { buttons, axes };
}
