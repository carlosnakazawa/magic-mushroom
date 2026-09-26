import * as THREE from 'three';
import type { IngredientKind } from '../data/ingredients';
import { glow, mesh, toon } from '../render/materials';
import { rawIngredientMesh } from './food';

/** Altura do tampo dos balcões (onde itens ficam). */
export const COUNTER_TOP = 0.92;
/** Altura do tampo das mesas de cogumelo. */
export const TABLE_TOP = 0.74;

const box = new THREE.BoxGeometry(1, 1, 1);
const cyl = new THREE.CylinderGeometry(1, 1, 1, 24);
const sphere = new THREE.SphereGeometry(1, 20, 14);

function part(geo: THREE.BufferGeometry, mat: THREE.Material, sx: number, sy: number, sz: number, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = mesh(geo, mat);
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  return m;
}

const WOOD = 0xc98b5a;
const WOOD_DARK = 0x9a6440;
const TOP = 0xfff1dc;

export function counter(): THREE.Group {
  const g = new THREE.Group();
  g.add(part(box, toon(WOOD), 0.94, 0.82, 0.94, 0, 0.41, 0));
  g.add(part(box, toon(WOOD_DARK), 0.7, 0.5, 0.02, 0, 0.42, 0.475));
  g.add(part(box, toon(TOP), 1.0, 0.1, 1.0, 0, COUNTER_TOP - 0.05, 0));
  return g;
}

export function wallBlock(height: number, withPaper: THREE.Texture | null): THREE.Group {
  const g = new THREE.Group();
  const mat = withPaper
    ? new THREE.MeshToonMaterial({ map: withPaper, color: 0xffffff })
    : toon(0xf6d8b8);
  g.add(part(box, mat, 1, height, 1, 0, height / 2, 0));
  g.add(part(box, toon(WOOD_DARK), 1.02, 0.35, 1.02, 0, 0.175, 0));
  g.add(part(box, toon(WOOD), 1.04, 0.1, 1.04, 0, height, 0));
  return g;
}

export function crate(kind: IngredientKind): THREE.Group {
  const g = counter();
  const crateG = new THREE.Group();
  crateG.position.y = COUNTER_TOP;
  const slat = toon(0xe0a86e);
  crateG.add(part(box, toon(0xb77a48), 0.78, 0.06, 0.78, 0, 0.03, 0));
  for (const s of [-1, 1]) {
    crateG.add(part(box, slat, 0.78, 0.22, 0.06, 0, 0.13, s * 0.36));
    crateG.add(part(box, slat, 0.06, 0.22, 0.78, s * 0.36, 0.13, 0));
  }
  const spots: [number, number][] = [
    [-0.16, -0.16],
    [0.16, -0.14],
    [-0.14, 0.16],
    [0.17, 0.15],
    [0, 0],
  ];
  spots.forEach(([x, z], i) => {
    const it = rawIngredientMesh(kind);
    it.position.set(x, 0.05 + (i === 4 ? 0.08 : 0), z);
    it.rotation.y = i * 1.3;
    crateG.add(it);
  });
  g.add(crateG);
  return g;
}

export function cuttingBoard(): { group: THREE.Group; knife: THREE.Object3D } {
  const g = counter();
  g.add(part(box, toon(0xf4d3a1), 0.72, 0.05, 0.56, 0, COUNTER_TOP + 0.025, 0.02));
  const knife = new THREE.Group();
  knife.add(part(box, toon(0xe8eef5), 0.05, 0.015, 0.26, 0, 0, 0.1));
  knife.add(part(box, toon(0x8a5a3a), 0.05, 0.04, 0.12, 0, 0, -0.08));
  knife.position.set(0.3, COUNTER_TOP + 0.07, -0.05);
  knife.rotation.y = 0.3;
  g.add(knife);
  return { group: g, knife };
}

export function sink(): { group: THREE.Group; dirtyStack: THREE.Group; water: THREE.Mesh } {
  const g = new THREE.Group();
  g.add(part(box, toon(0x9fc9e8), 0.94, 0.82, 0.94, 0, 0.41, 0));
  // Bordas do tampo ao redor da cuba
  const top = toon(0xe8f4ff);
  g.add(part(box, top, 1.0, 0.1, 0.18, 0, COUNTER_TOP - 0.05, -0.41));
  g.add(part(box, top, 1.0, 0.1, 0.18, 0, COUNTER_TOP - 0.05, 0.41));
  g.add(part(box, top, 0.18, 0.1, 1.0, -0.41, COUNTER_TOP - 0.05, 0));
  g.add(part(box, top, 0.18, 0.1, 1.0, 0.41, COUNTER_TOP - 0.05, 0));
  const water = part(box, new THREE.MeshStandardMaterial({ color: 0x6ec6ff, emissive: 0x2d8bd6, emissiveIntensity: 0.4, roughness: 0.1, transparent: true, opacity: 0.85 }), 0.64, 0.02, 0.64, 0, COUNTER_TOP - 0.1, 0);
  g.add(water);
  const metal = new THREE.MeshStandardMaterial({ color: 0xdfe8f0, metalness: 0.8, roughness: 0.25 });
  g.add(part(cyl, metal, 0.035, 0.3, 0.035, 0, COUNTER_TOP + 0.15, -0.4));
  const spout = part(cyl, metal, 0.03, 0.22, 0.03, 0, COUNTER_TOP + 0.3, -0.3);
  spout.rotation.x = Math.PI / 2;
  g.add(spout);
  const dirtyStack = new THREE.Group();
  dirtyStack.position.set(0, COUNTER_TOP - 0.08, 0);
  g.add(dirtyStack);
  return { group: g, dirtyStack, water };
}

export function trashBin(): THREE.Group {
  const g = new THREE.Group();
  g.add(part(cyl, toon(0x7cbf7a), 0.34, 0.72, 0.34, 0, 0.36, 0));
  g.add(part(cyl, toon(0x5a9a58), 0.37, 0.08, 0.37, 0, 0.74, 0));
  g.add(part(sphere, toon(0x5a9a58), 0.08, 0.05, 0.08, 0, 0.8, 0));
  // Folhinha "reciclável"
  const leafM = part(sphere, toon(0xd8f7a5), 0.12, 0.02, 0.07, 0, 0.42, 0.34);
  leafM.rotation.set(Math.PI / 2, 0, 0.5);
  g.add(leafM);
  return g;
}

/** Mesa de cogumelo clássica: tampo vermelho com bolinhas brancas. */
export function mushroomTable(): THREE.Group {
  const g = new THREE.Group();
  const stem = toon(0xfff3dd);
  g.add(part(cyl, stem, 0.16, 0.66, 0.16, 0, 0.33, 0));
  g.add(part(cyl, stem, 0.24, 0.06, 0.24, 0, 0.03, 0));
  const capMat = toon(0xff6b6b);
  g.add(part(cyl, capMat, 0.56, 0.1, 0.56, 0, TABLE_TOP - 0.05, 0));
  const rim = mesh(new THREE.TorusGeometry(0.56, 0.06, 10, 36), capMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = TABLE_TOP - 0.07;
  g.add(rim);
  const dots = toon(0xffffff);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.3;
    const d = part(sphere, dots, 0.07, 0.035, 0.07, Math.cos(a) * 0.58, TABLE_TOP - 0.07, Math.sin(a) * 0.58);
    g.add(d);
  }
  // Toalhinha no centro
  g.add(part(cyl, toon(0xfff7ea), 0.3, 0.01, 0.3, 0, TABLE_TOP + 0.005, 0));
  return g;
}

/** Banquinho de cogumelo. */
export function stool(): THREE.Group {
  const g = new THREE.Group();
  g.add(part(cyl, toon(0xfff3dd), 0.09, 0.26, 0.09, 0, 0.13, 0));
  g.add(part(sphere, toon(0xffa36b), 0.2, 0.09, 0.2, 0, 0.28, 0));
  g.add(part(sphere, toon(0xffffff), 0.04, 0.02, 0.04, 0.08, 0.34, 0.05));
  return g;
}

/** Lanterna/luzinha pendurada que brilha (entra no bloom). */
export function lantern(color: number): THREE.Group {
  const g = new THREE.Group();
  g.add(part(cyl, toon(0x6b4a33), 0.005, 0.6, 0.005, 0, 0.3, 0));
  g.add(part(sphere, glow(color, 2.4), 0.09, 0.11, 0.09, 0, 0, 0));
  g.add(part(cyl, toon(0x6b4a33), 0.06, 0.03, 0.06, 0, 0.11, 0));
  return g;
}

/** Cogumelo gigante decorativo (lado de fora). */
export function giantMushroom(capColor: number, glowing: boolean, scale = 1): THREE.Group {
  const g = new THREE.Group();
  g.add(part(cyl, toon(0xfff1dd), 0.18, 1.2, 0.18, 0, 0.6, 0));
  const capMat = glowing ? glow(capColor, 1.1) : toon(capColor);
  const cap = part(sphere, capMat, 0.7, 0.4, 0.7, 0, 1.2, 0);
  g.add(cap);
  const dot = glowing ? glow(0xffffff, 1.5) : toon(0xffffff);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.add(part(sphere, dot, 0.08, 0.05, 0.08, Math.cos(a) * 0.45, 1.42, Math.sin(a) * 0.45));
  }
  g.scale.setScalar(scale);
  return g;
}

export function tree(scale = 1): THREE.Group {
  const g = new THREE.Group();
  g.add(part(cyl, toon(0x8a5a3a), 0.2, 1.4, 0.2, 0, 0.7, 0));
  const leaves = [0x5fb86a, 0x78c97a, 0x4ea45d];
  for (let i = 0; i < 4; i++) {
    const a = i * 1.7;
    g.add(part(sphere, toon(leaves[i % 3]!), 0.75, 0.65, 0.75, Math.cos(a) * 0.35, 1.7 + (i % 2) * 0.35, Math.sin(a) * 0.35));
  }
  g.scale.setScalar(scale);
  return g;
}

export function bush(): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) g.add(part(sphere, toon(i % 2 ? 0x6cc070 : 0x55a95e), 0.35, 0.3, 0.35, i * 0.3 - 0.3, 0.25, (i % 2) * 0.15));
  const flower = toon(0xffc4e1);
  for (let i = 0; i < 4; i++) g.add(part(sphere, flower, 0.05, 0.05, 0.05, i * 0.2 - 0.3, 0.5, 0.2));
  return g;
}

export function pottedPlant(): THREE.Group {
  const g = new THREE.Group();
  g.add(part(cyl, toon(0xe07a5f), 0.2, 0.3, 0.2, 0, 0.15, 0));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const leafM = part(sphere, toon(0x4caf50), 0.08, 0.3, 0.05, Math.cos(a) * 0.08, 0.5, Math.sin(a) * 0.08);
    leafM.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
    g.add(leafM);
  }
  return g;
}

/** Placa com texto desenhado em canvas. */
export function signBoard(text: string, sub: string): THREE.Group {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#7a4a2c';
  ctx.beginPath();
  ctx.roundRect(8, 8, 1008, 240, 60);
  ctx.fill();
  ctx.fillStyle = '#9c643e';
  ctx.beginPath();
  ctx.roundRect(24, 24, 976, 208, 48);
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff4d6';
  let size = 92;
  do {
    ctx.font = `700 ${size}px Fredoka, sans-serif`;
    size -= 4;
  } while (ctx.measureText(text).width > 920 && size > 30);
  ctx.fillText(text, 512, 130);
  ctx.fillStyle = '#ffd36b';
  ctx.font = '600 48px Fredoka, sans-serif';
  ctx.fillText(sub, 512, 200);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const g = new THREE.Group();
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(4, 1), new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.35 }));
  g.add(plane);
  return g;
}

/** Janela com luz quente. */
export function windowPane(): THREE.Group {
  const g = new THREE.Group();
  g.add(part(box, toon(WOOD_DARK), 0.9, 0.9, 0.06, 0, 0, 0));
  g.add(part(box, glow(0xfff0b8, 0.9), 0.74, 0.74, 0.07, 0, 0, 0.005));
  g.add(part(box, toon(WOOD_DARK), 0.06, 0.8, 0.08, 0, 0, 0.01));
  g.add(part(box, toon(WOOD_DARK), 0.8, 0.06, 0.08, 0, 0, 0.01));
  return g;
}

/** Arco da porta de entrada. */
export function doorArch(): THREE.Group {
  const g = new THREE.Group();
  const wood = toon(WOOD_DARK);
  g.add(part(box, wood, 0.18, 1.8, 0.18, 0, 0.9, -0.55));
  g.add(part(box, wood, 0.18, 1.8, 0.18, 0, 0.9, 0.55));
  const arch = mesh(new THREE.TorusGeometry(0.55, 0.09, 10, 24, Math.PI), wood);
  arch.rotation.y = Math.PI / 2;
  arch.position.y = 1.8;
  g.add(arch);
  const vine = toon(0x5fb86a);
  for (let i = 0; i < 7; i++) {
    const a = (i / 6) * Math.PI;
    g.add(part(sphere, i % 2 ? vine : toon(0xffc4e1), 0.09, 0.09, 0.09, 0.05, 1.8 + Math.sin(a) * 0.58, Math.cos(a) * 0.58));
  }
  // Tapete de boas-vindas
  g.add(part(box, toon(0xffb36b), 0.9, 0.02, 1.1, -0.7, 0.01, 0));
  return g;
}
