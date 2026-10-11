import type * as THREE from 'three';
import { TUNING } from '../config';
import { INGREDIENTS } from '../data/ingredients';
import { needsChopped } from '../data/recipes';
import {
  dishRecipe,
  emptyVessel,
  fillVessel,
  isEmptyVessel,
  itemName,
  makeIngredient,
  makeVessel,
  tryMerge,
  type Item,
  vesselName,
  type VesselItem,
} from '../sim/items';
import type { Chef } from './chef';
import type { Station, Table, World } from './world';
import { t, tk } from '../i18n';

export type Target = { kind: 'station'; station: Station } | { kind: 'table'; table: Table };

/** Uma ação possível. A mesma estrutura gera a dica na tela e executa a ação — nunca divergem. */
export interface Action {
  label: string;
  /** Identificador estável (o texto muda com o idioma). */
  id?: 'takeOrder';
  /** Ação existe mas não pode ser feita agora (mostra dica em cinza, toca "não"). */
  disabled?: boolean;
  run: () => void;
}

/** O que as ações precisam do jogo (implementado por DayRun). */
export interface ActionHost {
  hold(chef: Chef, item: Item | null): void;
  place(station: Station, item: Item | null): void;
  emit(e: GameEvent): void;
  takeOrder(table: Table, chef: Chef): void;
  serve(table: Table, chef: Chef): void;
  clearDish(table: Table, chef: Chef): void;
  startWork(chef: Chef, station: Station): void;
}

export type GameEvent =
  | { type: 'pickup'; chef: Chef; item: Item; from: 'crate' | 'counter' | 'stack' | 'table' }
  | { type: 'place'; chef: Chef; item: Item; station: Station }
  | { type: 'merge'; chef: Chef; bowl: Item; at: THREE.Vector3 }
  | { type: 'trash'; chef: Chef; at: THREE.Vector3 }
  | { type: 'machineAdd'; chef: Chef; station: Station }
  | { type: 'machineStart'; chef: Chef; station: Station }
  | { type: 'machineTake'; chef: Chef; station: Station; vessel: VesselItem }
  | { type: 'dump'; chef: Chef; station: Station }
  | { type: 'deny'; chef: Chef };

/**
 * Encontra a estação/mesa que o herói vai usar.
 * Mira tolerante (teste de usabilidade): prefere o que está à frente, mas aceita vizinhos
 * ao lado quando há algo útil para fazer neles (`useful`), e alcança mais longe com o
 * super-poder "língua comprida".
 */
export function findTarget(world: World, chef: Chef, useful?: (t: Target) => boolean): Target | null {
  const fx = Math.sin(chef.facing);
  const fz = Math.cos(chef.facing);
  const cx = Math.round(chef.pos.x);
  const cz = Math.round(chef.pos.z);
  const reach = TUNING.player.reach + 0.55 + chef.mods.reach;
  const span = reach > 1.6 ? 2 : 1;
  let best: Target | null = null;
  let bestScore = Infinity;
  for (let dz = -span; dz <= span; dz++)
    for (let dx = -span; dx <= span; dx++) {
      const x = cx + dx;
      const z = cz + dz;
      const station = world.stationAt(x, z);
      const table = station ? null : world.tableAt(x, z);
      if (!station && !table) continue;
      // Escalares em vez de Vector3: roda todo frame para cada herói.
      const tx = x - chef.pos.x;
      const tz = z - chef.pos.z;
      const dist = Math.hypot(tx, tz);
      if (dist > reach) continue;
      const dot = dist > 0.001 ? (tx * fx + tz * fz) / dist : 1;
      const target: Target = station ? { kind: 'station', station } : { kind: 'table', table: table! };
      const helps = useful?.(target) ?? false;
      // À frente: sempre vale. Ao lado: só se for útil e estiver colado.
      if (dot < 0.3 && !(helps && dot > -0.25 && dist < 1.15)) continue;
      const score = dist - dot * 0.9 - (helps ? TUNING.player.usefulTargetBonus : 0);
      if (score < bestScore) {
        bestScore = score;
        best = target;
      }
    }
  return best;
}

const deny = (host: ActionHost, chef: Chef, label: string): Action => ({ label, disabled: true, run: () => host.emit({ type: 'deny', chef }) });


/** Ação do botão "pegar/soltar" (Espaço). */
export function pickAction(host: ActionHost, chef: Chef, target: Target | null): Action | null {
  if (!target) return null;
  const held = chef.held;
  if (target.kind === 'table') return tablePickAction(host, chef, target.table);

  const s = target.station;
  switch (s.kind) {
    case 'crate': {
      if (held) return deny(host, chef, t('deny.handsFull'));
      const kind = s.ingredient!;
      return {
        label: t('act.take', { item: INGREDIENTS[kind].name }),
        run: () => {
          const item = makeIngredient(kind);
          host.hold(chef, item);
          host.emit({ type: 'pickup', chef, item, from: 'crate' });
        },
      };
    }
    case 'stack': {
      const v = s.vessel!;
      if (!held && s.count > 0) {
        return {
          label: t('act.take', { item: vesselName(v) }),
          run: () => {
            s.count--;
            s.refreshStack();
            const item = makeVessel(v);
            host.hold(chef, item);
            host.emit({ type: 'pickup', chef, item, from: 'stack' });
          },
        };
      }
      if (!held) return deny(host, chef, tk(`deny.noVessels.${v}`));
      if (held.type === 'ingredient') return deny(host, chef, t('deny.dropFirst', { item: itemName(held).toLowerCase() }));
      if (isEmptyVessel(held, v)) {
        return {
          label: t('act.store'),
          run: () => {
            s.count++;
            s.refreshStack();
            host.hold(chef, null);
          },
        };
      }
      return null;
    }
    case 'sink': {
      if (held?.type === 'vessel' && held.dirty) {
        return {
          label: t('act.toSink'),
          run: () => {
            s.dirty.push(held);
            host.hold(chef, null);
            host.emit({ type: 'place', chef, item: held, station: s });
          },
        };
      }
      return null;
    }
    case 'trash': {
      if (!held || held.type === 'tool') return null;
      if (held.type === 'ingredient') {
        return {
          label: t('act.trash'),
          run: () => {
            host.hold(chef, null);
            host.emit({ type: 'trash', chef, at: s.worldTop });
          },
        };
      }
      if (!held.dirty && held.contents.length > 0) {
        return {
          label: t('act.empty', { vessel: vesselName(held.vessel) }),
          run: () => {
            emptyVessel(held);
            host.emit({ type: 'trash', chef, at: s.worldTop });
          },
        };
      }
      return held.dirty ? deny(host, chef, t('deny.dirtyToSink')) : null;
    }
    case 'machine':
      return machinePickAction(host, chef, s);
    case 'counter':
    case 'board': {
      const onTop = s.item;
      if (!held && onTop) {
        return {
          label: t('act.take', { item: itemName(onTop) }),
          run: () => {
            host.place(s, null);
            s.progress = 0;
            host.hold(chef, onTop);
            host.emit({ type: 'pickup', chef, item: onTop, from: 'counter' });
          },
        };
      }
      if (held && !onTop) {
        if (s.kind === 'board') {
          if (held.type !== 'ingredient') return null;
          if (!INGREDIENTS[held.kind].choppable) return deny(host, chef, t('deny.noChop', { item: INGREDIENTS[held.kind].name }));
        }
        return {
          label: s.kind === 'board' ? t('act.putBoard') : t('act.put'),
          run: () => {
            host.hold(chef, null);
            host.place(s, held);
            host.emit({ type: 'place', chef, item: held, station: s });
          },
        };
      }
      if (held && onTop) {
        const bowl = held.type === 'vessel' ? held : onTop.type === 'vessel' ? onTop : null;
        const ing = held.type === 'ingredient' ? held : onTop.type === 'ingredient' ? onTop : null;
        if (!bowl || !ing) return null;
        if (bowl.dirty) return deny(host, chef, t('deny.dirty', { vessel: vesselName(bowl.vessel) }));
        if (bowl.vessel !== 'bowl') return deny(host, chef, t('deny.saladBowl'));
        if (!ing.chopped) return deny(host, chef, INGREDIENTS[ing.kind].choppable ? t('deny.chopFirst') : t('deny.machine'));
        // Testa numa cópia para não alterar o estado só por exibir a dica
        const probe = tryMerge(clone(held), clone(onTop));
        if (!probe) return deny(host, chef, t('deny.noMatch'));
        return {
          label: t('act.add', { item: INGREDIENTS[ing.kind].name }),
          run: () => {
            const res = tryMerge(held, onTop);
            if (!res) return;
            host.hold(chef, res.held);
            host.place(s, res.counter);
            host.emit({ type: 'merge', chef, bowl, at: s.worldTop });
          },
        };
      }
      return null;
    }
  }
}

function machinePickAction(host: ActionHost, chef: Chef, s: Station): Action | null {
  const m = s.machine!;
  const held = chef.held;
  switch (m.phase) {
    case 'fire':
      return held?.type === 'tool' ? null : deny(host, chef, t('deny.grabExt'));
    case 'burnt':
      if (held) return deny(host, chef, t('deny.burntHands'));
      return {
        label: t('act.dumpBurnt'),
        run: () => {
          m.dump();
          host.emit({ type: 'dump', chef, station: s });
        },
      };
    case 'done':
    case 'warning': {
      if (isEmptyVessel(held, m.vessel)) {
        const recipe = m.recipe!;
        return {
          label: t('act.serve', { dish: recipe.name }),
          run: () => {
            const out = m.take();
            if (!out) return;
            fillVessel(held, out.method, out.contents);
            host.emit({ type: 'machineTake', chef, station: s, vessel: held });
          },
        };
      }
      return deny(host, chef, tk(`deny.bring.${m.vessel}`));
    }
    case 'working':
      return held?.type === 'ingredient' ? deny(host, chef, t('deny.working')) : null;
    case 'idle': {
      if (held?.type === 'ingredient') {
        const def = INGREDIENTS[held.kind];
        if (m.canAdd(held.kind, held.chopped)) {
          return {
            label: t('act.add', { item: def.name }),
            run: () => {
              if (!m.add(held.kind)) return;
              host.hold(chef, null);
              host.emit({ type: 'machineAdd', chef, station: s });
            },
          };
        }
        const wantsChopped = needsChopped(m.method);
        if (wantsChopped && !held.chopped && def.choppable) return deny(host, chef, 'Corte primeiro na tábua');
        if (!wantsChopped && held.chopped) return deny(host, chef, t('deny.whole'));
        return deny(host, chef, m.contents.includes(held.kind) ? t('deny.already') : t('deny.noMatchHere'));
      }
      if (!held && m.contents.length) {
        return {
          label: t('act.emptyMachine'),
          run: () => {
            m.dump();
            host.emit({ type: 'dump', chef, station: s });
          },
        };
      }
      return null;
    }
  }
}

function clone<T extends Item>(item: T): T {
  return item.type === 'vessel' ? ({ ...item, contents: [...item.contents] } as T) : ({ ...item } as T);
}

function tablePickAction(host: ActionHost, chef: Chef, table: Table): Action | null {
  const held = chef.held;
  const party = table.party;
  if (held) {
    if (held.type !== 'vessel') return null;
    const recipe = dishRecipe(held);
    if (!recipe) return held.contents.length > 0 && !held.dirty ? deny(host, chef, t('deny.incomplete')) : null;
    if (!party || party.isLeaving) return null;
    if (party.phase === 'waitingOrder') return deny(host, chef, t('deny.orderFirst'));
    if (party.wants(recipe.id) < 0) return deny(host, chef, t('deny.nobody'));
    return { label: t('act.serve', { dish: recipe.name }), run: () => host.serve(table, chef) };
  }
  if (party?.phase === 'waitingOrder') return { id: 'takeOrder', label: t('act.takeOrder'), run: () => host.takeOrder(table, chef) };
  if (table.hasDirty) return { label: table.coins > 0 ? t('act.clearCoins') : t('act.clear'), run: () => host.clearDish(table, chef) };
  return null;
}

/** Ação do botão "usar" (E). */
export function useAction(host: ActionHost, chef: Chef, target: Target | null): Action | null {
  if (!target) return null;
  if (target.kind === 'table') {
    const party = target.table.party;
    if (party?.phase === 'waitingOrder') return { id: 'takeOrder', label: t('act.takeOrder'), run: () => host.takeOrder(target.table, chef) };
    return null;
  }
  const s = target.station;
  if (chef.workingAt === s) return null;
  if (s.kind === 'board' && s.item?.type === 'ingredient' && !s.item.chopped && INGREDIENTS[s.item.kind].choppable) {
    return { label: s.progress > 0 ? t('act.chopMore') : t('act.chop'), run: () => host.startWork(chef, s) };
  }
  if (s.kind === 'sink' && s.dirty.length > 0) {
    return { label: s.progress > 0 ? t('act.washMore') : t('act.wash'), run: () => host.startWork(chef, s) };
  }
  if (s.kind === 'machine') {
    const m = s.machine!;
    if (m.phase === 'fire') {
      return chef.held?.type === 'tool' ? { label: t('act.extinguish'), run: () => host.startWork(chef, s) } : deny(host, chef, t('deny.grabExt'));
    }
    if (m.kind === 'blender' && m.phase === 'idle' && m.contents.length) {
      if (!m.recipe) return deny(host, chef, t('deny.missing'));
      return {
        label: t('act.start'),
        run: () => {
          if (m.start()) host.emit({ type: 'machineStart', chef, station: s });
        },
      };
    }
  }
  return null;
}
