import * as THREE from 'three';
import { TUNING } from '../config';
import type { HeroDef } from '../data/characters';
import type { PlayerInput } from '../core/input';
import { Creature } from '../models/creature';
import type { Item } from '../sim/items';
import { perkMods, type PerkMods } from '../sim/perks';
import { runMultiplier } from '../sim/run';
import type { WorldLabel } from '../ui/worldui';
import { angleDiff } from './customer';
import type { Station, World } from './world';

/** Um herói na cozinha/salão. Pode ser controlado por um jogador ou ficar parado (modo solo). */
export class Chef {
  readonly creature: Creature;
  readonly pos = new THREE.Vector3();
  readonly vel = new THREE.Vector3();
  /** Direção lógica (mira): muda na hora que o jogador aponta. */
  facing = 0;
  /** Direção visual do modelo: gira suave atrás da lógica. */
  private visualFacing = 0;
  /** Super-poder deste herói. */
  readonly mods: PerkMods;
  /** Balão de fala e quanto tempo falta para sumir. */
  speech: WorldLabel | null = null;
  speechLeft = 0;
  /** Evita falar demais. */
  speechCooldown = 0;
  held: Item | null = null;
  /** Estação onde está trabalhando (tábua/pia). */
  workingAt: Station | null = null;
  /** Índice do jogador que controla (ou -1). */
  controller = -1;
  hint: WorldLabel | null = null;
  tag: WorldLabel | null = null;
  /** Segundos segurando o direcional sem parar (corrida automática). */
  private heldMove = 0;
  /** Está correndo (para a poeirinha nos pés). */
  running = false;
  /** Marcador sob os pés (cor do jogador). */
  readonly ring: THREE.Mesh;

  constructor(readonly hero: HeroDef) {
    this.creature = new Creature(hero, 1.25);
    this.mods = perkMods(hero.perk);
    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(0.36, 0.44, 32),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false }),
    );
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.015;
    this.creature.root.add(this.ring);
  }

  get root(): THREE.Group {
    return this.creature.root;
  }

  get forward(): THREE.Vector3 {
    return new THREE.Vector3(Math.sin(this.facing), 0, Math.cos(this.facing));
  }

  /** Vira para um ponto na hora (ao agir numa estação). */
  faceTo(x: number, z: number): void {
    this.facing = Math.atan2(x - this.pos.x, z - this.pos.z);
  }

  setRingColor(color: number | null): void {
    this.ring.visible = color !== null;
    if (color !== null) (this.ring.material as THREE.MeshBasicMaterial).color.setHex(color);
  }

  move(input: PlayerInput | null, world: World, dt: number): void {
    const want = new THREE.Vector3(input?.moveX ?? 0, 0, input?.moveZ ?? 0);
    if (want.lengthSq() > 1) want.normalize();
    // Corrida automática: conta o tempo segurando o direcional (empurrão leve não conta)
    this.heldMove = want.lengthSq() > 0.5 ? this.heldMove + dt : 0;
    const base = TUNING.player.speed * this.mods.speed;
    const top = base * runMultiplier(this.heldMove);
    this.running = top > base * 1.2;
    want.multiplyScalar(top);
    const k = Math.min(1, (TUNING.player.accel * dt) / top);
    this.vel.lerp(want, k);
    if (want.lengthSq() > 0.01) {
      // Mira instantânea: um toque rápido na direção já escolhe o alvo (teste de usabilidade)
      this.facing = Math.atan2(want.x, want.z);
      this.workingAt = null;
    }
    this.pos.addScaledVector(this.vel, dt);
    this.collide(world);

    // Correndo, as patinhas mexem mais rápido (moving > 1)
    this.creature.moving = this.vel.length() / base;
    this.creature.holding = !!this.held;
    this.creature.working = !!this.workingAt;
    this.root.position.copy(this.pos);
    this.visualFacing += angleDiff(this.facing, this.visualFacing) * Math.min(1, dt * 18);
    this.root.rotation.y = this.visualFacing;
  }

  /**
   * Empurra o herói para fora de um cliente que está andando (antes atravessava).
   * Só o herói se mexe: o cliente segue a rota dele sem travar.
   */
  pushFrom(x: number, z: number, radius: number, world: World): void {
    const dx = this.pos.x - x;
    const dz = this.pos.z - z;
    const min = TUNING.player.radius + radius;
    const d2 = dx * dx + dz * dz;
    if (d2 >= min * min) return;
    const d = Math.sqrt(d2);
    // Em cima um do outro: sai para o lado em que o herói está olhando para trás
    const nx = d > 1e-4 ? dx / d : -Math.sin(this.facing);
    const nz = d > 1e-4 ? dz / d : -Math.cos(this.facing);
    this.pos.x += nx * (min - d);
    this.pos.z += nz * (min - d);
    this.collide(world);
    this.root.position.copy(this.pos);
  }

  /** Colisão círculo × células sólidas: empurra para fora pela normal (desliza nas quinas). */
  private collide(world: World): void {
    const r = TUNING.player.radius;
    for (let iter = 0; iter < 2; iter++) {
      const cx = Math.round(this.pos.x);
      const cz = Math.round(this.pos.z);
      for (let dz = -1; dz <= 1; dz++)
        for (let dx = -1; dx <= 1; dx++) {
          const x = cx + dx;
          const z = cz + dz;
          if (!world.isSolid(x, z)) continue;
          const ox = this.pos.x - Math.max(x - 0.5, Math.min(this.pos.x, x + 0.5));
          const oz = this.pos.z - Math.max(z - 0.5, Math.min(this.pos.z, z + 0.5));
          const d2 = ox * ox + oz * oz;
          if (d2 >= r * r) continue;
          if (d2 > 1e-8) {
            const d = Math.sqrt(d2);
            this.pos.x += (ox / d) * (r - d);
            this.pos.z += (oz / d) * (r - d);
          } else {
            // Centro dentro da caixa: sai pelo eixo de menor penetração.
            const px = this.pos.x - x;
            const pz = this.pos.z - z;
            if (Math.abs(px) > Math.abs(pz)) this.pos.x = x + Math.sign(px || 1) * (0.5 + r);
            else this.pos.z = z + Math.sign(pz || 1) * (0.5 + r);
          }
        }
    }
  }

  /** Resolve sobreposição com outro herói (empurrãozinho mútuo). */
  separate(other: Chef): void {
    const d = this.pos.clone().sub(other.pos);
    d.y = 0;
    const min = TUNING.player.radius * 2;
    const len = d.length();
    if (len > 0.0001 && len < min) {
      d.multiplyScalar((min - len) / len / 2);
      this.pos.add(d);
      other.pos.sub(d);
    }
  }
}
