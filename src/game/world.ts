import * as THREE from 'three';
import { DECOR_SLOTS, furnitureDef, wallDef, type DecorSlot, type FurnitureId, type SlotKind } from '../data/furniture';
import type { IngredientKind } from '../data/ingredients';
import type { LevelDef } from '../data/levels';
import type { Vessel } from '../data/recipes';
import { Fireflies } from '../fx/particles';
import { cushionStool, decorMesh, familySeatOffsets } from '../models/decor';
import { vesselMesh, vesselStackMesh } from '../models/food';
import { blenderView, cauldronView, griddleView, type MachineView } from '../models/machines';
import {
  COUNTER_TOP,
  TABLE_TOP,
  bush,
  counter,
  crate,
  cuttingBoard,
  doorArch,
  giantMushroom,
  lantern,
  mushroomTable,
  signBoard,
  sink,
  stool,
  trashBin,
  tree,
  wallBlock,
  windowPane,
} from '../models/props';
import { glow, mesh, toon } from '../render/materials';
import { mergeStatic } from '../render/merge';
import { grass, kitchenTiles, wallpaper, woodFloor } from '../render/textures';
import type { Item, VesselItem } from '../sim/items';
import { Machine, type MachineKind } from '../sim/machine';
import type { Party } from '../sim/party';
import { findPath, simplify } from '../sim/pathfind';
import type { SaveData } from '../sim/progress';
import type { Customer } from './customer';

export type StationKind = 'counter' | 'crate' | 'board' | 'stack' | 'sink' | 'trash' | 'machine';

const CRATE_KINDS: Record<string, IngredientKind> = { L: 'lettuce', T: 'tomato', M: 'glowshroom', R: 'berry', N: 'carrot', A: 'batter', Y: 'bamboo' };
const STACK_KINDS: Record<string, Vessel> = { B: 'bowl', U: 'cup', O: 'plate' };
const MACHINE_KINDS: Record<string, MachineKind> = { J: 'blender', K: 'cauldron', G: 'griddle' };

export class Station {
  item: Item | null = null;
  /** Progresso do trabalho manual (tábua/pia/extintor), 0..1. */
  progress = 0;
  /** Pilha de recipientes limpos. */
  vessel?: Vessel;
  count = 0;
  /** Recipientes sujos esperando na pia. */
  dirty: VesselItem[] = [];
  /** Máquina (liquidificador/caldeirão/chapa). */
  machine?: Machine;
  machineView?: MachineView;
  /** Item colocado no começo do dia (ex.: extintor). */
  startItem?: 'extinguisher';
  /** Alguém trabalhando aqui neste frame. */
  busy = false;
  readonly anchor = new THREE.Object3D();
  /** Anel de destaque quando é o alvo de um jogador. */
  readonly highlight: THREE.Mesh;
  knife?: THREE.Object3D;
  stackGroup?: THREE.Group;
  dirtyGroup?: THREE.Group;
  private shownDirty = -1;

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
    return new THREE.Vector3(this.x, this.machineView?.topY ?? this.anchor.position.y, this.z);
  }

  refreshStack(): void {
    if (!this.stackGroup || !this.vessel) return;
    this.stackGroup.clear();
    this.stackGroup.add(vesselStackMesh(this.vessel, this.count));
  }

  refreshDirty(): void {
    if (!this.dirtyGroup || this.shownDirty === this.dirty.length) return;
    this.shownDirty = this.dirty.length;
    this.dirtyGroup.clear();
    this.dirty.forEach((d, i) => {
      const b = vesselMesh({ ...d, dirty: true });
      b.position.set((i % 2) * 0.12 - 0.06, Math.floor(i / 2) * 0.07, 0);
      b.rotation.set(0.15, i, 0);
      this.dirtyGroup!.add(b);
    });
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
    opts: { family?: boolean } = {},
  ) {
    group.position.set(x, 0, z);
    this.coinAnchor.position.set(0, TABLE_TOP + 0.01, 0);
    group.add(this.coinAnchor);
    this.highlight = makeHighlight(opts.family ? 1.25 : 0.7, TABLE_TOP + 0.03, true);
    group.add(this.highlight);
    for (const [dx, dz] of seatOffsets) {
      const st = opts.family ? cushionStool() : stool();
      st.position.set(dx, 0, dz);
      group.add(st);
      const plate = new THREE.Object3D();
      plate.position.set(dx * (opts.family ? 0.55 : 0.45), TABLE_TOP + 0.01, dz * (opts.family ? 0.42 : 0.45));
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

  get isFamily(): boolean {
    return this.seats.length > 2;
  }

  /** Mesa livre: sem grupo e sem louça. */
  get free(): boolean {
    return !this.party && this.seats.every((s) => !s.dish);
  }

  get hasDirty(): boolean {
    return this.seats.some((s) => s.dish?.type === 'vessel' && s.dish.dirty);
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

type Cell =
  | { type: 'wall' }
  | { type: 'station'; station: Station }
  | { type: 'table'; table: Table }
  | { type: 'decor' }
  | null;

/** Marcador de espaço de decoração (modo de posicionar móveis à noite). */
export interface SlotMarker {
  slot: DecorSlot;
  mesh: THREE.Mesh;
}

/**
 * O restaurante: lê o mapa ASCII do nível e monta tudo em 3D, incluindo a
 * decoração comprada na loja noturna. Célula (x, z) do mapa → ponto (x, 0, z).
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
  /** Luzes das luminárias compradas (mais fortes à noite). */
  private decorLights: THREE.PointLight[] = [];
  private nightGlows: { mat: THREE.MeshStandardMaterial; day: number; night: number }[] = [];
  private cells: Cell[][] = [];
  private familyCells: [number, number][] = [];
  private fireflies: Fireflies;
  private lanterns: THREE.Object3D[] = [];
  private markers: SlotMarker[] = [];
  private markerGroup = new THREE.Group();
  private t = 0;
  private night = 0;

  constructor(
    level: LevelDef,
    private save: SaveData,
  ) {
    const rows = level.map;
    this.depth = rows.length;
    this.width = Math.max(...rows.map((r) => r.length));

    this.buildGround();
    for (let z = 0; z < this.depth; z++) {
      const row: Cell[] = [];
      for (let x = 0; x < this.width; x++) row.push(this.buildCell(rows[z]![x] ?? '.', x, z));
      this.cells.push(row);
    }
    this.buildDecor();
    this.buildShell();
    this.buildOutside();

    const center = new THREE.Vector3(this.width / 2, 0, this.depth / 2);
    this.fireflies = new Fireflies(80, center.clone().setY(0.4), new THREE.Vector3(this.width + 14, 2.6, this.depth + 10));
    this.root.add(this.fireflies.points);
    this.root.add(this.markerGroup);
  }

  private buildGround(): void {
    const g = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.MeshToonMaterial({ map: grass(), color: 0xffffff }));
    g.rotation.x = -Math.PI / 2;
    g.position.set(this.width / 2, -0.02, this.depth / 2);
    g.receiveShadow = true;
    this.root.add(g);

    const kitchenW = 9;
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
  }

  private buildCell(ch: string, x: number, z: number): Cell {
    const add = (s: Station): Cell => {
      this.stations.push(s);
      this.root.add(s.group);
      return { type: 'station', station: s };
    };
    if (ch === 'Y' && !this.save.families.includes('panda')) ch = '#';
    if (CRATE_KINDS[ch]) return add(new Station('crate', x, z, crate(CRATE_KINDS[ch]), CRATE_KINDS[ch]));
    if (STACK_KINDS[ch]) {
      const g = counter();
      const s = new Station('stack', x, z, g);
      s.vessel = STACK_KINDS[ch];
      s.stackGroup = new THREE.Group();
      s.stackGroup.position.y = COUNTER_TOP;
      g.add(s.stackGroup);
      return add(s);
    }
    if (MACHINE_KINDS[ch]) {
      const kind = MACHINE_KINDS[ch];
      const view = kind === 'blender' ? blenderView() : kind === 'cauldron' ? cauldronView() : griddleView();
      const s = new Station('machine', x, z, view.group);
      s.machine = new Machine(kind);
      s.machineView = view;
      s.anchor.position.y = view.topY;
      s.highlight.position.y = kind === 'cauldron' ? 0.63 : COUNTER_TOP + 0.01;
      return add(s);
    }
    switch (ch) {
      case 'W': {
        const back = z === 0;
        const w = wallBlock(back ? 2.4 : 1.3, back ? wallpaper(wallDef(this.save.wall)) : null);
        w.position.set(x, 0, z);
        this.root.add(w);
        return { type: 'wall' };
      }
      case '#':
        return add(new Station('counter', x, z, counter()));
      case 'Z': {
        const s = new Station('counter', x, z, counter());
        s.startItem = 'extinguisher';
        return add(s);
      }
      case 'C': {
        const { group, knife } = cuttingBoard();
        const s = new Station('board', x, z, group);
        s.knife = knife;
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
        this.trackGlow(lamp);
        return { type: 'table', table: t };
      }
      case 'F':
        this.familyCells.push([x, z]);
        return null;
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

  /** Móveis comprados na loja noturna, nos seus espaços. */
  private buildDecor(): void {
    for (const slot of DECOR_SLOTS) {
      const id = this.save.placed[slot.id];
      if (!id) continue;
      if (slot.kind === 'family') {
        this.buildFamilyTable(slot, id);
        continue;
      }
      const piece = decorMesh(id, slot.kind, slot.id);
      piece.group.position.set(slot.x, slot.kind === 'light' ? 2.45 : slot.kind === 'wall' ? 1.55 : 0, slot.z);
      if (slot.kind === 'wall') piece.group.position.z += 0.04;
      this.root.add(piece.group);
      this.trackGlow(piece.group);
      if (piece.light) this.decorLights.push(piece.light);
      if (slot.kind === 'corner' && this.cells[slot.z]?.[slot.x] === null) this.cells[slot.z]![slot.x] = { type: 'decor' };
      if (slot.kind === 'light') this.lanterns.push(piece.group);
    }
  }

  private buildFamilyTable(slot: DecorSlot, id: FurnitureId): void {
    const seats = furnitureDef(id).seats ?? 4;
    const piece = decorMesh(id, 'family', slot.id);
    const t = new Table(slot.x, slot.z, piece.group, familySeatOffsets(seats), { family: true });
    this.tables.push(t);
    this.root.add(t.group);
    this.trackGlow(t.group);
    for (const [x, z] of this.familyCells) this.cells[z]![x] = { type: 'table', table: t };
  }

  /** Guarda materiais que brilham para realçar à noite. */
  private trackGlow(obj: THREE.Object3D): void {
    obj.traverse((o) => {
      const mat = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
      if (mat && !Array.isArray(mat) && mat.isMeshStandardMaterial && mat.emissiveIntensity > 0.5) {
        this.nightGlows.push({ mat, day: mat.emissiveIntensity, night: mat.emissiveIntensity * 1.6 });
      }
    });
  }

  private buildShell(): void {
    const shell = new THREE.Group();
    const east = this.width - 0.5;
    // Parede leste com vão da porta
    for (let z = 1; z < this.depth; z++) {
      if (Math.abs(z - this.door.z) < 0.5) continue;
      const w = wallBlock(1.3, null);
      w.scale.x = 0.3;
      w.position.set(east + 0.15, 0, z);
      shell.add(w);
    }
    // Cerquinha de sebe na frente (baixa para não tapar a visão)
    for (let x = 0; x < this.width; x += 1.2) {
      const b = bush();
      b.scale.set(0.8, 0.6, 0.7);
      b.position.set(x + 0.3, 0, this.depth - 0.1);
      shell.add(b);
    }
    this.root.add(mergeStatic(shell));

    const arch = doorArch();
    arch.position.set(east + 0.15, 0, this.door.z);
    this.root.add(arch);

    const sign = signBoard('Bistrô do Cogumelo Mágico', '✦ aberto ✦');
    sign.position.set(5.5, 2.05, 0.53);
    sign.scale.setScalar(0.85);
    this.root.add(sign);
    const win = windowPane();
    win.position.set(9.6, 1.75, 0.53);
    this.root.add(win);
    this.trackGlow(win);
  }

  private buildOutside(): void {
    const W = this.width;
    const D = this.depth;
    const out = new THREE.Group();
    const rng = (() => {
      let s = 11;
      return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
    })();
    for (let i = 0; i < 18; i++) {
      const t = tree(1 + rng() * 0.6);
      t.position.set(-4 + i * 1.6 + rng(), 0, -2.5 - rng() * 2.5);
      out.add(t);
    }
    for (let i = 0; i < 7; i++) {
      const left = tree(0.9 + rng() * 0.5);
      left.position.set(-2.5 - rng() * 2, 0, 1 + i * 1.7);
      out.add(left);
      const right = tree(0.9 + rng() * 0.5);
      right.position.set(W + 2.5 + rng() * 2, 0, 3.5 + i * 1.5);
      out.add(right);
    }
    for (const [x, z, c, s] of [
      [-1.8, D - 1.5, 0xffb36b, 1.0],
      [W + 3.2, 1.2, 0xff6b6b, 0.8],
    ] as const) {
      const m = giantMushroom(c, false, s);
      m.position.set(x, 0, z);
      out.add(m);
    }
    const stoneGeo = new THREE.CylinderGeometry(0.28, 0.3, 0.05, 10);
    for (let i = 0; i < 6; i++) {
      const stone = mesh(stoneGeo, toon(0xd9d2c5));
      stone.position.set(W + 0.4 + i * 0.75, 0.01, this.door.z + (i % 2 ? 0.15 : -0.15));
      out.add(stone);
    }
    this.root.add(mergeStatic(out));

    // Cogumelos gigantes brilhantes (não entram no merge: brilham mais à noite)
    for (const [x, z, c, s] of [
      [-1.6, -0.8, 0xb58cff, 1.1],
      [W + 1.4, -0.6, 0xff7fa8, 1.3],
      [W + 1.6, D - 1, 0x7fd8ff, 0.9],
    ] as const) {
      const m = giantMushroom(c, true, s);
      m.position.set(x, 0, z);
      this.root.add(m);
      this.trackGlow(m);
    }
  }

  cell(x: number, z: number): Cell {
    return this.cells[z]?.[x] ?? null;
  }

  /** Sólido para os heróis? Fora do mapa também é sólido. */
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

  /** Ponto do lado de fora, alinhado com a porta (onde clientes aparecem/somem). */
  outside(offset = 0): THREE.Vector3 {
    return new THREE.Vector3(this.door.x + 2.5 + offset, 0, this.door.z);
  }

  /**
   * Rota a pé (A*) entre dois pontos do mundo, contornando balcões, mesas e móveis.
   * Os pontos de início/fim podem estar fora do mapa (lado de fora da porta).
   */
  route(from: THREE.Vector3, to: THREE.Vector3): THREE.Vector3[] {
    const walk = (x: number, z: number) => !this.isSolid(x, z);
    const inside = (p: THREE.Vector3) => p.x <= this.width - 0.5;
    const door: [number, number] = [this.door.x, this.door.z];
    const fromIn = inside(from);
    const toIn = inside(to);
    const a: [number, number] = fromIn ? [Math.round(from.x), Math.round(from.z)] : door;
    const b: [number, number] = toIn ? [Math.round(to.x), Math.round(to.z)] : door;
    const cells = findPath(walk, a, b) ?? [a, b];
    // Só simplifica a parte de dentro: a porta é passagem obrigatória (não atravessa parede).
    const interior = simplify(walk, [fromIn ? [from.x, from.z] : door, ...cells, toIn ? [to.x, to.z] : door]);
    const full: [number, number][] = [...(fromIn ? [] : [[from.x, from.z] as [number, number]]), ...interior, ...(toIn ? [] : [[to.x, to.z] as [number, number]])];
    return full.slice(1).map(([x, z]) => new THREE.Vector3(x, 0, z));
  }

  // ───────────── noite e decoração ─────────────

  /** 0 = dia, 1 = noite: luminárias, janelas e cogumelos brilham mais. */
  setNight(v: number): void {
    this.night = v;
    for (const g of this.nightGlows) g.mat.emissiveIntensity = g.day + (g.night - g.day) * v;
    for (const l of this.decorLights) l.intensity = 1.5 + v * 7;
    const fm = this.fireflies.points.material as THREE.PointsMaterial;
    fm.size = 0.22 + v * 0.14;
  }

  /** Mostra os espaços livres/ocupados de um tipo para posicionar um móvel. */
  showSlots(kind: SlotKind | null, selected: string | null): void {
    this.markerGroup.clear();
    this.markers = [];
    if (!kind) return;
    for (const slot of DECOR_SLOTS.filter((s) => s.kind === kind)) {
      const sel = slot.id === selected;
      const occupied = !!this.save.placed[slot.id];
      const r = kind === 'family' ? 1.3 : kind === 'rug' ? (slot.id === 'rug2' ? 0.8 : 1.6) : 0.45;
      const m = new THREE.Mesh(
        new THREE.RingGeometry(r * 0.8, r, 40),
        new THREE.MeshBasicMaterial({
          color: sel ? 0xfff27a : occupied ? 0xffb3d1 : 0x9fe8ff,
          transparent: true,
          opacity: sel ? 0.95 : 0.6,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      );
      m.rotation.x = -Math.PI / 2;
      const y = kind === 'light' ? 0.03 : kind === 'wall' ? 0.03 : 0.03;
      const z = kind === 'wall' ? 1.1 : slot.z;
      m.position.set(slot.x, y, z);
      m.renderOrder = 6;
      m.userData.slotId = slot.id;
      if (sel) {
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r * 0.9, 2.6, 24, 1, true), glow(0xfff27a, 0.6));
        (beam.material as THREE.MeshStandardMaterial).transparent = true;
        (beam.material as THREE.MeshStandardMaterial).opacity = 0.12;
        (beam.material as THREE.MeshStandardMaterial).depthWrite = false;
        beam.position.set(slot.x, 1.3, z);
        this.markerGroup.add(beam);
      }
      this.markerGroup.add(m);
      this.markers.push({ slot, mesh: m });
    }
  }

  get slotMarkers(): readonly SlotMarker[] {
    return this.markers;
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
    for (const l of this.decorLights) l.intensity = (1.5 + this.night * 7) * (0.92 + Math.sin(this.t * 3 + l.id) * 0.08);
    this.markerGroup.children.forEach((m) => {
      if (m instanceof THREE.Mesh && m.geometry instanceof THREE.RingGeometry) m.rotation.z += dt * 0.6;
    });
  }
}
