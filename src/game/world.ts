import * as THREE from 'three';
import type { IngredientKind } from '../data/ingredients';
import type { LevelDef } from '../data/levels';
import { Fireflies } from '../fx/particles';
import { mesh, toon } from '../render/materials';
import { grass, kitchenTiles, wallpaper, woodFloor } from '../render/textures';
import {
  COUNTER_TOP,
  TABLE_TOP,
  bowlStack,
  bush,
  counter,
  crate,
  cuttingBoard,
  doorArch,
  giantMushroom,
  lantern,
  mushroomTable,
  pottedPlant,
  refreshBowlStack,
  signBoard,
  sink,
  stool,
  trashBin,
  tree,
  wallBlock,
  windowPane,
} from '../models/props';
import type { BowlItem, Item } from '../sim/items';
import type { Party } from '../sim/party';
import type { Customer } from './customer';

export type StationKind = 'counter' | 'crate' | 'board' | 'bowls' | 'sink' | 'trash';

const CRATE_KINDS: Record<string, IngredientKind> = { L: 'lettuce', T: 'tomato', M: 'glowshroom' };

export class Station {
  item: Item | null = null;
  /** Progresso do trabalho (tábua/pia), 0..1. */
  progress = 0;
  /** Tigelas limpas (pilha). */
  bowls = 0;
  /** Tigelas sujas esperando na pia. */
  dirty: BowlItem[] = [];
  /** Alguém trabalhando aqui neste frame. */
  busy = false;
  readonly anchor = new THREE.Object3D();
  /** Anel de destaque quando é o alvo de um jogador. */
  readonly highlight: THREE.Mesh;
  knife?: THREE.Object3D;
  stackGroup?: THREE.Group;
  dirtyGroup?: THREE.Group;

  constructor(
    readonly kind: StationKind,
    readonly x: number,
    readonly z: number,
    readonly group: THREE.Group,
    readonly ingredient?: IngredientKind,
  ) {
    group.position.set(x, 0, z);
    this.anchor.position.set(0, kind === 'board' ? COUNTER_TOP + 0.05 : kind === 'trash' ? 0.8 : COUNTER_TOP, 0);
    group.add(this.anchor);
    this.highlight = makeHighlight(kind === 'trash' ? 0.42 : 0.56, kind === 'trash' ? 0.82 : COUNTER_TOP + 0.01);
    group.add(this.highlight);
  }

  get worldTop(): THREE.Vector3 {
    return new THREE.Vector3(this.x, this.anchor.position.y, this.z);
  }

  refreshStack(): void {
    if (this.stackGroup) refreshBowlStack(this.stackGroup, this.bowls);
  }
}

export interface Seat {
  pos: THREE.Vector3;
  facing: number;
  /** Onde o prato deste lugar fica na mesa. */
  plate: THREE.Object3D;
  dish: Item | null;
  customer: Customer | null;
}

export class Table {
  party: Party | null = null;
  coins = 0;
  readonly coinAnchor = new THREE.Object3D();
  readonly highlight: THREE.Mesh;
  readonly seats: Seat[] = [];

  constructor(
    readonly x: number,
    readonly z: number,
    readonly group: THREE.Group,
    seatOffsets: readonly [number, number][],
  ) {
    group.position.set(x, 0, z);
    this.coinAnchor.position.set(0, TABLE_TOP + 0.01, 0);
    group.add(this.coinAnchor);
    this.highlight = makeHighlight(0.7, TABLE_TOP + 0.02, true);
    group.add(this.highlight);
    for (const [dx, dz] of seatOffsets) {
      const st = stool();
      st.position.set(dx, 0, dz);
      group.add(st);
      const plate = new THREE.Object3D();
      plate.position.set(dx * 0.45, TABLE_TOP + 0.01, dz * 0.45);
      group.add(plate);
      this.seats.push({
        pos: new THREE.Vector3(x + dx, 0, z + dz),
        facing: Math.atan2(-dx, -dz),
        plate,
        dish: null,
        customer: null,
      });
    }
  }

  get capacity(): number {
    return this.seats.length;
  }

  /** Mesa livre: sem grupo e sem louça. */
  get free(): boolean {
    return !this.party && this.seats.every((s) => !s.dish);
  }

  get hasDirty(): boolean {
    return this.seats.some((s) => s.dish?.type === 'bowl' && s.dish.dirty);
  }
}

function makeHighlight(radius: number, y: number, round = false): THREE.Mesh {
  const geo = round ? new THREE.RingGeometry(radius - 0.06, radius, 40) : new THREE.RingGeometry(radius - 0.07, radius, 4, 1);
  const m = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({ color: 0xfff27a, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide }),
  );
  m.rotation.x = -Math.PI / 2;
  if (!round) m.rotation.z = Math.PI / 4;
  m.position.y = y;
  m.visible = false;
  m.renderOrder = 5;
  return m;
}

type Cell = { type: 'wall' } | { type: 'station'; station: Station } | { type: 'table'; table: Table } | null;

/**
 * O restaurante: lê o mapa ASCII do nível e monta tudo em 3D.
 * Célula (x, z) do mapa tem centro no ponto (x, 0, z) do mundo.
 */
export class World {
  readonly root = new THREE.Group();
  readonly width: number;
  readonly depth: number;
  readonly stations: Station[] = [];
  readonly tables: Table[] = [];
  readonly spawns: THREE.Vector3[] = [];
  /** Célula da porta (entrada/saída de clientes). */
  door = new THREE.Vector3();
  /** Corredor por onde clientes caminham (x fixo). */
  aisleX = 12.5;
  private cells: Cell[][] = [];
  private fireflies: Fireflies;
  private lanterns: THREE.Object3D[] = [];
  private t = 0;

  constructor(level: LevelDef) {
    const rows = level.map;
    this.depth = rows.length;
    this.width = Math.max(...rows.map((r) => r.length));

    this.buildGround();

    for (let z = 0; z < this.depth; z++) {
      const row: Cell[] = [];
      for (let x = 0; x < this.width; x++) row.push(this.buildCell(rows[z]![x] ?? '.', x, z));
      this.cells.push(row);
    }

    this.buildShell();
    this.buildOutside();

    const center = new THREE.Vector3(this.width / 2, 0, this.depth / 2);
    this.fireflies = new Fireflies(70, center.clone().setY(0.4), new THREE.Vector3(this.width + 14, 2.6, this.depth + 10));
    this.root.add(this.fireflies.points);
  }

  private buildGround(): void {
    const g = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.MeshToonMaterial({ map: grass(), color: 0xffffff }));
    g.rotation.x = -Math.PI / 2;
    g.position.set(this.width / 2, -0.02, this.depth / 2);
    g.receiveShadow = true;
    this.root.add(g);

    const kitchenW = 7.5;
    const tiles = kitchenTiles();
    tiles.repeat.set(kitchenW / 2, this.depth / 2);
    const kf = new THREE.Mesh(new THREE.PlaneGeometry(kitchenW + 0.5, this.depth), new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.6 }));
    kf.rotation.x = -Math.PI / 2;
    kf.position.set((kitchenW + 0.5) / 2 - 0.5, 0, this.depth / 2 - 0.5);
    kf.receiveShadow = true;
    this.root.add(kf);

    const wood = woodFloor();
    const dw = this.width - kitchenW - 0.5;
    wood.repeat.set(dw / 3, this.depth / 3);
    const df = new THREE.Mesh(new THREE.PlaneGeometry(dw, this.depth), new THREE.MeshStandardMaterial({ map: wood, roughness: 0.75 }));
    df.rotation.x = -Math.PI / 2;
    df.position.set(kitchenW + dw / 2, 0, this.depth / 2 - 0.5);
    df.receiveShadow = true;
    this.root.add(df);

    // Tapete redondo no salão
    const rug = mesh(new THREE.CircleGeometry(1.6, 40), toon(0xf7c6d9), false);
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(12.5, 0.005, 5.5);
    rug.receiveShadow = true;
    this.root.add(rug);
  }

  private buildCell(ch: string, x: number, z: number): Cell {
    const add = (s: Station): Cell => {
      this.stations.push(s);
      this.root.add(s.group);
      return { type: 'station', station: s };
    };
    switch (ch) {
      case 'W': {
        const back = z === 0;
        const w = wallBlock(back ? 2.4 : 1.3, back ? wallpaper() : null);
        w.position.set(x, 0, z);
        this.root.add(w);
        return { type: 'wall' };
      }
      case '#':
        return add(new Station('counter', x, z, counter()));
      case 'L':
      case 'T':
      case 'M':
        return add(new Station('crate', x, z, crate(CRATE_KINDS[ch]!), CRATE_KINDS[ch]));
      case 'C': {
        const { group, knife } = cuttingBoard();
        const s = new Station('board', x, z, group);
        s.knife = knife;
        return add(s);
      }
      case 'B': {
        const { group, stack } = bowlStack();
        const s = new Station('bowls', x, z, group);
        s.stackGroup = stack;
        return add(s);
      }
      case 'S': {
        const { group, dirtyStack } = sink();
        const s = new Station('sink', x, z, group);
        s.dirtyGroup = dirtyStack;
        return add(s);
      }
      case 'X':
        return add(new Station('trash', x, z, trashBin()));
      case 't': {
        const t = new Table(x, z, mushroomTable(), [
          [-0.66, 0],
          [0.66, 0],
        ]);
        this.tables.push(t);
        this.root.add(t.group);
        const lamp = lantern(0xffd27a);
        lamp.position.set(x, 2.3, z - 0.3);
        this.root.add(lamp);
        this.lanterns.push(lamp);
        return { type: 'table', table: t };
      }
      case 'P':
        this.spawns.push(new THREE.Vector3(x, 0, z));
        return null;
      case 'D':
        this.door.set(x, 0, z);
        return null;
      default:
        return null;
    }
  }

  private buildShell(): void {
    const east = this.width - 0.5;
    // Parede leste com vão da porta
    for (let z = 1; z < this.depth; z++) {
      if (Math.abs(z - this.door.z) < 0.5) continue;
      const w = wallBlock(1.3, null);
      w.scale.x = 0.3;
      w.position.set(east + 0.15, 0, z);
      this.root.add(w);
    }
    const arch = doorArch();
    arch.position.set(east + 0.15, 0, this.door.z);
    this.root.add(arch);

    // Cerquinha de sebe na frente (baixa para não tapar a visão)
    for (let x = 0; x < this.width; x += 1.2) {
      const b = bush();
      b.scale.set(0.8, 0.6, 0.7);
      b.position.set(x + 0.3, 0, this.depth - 0.1);
      this.root.add(b);
    }

    // Placa e janelas na parede do fundo
    const sign = signBoard('Bistrô do Cogumelo Mágico', '✦ aberto ✦');
    sign.position.set(this.width / 2 + 0.5, 2.05, 0.53);
    sign.scale.setScalar(0.85);
    this.root.add(sign);
    for (const x of [2, 13.5]) {
      const w = windowPane();
      w.position.set(x, 1.75, 0.53);
      this.root.add(w);
    }
    for (const [x, z] of [
      [9, 9.1],
      [15, 8.9],
      [9, 1.2],
    ] as const) {
      const p = pottedPlant();
      p.position.set(x, 0, z);
      this.root.add(p);
    }
  }

  private buildOutside(): void {
    const W = this.width;
    const D = this.depth;
    const rng = (() => {
      let s = 11;
      return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
    })();
    // Árvores ao fundo e nas laterais
    for (let i = 0; i < 16; i++) {
      const t = tree(1 + rng() * 0.6);
      t.position.set(-4 + i * 1.6 + rng(), 0, -2.5 - rng() * 2.5);
      this.root.add(t);
    }
    for (let i = 0; i < 6; i++) {
      const left = tree(0.9 + rng() * 0.5);
      left.position.set(-2.5 - rng() * 2, 0, 1 + i * 1.8);
      this.root.add(left);
      const right = tree(0.9 + rng() * 0.5);
      right.position.set(W + 2.5 + rng() * 2, 0, 3.5 + i * 1.6);
      this.root.add(right);
    }
    // Cogumelos gigantes brilhantes
    const shrooms: [number, number, number, number, boolean][] = [
      [-1.6, -0.8, 0xb58cff, 1.1, true],
      [W + 1.4, -0.6, 0xff7fa8, 1.3, true],
      [W + 1.6, D - 1, 0x7fd8ff, 0.9, true],
      [-1.8, D - 1.5, 0xffb36b, 1.0, false],
      [W + 3.2, 1.2, 0xff6b6b, 0.8, false],
    ];
    for (const [x, z, c, s, g] of shrooms) {
      const m = giantMushroom(c, g, s);
      m.position.set(x, 0, z);
      this.root.add(m);
    }
    // Caminho de pedras até a porta
    for (let i = 0; i < 6; i++) {
      const stone = mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.05, 10), toon(0xd9d2c5));
      stone.position.set(W + 0.4 + i * 0.75, 0.01, this.door.z + (i % 2 ? 0.15 : -0.15));
      this.root.add(stone);
    }
  }

  cell(x: number, z: number): Cell {
    return this.cells[z]?.[x] ?? null;
  }

  /** Sólido para os heróis? Fora do mapa também é sólido (exceto a porta, que é bloqueada por uma "cortina"). */
  isSolid(x: number, z: number): boolean {
    if (x < 0 || z < 0 || x >= this.width || z >= this.depth) return true;
    return this.cells[z]![x] !== null;
  }

  stationAt(x: number, z: number): Station | null {
    const c = this.cell(x, z);
    return c?.type === 'station' ? c.station : null;
  }

  tableAt(x: number, z: number): Table | null {
    const c = this.cell(x, z);
    return c?.type === 'table' ? c.table : null;
  }

  /** Libera texturas de canvas criadas para este mundo (o mundo é recriado a cada dia). */
  dispose(): void {
    this.root.traverse((o) => {
      const mat = (o as THREE.Mesh).material as THREE.Material & { map?: THREE.Texture | null; emissiveMap?: THREE.Texture | null };
      if (!mat || Array.isArray(mat)) return;
      mat.map?.dispose();
      mat.emissiveMap?.dispose();
    });
  }

  update(dt: number): void {
    this.t += dt;
    this.fireflies.update(dt);
    this.lanterns.forEach((l, i) => (l.rotation.z = Math.sin(this.t * 1.3 + i) * 0.06));
  }
}
