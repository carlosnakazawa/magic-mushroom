/** Números de ajuste do jogo. Mude aqui para balancear — nunca espalhe "números mágicos" pelo código. */
export const TUNING = {
  player: {
    /** Um pouco mais rápido que antes (4.6): o teste com crianças achou lento. */
    speed: 5.3,
    accel: 42,
    radius: 0.36,
    reach: 0.95,
    /** Quanto a mira "puxa" para estações onde há algo útil para fazer. */
    usefulTargetBonus: 0.6,
    /**
     * Corrida automática: segurando o direcional por `runAfter` segundos o herói
     * acelera até `runBoost`× em `runRamp` segundos (pedido das crianças: "andar mais rápido").
     */
    runAfter: 0.45,
    runRamp: 0.35,
    runBoost: 1.4,
  },
  day: {
    /** Nos últimos segundos do dia não entram clientes novos (antes: 12 s). */
    lastCall: 30,
    /** Relógio zerado com clientes esperando: até quantos segundos de "hora de fechar". */
    overtimeMax: 45,
  },
  work: {
    /** Segundos para picar um ingrediente na tábua. */
    chopTime: 1.6,
    /** Segundos para lavar uma tigela na pia. */
    washTime: 1.8,
  },
  customer: {
    walkSpeed: 2.2,
    /** Tamanho do cliente andando para os heróis esbarrarem (antes atravessavam). */
    radius: 0.3,
    eatTime: 4,
  },
  patience: {
    /** Fração por segundo perdida esperando alguém anotar o pedido. */
    orderDrain: 1 / 40,
    /** Fração por segundo perdida esperando a comida. */
    foodDrain: 1 / 70,
    /** Recuperação de paciência do grupo todo a cada prato entregue. */
    serveRecovery: 0.35,
  },
  economy: {
    /** Gorjeta máxima como fração do preço (quando paciência = 100%). */
    maxTipRatio: 0.5,
    /** Bônus de banquete por membro (grupos com 3+). */
    banquetBonusPerMember: 5,
    banquetMinSize: 3,
  },
  machines: {
    /** Liquidificador trabalhando (s). */
    blendTime: 4,
    /** Caldeirão cozinhando (s). */
    cookTime: 7,
    /** Chapa grelhando (s). */
    grillTime: 5,
    /** Pronto e seguro antes de começar a queimar (s). */
    safeTime: 7,
    /** Aviso antes de queimar (s). */
    warnTime: 5,
    /** Queimado até pegar fogo (s). */
    burntToFire: 4,
    /** Extintor apagando (s). */
    extinguishTime: 1.2,
  },
  decor: {
    /** Cada ponto de charme reduz a perda de paciência em 1%... */
    charmPerPoint: 0.01,
    /** ...até no máximo 30%. */
    maxCharmBonus: 0.3,
  },
  /** Super-poderes dos heróis (ver data/characters.ts e sim/perks.ts). */
  perks: {
    tipsBonus: 2,
    speed: 1.15,
    chop: 1.35,
    fireSpray: 2,
    fireWash: 1.2,
    memoryPatience: 0.25,
    soupBoost: 1.3,
    wash: 1.6,
    reachExtra: 0.7,
    /** Lumi: perda de paciência de todos os clientes × este valor. */
    calmDrain: 0.85,
  },
  /** Segundos até o próximo cliente depois da 1ª entrega do tutorial. */
  tutorialNextCustomer: 4,
  /** Presente de boas-vindas na primeira noite (o teste mostrou que a 1ª loja ficava vazia). */
  welcomeGift: 40,
  rest: {
    /** Heróis descansados trabalham mais rápido no começo do dia. */
    workSpeed: 1.3,
    /** Duração do bônus (s). */
    duration: 60,
  },
} as const;

export type Tuning = typeof TUNING;
