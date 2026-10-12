/** Heróis jogáveis e clientes. Personalidades completas em docs/GDD.md (seções 2 e B10). */

import type { FamilyId } from './families';
import { localize, tk } from '../i18n';

export type Species = 'bunny' | 'fox' | 'dragon' | 'wolf' | 'owl' | 'bear' | 'cat' | 'mouse' | 'frog' | 'hedgehog' | 'panda';

export type WingStyle = 'dragonfly' | 'leaf' | 'bat' | 'constellation' | 'feather';

/** Efeito ao comemorar uma entrega. */
export type CelebrateFx = 'hearts' | 'leaves' | 'sparks' | 'stars' | 'dust';

/** Acessório que deixa cada herói reconhecível de longe. */
export type Accessory = 'bow' | 'leafCrown' | 'chefHat' | 'starScarf' | 'glasses' | 'bambooLeaf' | 'flower' | 'crown' | 'moonClip';

/**
 * Super-poder de cada herói (efeito leve, ver `sim/perks.ts` e `TUNING.perks`).
 * Dá um motivo para escolher heróis diferentes sem deixar ninguém "fraco".
 */
export type PerkId = 'tips' | 'speed' | 'chop' | 'firefighter' | 'memory' | 'soup' | 'wash' | 'reach' | 'calm';

/** Jeito de se mexer: dá personalidade à animação. */
export interface MoveStyle {
  /** Altura dos pulinhos ao andar (1 = normal). */
  bounce: number;
  /** Flutuação parado (asas). */
  hover: number;
  /** Balanço da cabeça parado. */
  wiggle: number;
}

/** Falas curtinhas (balão sobre o herói). */
export interface Phrases {
  start: string[];
  serve: string[];
  fire: string[];
  swap: string[];
}

export interface HeroDef {
  id: string;
  name: string;
  title: string;
  species: Species;
  wing: WingStyle;
  body: number;
  belly: number;
  accent: number;
  wingColor: number;
  eyeColor: number;
  celebrate: CelebrateFx;
  /** Frase curta para o menu de seleção. */
  blurb: string;
  accessory: Accessory;
  perk: PerkId;
  /** Texto do super-poder, para os cards. */
  perkText: string;
  style: MoveStyle;
  /** Tom de voz (Hz) dos "piu-pius" sintetizados. */
  voice: number;
  phrases: Phrases;
  /** Herói contratado ao desbloquear uma família (não aparece antes). */
  family?: FamilyId;
  /** Herói contratável na loja noturna por este preço em moedas do jogo. */
  price?: number;
}

export const HEROES: readonly HeroDef[] = ([
  {
    id: 'puff',
    name: 'Puff',
    species: 'bunny',
    wing: 'dragonfly',
    body: 0xfdf6ff,
    belly: 0xffe3ef,
    accent: 0xffb6d1,
    wingColor: 0xbfe8ff,
    eyeColor: 0x2b2440,
    celebrate: 'hearts',
    accessory: 'bow',
    perk: 'tips',
    style: { bounce: 1.6, hover: 1, wiggle: 1.2 },
    voice: 880,
  },
  {
    id: 'florzinha',
    name: 'Florzinha',
    species: 'fox',
    wing: 'leaf',
    body: 0xffa25e,
    belly: 0xfff1de,
    accent: 0xd9531e,
    wingColor: 0xffb347,
    eyeColor: 0x2e1a10,
    celebrate: 'leaves',
    accessory: 'leafCrown',
    perk: 'speed',
    style: { bounce: 0.8, hover: 0.6, wiggle: 0.7 },
    voice: 700,
  },
  {
    id: 'pipoca',
    name: 'Pipoca',
    species: 'dragon',
    wing: 'bat',
    body: 0x6fd6a8,
    belly: 0xfff0b3,
    accent: 0xff8fb1,
    wingColor: 0x3fae8a,
    eyeColor: 0x1d2b25,
    celebrate: 'sparks',
    accessory: 'chefHat',
    perk: 'chop',
    style: { bounce: 1.3, hover: 0.5, wiggle: 1.6 },
    voice: 420,
  },
  {
    id: 'astro',
    name: 'Astro',
    species: 'wolf',
    wing: 'constellation',
    body: 0x6f7fa8,
    belly: 0xc9d3ef,
    accent: 0x3d4a73,
    wingColor: 0x9fd0ff,
    eyeColor: 0x7fe8ff,
    celebrate: 'stars',
    accessory: 'starScarf',
    perk: 'firefighter',
    style: { bounce: 0.6, hover: 0.8, wiggle: 0.4 },
    voice: 520,
  },
  {
    id: 'estrelinha',
    name: 'Estrelinha',
    species: 'owl',
    wing: 'feather',
    body: 0xe2c59a,
    belly: 0xfff4e0,
    accent: 0xa77a52,
    wingColor: 0xf6e7ff,
    eyeColor: 0x3a2a55,
    celebrate: 'dust',
    accessory: 'glasses',
    perk: 'memory',
    style: { bounce: 0.4, hover: 1.8, wiggle: 0.8 },
    voice: 1040,
  },
  {
    id: 'mochi',
    name: 'Mochi',
    species: 'panda',
    wing: 'leaf',
    body: 0xfbfbf8,
    belly: 0xffffff,
    accent: 0x2e2c36,
    wingColor: 0x8fd16a,
    eyeColor: 0x1d1b22,
    celebrate: 'leaves',
    accessory: 'bambooLeaf',
    perk: 'soup',
    style: { bounce: 0.5, hover: 0.4, wiggle: 0.5 },
    voice: 360,
    family: 'panda',
  },
  {
    id: 'bolota',
    name: 'Bolota',
    species: 'hedgehog',
    wing: 'feather',
    body: 0xb08a6a,
    belly: 0xf7e3c8,
    accent: 0x6a4c36,
    wingColor: 0xffd9e8,
    eyeColor: 0x2e2018,
    celebrate: 'hearts',
    accessory: 'flower',
    perk: 'wash',
    style: { bounce: 1.1, hover: 0.5, wiggle: 1 },
    voice: 760,
    price: 120,
  },
  {
    id: 'gota',
    name: 'Gota',
    species: 'frog',
    wing: 'dragonfly',
    body: 0xff9fc4,
    belly: 0xffe6f0,
    accent: 0xd9668f,
    wingColor: 0xc8f4ff,
    eyeColor: 0x1d2b18,
    celebrate: 'sparks',
    accessory: 'crown',
    perk: 'reach',
    style: { bounce: 1.9, hover: 0.3, wiggle: 1.4 },
    voice: 600,
    price: 150,
  },
  {
    id: 'lumi',
    name: 'Lumi',
    species: 'cat',
    wing: 'constellation',
    body: 0xb9b3d9,
    belly: 0xf4f1ff,
    accent: 0x8f7fd6,
    wingColor: 0xd9c8ff,
    eyeColor: 0x6a4fd6,
    celebrate: 'stars',
    accessory: 'moonClip',
    perk: 'calm',
    style: { bounce: 0.5, hover: 1.4, wiggle: 0.6 },
    voice: 940,
    price: 200,
  },
] as HeroDef[]).map((h) => {
  localize(h, { title: `hero.${h.id}.title`, blurb: `hero.${h.id}.blurb`, perkText: `hero.${h.id}.perk` });
  // Falas: cada tipo é uma lista "a|b|c" no dicionário
  const phrases = {} as Phrases;
  for (const k of ['start', 'serve', 'fire', 'swap'] as const) localize(phrases, {}, { [k]: `hero.${h.id}.${k}` });
  return Object.defineProperty(h, 'phrases', { value: phrases, enumerable: true });
});

export function heroDef(id: string): HeroDef | undefined {
  return HEROES.find((h) => h.id === id);
}

export interface CustomerLook {
  species: Species;
  body: number;
  belly: number;
  accent: number;
}

/** Clientes da floresta (famílias especiais chegam em etapas futuras — ver GDD seção 6). */
export const CUSTOMER_LOOKS: readonly CustomerLook[] = [
  { species: 'bear', body: 0xb7825a, belly: 0xf0d2b0, accent: 0x7a4f30 },
  { species: 'bear', body: 0xe9d7c0, belly: 0xffffff, accent: 0xa98e70 },
  { species: 'cat', body: 0x9aa3b5, belly: 0xf3f3f7, accent: 0xff9fb5 },
  { species: 'cat', body: 0xf2b36b, belly: 0xfff4e3, accent: 0xd97a3a },
  { species: 'mouse', body: 0xc8c0cf, belly: 0xfbeff5, accent: 0xff9fb5 },
  { species: 'frog', body: 0x8fd16a, belly: 0xe9f7c9, accent: 0x5a9a3f },
  { species: 'hedgehog', body: 0x9b7b64, belly: 0xf1dcc4, accent: 0x5c4332 },
];

/** Visual dos clientes de famílias desbloqueáveis. */
export const FAMILY_LOOKS: Partial<Record<FamilyId, CustomerLook>> = {
  panda: { species: 'panda', body: 0xfbfbf8, belly: 0xffffff, accent: 0x2e2c36 },
};

/** Rótulo de família por espécie, traduzido ("Bear family", "Família Urso"…). */
export function speciesFamilyName(sp: Species): string {
  return tk(`species.${sp}`);
}
