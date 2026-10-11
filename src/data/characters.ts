/** Heróis jogáveis e clientes. Personalidades completas em docs/GDD.md (seções 2 e B10). */

import type { FamilyId } from './families';

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

export const HEROES: readonly HeroDef[] = [
  {
    id: 'puff',
    name: 'Puff',
    title: 'O Coelhinho Alado',
    species: 'bunny',
    wing: 'dragonfly',
    body: 0xfdf6ff,
    belly: 0xffe3ef,
    accent: 0xffb6d1,
    wingColor: 0xbfe8ff,
    eyeColor: 0x2b2440,
    celebrate: 'hearts',
    blurb: 'Meigo e saltitante, cuida de cada detalhe.',
    accessory: 'bow',
    perk: 'tips',
    perkText: 'Feito com carinho: +2 🪙 em cada prato que serve',
    style: { bounce: 1.6, hover: 1, wiggle: 1.2 },
    voice: 880,
    phrases: {
      start: ['Vamos cozinhar com carinho! 💕', 'Oi, amiguinhos!'],
      serve: ['Feito com amor! 💕', 'Bom apetite!', 'Hihi! 🐰'],
      fire: ['Ai, ai, ai! 🔥', 'Socorro, fogo!'],
      swap: ['Pulinho! 🐰', 'Puff chegou!'],
    },
  },
  {
    id: 'florzinha',
    name: 'Florzinha',
    title: 'A Raposinha das Folhas',
    species: 'fox',
    wing: 'leaf',
    body: 0xffa25e,
    belly: 0xfff1de,
    accent: 0xd9531e,
    wingColor: 0xffb347,
    eyeColor: 0x2e1a10,
    celebrate: 'leaves',
    blurb: 'Rápida e engenhosa, faz curvas ágeis pelo salão.',
    accessory: 'leafCrown',
    perk: 'speed',
    perkText: 'Pés ligeiros: anda 15% mais rápido',
    style: { bounce: 0.8, hover: 0.6, wiggle: 0.7 },
    voice: 700,
    phrases: {
      start: ['Rapidinho, rapidinho! 🍂', 'Deixa comigo!'],
      serve: ['Entrega relâmpago! ⚡', 'Prontinho!', 'Zum! 🍂'],
      fire: ['Eita! Extintor, já!', 'Fogo? Corre!'],
      swap: ['Minha vez! 🦊', 'Sai da frente!'],
    },
  },
  {
    id: 'pipoca',
    name: 'Pipoca',
    title: 'O Dragãozinho Enérgico',
    species: 'dragon',
    wing: 'bat',
    body: 0x6fd6a8,
    belly: 0xfff0b3,
    accent: 0xff8fb1,
    wingColor: 0x3fae8a,
    eyeColor: 0x1d2b25,
    celebrate: 'sparks',
    blurb: 'Pura energia! Solta faíscas coloridas de alegria.',
    accessory: 'chefHat',
    perk: 'chop',
    perkText: 'Força de dragão: corta 35% mais rápido',
    style: { bounce: 1.3, hover: 0.5, wiggle: 1.6 },
    voice: 420,
    phrases: {
      start: ['UHUUU! Bora cozinhar! 🐲', 'Tô pegando fogo! (de alegria)'],
      serve: ['TCHARAM! ✨', 'Mais um! Mais um!', 'Fsssh! 🎆'],
      fire: ['Não fui eu! 😅', 'Ops! Esse fogo não é meu!'],
      swap: ['PIPOCA NA ÁREA!', 'Energia total! ⚡'],
    },
  },
  {
    id: 'astro',
    name: 'Astro',
    title: 'O Lobinho Estelar',
    species: 'wolf',
    wing: 'constellation',
    body: 0x6f7fa8,
    belly: 0xc9d3ef,
    accent: 0x3d4a73,
    wingColor: 0x9fd0ff,
    eyeColor: 0x7fe8ff,
    celebrate: 'stars',
    blurb: 'Focado e heróico — mas abana o rabo quando acerta.',
    accessory: 'starScarf',
    perk: 'firefighter',
    perkText: 'Herói estelar: apaga fogo 2× mais rápido e lava 20% mais rápido',
    style: { bounce: 0.6, hover: 0.8, wiggle: 0.4 },
    voice: 520,
    phrases: {
      start: ['Missão: bistrô perfeito. ⭐', 'Equipe, em posição!'],
      serve: ['Missão cumprida! ⭐', 'Pedido perfeito. *abana o rabo*'],
      fire: ['Deixa que eu apago! 🧯', 'Ao resgate!'],
      swap: ['Astro de prontidão!', 'Assumindo o comando! ⭐'],
    },
  },
  {
    id: 'estrelinha',
    name: 'Estrelinha',
    title: 'A Corujinha Feérica',
    species: 'owl',
    wing: 'feather',
    body: 0xf3e6d0,
    belly: 0xfffaf0,
    accent: 0xc7a5e8,
    wingColor: 0xf6e7ff,
    eyeColor: 0x3a2a55,
    celebrate: 'dust',
    blurb: 'Graciosa e organizada, nunca esquece um pedido.',
    accessory: 'glasses',
    perk: 'memory',
    perkText: 'Memória de coruja: ao anotar, o cliente fica +25% paciente',
    style: { bounce: 0.4, hover: 1.8, wiggle: 0.8 },
    voice: 1040,
    phrases: {
      start: ['Tudo anotado e organizado! 📜', 'Uhu-uhu! Bom dia!'],
      serve: ['Exatamente como pediu! ✨', 'Uhu! 🦉'],
      fire: ['Isso não estava na lista! 🔥', 'Calma, calma!'],
      swap: ['Estrelinha voando! ✨', 'Deixa eu organizar!'],
    },
  },
  {
    id: 'mochi',
    name: 'Mochi',
    title: 'O Pandinha do Bambu',
    species: 'panda',
    wing: 'leaf',
    body: 0xfbfbf8,
    belly: 0xffffff,
    accent: 0x2e2c36,
    wingColor: 0x8fd16a,
    eyeColor: 0x1d1b22,
    celebrate: 'leaves',
    blurb: 'Calmo e forte, adora uma sopinha de bambu.',
    accessory: 'bambooLeaf',
    perk: 'soup',
    perkText: 'Mestre das sopas: caldeirão e chapa que ele abastece cozinham 30% mais rápido',
    style: { bounce: 0.5, hover: 0.4, wiggle: 0.5 },
    voice: 360,
    phrases: {
      start: ['Sem pressa... mas sem atraso. 🎍', 'Hora da sopinha!'],
      serve: ['Feito com calma. 🐼', 'Hmmm, que cheiro bom!'],
      fire: ['Ih... queimou o bambu?', 'Respira... e apaga!'],
      swap: ['Mochi aqui. 🎍', 'Bocejo... vamos lá!'],
    },
    family: 'panda',
  },
  {
    id: 'bolota',
    name: 'Bolota',
    title: 'O Ouriço Jardineiro',
    species: 'hedgehog',
    wing: 'feather',
    body: 0xb08a6a,
    belly: 0xf7e3c8,
    accent: 0x6a4c36,
    wingColor: 0xffd9e8,
    eyeColor: 0x2e2018,
    celebrate: 'hearts',
    blurb: 'Tímido, mas o mais caprichoso da pia.',
    accessory: 'flower',
    perk: 'wash',
    perkText: 'Brilho de espinhos: lava louça 60% mais rápido',
    style: { bounce: 1.1, hover: 0.5, wiggle: 1 },
    voice: 760,
    phrases: {
      start: ['É-é... vamos lá? 🌼', 'Louça limpinha hoje!'],
      serve: ['Brilhando! ✨', 'Fiz direitinho? 🌼'],
      fire: ['Eek! 🦔', 'Meus espinhos! Fogo!'],
      swap: ['Bolota rolando! 🌀', 'Oi... sou eu! 🌼'],
    },
    price: 120,
  },
  {
    id: 'gota',
    name: 'Gota',
    title: 'A Sapinha Saltadora',
    species: 'frog',
    wing: 'dragonfly',
    body: 0x7fd36a,
    belly: 0xe9f7c9,
    accent: 0xff8fb1,
    wingColor: 0xb8f0ff,
    eyeColor: 0x1d2b18,
    celebrate: 'sparks',
    blurb: 'Brincalhona, alcança tudo com a língua comprida.',
    accessory: 'crown',
    perk: 'reach',
    perkText: 'Língua comprida: pega e usa estações um pouco mais longe',
    style: { bounce: 1.9, hover: 0.3, wiggle: 1.4 },
    voice: 600,
    phrases: {
      start: ['Croac! Bom dia, bistrô! 👑', 'Pula-pula, trabalho!'],
      serve: ['Slurp! Entregue! 👅', 'Croac-tástico!'],
      fire: ['Água! Água! 💧', 'Croac! Fogo!'],
      swap: ['Boing! 🐸', 'A rainha chegou! 👑'],
    },
    price: 150,
  },
  {
    id: 'lumi',
    name: 'Lumi',
    title: 'A Gatinha da Lua',
    species: 'cat',
    wing: 'constellation',
    body: 0xb9b3d9,
    belly: 0xf4f1ff,
    accent: 0x8f7fd6,
    wingColor: 0xd9c8ff,
    eyeColor: 0x6a4fd6,
    celebrate: 'stars',
    blurb: 'Sonhadora e tranquila — o ronronar acalma todo mundo.',
    accessory: 'moonClip',
    perk: 'calm',
    perkText: 'Ronronar lunar: todos os clientes ficam 15% mais pacientes',
    style: { bounce: 0.5, hover: 1.4, wiggle: 0.6 },
    voice: 940,
    phrases: {
      start: ['Miau... que noite... digo, dia lindo! 🌙', 'Prrr... vamos?'],
      serve: ['Prrrr... 💜', 'Servido com brilho de lua 🌙'],
      fire: ['Miaaau! 🙀', 'Fogo não combina com a lua!'],
      swap: ['Lumi acordou! 🌙', 'Prrr... minha vez.'],
    },
    price: 200,
  },
];

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

/** Nome da espécie no plural, para o banner de família ("Família Ursos"). */
export const SPECIES_FAMILY_NAME: Record<Species, string> = {
  bunny: 'Coelhos',
  fox: 'Raposas',
  dragon: 'Dragões',
  wolf: 'Lobos',
  owl: 'Corujas',
  bear: 'Ursos',
  cat: 'Gatos',
  mouse: 'Ratinhos',
  frog: 'Sapos',
  hedgehog: 'Ouriços',
  panda: 'Pandas',
};
