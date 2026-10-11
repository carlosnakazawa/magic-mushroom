/**
 * Camada de plataforma: o mesmo jogo roda no navegador, em app (Capacitor: Android/iOS)
 * e no PC (Electron/Steam). Tudo que muda entre plataformas passa por aqui — o resto
 * do jogo não precisa saber onde está rodando. Plano completo em docs/LANCAMENTO.md.
 */

export type PlatformKind = 'web' | 'android' | 'ios' | 'desktop';

interface CapacitorGlobal {
  getPlatform(): string;
  isNativePlatform(): boolean;
}

function detect(): PlatformKind {
  const cap = (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
  if (cap?.isNativePlatform()) return cap.getPlatform() === 'ios' ? 'ios' : 'android';
  if (/electron/i.test(navigator.userAgent)) return 'desktop';
  return 'web';
}

export const platform = {
  kind: detect(),

  get isApp(): boolean {
    return this.kind === 'android' || this.kind === 'ios';
  },

  /** Vibração curtinha (botões de toque). No iOS nativo, trocar por @capacitor/haptics. */
  vibrate(ms: number): void {
    try {
      navigator.vibrate?.(ms);
    } catch {
      /* sem vibração */
    }
  },

  /**
   * Avisa quando o app/aba vai para segundo plano ou volta.
   * Apps de celular precisam pausar o jogo e a música ao sair (exigência das lojas).
   */
  onVisibility(cb: (visible: boolean) => void): void {
    document.addEventListener('visibilitychange', () => cb(document.visibilityState === 'visible'));
    window.addEventListener('pagehide', () => cb(false));
  },
};
