/** Heróis jogáveis e clientes. Descrições completas em docs/GDD.md (seção 2). */

export type Species = 'bunny' | 'fox' | 'dragon' | 'wolf' | 'owl' | 'bear' | 'cat' | 'mouse' | 'frog' | 'hedgehog';

export type WingStyle = 'dragonfly' | 'leaf' | 'bat' | 'constellation' | 'feather';

/** Efeito ao comemorar uma entrega. */
export type CelebrateFx = 'hearts' | 'leaves' | 'sparks' | 'stars' | 'dust';

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
  },
];

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
