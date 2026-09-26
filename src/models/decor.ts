import * as THREE from 'three';
import { furnitureDef, type FurnitureId } from '../data/furniture';
import { glow, mesh, toon } from '../render/materials';
import { TABLE_TOP, giantMushroom, pottedPlant } from './props';

const box = new THREE.BoxGeometry(1, 1, 1);
const cyl = new THREE.CylinderGeometry(1, 1, 1, 24);
const sphere = new THREE.SphereGeometry(1, 20, 14);
const cone = new THREE.ConeGeometry(1, 1, 16);

function part(geo: THREE.BufferGeometry, mat: THREE.Material, sx: number, sy: number, sz: number, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = mesh(geo, mat);
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  return m;
}

/** Posição (relativa ao centro) de cada lugar da mesa família, conforme o número de lugares. */
export function familySeatOffsets(seats: number): [number, number][] {
  const four: [number, number][] = [
    [-0.5, -0.72],
    [0.5, -0.72],
    [-0.5, 0.72],
    [0.5, 0.72],
  ];
  return seats >= 6
    ? [
        ...four,
        [-1.22, 0],
        [1.22, 0],
      ]
    : four;
}

/** Mesa Cogumelo Duplo: dois chapéus de cogumelo unidos (4 lugares). */
function doubleMushroomTable(): THREE.Group {
  const g = new THREE.Group();
  const stem = toon(0xfff3dd);
  const cap = toon(0xff8fa3);
  for (const x of [-0.5, 0.5]) {
    g.add(part(cyl, stem, 0.15, 0.66, 0.15, x, 0.33, 0));
    g.add(part(cyl, cap, 0.62, 0.1, 0.55, x, TABLE_TOP - 0.05, 0));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      g.add(part(sphere, toon(0xffffff), 0.06, 0.03, 0.06, x + Math.cos(a) * 0.5, TABLE_TOP - 0.06, Math.sin(a) * 0.46));
    }
  }
  g.add(part(box, toon(0xfff7ea), 1.3, 0.012, 0.5, 0, TABLE_TOP + 0.005, 0));
  return g;
}

/** Tronco Encantado: tronco oco com musgo e cogumelinhos brilhantes (6 lugares). */
function enchantedLog(): THREE.Group {
  const g = new THREE.Group();
  const bark = toon(0x9a6440);
  const log = part(cyl, bark, 0.5, 2.0, 0.5, 0, 0.38, 0);
  log.rotation.z = Math.PI / 2;
  log.scale.set(0.42, 1.9, 0.62);
  g.add(log);
  // Tampo plano de madeira clara
  g.add(part(box, toon(0xe8b98a), 2.0, 0.08, 1.05, 0, TABLE_TOP - 0.04, 0));
  for (const x of [-1, 1]) {
    const ring = mesh(new THREE.TorusGeometry(0.38, 0.06, 8, 24), toon(0xc98b5a));
    ring.rotation.y = Math.PI / 2;
    ring.position.set(x * 0.98, 0.4, 0);
    g.add(ring);
  }
  const moss = toon(0x6cc070);
  for (let i = 0; i < 6; i++) g.add(part(sphere, moss, 0.14, 0.05, 0.1, -0.85 + i * 0.34, TABLE_TOP - 0.02, i % 2 ? 0.5 : -0.5));
  for (const [x, z, c] of [
    [-0.8, 0.52, 0xb58cff],
    [0.7, -0.52, 0x7fd8ff],
    [0.1, 0.53, 0xff7fb0],
  ] as const) {
    g.add(part(cyl, toon(0xfff3dd), 0.02, 0.1, 0.02, x, TABLE_TOP - 0.1, z));
    g.add(part(sphere, glow(c, 1.6), 0.06, 0.035, 0.06, x, TABLE_TOP - 0.04, z));
  }
  g.add(part(box, toon(0xfff7ea), 1.6, 0.012, 0.5, 0, TABLE_TOP + 0.005, 0));
  return g;
}

/** Banquinho acolchoado das mesas de família. */
export function cushionStool(): THREE.Group {
  const g = new THREE.Group();
  g.add(part(cyl, toon(0xc98b5a), 0.14, 0.26, 0.14, 0, 0.13, 0));
  g.add(part(sphere, toon(0xff9fb5), 0.2, 0.08, 0.2, 0, 0.28, 0));
  return g;
}

export function familyTableMesh(id: FurnitureId): THREE.Group {
  return id === 'enchanted_log' ? enchantedLog() : doubleMushroomTable();
}

function hangingLamp(id: FurnitureId): { group: THREE.Group; color: number } {
  const def = furnitureDef(id);
  const color = def.color ?? 0xffffff;
  const g = new THREE.Group();
  g.add(part(cyl, toon(0x6b4a33), 0.006, 0.8, 0.006, 0, 0.4, 0));
  switch (id) {
    case 'lamp_crystal': {
      const c1 = part(new THREE.OctahedronGeometry(1), glow(color, 2.2), 0.14, 0.22, 0.14, 0, -0.05, 0);
      g.add(c1);
      g.add(part(new THREE.OctahedronGeometry(1), glow(0xffffff, 2.5), 0.06, 0.1, 0.06, 0.12, -0.12, 0));
      break;
    }
    case 'lamp_firefly': {
      const jar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.26, 16),
        new THREE.MeshStandardMaterial({ color: 0xe8fff0, transparent: true, opacity: 0.35, depthWrite: false }),
      );
      jar.position.y = -0.06;
      g.add(jar);
      g.add(part(cyl, toon(0xc98b5a), 0.13, 0.04, 0.13, 0, 0.09, 0));
      for (let i = 0; i < 5; i++) g.add(part(sphere, glow(color, 3), 0.025, 0.025, 0.025, Math.cos(i * 2) * 0.06, -0.12 + i * 0.03, Math.sin(i * 2) * 0.06));
      break;
    }
    default: {
      // Lua crescente
      const moon = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.06, 12, 24, Math.PI * 1.3), glow(color, 1.8));
      moon.rotation.z = 0.8;
      moon.position.y = -0.12;
      g.add(moon);
      g.add(part(sphere, glow(0xfff27a, 2.5), 0.03, 0.03, 0.03, 0.05, -0.1, 0));
      break;
    }
  }
  return { group: g, color };
}

function cornerPiece(id: FurnitureId): THREE.Group {
  const g = new THREE.Group();
  switch (id) {
    case 'plant_fern': {
      const p = pottedPlant();
      p.scale.setScalar(1.6);
      g.add(p);
      break;
    }
    case 'plant_flowers': {
      g.add(part(cyl, toon(0x7fc8e8), 0.2, 0.34, 0.2, 0, 0.17, 0));
      const colors = [0xff7fb0, 0xfff27a, 0xb58cff, 0x7fd8ff];
      for (let i = 0; i < 7; i++) {
        const a = i * 0.9;
        g.add(part(cyl, toon(0x4caf50), 0.012, 0.35, 0.012, Math.cos(a) * 0.08, 0.5, Math.sin(a) * 0.08));
        g.add(part(sphere, glow(colors[i % 4]!, 0.9), 0.06, 0.05, 0.06, Math.cos(a) * 0.1, 0.7 + (i % 3) * 0.05, Math.sin(a) * 0.1));
      }
      break;
    }
    case 'mushroom_statue': {
      g.add(part(cyl, toon(0xd9d2c5), 0.3, 0.2, 0.3, 0, 0.1, 0));
      const m = giantMushroom(0xff6b6b, false, 0.55);
      m.position.y = 0.2;
      g.add(m);
      g.add(part(sphere, toon(0x2b2440), 0.03, 0.04, 0.02, -0.08, 0.95, 0.12));
      g.add(part(sphere, toon(0x2b2440), 0.03, 0.04, 0.02, 0.08, 0.95, 0.12));
      break;
    }
    case 'bookshelf': {
      g.add(part(box, toon(0x9a6440), 0.8, 1.3, 0.4, 0, 0.65, 0));
      g.add(part(box, toon(0x7a4f30), 0.7, 1.2, 0.3, 0, 0.65, 0.06));
      const colors = [0xff7fb0, 0x7fd8ff, 0xfff27a, 0x8fd16a, 0xb58cff];
      for (let shelf = 0; shelf < 3; shelf++) {
        g.add(part(box, toon(0xc98b5a), 0.72, 0.03, 0.32, 0, 0.12 + shelf * 0.4, 0.05));
        for (let i = 0; i < 5; i++) g.add(part(box, toon(colors[(i + shelf) % 5]!), 0.1, 0.28 - (i % 2) * 0.05, 0.22, -0.26 + i * 0.13, 0.28 + shelf * 0.4, 0.06));
      }
      break;
    }
    case 'panda_lantern': {
      g.add(part(cyl, toon(0x8fd16a), 0.04, 1.2, 0.04, -0.15, 0.6, 0));
      g.add(part(cyl, toon(0x8fd16a), 0.04, 1.0, 0.04, 0.15, 0.5, 0.05));
      g.add(part(box, toon(0x6ab04c), 0.5, 0.04, 0.04, 0, 1.0, 0));
      const lantern = part(sphere, glow(0xff5a4e, 1.6), 0.18, 0.22, 0.18, 0, 0.7, 0);
      g.add(lantern);
      g.add(part(cyl, toon(0xffd23f), 0.1, 0.04, 0.1, 0, 0.93, 0));
      g.add(part(cyl, toon(0xffd23f), 0.1, 0.04, 0.1, 0, 0.47, 0));
      break;
    }
  }
  return g;
}

function rugMesh(id: FurnitureId, scale: number): THREE.Mesh {
  const def = furnitureDef(id);
  let geo: THREE.BufferGeometry;
  if (id === 'rug_star') {
    const s = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 0.8 : 1.8;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    geo = new THREE.ShapeGeometry(s);
  } else if (id === 'rug_leaf') {
    const s = new THREE.Shape();
    s.moveTo(-1.9, 0);
    s.quadraticCurveTo(0, 1.6, 1.9, 0);
    s.quadraticCurveTo(0, -1.6, -1.9, 0);
    geo = new THREE.ShapeGeometry(s, 16);
  } else {
    geo = new THREE.CircleGeometry(1.6, 40);
  }
  const m = new THREE.Mesh(geo, toon(def.color ?? 0xf7c6d9));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.006;
  m.scale.setScalar(scale);
  m.receiveShadow = true;
  return m;
}

function wallPiece(id: FurnitureId): THREE.Group {
  const g = new THREE.Group();
  switch (id) {
    case 'garland': {
      const colors = [0xff7fb0, 0xfff27a, 0x7fd8ff, 0x8fd16a, 0xb58cff];
      for (let i = 0; i < 7; i++) {
        const x = -0.9 + i * 0.3;
        const y = -Math.sin((i / 6) * Math.PI) * 0.18;
        const flag = part(cone, toon(colors[i % 5]!), 0.1, 0.22, 0.02, x, y - 0.1, 0);
        flag.rotation.z = Math.PI;
        g.add(flag);
      }
      break;
    }
    case 'painting': {
      g.add(part(box, toon(0xc98b5a), 0.9, 0.7, 0.05, 0, 0, 0));
      g.add(part(box, toon(0x9fd8f0), 0.76, 0.56, 0.06, 0, 0, 0.005));
      g.add(part(box, toon(0x6cc070), 0.76, 0.2, 0.07, 0, -0.18, 0.005));
      g.add(part(sphere, toon(0xff6b6b), 0.1, 0.06, 0.02, -0.15, -0.05, 0.04));
      g.add(part(sphere, glow(0xfff27a, 1.2), 0.07, 0.07, 0.02, 0.25, 0.15, 0.04));
      break;
    }
    default: {
      const ring = mesh(new THREE.TorusGeometry(0.3, 0.07, 10, 28), toon(0x6cc070));
      g.add(ring);
      const colors = [0xff7fb0, 0xffffff, 0xfff27a];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        g.add(part(sphere, toon(colors[i % 3]!), 0.06, 0.06, 0.04, Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0.05));
      }
      break;
    }
  }
  return g;
}

export interface DecorPiece {
  group: THREE.Group;
  /** Luz real (luminárias) — mais forte à noite. */
  light?: THREE.PointLight;
}

/** Monta o visual de um móvel para um tipo de espaço. */
export function decorMesh(id: FurnitureId, slotKind: string, slotId: string): DecorPiece {
  switch (slotKind) {
    case 'light': {
      const { group, color } = hangingLamp(id);
      const light = new THREE.PointLight(color, 2, 6, 1.6);
      light.position.y = -0.1;
      group.add(light);
      return { group, light };
    }
    case 'rug': {
      const g = new THREE.Group();
      g.add(rugMesh(id, slotId === 'rug2' ? 0.45 : 1));
      return { group: g };
    }
    case 'wall':
      return { group: wallPiece(id) };
    case 'corner':
      return { group: cornerPiece(id) };
    default:
      return { group: familyTableMesh(id) };
  }
}
