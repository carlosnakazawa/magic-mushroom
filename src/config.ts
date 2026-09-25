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
  kitchen: {
    startingBowls: 3,
  },
} as const;

export type Tuning = typeof TUNING;
