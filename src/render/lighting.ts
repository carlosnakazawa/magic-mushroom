import * as THREE from 'three';
import type { Stage } from './stage';

/** Um "clima" de iluminação. A transição dia ↔ noite interpola entre dois destes. */
interface Preset {
  sky: number;
  hemiSky: number;
  hemiGround: number;
  hemi: number;
  sun: number;
  sunColor: number;
  fill: number;
  exposure: number;
  bloom: number;
}

const DAY: Preset = {
  sky: 0x7fbf95,
  hemiSky: 0xfff4e6,
  hemiGround: 0x7a8f6b,
  hemi: 0.85,
  sun: 1.55,
  sunColor: 0xffe0b8,
  fill: 0.3,
  exposure: 0.95,
  bloom: 0.5,
};

const NIGHT: Preset = {
  sky: 0x1c2244,
  hemiSky: 0x7f8fe0,
  hemiGround: 0x2a2440,
  hemi: 0.58,
  sun: 0.6,
  sunColor: 0x9fb4ff,
  fill: 0.12,
  exposure: 1.05,
  bloom: 0.95,
};

const a = new THREE.Color();
const b = new THREE.Color();

function mix(ca: number, cb: number, t: number, out: THREE.Color): THREE.Color {
  return out.copy(a.setHex(ca)).lerp(b.setHex(cb), t);
}

/** Controla o ciclo dia/noite (0 = dia, 1 = noite), com transição suave. */
export class Lighting {
  /** Valor atual 0..1. */
  value = 0;
  target = 0;
  /** Multiplicador do bloom (modo "menos efeitos"). */
  bloomScale = 1;

  constructor(private stage: Stage) {
    this.apply();
  }

  set(night: boolean, instant = false): void {
    this.target = night ? 1 : 0;
    if (instant) {
      this.value = this.target;
      this.apply();
    }
  }

  update(dt: number): void {
    if (this.value === this.target) return;
    const step = dt / 2.5;
    this.value = this.target > this.value ? Math.min(this.target, this.value + step) : Math.max(this.target, this.value - step);
    this.apply();
  }

  private apply(): void {
    const t = this.value * this.value * (3 - 2 * this.value);
    const s = this.stage;
    const lerp = (x: number, y: number) => x + (y - x) * t;
    const bg = s.scene.background as THREE.Color;
    mix(DAY.sky, NIGHT.sky, t, bg);
    (s.scene.fog as THREE.Fog).color.copy(bg);
    mix(DAY.hemiSky, NIGHT.hemiSky, t, s.hemi.color);
    mix(DAY.hemiGround, NIGHT.hemiGround, t, s.hemi.groundColor);
    s.hemi.intensity = lerp(DAY.hemi, NIGHT.hemi);
    mix(DAY.sunColor, NIGHT.sunColor, t, s.sun.color);
    s.sun.intensity = lerp(DAY.sun, NIGHT.sun);
    s.fill.intensity = lerp(DAY.fill, NIGHT.fill);
    s.renderer.toneMappingExposure = lerp(DAY.exposure, NIGHT.exposure);
    s.bloom.strength = lerp(DAY.bloom, NIGHT.bloom) * this.bloomScale;
  }
}
