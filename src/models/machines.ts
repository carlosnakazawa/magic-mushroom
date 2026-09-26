import * as THREE from 'three';
import { INGREDIENTS } from '../data/ingredients';
import { glow, mesh, toon } from '../render/materials';
import type { Machine } from '../sim/machine';
import { choppedMesh, cookedColor, rawIngredientMesh } from './food';
import { COUNTER_TOP, counter } from './props';

const cyl = new THREE.CylinderGeometry(1, 1, 1, 24);
const box = new THREE.BoxGeometry(1, 1, 1);
const sphere = new THREE.SphereGeometry(1, 16, 12);
const cone = new THREE.ConeGeometry(1, 1, 12);

function part(geo: THREE.BufferGeometry, mat: THREE.Material, sx: number, sy: number, sz: number, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = mesh(geo, mat);
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  return m;
}

/** Visual de uma máquina: monta a malha e anima conforme o estado da lógica (`sim/machine.ts`). */
export interface MachineView {
  group: THREE.Group;
  /** Altura onde a comida aparece (para rótulos e partículas). */
  topY: number;
  update(m: Machine, t: number): void;
}

/** Chamas cartunescas (cones que tremulam) — reutilizadas pelo fogo de qualquer máquina. */
function flames(): THREE.Group {
  const g = new THREE.Group();
  const colors = [0xff5a2a, 0xff9a2a, 0xffd23f];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const f = part(cone, glow(colors[i % 3]!, 2.4), 0.12, 0.45, 0.12, Math.cos(a) * 0.18, 0.2, Math.sin(a) * 0.18);
    f.castShadow = false;
    f.userData.phase = i * 1.7;
    g.add(f);
  }
  const core = part(cone, glow(0xfff27a, 3), 0.15, 0.6, 0.15, 0, 0.28, 0);
  core.castShadow = false;
  core.userData.phase = 0.5;
  g.add(core);
  g.visible = false;
  return g;
}

function animateFlames(g: THREE.Group, on: boolean, t: number): void {
  g.visible = on;
  if (!on) return;
  g.children.forEach((c) => {
    const ph = c.userData.phase as number;
    c.scale.y = (c === g.children[g.children.length - 1] ? 0.6 : 0.45) * (0.8 + Math.sin(t * 14 + ph) * 0.25);
    c.rotation.y = t * 3 + ph;
  });
}

export function blenderView(): MachineView {
  const group = counter();
  const top = COUNTER_TOP;
  group.add(part(box, toon(0xf6f0ff), 0.42, 0.16, 0.42, 0, top + 0.08, 0));
  group.add(part(cyl, glow(0x7fd8ff, 0.8), 0.05, 0.02, 0.05, 0.12, top + 0.12, 0.215));
  const jar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.15, 0.5, 6, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xbfefff, emissive: 0x4fc3ff, emissiveIntensity: 0.35, transparent: true, opacity: 0.4, roughness: 0.05, side: THREE.DoubleSide, depthWrite: false }),
  );
  jar.position.y = top + 0.41;
  group.add(jar);
  group.add(part(cyl, toon(0xb58cff), 0.21, 0.04, 0.21, 0, top + 0.68, 0));
  const blade = part(box, toon(0xdfe8f0), 0.24, 0.01, 0.04, 0, top + 0.2, 0);
  group.add(blade);
  const liquid = part(cyl, glow(0x8a5cff, 0.6), 0.16, 0.1, 0.16, 0, top + 0.22, 0);
  liquid.visible = false;
  group.add(liquid);
  const pieces = new THREE.Group();
  pieces.position.y = top + 0.18;
  group.add(pieces);
  let version = -1;
  return {
    group,
    topY: top + 0.75,
    update(m, t) {
      if (m.version !== version) {
        version = m.version;
        pieces.clear();
        const hasLiquid = m.phase !== 'idle';
        liquid.visible = hasLiquid;
        if (hasLiquid) (liquid.material as THREE.MeshStandardMaterial).color.setHex(cookedColor('blend', m.contents));
        if (hasLiquid) (liquid.material as THREE.MeshStandardMaterial).emissive.setHex(cookedColor('blend', m.contents));
        if (!hasLiquid)
          m.contents.forEach((k, i) => {
            const r = rawIngredientMesh(k);
            r.scale.setScalar(0.7);
            r.position.set((i - 0.5) * 0.1, i * 0.08, 0);
            pieces.add(r);
          });
      }
      const working = m.phase === 'working';
      blade.rotation.y += working ? 0.9 : 0;
      jar.position.x = working ? Math.sin(t * 60) * 0.008 : 0;
      const fill = working ? 0.1 + m.progress * 0.28 : 0.38;
      liquid.scale.y = fill;
      liquid.position.y = top + 0.18 + fill / 2;
      liquid.rotation.y = t * (working ? 8 : 0.5);
      (jar.material as THREE.MeshStandardMaterial).emissiveIntensity = m.phase === 'done' ? 0.6 + Math.sin(t * 5) * 0.3 : 0.35;
    },
  };
}

export function cauldronView(): MachineView {
  const group = new THREE.Group();
  // Fogareiro de pedra
  group.add(part(box, toon(0x9a8f86), 0.94, 0.55, 0.94, 0, 0.275, 0));
  group.add(part(box, toon(0x7a6f68), 1.0, 0.08, 1.0, 0, 0.58, 0));
  const embers = part(box, glow(0xff7a2a, 1.4), 0.5, 0.06, 0.5, 0, 0.55, 0.2);
  group.add(embers);
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 14; i++) {
    const a = (i / 14) * Math.PI * 0.62;
    pts.push(new THREE.Vector2(Math.sin(a) * 0.42 + 0.02, -Math.cos(a) * 0.36 + 0.36));
  }
  pts.push(new THREE.Vector2(0.4, 0.44));
  const pot = mesh(new THREE.LatheGeometry(pts, 28), new THREE.MeshToonMaterial({ color: 0x3a3542, side: THREE.DoubleSide }));
  pot.position.y = 0.6;
  group.add(pot);
  const rim = mesh(new THREE.TorusGeometry(0.4, 0.04, 8, 28), toon(0x57506a));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 1.04;
  group.add(rim);
  const soup = part(cyl, toon(0xffa24a), 0.37, 0.02, 0.37, 0, 0.94, 0);
  soup.visible = false;
  group.add(soup);
  const bubbles = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const b = part(sphere, toon(0xffffff), 0.04, 0.04, 0.04, Math.cos(i * 2.5) * 0.2, 0.96, Math.sin(i * 2.5) * 0.2);
    b.userData.phase = i;
    bubbles.add(b);
  }
  group.add(bubbles);
  const pieces = new THREE.Group();
  pieces.position.y = 0.95;
  group.add(pieces);
  const fire = flames();
  fire.position.y = 0.95;
  group.add(fire);
  let version = -1;
  return {
    group,
    topY: 1.05,
    update(m, t) {
      if (m.version !== version) {
        version = m.version;
        pieces.clear();
        m.contents.forEach((k, i) => {
          const c = choppedMesh(k, 0.14, 0);
          c.rotation.y = i * 2;
          pieces.add(c);
        });
        soup.visible = m.contents.length > 0;
        const burnt = m.phase === 'burnt' || m.phase === 'fire';
        const color = burnt ? 0x2b2320 : m.phase === 'warning' ? 0x8a5a3a : cookedColor('cook', m.contents);
        (soup.material as THREE.MeshToonMaterial).color.setHex(m.phase === 'idle' ? 0x8fd3ff : color);
        pieces.visible = !burnt;
      }
      const cooking = m.phase !== 'idle';
      bubbles.visible = cooking && m.phase !== 'fire';
      bubbles.children.forEach((b) => {
        const ph = b.userData.phase as number;
        const k = (t * 1.5 + ph * 0.37) % 1;
        b.position.y = 0.94 + k * 0.12;
        b.scale.setScalar(0.04 * (1 - k));
      });
      pieces.rotation.y = t * (cooking ? 0.8 : 0.1);
      (embers.material as THREE.MeshStandardMaterial).emissiveIntensity = cooking ? 1.6 + Math.sin(t * 8) * 0.4 : 0.3;
      animateFlames(fire, m.phase === 'fire', t);
    },
  };
}

export function griddleView(): MachineView {
  const group = counter();
  const top = COUNTER_TOP;
  group.add(part(box, toon(0x4a4452), 0.86, 0.06, 0.8, 0, top + 0.03, 0));
  const hot = part(box, new THREE.MeshStandardMaterial({ color: 0x3a3440, emissive: 0xff6a2a, emissiveIntensity: 0, roughness: 0.6 }), 0.78, 0.01, 0.72, 0, top + 0.065, 0);
  hot.castShadow = false;
  group.add(hot);
  const pancake = part(cyl, toon(0xffe7a8), 0.2, 0.04, 0.2, 0, top + 0.09, 0);
  pancake.visible = false;
  group.add(pancake);
  const fire = flames();
  fire.position.y = top + 0.05;
  group.add(fire);
  const raw = new THREE.Group();
  raw.position.y = top + 0.07;
  group.add(raw);
  let version = -1;
  return {
    group,
    topY: top + 0.12,
    update(m, t) {
      if (m.version !== version) {
        version = m.version;
        raw.clear();
      }
      const has = m.contents.length > 0;
      pancake.visible = has && m.phase !== 'fire';
      const mat = pancake.material as THREE.MeshToonMaterial;
      if (m.phase === 'working') mat.color.lerpColors(new THREE.Color(INGREDIENTS.batter.color), new THREE.Color(0xf2b45c), m.progress);
      else if (m.phase === 'done') mat.color.setHex(0xf2b45c);
      else if (m.phase === 'warning') mat.color.setHex(0x9a5a2a);
      else if (m.phase === 'burnt') mat.color.setHex(0x2b2320);
      pancake.scale.y = m.phase === 'working' ? 0.04 + Math.abs(Math.sin(t * 3)) * 0.01 : 0.04;
      (hot.material as THREE.MeshStandardMaterial).emissiveIntensity = m.phase !== 'idle' ? 0.9 + Math.sin(t * 6) * 0.25 : 0;
      animateFlames(fire, m.phase === 'fire', t);
    },
  };
}
