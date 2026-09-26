import * as THREE from 'three';
import { INGREDIENTS, type IngredientKind } from '../data/ingredients';
import { matchRecipe, type Method } from '../data/recipes';
import { glow, mesh, toon } from '../render/materials';
import { dishRecipe, type Item, type VesselItem } from '../sim/items';

const sphere = new THREE.SphereGeometry(1, 16, 12);
const cube = new THREE.BoxGeometry(1, 1, 1);
const cone = new THREE.ConeGeometry(1, 1, 10);
const cyl = new THREE.CylinderGeometry(1, 1, 1, 16);
// Geometrias/materiais compartilhados: tigelas e moedas são recriadas com frequência.
const rimGeo = new THREE.TorusGeometry(0.225, 0.015, 8, 28);
const coinGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16);
const coinMat = new THREE.MeshStandardMaterial({ color: 0xffc83d, emissive: 0xffa000, emissiveIntensity: 0.9, metalness: 0.6, roughness: 0.3 });
const glassMat = new THREE.MeshStandardMaterial({ color: 0xdff6ff, transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.1, depthWrite: false });
const cupGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.26, 20, 1, true);
const plateGeo = new THREE.CylinderGeometry(0.26, 0.2, 0.04, 28);

const bowlGeo = (() => {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 12; i++) {
    const a = (i / 12) * (Math.PI / 2);
    pts.push(new THREE.Vector2(0.05 + Math.sin(a) * 0.2, 0.02 + (1 - Math.cos(a)) * 0.14));
  }
  pts.push(new THREE.Vector2(0.23, 0.17), new THREE.Vector2(0.22, 0.17));
  for (let i = 12; i >= 0; i--) {
    const a = (i / 12) * (Math.PI / 2);
    pts.push(new THREE.Vector2(0.03 + Math.sin(a) * 0.19, 0.04 + (1 - Math.cos(a)) * 0.13));
  }
  return new THREE.LatheGeometry(pts, 28);
})();

function part(geo: THREE.BufferGeometry, mat: THREE.Material, sx: number, sy: number, sz: number, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = mesh(geo, mat);
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  return m;
}

export function rawIngredientMesh(kind: IngredientKind): THREE.Group {
  const g = new THREE.Group();
  const def = INGREDIENTS[kind];
  switch (kind) {
    case 'lettuce': {
      const light = toon(0xb6f07a);
      const dark = toon(def.color);
      g.add(part(sphere, dark, 0.15, 0.12, 0.15, 0, 0.11, 0));
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const leaf = part(sphere, i % 2 ? light : dark, 0.11, 0.06, 0.13, Math.cos(a) * 0.08, 0.1, Math.sin(a) * 0.08);
        leaf.rotation.set(Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6);
        g.add(leaf);
      }
      break;
    }
    case 'tomato':
      g.add(part(sphere, toon(def.color), 0.13, 0.11, 0.13, 0, 0.11, 0));
      g.add(part(cone, toon(0x4caf50), 0.06, 0.04, 0.06, 0, 0.22, 0));
      break;
    case 'glowshroom': {
      g.add(part(cyl, toon(0xfff3e0), 0.04, 0.12, 0.04, 0, 0.06, 0));
      g.add(part(sphere, glow(def.glow ?? def.color, 1.6), 0.12, 0.08, 0.12, 0, 0.13, 0));
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        g.add(part(sphere, toon(0xffffff, 0xffffff, 0.8), 0.018, 0.012, 0.018, Math.cos(a) * 0.07, 0.18, Math.sin(a) * 0.07));
      }
      break;
    }
    case 'berry': {
      const mats = [toon(def.color), toon(0x8f7dff), toon(0xff6b9d)];
      for (let i = 0; i < 7; i++) {
        const a = i * 2.3;
        const r = i === 0 ? 0 : 0.08;
        g.add(part(sphere, mats[i % 3]!, 0.055, 0.055, 0.055, Math.cos(a) * r, 0.06 + (i === 0 ? 0.06 : 0), Math.sin(a) * r));
      }
      g.add(part(sphere, toon(0x4caf50), 0.04, 0.012, 0.025, 0.02, 0.17, 0));
      break;
    }
    case 'carrot': {
      const body = part(cone, toon(def.color), 0.07, 0.3, 0.07, 0, 0.07, 0);
      body.rotation.z = Math.PI / 2;
      g.add(body);
      for (let i = 0; i < 3; i++) {
        const leaf = part(sphere, toon(0x5fbf5a), 0.025, 0.08, 0.025, 0.17, 0.09, (i - 1) * 0.03);
        leaf.rotation.z = -0.6 + i * 0.1;
        g.add(leaf);
      }
      break;
    }
    case 'batter':
      g.add(part(cyl, toon(0xffffff), 0.1, 0.12, 0.1, 0, 0.06, 0));
      g.add(part(sphere, toon(def.color), 0.1, 0.06, 0.1, 0, 0.13, 0));
      g.add(part(cyl, toon(0xff9fb5), 0.102, 0.03, 0.102, 0, 0.05, 0));
      break;
    case 'bamboo':
      for (let i = 0; i < 3; i++) {
        const stalk = part(cyl, toon(i % 2 ? 0x8fd16a : def.color), 0.035, 0.28, 0.035, (i - 1) * 0.07, 0.14, 0);
        g.add(stalk);
        g.add(part(cyl, toon(0x6ab04c), 0.04, 0.02, 0.04, (i - 1) * 0.07, 0.16, 0));
      }
      g.add(part(sphere, toon(0x5fbf5a), 0.08, 0.02, 0.04, 0.05, 0.28, 0));
      break;
  }
  return g;
}

/** Pedacinhos picados de um ingrediente. `spread` = raio do montinho. */
export function choppedMesh(kind: IngredientKind, spread = 0.12, y = 0.03): THREE.Group {
  const g = new THREE.Group();
  const def = INGREDIENTS[kind];
  const mat = def.glow ? glow(def.glow, 1.4) : toon(def.color);
  const alt = kind === 'tomato' ? toon(0xffb3a8) : kind === 'lettuce' ? toon(0xd8f7a5) : kind === 'carrot' ? toon(0xffc27a) : mat;
  const geo = kind === 'tomato' ? sphere : kind === 'carrot' || kind === 'bamboo' ? cyl : cube;
  for (let i = 0; i < 7; i++) {
    const a = i * 2.4;
    const r = spread * Math.sqrt((i + 0.5) / 7);
    const piece = part(geo, i % 3 === 0 ? alt : mat, 0.05, geo === cyl ? 0.02 : 0.035, 0.05, Math.cos(a) * r, y + (i % 2) * 0.02, Math.sin(a) * r);
    piece.rotation.set(a, a * 2, 0);
    g.add(piece);
  }
  return g;
}

/** Cor da comida pronta de um método + conteúdo (sucos, sopas, panquecas). */
export function cookedColor(method: Method, contents: readonly IngredientKind[]): number {
  const r = matchRecipe(method, contents);
  if (r?.color) return r.color;
  return contents.length ? INGREDIENTS[contents[0]!].color : 0xffffff;
}

function bowlContents(g: THREE.Group, item: VesselItem): void {
  if (item.method === 'cook') {
    const c = cookedColor('cook', item.contents);
    g.add(part(cyl, toon(c, c, 0.25), 0.19, 0.02, 0.19, 0, 0.13, 0));
    item.contents.forEach((k, i) => {
      const heap = choppedMesh(k, 0.08, 0.14);
      heap.rotation.y = i * 1.3;
      g.add(heap);
    });
    return;
  }
  item.contents.forEach((kind, i) => {
    const heap = choppedMesh(kind, 0.1, 0.07 + i * 0.03);
    heap.position.x = item.contents.length > 1 ? Math.cos(i * 2.1) * 0.05 : 0;
    heap.position.z = item.contents.length > 1 ? Math.sin(i * 2.1) * 0.05 : 0;
    g.add(heap);
  });
}

export function vesselMesh(item: VesselItem): THREE.Group {
  const g = new THREE.Group();
  const complete = !!dishRecipe(item);
  switch (item.vessel) {
    case 'bowl': {
      g.add(mesh(bowlGeo, toon(item.dirty ? 0xd8cfc0 : 0xfdfbff)));
      const rim = mesh(rimGeo, toon(item.dirty ? 0xa89886 : 0x8fd3ff));
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.17;
      g.add(rim);
      if (item.dirty) g.add(part(sphere, toon(0x9b7b5b), 0.14, 0.02, 0.12, 0.02, 0.07, 0));
      else bowlContents(g, item);
      break;
    }
    case 'cup': {
      const glass = new THREE.Mesh(cupGeo, glassMat);
      glass.position.y = 0.13;
      g.add(glass);
      g.add(part(cyl, toon(0xdff6ff), 0.1, 0.015, 0.1, 0, 0.008, 0));
      if (item.dirty) {
        g.add(part(cyl, toon(0xb9a6d9), 0.09, 0.02, 0.09, 0, 0.03, 0));
      } else if (item.contents.length) {
        const c = cookedColor('blend', item.contents);
        g.add(part(cyl, glow(c, 0.5), 0.1, 0.18, 0.1, 0, 0.1, 0));
        const straw = part(cyl, toon(0xff7fb0), 0.012, 0.3, 0.012, 0.04, 0.24, 0);
        straw.rotation.z = -0.25;
        g.add(straw);
        if (item.contents.includes('glowshroom')) g.add(part(sphere, glow(0xffffff, 2), 0.02, 0.02, 0.02, -0.03, 0.2, 0.03));
      }
      break;
    }
    case 'plate': {
      g.add(part(plateGeo, toon(item.dirty ? 0xd8cfc0 : 0xfffdf8), 1, 1, 1, 0, 0.02, 0));
      const band = mesh(new THREE.TorusGeometry(0.235, 0.012, 6, 28), toon(item.dirty ? 0xa89886 : 0xffb3c8));
      band.rotation.x = Math.PI / 2;
      band.position.y = 0.04;
      g.add(band);
      if (item.dirty) g.add(part(sphere, toon(0x9b7b5b), 0.12, 0.01, 0.1, 0, 0.045, 0));
      else if (item.method === 'grill') {
        const c = cookedColor('grill', item.contents);
        for (let i = 0; i < 3; i++) g.add(part(cyl, toon(c), 0.17 - i * 0.01, 0.035, 0.17 - i * 0.01, 0, 0.06 + i * 0.037, 0));
        g.add(part(cube, toon(0xfff3a0), 0.06, 0.03, 0.06, 0, 0.18, 0));
        g.add(part(sphere, toon(0x6a5cff), 0.03, 0.03, 0.03, 0.06, 0.18, 0.04));
      }
      break;
    }
  }
  if (complete && item.method === 'assemble') {
    const mint = part(sphere, toon(0x3fbf7f), 0.05, 0.015, 0.03, 0, 0.19, 0);
    mint.rotation.y = 0.6;
    g.add(mint);
  }
  return g;
}

/** Pilha de recipientes limpos (tigelas, copos, pratos). */
export function vesselStackMesh(vessel: VesselItem['vessel'], count: number): THREE.Group {
  const g = new THREE.Group();
  const step = vessel === 'bowl' ? 0.07 : vessel === 'plate' ? 0.045 : 0;
  for (let i = 0; i < count; i++) {
    const v = vesselMesh({ id: -1, type: 'vessel', vessel, contents: [], method: null, dirty: false, version: 0 });
    if (vessel === 'cup') v.position.set((i % 3) * 0.2 - 0.2, 0, Math.floor(i / 3) * 0.2 - 0.1);
    else v.position.y = i * step;
    v.rotation.y = i * 0.7;
    g.add(v);
  }
  return g;
}

export function extinguisherMesh(): THREE.Group {
  const g = new THREE.Group();
  g.add(part(cyl, toon(0x6ec6ff), 0.09, 0.32, 0.09, 0, 0.16, 0));
  g.add(part(sphere, toon(0x6ec6ff), 0.09, 0.05, 0.09, 0, 0.32, 0));
  g.add(part(cyl, toon(0xfff27a), 0.03, 0.05, 0.03, 0, 0.37, 0));
  const hose = part(cyl, toon(0x2f5d8a), 0.015, 0.16, 0.015, 0.06, 0.36, 0.04);
  hose.rotation.z = -0.9;
  g.add(hose);
  // Estrelinha mágica no rótulo
  g.add(part(sphere, glow(0xffffff, 2), 0.03, 0.03, 0.01, 0, 0.18, 0.09));
  return g;
}

/** Visual 3D de qualquer item. Origem = base do item. */
export function itemMesh(item: Item): THREE.Group {
  if (item.type === 'tool') return extinguisherMesh();
  if (item.type === 'ingredient') return item.chopped ? choppedMesh(item.kind) : rawIngredientMesh(item.kind);
  return vesselMesh(item);
}

/** Compatibilidade: tigela avulsa (pilhas e pia). */
export function bowlMesh(contents: readonly IngredientKind[], dirty: boolean): THREE.Group {
  return vesselMesh({ id: -1, type: 'vessel', vessel: 'bowl', contents: [...contents], method: contents.length ? 'assemble' : null, dirty, version: 0 });
}

/** Pilha de moedas douradas (deixadas na mesa). */
export function coinPile(count: number): THREE.Group {
  const g = new THREE.Group();
  const n = Math.min(8, Math.max(1, Math.ceil(count / 4)));
  for (let i = 0; i < n; i++) {
    const c = new THREE.Mesh(coinGeo, coinMat);
    c.castShadow = true;
    c.position.set((i % 3) * 0.05 - 0.05, 0.012 + Math.floor(i / 3) * 0.022, (i % 2) * 0.04);
    c.rotation.z = (i % 2) * 0.2;
    g.add(c);
  }
  return g;
}
