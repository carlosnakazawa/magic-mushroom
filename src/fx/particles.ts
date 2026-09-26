import * as THREE from 'three';
import { heart, leaf, softDot, sparkle } from '../render/textures';

export type ParticleKind = 'dot' | 'sparkle' | 'heart' | 'leaf';

interface Particle {
  sprite: THREE.Sprite;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  gravity: number;
  spin: number;
}

export interface BurstOpts {
  kind?: ParticleKind;
  count?: number;
  colors?: number[];
  speed?: number;
  up?: number;
  life?: number;
  size?: number;
  gravity?: number;
  additive?: boolean;
}

/** Pool de partículas em sprites — brilhos, corações, folhas, faíscas. */
export class Particles {
  private pool: Particle[] = [];
  private active: Particle[] = [];
  private textures: Record<ParticleKind, THREE.Texture>;

  constructor(private scene: THREE.Scene) {
    this.textures = { dot: softDot(), sparkle: sparkle(), heart: heart(), leaf: leaf() };
  }

  private take(kind: ParticleKind, color: number, additive: boolean): Particle {
    let p = this.pool.pop();
    if (!p) {
      const mat = new THREE.SpriteMaterial({ transparent: true, depthWrite: false });
      p = { sprite: new THREE.Sprite(mat), vel: new THREE.Vector3(), life: 0, maxLife: 1, size: 1, gravity: 0, spin: 0 };
    }
    const mat = p.sprite.material;
    mat.map = this.textures[kind];
    mat.color.setHex(color);
    mat.blending = additive ? THREE.AdditiveBlending : THREE.NormalBlending;
    mat.rotation = Math.random() * Math.PI * 2;
    mat.needsUpdate = true;
    this.scene.add(p.sprite);
    this.active.push(p);
    return p;
  }

  burst(at: THREE.Vector3, opts: BurstOpts = {}): void {
    const kind = opts.kind ?? 'sparkle';
    const colors = opts.colors ?? [0xffffff];
    const count = opts.count ?? 12;
    const speed = opts.speed ?? 1.6;
    const additive = opts.additive ?? (kind === 'sparkle' || kind === 'dot');
    for (let i = 0; i < count; i++) {
      const p = this.take(kind, colors[i % colors.length]!, additive);
      p.sprite.position.copy(at);
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random() * 0.6);
      p.vel.set(Math.cos(a) * s, (opts.up ?? 2) * (0.6 + Math.random() * 0.6), Math.sin(a) * s);
      p.maxLife = p.life = (opts.life ?? 0.9) * (0.7 + Math.random() * 0.5);
      p.size = (opts.size ?? 0.22) * (0.7 + Math.random() * 0.6);
      p.gravity = opts.gravity ?? 4;
      p.spin = (Math.random() - 0.5) * 6;
    }
  }

  update(dt: number): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i]!;
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.sprite);
        this.active.splice(i, 1);
        this.pool.push(p);
        continue;
      }
      p.vel.y -= p.gravity * dt;
      p.vel.multiplyScalar(1 - dt * 1.2);
      p.sprite.position.addScaledVector(p.vel, dt);
      const k = p.life / p.maxLife;
      const pop = k > 0.8 ? (1 - k) / 0.2 : 1;
      p.sprite.scale.setScalar(p.size * pop * (0.5 + k * 0.5));
      p.sprite.material.opacity = Math.min(1, k * 1.6);
      p.sprite.material.rotation += p.spin * dt;
    }
  }
}

/** Vaga-lumes / pólen mágico flutuando pela cena. */
export class Fireflies {
  readonly points: THREE.Points;
  private base: Float32Array;
  private phase: Float32Array;
  private t = 0;

  constructor(count: number, center: THREE.Vector3, size: THREE.Vector3, color = 0xfff3a0) {
    const pos = new Float32Array(count * 3);
    this.base = new Float32Array(count * 3);
    this.phase = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      this.base[i * 3] = center.x + (Math.random() - 0.5) * size.x;
      this.base[i * 3 + 1] = center.y + Math.random() * size.y;
      this.base[i * 3 + 2] = center.z + (Math.random() - 0.5) * size.z;
      this.phase[i] = Math.random() * Math.PI * 2;
    }
    pos.set(this.base);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.22,
      map: softDot(),
      color,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    this.points = new THREE.Points(geo, mat);
  }

  update(dt: number): void {
    this.t += dt;
    const attr = this.points.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < this.phase.length; i++) {
      const ph = this.phase[i]!;
      arr[i * 3] = this.base[i * 3]! + Math.sin(this.t * 0.6 + ph) * 0.6;
      arr[i * 3 + 1] = this.base[i * 3 + 1]! + Math.sin(this.t * 0.9 + ph * 2) * 0.3;
      arr[i * 3 + 2] = this.base[i * 3 + 2]! + Math.cos(this.t * 0.5 + ph) * 0.6;
    }
    attr.needsUpdate = true;
    (this.points.material as THREE.PointsMaterial).opacity = 0.75 + Math.sin(this.t * 2) * 0.2;
  }
}
