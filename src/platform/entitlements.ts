/**
 * Versão gratuita × completa (modelo de negócio em docs/LANCAMENTO.md).
 *
 * - Web e PC (Steam, jogo pago): tudo liberado.
 * - Lojas de celular: o app é gratuito com o Nível 1 + a 1ª noite; uma compra única
 *   ("Bistrô Completo") libera tudo. A compra real será feita com um plugin de
 *   compras (ex.: RevenueCat/cordova-plugin-purchase) — aqui fica só a interface.
 *
 * `?demo` na URL simula a versão gratuita para testar a experiência.
 */
import { platform } from './platform';

/** Último nível jogável na versão gratuita. */
export const DEMO_MAX_LEVEL = 1;

const KEY = 'bistro-cogumelo-full-v1';

function readFlag(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export const entitlements = {
  /** Jogo completo liberado? */
  get full(): boolean {
    if (new URLSearchParams(location.search).has('demo')) return readFlag();
    if (!platform.isApp) return true;
    return readFlag();
  },

  levelAvailable(levelId: number): boolean {
    return levelId <= DEMO_MAX_LEVEL || this.full;
  },

  /**
   * Compra o jogo completo. Hoje é um simulador (marca como comprado);
   * no app, chamar o plugin da loja e só gravar depois da confirmação.
   */
  async purchaseFull(): Promise<boolean> {
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      return false;
    }
    return true;
  },
};

/**
 * "Portão dos pais": exigido pela Apple (categoria Kids) e recomendado pelo Google
 * (Famílias) antes de compras e links externos. Uma continha que criança pequena
 * não resolve sozinha.
 */
export function parentalChallenge(): { question: string; answer: number } {
  const a = 6 + Math.floor(Math.random() * 4);
  const b = 3 + Math.floor(Math.random() * 6);
  return { question: `Quanto é ${a} × ${b}?`, answer: a * b };
}
