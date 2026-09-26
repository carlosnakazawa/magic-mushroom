import { parseSave, type SaveData } from '../sim/progress';

const KEY = 'bistro-cogumelo-save-v1';

/** Lê o progresso salvo no navegador (nunca lança erro: sem storage = jogo novo). */
export function loadSave(): SaveData {
  try {
    return parseSave(localStorage.getItem(KEY));
  } catch {
    return parseSave(null);
  }
}

export function writeSave(save: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    // Modo privado / storage cheio: o jogo continua, só não salva.
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignora */
  }
}
