/** Famílias desbloqueáveis (GDD seção 6). A Panda é a primeira implementada; as outras aparecem como "em breve". */

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

export const FAMILIES: readonly FamilyDef[] = [
  {
    id: 'panda',
    name: 'Família Panda',
    emoji: '🐼',
    starsToUnlock: 4,
    available: true,
    helperHero: 'mochi',
    perks: ['Pandas visitam o bistrô em família', 'Mochi, o Pandinha, entra para a equipe', 'Nova receita: Sopa de Bambu 🎍', 'Novo móvel: Lanterna de Bambu'],
  },
  { id: 'sheep', name: 'Família Ovelha', emoji: '🐑', starsToUnlock: 7, available: false, perks: ['Em breve!'] },
  { id: 'axolotl', name: 'Família Axolote', emoji: '🦎', starsToUnlock: 8, available: false, perks: ['Em breve!'] },
  { id: 'squirrel', name: 'Família Esquilo', emoji: '🐿️', starsToUnlock: 9, available: false, perks: ['Em breve!'] },
];

export function familyDef(id: FamilyId): FamilyDef {
  return FAMILIES.find((f) => f.id === id)!;
}
