/**
 * Traduções. O inglês (`en.ts`) é a fonte e o idioma padrão; os outros dicionários
 * são tipados a partir dele, então o build falha se faltar alguma frase.
 *
 * - `t('chave', { n: 3 })` → texto com {variáveis} trocadas
 * - `tl('chave')` → lista (itens separados por "|" no dicionário)
 * - Módulo puro (sem DOM): pode ser usado em `data/` e `sim/`.
 */
import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { ja } from './ja';
import { pt } from './pt';
import { zh } from './zh';

export type TKey = keyof typeof en;
export type Dict = { readonly [K in TKey]: string };

export type Lang = 'en' | 'es' | 'pt' | 'fr' | 'zh' | 'ja';

export const LANGS: readonly { id: Lang; label: string; flag: string; html: string }[] = [
  { id: 'en', label: 'English', flag: '🇺🇸', html: 'en' },
  { id: 'es', label: 'Español', flag: '🇪🇸', html: 'es' },
  { id: 'pt', label: 'Português (BR)', flag: '🇧🇷', html: 'pt-BR' },
  { id: 'fr', label: 'Français', flag: '🇫🇷', html: 'fr' },
  { id: 'zh', label: '简体中文', flag: '🇨🇳', html: 'zh-Hans' },
  { id: 'ja', label: '日本語', flag: '🇯🇵', html: 'ja' },
];

const DICTS: Record<Lang, Dict> = { en, es, pt, fr, zh, ja };

let current: Lang = 'en';

export function getLang(): Lang {
  return current;
}

export function setLang(lang: Lang): void {
  current = lang;
}

export function isLang(v: unknown): v is Lang {
  return typeof v === 'string' && LANGS.some((l) => l.id === v);
}

/**
 * Escolhe o idioma: o salvo nas opções; senão o do aparelho; senão inglês.
 * `override` (ex.: `?lang=ja` na URL) vence tudo — útil para testes e screenshots das lojas.
 */
export function resolveLang(saved: string | undefined, preferred: readonly string[], override?: string | null): Lang {
  if (isLang(override)) return override;
  if (isLang(saved)) return saved;
  for (const p of preferred) {
    const base = p.toLowerCase().split('-')[0];
    if (isLang(base)) return base;
  }
  return 'en';
}

function fill(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/** Texto traduzido (cai para o inglês se faltar). */
export function t(key: TKey, vars?: Record<string, string | number>): string {
  return fill(DICTS[current][key] ?? en[key], vars);
}

/** Chave montada em tempo de execução (ex.: `recipe.${id}`). */
export function tk(key: string, vars?: Record<string, string | number>): string {
  return t(key as TKey, vars);
}

/** Lista traduzida ("a|b|c" → ["a","b","c"]). */
export function tl(key: string): string[] {
  return tk(key).split('|');
}

/** Define campos de texto como getters traduzidos (os dados de `data/` usam isso). */
export function localize<T extends object>(obj: T, fields: Record<string, string>, lists: Record<string, string> = {}): T {
  for (const [field, key] of Object.entries(fields)) Object.defineProperty(obj, field, { get: () => tk(key), enumerable: true, configurable: true });
  for (const [field, key] of Object.entries(lists)) Object.defineProperty(obj, field, { get: () => tl(key), enumerable: true, configurable: true });
  return obj;
}

/** Todas as chaves e dicionários (para testes). */
export const ALL_DICTS = DICTS;
