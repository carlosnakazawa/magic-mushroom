import * as THREE from 'three';
import { INGREDIENTS } from '../data/ingredients';
import { TUNING } from '../config';
import { bowlRecipe, itemName, makeBowl, makeIngredient, tryMerge, type Item } from '../sim/items';
import type { Chef } from './chef';
import type { Station, Table, World } from './world';

export type Target = { kind: 'station'; station: Station } | { kind: 'table'; table: Table };

/** Uma ação possível. A mesma estrutura gera a dica na tela e executa a ação — nunca divergem. */
export interface Action {
  label: string;
  /** Ação existe mas não pode ser feita agora (mostra dica em cinza, toca "não"). */
  disabled?: boolean;
  run: () => void;
}

/** O que as ações precisam do jogo (implementado por Game). */
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
  | { type: 'deny'; chef: Chef };

/** Encontra a estação/mesa que o herói está "olhando". */
export function findTarget(world: World, chef: Chef): Target | null {
  const fx = Math.sin(chef.facing);
  const fz = Math.cos(chef.facing);
  const cx = Math.round(chef.pos.x);
  const cz = Math.round(chef.pos.z);
  let best: Target | null = null;
  let bestScore = Infinity;
  for (let dz = -1; dz <= 1; dz++)
    for (let dx = -1; dx <= 1; dx++) {
      const x = cx + dx;
      const z = cz + dz;
      const station = world.stationAt(x, z);
      const table = station ? null : world.tableAt(x, z);
      if (!station && !table) continue;
      // Escalares em vez de Vector3: roda todo frame para cada herói.
      const tx = x - chef.pos.x;
      const tz = z - chef.pos.z;
      const dist = Math.hypot(tx, tz);
      if (dist > TUNING.player.reach + 0.55) continue;
      const dot = dist > 0.001 ? (tx * fx + tz * fz) / dist : 1;
      if (dot < 0.3) continue;
      const score = dist - dot * 0.9;
      if (score < bestScore) {
        bestScore = score;
        best = station ? { kind: 'station', station } : { kind: 'table', table: table! };
      }
    }
  return best;
}

/** Ação do botão "pegar/soltar" (Espaço). */
export function pickAction(host: ActionHost, chef: Chef, target: Target | null): Action | null {
  if (!target) return null;
  const held = chef.held;
  if (target.kind === 'table') return tablePickAction(host, chef, target.table);

  const s = target.station;
  switch (s.kind) {
    case 'crate': {
      if (held) return null;
      const kind = s.ingredient!;
      return {
        label: `Pegar ${INGREDIENTS[kind].name}`,
        run: () => {
          const item = makeIngredient(kind);
          host.hold(chef, item);
          host.emit({ type: 'pickup', chef, item, from: 'crate' });
        },
      };
    }
    case 'bowls': {
      if (!held && s.bowls > 0) {
        return {
          label: 'Pegar tigela',
          run: () => {
            s.bowls--;
            s.refreshStack();
            const item = makeBowl();
            host.hold(chef, item);
            host.emit({ type: 'pickup', chef, item, from: 'stack' });
          },
        };
      }
      if (!held) return { label: 'Sem tigelas — lave na pia!', disabled: true, run: () => host.emit({ type: 'deny', chef }) };
      if (held.type === 'bowl' && !held.dirty && held.contents.length === 0) {
        return {
          label: 'Guardar tigela',
          run: () => {
            s.bowls++;
            s.refreshStack();
            host.hold(chef, null);
          },
        };
      }
      return null;
    }
    case 'sink': {
      if (held?.type === 'bowl' && held.dirty) {
        return {
          label: 'Colocar na pia',
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
      if (!held) return null;
      if (held.type === 'ingredient') {
        return {
          label: 'Jogar fora',
          run: () => {
            host.hold(chef, null);
            host.emit({ type: 'trash', chef, at: s.worldTop });
          },
        };
      }
      if (!held.dirty && held.contents.length > 0) {
        return {
          label: 'Esvaziar tigela',
          run: () => {
            held.contents = [];
            held.version++;
            host.emit({ type: 'trash', chef, at: s.worldTop });
          },
        };
      }
      return held.dirty ? { label: 'Louça suja vai na pia', disabled: true, run: () => host.emit({ type: 'deny', chef }) } : null;
    }
    case 'counter':
    case 'board': {
      const onTop = s.item;
      if (!held && onTop) {
        return {
          label: `Pegar ${itemName(onTop)}`,
          run: () => {
            host.place(s, null);
            s.progress = 0;
            host.hold(chef, onTop);
            host.emit({ type: 'pickup', chef, item: onTop, from: 'counter' });
          },
        };
      }
      if (held && !onTop) {
        if (s.kind === 'board' && held.type !== 'ingredient') return null;
        return {
          label: s.kind === 'board' ? 'Colocar na tábua' : 'Colocar',
          run: () => {
            host.hold(chef, null);
            host.place(s, held);
            host.emit({ type: 'place', chef, item: held, station: s });
          },
        };
      }
      if (held && onTop) {
        const bowl = held.type === 'bowl' ? held : onTop.type === 'bowl' ? onTop : null;
        const ing = held.type === 'ingredient' ? held : onTop.type === 'ingredient' ? onTop : null;
        if (!bowl || !ing) return null;
        if (bowl.dirty) return { label: 'Tigela suja!', disabled: true, run: () => host.emit({ type: 'deny', chef }) };
        if (!ing.chopped) return { label: 'Corte primeiro na tábua', disabled: true, run: () => host.emit({ type: 'deny', chef }) };
        // Testa numa cópia para não alterar o estado só por exibir a dica
        const probe = tryMerge(clone(held), clone(onTop));
        if (!probe) return { label: 'Não combina', disabled: true, run: () => host.emit({ type: 'deny', chef }) };
        return {
          label: `Juntar ${INGREDIENTS[ing.kind].name}`,
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

function clone<T extends Item>(item: T): T {
  return item.type === 'bowl' ? ({ ...item, contents: [...item.contents] } as T) : ({ ...item } as T);
}

function tablePickAction(host: ActionHost, chef: Chef, table: Table): Action | null {
  const held = chef.held;
  const party = table.party;
  if (held) {
    const recipe = bowlRecipe(held);
    if (!recipe) return held.type === 'bowl' && held.contents.length > 0 ? { label: 'Prato incompleto', disabled: true, run: () => host.emit({ type: 'deny', chef }) } : null;
    if (!party || party.phase === 'waitingOrder') {
      return party ? { label: 'Anote o pedido primeiro', disabled: true, run: () => host.emit({ type: 'deny', chef }) } : null;
    }
    if (party.wants(recipe.id) < 0) return { label: 'Ninguém aqui pediu isso', disabled: true, run: () => host.emit({ type: 'deny', chef }) };
    return { label: `Servir ${recipe.name}`, run: () => host.serve(table, chef) };
  }
  if (party?.phase === 'waitingOrder') return { label: 'Anotar pedido', run: () => host.takeOrder(table, chef) };
  if (table.hasDirty) return { label: table.coins > 0 ? 'Recolher louça e moedas' : 'Recolher louça', run: () => host.clearDish(table, chef) };
  return null;
}

/** Ação do botão "usar" (E). */
export function useAction(host: ActionHost, chef: Chef, target: Target | null): Action | null {
  if (!target) return null;
  if (target.kind === 'table') {
    const party = target.table.party;
    if (party?.phase === 'waitingOrder') return { label: 'Anotar pedido', run: () => host.takeOrder(target.table, chef) };
    return null;
  }
  const s = target.station;
  if (chef.workingAt === s) return null;
  if (s.kind === 'board' && s.item?.type === 'ingredient' && !s.item.chopped) {
    return { label: s.progress > 0 ? 'Continuar cortando' : 'Cortar', run: () => host.startWork(chef, s) };
  }
  if (s.kind === 'sink' && s.dirty.length > 0) {
    return { label: s.progress > 0 ? 'Continuar lavando' : 'Lavar', run: () => host.startWork(chef, s) };
  }
  return null;
}
