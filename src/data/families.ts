/** Famílias desbloqueáveis (GDD seção 6). A Panda é a primeira implementada; as outras aparecem como "em breve". */

import { localize } from '../i18n';

export type FamilyId = 'panda' | 'sheep' | 'axolotl' | 'squirrel';

export interface FamilyDef {
  id: FamilyId;
  name: string;
  emoji: string;
  /** Estrelas totais (somando o melhor resultado de cada nível) para desbloquear. */
  starsToUnlock: number;
  /** Implementada no jogo (as demais só aparecem como meta futura). */
  available: boolean;
  /** Herói contratável que a família traz. */
  helperHero?: string;
  perks: string[];
}

export const FAMILIES: readonly FamilyDef[] = ([
  {
    id: 'panda',
    emoji: '🐼',
    starsToUnlock: 4,
    available: true,
    helperHero: 'mochi',
  },
  { id: 'sheep', emoji: '🐑', starsToUnlock: 7, available: false, perks: ['Em breve!'] },
  { id: 'axolotl', emoji: '🦎', starsToUnlock: 8, available: false, perks: ['Em breve!'] },
  { id: 'squirrel', emoji: '🐿️', starsToUnlock: 9, available: false, perks: ['Em breve!'] },
] as FamilyDef[]).map((f) => localize(f, { name: `family.${f.id}.name` }, { perks: `family.${f.id}.perks` }));

export function familyDef(id: FamilyId): FamilyDef {
  return FAMILIES.find((f) => f.id === id)!;
}
