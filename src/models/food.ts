import * as THREE from 'three';
import { INGREDIENTS, type IngredientKind } from '../data/ingredients';
import { glow, mesh, toon } from '../render/materials';
import { bowlRecipe, type Item } from '../sim/items';

const sphere = new THREE.SphereGeometry(1, 16, 12);
const cube = new THREE.BoxGeometry(1, 1, 1);
const cone = new THREE.ConeGeometry(1, 1, 8);
const cyl = new THREE.CylinderGeometry(1, 1, 1, 16);
// Geometrias/materiais compartilhados: tigelas e moedas são recriadas com frequência.
const rimGeo = new THREE.TorusGeometry(0.225, 0.015, 8, 28);
const coinGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16);
const coinMat = new THREE.MeshStandardMaterial({ color: 0xffc83d, emissive: 0xffa000, emissiveIntensity: 0.9, metalness: 0.6, roughness: 0.3 });

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
    case 'tomato': {
      g.add(part(sphere, toon(def.color), 0.13, 0.11, 0.13, 0, 0.11, 0));
      g.add(part(cone, toon(0x4caf50), 0.06, 0.04, 0.06, 0, 0.22, 0));
      break;
    }
    case 'glowshroom': {
      g.add(part(cyl, toon(0xfff3e0), 0.04, 0.12, 0.04, 0, 0.06, 0));
      const cap = part(sphere, glow(def.glow ?? def.color, 1.6), 0.12, 0.08, 0.12, 0, 0.13, 0);
      g.add(cap);
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        g.add(part(sphere, toon(0xffffff, 0xffffff, 0.8), 0.018, 0.012, 0.018, Math.cos(a) * 0.07, 0.18, Math.sin(a) * 0.07));
      }
      break;
    }
  }
  return g;
}

/** Pedacinhos picados de um ingrediente. `spread` = raio do montinho. */
export function choppedMesh(kind: IngredientKind, spread = 0.12, y = 0.03): THREE.Group {
  const g = new THREE.Group();
  const def = INGREDIENTS[kind];
  const mat = def.glow ? glow(def.glow, 1.4) : toon(def.color);
  const alt = kind === 'tomato' ? toon(0xffb3a8) : kind === 'lettuce' ? toon(0xd8f7a5) : mat;
  for (let i = 0; i < 7; i++) {
    const a = i * 2.4;
    const r = spread * Math.sqrt((i + 0.5) / 7);
    const piece = part(
      kind === 'tomato' ? sphere : cube,
      i % 3 === 0 ? alt : mat,
      0.05,
      0.035,
      0.05,
      Math.cos(a) * r,
      y + (i % 2) * 0.02,
      Math.sin(a) * r,
    );
    piece.rotation.set(a, a * 2, 0);
    g.add(piece);
  }
  return g;
}

export function bowlMesh(contents: readonly IngredientKind[], dirty: boolean, complete: boolean): THREE.Group {
  const g = new THREE.Group();
  const b = mesh(bowlGeo, toon(dirty ? 0xd8cfc0 : 0xfdfbff));
  g.add(b);
  const rim = mesh(rimGeo, toon(dirty ? 0xa89886 : 0x8fd3ff));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.17;
  g.add(rim);
  if (dirty) {
    const smudge = part(sphere, toon(0x9b7b5b), 0.14, 0.02, 0.12, 0.02, 0.07, 0);
    g.add(smudge);
    return g;
  }
  contents.forEach((kind, i) => {
    const heap = choppedMesh(kind, 0.1, 0.07 + i * 0.03);
    heap.position.x = contents.length > 1 ? Math.cos(i * 2.1) * 0.05 : 0;
    heap.position.z = contents.length > 1 ? Math.sin(i * 2.1) * 0.05 : 0;
    g.add(heap);
  });
  if (complete) {
    // Folhinha de hortelã coroando o prato pronto
    const mint = part(sphere, toon(0x3fbf7f), 0.05, 0.015, 0.03, 0, 0.19, 0);
    mint.rotation.y = 0.6;
    g.add(mint);
  }
  return g;
}

/** Visual 3D de qualquer item. Origem = base do item. */
export function itemMesh(item: Item): THREE.Group {
  if (item.type === 'ingredient') return item.chopped ? choppedMesh(item.kind) : rawIngredientMesh(item.kind);
  return bowlMesh(item.contents, item.dirty, !!bowlRecipe(item));
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
