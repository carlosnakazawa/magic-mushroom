import * as THREE from 'three';
import { audio } from '../core/audio';
import type { HeroDef, Quirk } from '../data/characters';
import { Particles, type BurstOpts } from '../fx/particles';
import type { Stage } from '../render/stage';

/** Efeitos visuais compartilhados por dia e noite (respeitam o modo "menos efeitos"). */
export class Fx {
  readonly particles: Particles;
  /** 1 = normal; menor = menos partículas. */
  amount = 1;

  constructor(
    private stage: Stage,
    private container: HTMLElement,
  ) {
    this.particles = new Particles(stage.scene);
  }

  burst(at: THREE.Vector3, opts: BurstOpts): void {
    const count = Math.max(1, Math.round((opts.count ?? 12) * this.amount));
    this.particles.burst(at, { ...opts, count });
  }

  /** Comemoração com a "assinatura" de cada herói (corações, folhas, faíscas...). */
  heroBurst(hero: HeroDef, at: THREE.Vector3): void {
    switch (hero.celebrate) {
      case 'hearts':
        this.burst(at, { kind: 'heart', count: 8, colors: [0xff7fb0, 0xffb3d1], additive: false });
        break;
      case 'leaves':
        this.burst(at, {
          kind: 'leaf',
          count: 10,
          colors: hero.species === 'panda' ? [0x8fd16a, 0x5fbf5a, 0xd8f7a5] : [0xffa25e, 0xffc94d, 0xd9531e],
          additive: false,
          gravity: 2,
        });
        break;
      case 'sparks':
        this.burst(at, { kind: 'sparkle', count: 18, colors: [0xff5a5a, 0xffd23f, 0x3fd2ff, 0x9dff6b, 0xff7fe0], speed: 3, up: 3 });
        break;
      case 'stars':
        this.burst(at, { kind: 'sparkle', count: 14, colors: [0x9fd0ff, 0xffffff, 0xfff27a], speed: 2 });
        break;
      case 'dust':
        this.burst(at, { kind: 'dot', count: 16, colors: [0xf6e7ff, 0xc7a5e8, 0xffffff], speed: 1.5, gravity: 1 });
        break;
    }
  }

  /** Partículas da mania de cada herói (só as manias que "soltam" algo). */
  quirkBurst(quirk: Quirk, head: THREE.Vector3, forward: THREE.Vector3): void {
    const front = head.clone().addScaledVector(forward, 0.35);
    switch (quirk) {
      case 'twirl':
        this.burst(head, { kind: 'heart', count: 4, colors: [0xff7fb0, 0xffb3d1], additive: false, speed: 1 });
        break;
      case 'sneeze':
        this.burst(front, { kind: 'sparkle', count: 10, colors: [0xff5a5a, 0xffd23f, 0x3fd2ff, 0x9dff6b], speed: 2.2, up: 1 });
        break;
      case 'howl':
        this.burst(head.clone().setY(head.y + 0.4), { kind: 'sparkle', count: 7, colors: [0x9fd0ff, 0xffffff, 0xfff27a], speed: 1.2, up: 2 });
        break;
      case 'tongue':
        this.burst(front.addScaledVector(forward, 0.25), { kind: 'dot', count: 3, colors: [0xffffff, 0xc8f4ff], speed: 0.8, size: 0.12, life: 0.5 });
        break;
      case 'pose':
        this.burst(head, { kind: 'leaf', count: 4, colors: [0xffa25e, 0xffc94d], additive: false, gravity: 2, speed: 1 });
        break;
      case 'stretch':
        this.burst(head, { kind: 'sparkle', count: 5, colors: [0xd9c8ff, 0xffffff], speed: 0.8 });
        break;
      default:
        break;
    }
  }

  /** Moedinhas voando da mesa até o contador do HUD. */
  flyCoins(from: THREE.Vector3, to: { x: number; y: number }, amount: number, onDone: () => void): void {
    const start = { x: 0, y: 0, visible: true };
    this.stage.toScreen(from, start);
    const n = Math.max(1, Math.round(Math.min(8, 2 + Math.floor(amount / 5)) * Math.max(0.4, this.amount)));
    for (let i = 0; i < n; i++) {
      const c = document.createElement('div');
      c.className = 'fly-coin';
      c.textContent = '🪙';
      c.style.left = `${start.x + (Math.random() - 0.5) * 40}px`;
      c.style.top = `${start.y + (Math.random() - 0.5) * 30}px`;
      this.container.appendChild(c);
      window.setTimeout(() => {
        c.style.left = `${to.x}px`;
        c.style.top = `${to.y}px`;
        c.style.transform = 'scale(0.6)';
      }, 30 + i * 60);
      window.setTimeout(() => {
        c.remove();
        audio.coin();
        if (i === n - 1) onDone();
      }, 700 + i * 60);
    }
  }

  update(dt: number): void {
    this.particles.update(dt);
  }
}
