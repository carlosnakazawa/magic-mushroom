import * as THREE from 'three';
import { TUNING } from '../config';
import type { CustomerLook } from '../data/characters';
import { Creature } from '../models/creature';

export type CustomerState = 'walking' | 'seated' | 'gone';

/** Um cliente da floresta que anda por uma rota de pontos e senta no banquinho. */
export class Customer {
  readonly creature: Creature;
  readonly pos = new THREE.Vector3();
  state: CustomerState = 'walking';
  private path: THREE.Vector3[] = [];
  private facing = 0;
  private seatFacing = 0;
  private onArrive: (() => void) | null = null;

  constructor(
    readonly look: CustomerLook,
    scale: number,
  ) {
    this.creature = new Creature(look, scale);
  }

  get root(): THREE.Group {
    return this.creature.root;
  }

  walk(path: THREE.Vector3[], onArrive: () => void, seatFacing?: number): void {
    this.path = path.map((p) => p.clone());
    this.onArrive = onArrive;
    this.state = 'walking';
    this.creature.sitting = false;
    this.creature.eating = false;
    if (seatFacing !== undefined) this.seatFacing = seatFacing;
  }

  sit(): void {
    this.state = 'seated';
    this.creature.sitting = true;
    this.facing = this.seatFacing;
  }

  update(dt: number): void {
    if (this.state === 'walking') {
      const target = this.path[0];
      if (!target) {
        const cb = this.onArrive;
        this.onArrive = null;
        cb?.();
      } else {
        const d = target.clone().sub(this.pos);
        d.y = 0;
        const dist = d.length();
        const step = TUNING.customer.walkSpeed * dt;
        if (dist <= step) {
          this.pos.copy(target);
          this.path.shift();
        } else {
          d.multiplyScalar(1 / dist);
          this.pos.addScaledVector(d, step);
          this.facing = Math.atan2(d.x, d.z);
        }
      }
      this.creature.moving = this.path.length ? 1 : 0;
    } else {
      this.creature.moving = 0;
    }
    this.root.position.copy(this.pos);
    const r = this.root.rotation;
    r.y += angleDiff(this.facing, r.y) * Math.min(1, dt * 12);
    this.creature.update(dt);
  }
}

export function angleDiff(target: number, current: number): number {
  let d = target - current;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
