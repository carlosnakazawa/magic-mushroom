/** Números de ajuste do jogo. Mude aqui para balancear — nunca espalhe "números mágicos" pelo código. */
export const TUNING = {
  player: {
    speed: 4.6,
    accel: 30,
    radius: 0.36,
    reach: 0.95,
  },
  work: {
    /** Segundos para picar um ingrediente na tábua. */
    chopTime: 1.6,
    /** Segundos para lavar uma tigela na pia. */
    washTime: 1.8,
  },
  customer: {
    walkSpeed: 2.2,
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
  rest: {
    /** Heróis descansados trabalham mais rápido no começo do dia. */
    workSpeed: 1.3,
    /** Duração do bônus (s). */
    duration: 60,
  },
} as const;

export type Tuning = typeof TUNING;
