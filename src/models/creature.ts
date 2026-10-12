import * as THREE from 'three';
import type { Accessory, MoveStyle, Species, WingStyle } from '../data/characters';
import { glow, mesh, toon, wingMaterial } from '../render/materials';

export interface CreatureLook {
  species: Species;
  body: number;
  belly: number;
  accent: number;
  wing?: WingStyle;
  wingColor?: number;
  eyeColor?: number;
  accessory?: Accessory;
  style?: MoveStyle;
}

/** Humor do rosto: olhos normais, felizes (^^) ou dormindo (—). */
export type Mood = 'normal' | 'happy' | 'sleepy';

const DEFAULT_STYLE: MoveStyle = { bounce: 1, hover: 1, wiggle: 1 };

/**
 * Silhueta de cada espécie. Regra do "teste da sombra" (`?lineup=sombra`):
 * pintados de preto, os heróis precisam ser reconhecíveis só pelo formato.
 */
interface Profile {
  /** Escala geral (altura). */
  size: number;
  body: { r: number; sx: number; sy: number; sz: number; y: number };
  head: { r: number; y: number; z: number; sx: number; sy: number; sz: number };
  muzzle: 'round' | 'pointy' | 'long' | 'wide' | 'none';
  eye: { size: number; spread: number; y: number; shape: 'round' | 'big' | 'almond' | 'sharp' | 'owl' | 'frog' };
}

const PROFILES: Record<Species, Profile> = {
  // Pequena e fofa: corpo baixinho, olhos enormes (as orelhas em pé fazem a silhueta)
  bunny: { size: 0.92, body: { r: 0.28, sx: 1, sy: 0.98, sz: 0.95, y: 0.34 }, head: { r: 0.3, y: 0.75, z: 0, sx: 1.05, sy: 0.97, sz: 1 }, muzzle: 'round', eye: { size: 1.25, spread: 0.115, y: 0.02, shape: 'big' } },
  // Esguia, focinho fino
  fox: { size: 1, body: { r: 0.25, sx: 0.85, sy: 1.15, sz: 0.88, y: 0.37 }, head: { r: 0.27, y: 0.8, z: 0.02, sx: 1.08, sy: 0.9, sz: 1 }, muzzle: 'pointy', eye: { size: 1, spread: 0.1, y: 0.04, shape: 'almond' } },
  // O mais largo e gordinho
  dragon: { size: 1, body: { r: 0.34, sx: 1.2, sy: 0.95, sz: 1.02, y: 0.36 }, head: { r: 0.29, y: 0.8, z: 0.03, sx: 1.12, sy: 0.92, sz: 1 }, muzzle: 'wide', eye: { size: 1.05, spread: 0.12, y: 0.07, shape: 'round' } },
  // O mais alto, focinho comprido
  wolf: { size: 1.1, body: { r: 0.26, sx: 0.9, sy: 1.28, sz: 0.9, y: 0.42 }, head: { r: 0.26, y: 0.93, z: 0.02, sx: 1, sy: 0.95, sz: 1 }, muzzle: 'long', eye: { size: 0.95, spread: 0.1, y: 0.06, shape: 'sharp' } },
  // Ovo: cabeça e corpo juntos, sem focinho
  owl: { size: 0.95, body: { r: 0.34, sx: 1, sy: 1.25, sz: 0.95, y: 0.4 }, head: { r: 0.31, y: 0.72, z: 0.01, sx: 1.12, sy: 0.88, sz: 0.95 }, muzzle: 'none', eye: { size: 1, spread: 0.12, y: 0.02, shape: 'owl' } },
  bear: { size: 1, body: { r: 0.31, sx: 1.05, sy: 1, sz: 0.95, y: 0.36 }, head: { r: 0.3, y: 0.8, z: 0, sx: 1.05, sy: 0.95, sz: 1 }, muzzle: 'round', eye: { size: 1, spread: 0.11, y: 0.03, shape: 'round' } },
  cat: { size: 0.98, body: { r: 0.27, sx: 0.92, sy: 1.05, sz: 0.92, y: 0.36 }, head: { r: 0.29, y: 0.78, z: 0, sx: 1.12, sy: 0.9, sz: 1 }, muzzle: 'round', eye: { size: 1.1, spread: 0.11, y: 0.03, shape: 'almond' } },
  mouse: { size: 0.9, body: { r: 0.25, sx: 0.95, sy: 1, sz: 0.95, y: 0.33 }, head: { r: 0.27, y: 0.72, z: 0.02, sx: 1, sy: 0.95, sz: 1.05 }, muzzle: 'pointy', eye: { size: 1.15, spread: 0.1, y: 0.04, shape: 'big' } },
  // Achatada e larga, olhos no topo da cabeça
  frog: { size: 0.95, body: { r: 0.31, sx: 1.25, sy: 0.8, sz: 1, y: 0.3 }, head: { r: 0.31, y: 0.64, z: 0.03, sx: 1.35, sy: 0.75, sz: 1 }, muzzle: 'none', eye: { size: 1.1, spread: 0.15, y: 0.2, shape: 'frog' } },
  // Bolinha de espinhos (os espinhos cobrem as costas e a cabeça)
  hedgehog: { size: 0.95, body: { r: 0.3, sx: 1.05, sy: 0.95, sz: 1, y: 0.34 }, head: { r: 0.27, y: 0.72, z: 0.05, sx: 1, sy: 0.95, sz: 1 }, muzzle: 'pointy', eye: { size: 1, spread: 0.1, y: 0.04, shape: 'round' } },
  panda: { size: 1.03, body: { r: 0.34, sx: 1.12, sy: 1, sz: 1, y: 0.38 }, head: { r: 0.32, y: 0.84, z: 0, sx: 1.08, sy: 0.95, sz: 1 }, muzzle: 'round', eye: { size: 1, spread: 0.115, y: 0.03, shape: 'round' } },
};

const sphere = new THREE.SphereGeometry(1, 24, 18);
const lowSphere = new THREE.SphereGeometry(1, 12, 10);
const cone = new THREE.ConeGeometry(1, 1, 16);
const capsule = new THREE.CapsuleGeometry(1, 1, 6, 12);
const UP = new THREE.Vector3(0, 1, 0);

function ball(r: number, mat: THREE.Material, sx = 1, sy = 1, sz = 1, detail = true): THREE.Mesh {
  const m = mesh(detail ? sphere : lowSphere, mat);
  m.scale.set(r * sx, r * sy, r * sz);
  return m;
}

/** Cone apontando na direção `dir` a partir de `at`. */
function spike(mat: THREE.Material, at: THREE.Vector3, dir: THREE.Vector3, w: number, h: number): THREE.Mesh {
  const m = mesh(cone, mat);
  m.scale.set(w, h, w);
  m.quaternion.setFromUnitVectors(UP, dir.clone().normalize());
  m.position.copy(at).addScaledVector(dir.clone().normalize(), h * 0.4);
  return m;
}

/**
 * Criatura fofa procedural. A silhueta vem do perfil da espécie (corpo, cabeça,
 * focinho, olhos) + orelhas e cauda próprias; o herói ainda ganha acessório e asas.
 */
export class Creature {
  readonly root = new THREE.Group();
  /** Parte que pula/inclina (tudo menos a sombra). */
  readonly rig = new THREE.Group();
  readonly body = new THREE.Group();
  readonly head = new THREE.Group();
  readonly holdAnchor = new THREE.Object3D();
  private prof: Profile;
  private wings: THREE.Object3D[] = [];
  private tail: THREE.Object3D | null = null;
  private eyes: THREE.Object3D[] = [];
  private eyePos: THREE.Vector3[] = [];
  private happyEyes: THREE.Object3D[] = [];
  private sleepyEyes: THREE.Object3D[] = [];
  private mouthSmile: THREE.Object3D | null = null;
  private mouthOpen: THREE.Object3D | null = null;
  private style: MoveStyle = DEFAULT_STYLE;
  private fidgetIn = 3 + Math.random() * 4;
  private fidgetLeft = 0;
  /** Humor atual (a felicidade ao comemorar é automática). */
  mood: Mood = 'normal';
  private paws: THREE.Mesh[] = [];
  private feet: THREE.Mesh[] = [];
  private pawX: number;
  private pawY: number;
  private pawZ: number;
  private t = Math.random() * 10;
  private blinkIn = 1 + Math.random() * 3;
  private blinkLeft = 0;
  private celebrateLeft = 0;
  private hopLeft = 0;
  /** 0..1 — quão rápido está andando (controlado de fora). */
  moving = 0;
  /** Segurando algo: braços para frente. */
  holding = false;
  /** Trabalhando (cortando/lavando): braços batendo. */
  working = false;
  /** Sentado (clientes). */
  sitting = false;
  /** Comendo (clientes). */
  eating = false;
  private flapSpeed: number;
  private hoverAmp: number;

  constructor(
    readonly look: CreatureLook,
    scale = 1,
  ) {
    const p = (this.prof = PROFILES[look.species]);
    const bodyMat = toon(look.body);
    const bellyMat = toon(look.belly);
    const accentMat = toon(look.accent);
    const B = p.body;
    const H = p.head;

    this.root.add(this.rig);
    this.rig.add(this.body);

    // Corpo
    const torso = ball(B.r, bodyMat, B.sx, B.sy, B.sz);
    torso.position.y = B.y;
    this.body.add(torso);
    const belly = ball(B.r * 0.74, bellyMat, B.sx, B.sy * 1.02, 0.6);
    belly.position.set(0, B.y - 0.02, B.r * B.sz * 0.48);
    this.body.add(belly);

    // Patinhas (mãos) e pés
    this.pawX = B.r * B.sx * 0.92;
    this.pawY = B.y;
    this.pawZ = B.r * B.sz * 0.35;
    const limbMat = look.species === 'panda' ? accentMat : bodyMat;
    for (const side of [-1, 1]) {
      const paw = look.species === 'owl' ? ball(0.09, accentMat, 0.6, 1.2, 1) : ball(0.085, limbMat);
      paw.position.set(side * this.pawX, this.pawY, this.pawZ);
      this.body.add(paw);
      this.paws.push(paw);
      const footR = look.species === 'frog' ? 0.13 : 0.1;
      const foot = ball(footR, look.species === 'frog' ? accentMat : look.species === 'owl' ? toon(0xffc36b) : limbMat, 1.1, 0.6, 1.4);
      foot.position.set(side * B.r * B.sx * 0.45, 0.06, 0.08);
      this.rig.add(foot);
      this.feet.push(foot);
    }

    // Cabeça (chibi)
    this.head.position.set(0, H.y, H.z);
    this.body.add(this.head);
    this.head.add(ball(H.r, bodyMat, H.sx, H.sy, H.sz));

    this.buildMuzzle(look, bodyMat, bellyMat);
    this.buildFace(look);
    this.buildEars(look, bodyMat, accentMat, bellyMat);
    this.buildTail(look, bodyMat, accentMat, bellyMat);
    this.buildExtras(look, bodyMat, accentMat, bellyMat);
    if (look.wing) this.buildWings(look.wing, look.wingColor ?? 0xffffff);

    // Ponto onde itens seguros aparecem
    this.holdAnchor.position.set(0, B.y + 0.19, B.r * B.sz + 0.15);
    this.body.add(this.holdAnchor);

    // Sombra de contato suave
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.34 * Math.max(1, B.sx), 24),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18, depthWrite: false }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    this.root.add(shadow);

    if (look.accessory) this.buildAccessory(look.accessory, look);

    this.root.scale.setScalar(scale * p.size);
    this.style = look.style ?? DEFAULT_STYLE;
    this.flapSpeed = look.wing === 'bat' ? 14 : look.wing === 'feather' ? 7 : 11;
    this.hoverAmp = look.wing ? 0.035 * this.style.hover : 0;
  }

  /** Ponto na superfície da frente da cabeça (coordenadas da cabeça). */
  private front(x: number, y: number): number {
    const H = this.prof.head;
    const nx = x / (H.r * H.sx);
    const ny = y / (H.r * H.sy);
    return H.r * H.sz * Math.sqrt(Math.max(0.05, 1 - nx * nx - ny * ny));
  }

  /** Frente do focinho (onde ficam nariz e boca). */
  private muzzleTip = 0;

  private buildMuzzle(look: CreatureLook, bodyMat: THREE.Material, bellyMat: THREE.Material): void {
    const H = this.prof.head;
    const dark = toon(look.species === 'bunny' || look.species === 'mouse' ? 0xff8fb1 : 0x3b2a2a);
    const fz = this.front(0, -0.07);
    switch (this.prof.muzzle) {
      case 'round': {
        const m = ball(0.14, bellyMat, 1.25, 0.8, 0.8);
        m.position.set(0, -0.08, fz - 0.06);
        this.head.add(m);
        this.muzzleTip = fz + 0.05;
        break;
      }
      case 'pointy': {
        const m = ball(0.1, bellyMat, 0.95, 0.75, 1.7);
        m.position.set(0, -0.07, fz);
        this.head.add(m);
        this.muzzleTip = fz + 0.16;
        break;
      }
      case 'long': {
        // Focinho de lobo: cor do corpo, queixo claro embaixo
        const m = ball(0.095, bodyMat, 1, 0.8, 1.7);
        m.position.set(0, -0.05, fz);
        this.head.add(m);
        const chin = ball(0.08, bellyMat, 1, 0.5, 1.5);
        chin.position.set(0, -0.09, fz - 0.01);
        this.head.add(chin);
        this.muzzleTip = fz + 0.16;
        break;
      }
      case 'wide': {
        const m = ball(0.16, bodyMat, 1.5, 0.78, 1.15);
        m.position.set(0, -0.07, fz - 0.02);
        this.head.add(m);
        const lip = ball(0.13, bellyMat, 1.5, 0.45, 1.05);
        lip.position.set(0, -0.12, fz);
        this.head.add(lip);
        // Narinas de dragão
        for (const side of [-1, 1]) {
          const n = ball(0.018, toon(0x2b3a32));
          n.position.set(side * 0.05, -0.04, fz + 0.15);
          this.head.add(n);
        }
        this.muzzleTip = fz + 0.13;
        break;
      }
      case 'none':
        this.muzzleTip = this.front(0, -0.1);
        break;
    }
    if (this.prof.muzzle !== 'none' && this.prof.muzzle !== 'wide') {
      const nose = ball(0.035, dark);
      nose.position.set(0, this.prof.muzzle === 'round' ? -0.04 : -0.05, this.muzzleTip);
      this.head.add(nose);
    }
    void H;
  }

  private buildFace(look: CreatureLook): void {
    const E = this.prof.eye;
    const eyeMat = look.species === 'wolf' ? glow(look.eyeColor ?? 0x7fe8ff, 1.6) : toon(look.eyeColor ?? 0x2b2440);
    const white = toon(0xffffff, 0xffffff, 0.6);
    const H = this.prof.head;
    for (const side of [-1, 1]) {
      const eye = new THREE.Group();
      const x = side * E.spread * (H.sx > 1.2 ? 1.1 : 1);
      if (E.shape === 'frog') {
        // Olhos saltados no topo da cabeça
        const bump = ball(0.1, toon(look.body), 1, 1, 1);
        bump.position.set(x, H.r * H.sy * 0.75, 0.05);
        this.head.add(bump);
        eye.position.set(x, H.r * H.sy * 0.8, 0.13);
        const sclera = ball(0.075, toon(0xffffff), 1, 1, 0.6);
        eye.add(sclera);
      } else {
        eye.position.set(x, E.y, this.front(x, E.y) - 0.02);
      }
      if (E.shape === 'owl') {
        const ring = ball(0.12, toon(0xfff8ee), 1, 1, 0.3);
        ring.position.z = -0.01;
        eye.add(ring);
      }
      const r = 0.052 * E.size * (E.shape === 'owl' ? 1.45 : 1);
      const pupil = ball(r, eyeMat, E.shape === 'almond' ? 1.2 : 1, E.shape === 'almond' ? 0.85 : E.shape === 'sharp' ? 0.9 : 1.15, 0.6);
      if (E.shape === 'almond') pupil.rotation.z = side * -0.3;
      pupil.position.z = E.shape === 'frog' ? 0.04 : 0;
      eye.add(pupil);
      const shine = ball(r * 0.36, white);
      shine.position.set(r * 0.35, r * 0.45, pupil.position.z + 0.03);
      eye.add(shine);
      if (E.shape === 'big' || E.shape === 'owl') {
        const shine2 = ball(r * 0.18, white);
        shine2.position.set(-r * 0.3, -r * 0.35, 0.03);
        eye.add(shine2);
      }
      if (E.shape === 'sharp') {
        // Sobrancelha firme do herói
        const brow = ball(0.05, toon(look.accent), 1.4, 0.25, 0.4);
        brow.position.set(-side * 0.005, r * 1.5, 0.01);
        brow.rotation.z = side * 0.35;
        eye.add(brow);
      }
      if (look.species === 'panda') {
        const patch = ball(0.085, toon(look.accent), 0.9, 1.15, 0.35);
        patch.position.copy(eye.position).add(new THREE.Vector3(side * 0.005, -0.01, -0.015));
        patch.rotation.z = side * 0.5;
        this.head.add(patch);
        pupil.material = toon(0xffffff);
        pupil.scale.multiplyScalar(0.8);
        const dot = ball(0.03, toon(look.eyeColor ?? 0x1d1b22));
        dot.position.z = 0.03;
        eye.add(dot);
      }
      this.head.add(eye);
      this.eyes.push(eye);
      this.eyePos.push(eye.position.clone());

      // Olhos felizes (^^) e dormindo (—), trocados conforme o humor
      const lineMat = toon(look.species === 'wolf' ? 0x2b2440 : (look.eyeColor ?? 0x2b2440));
      const happy = new THREE.Mesh(new THREE.TorusGeometry(r * 0.9, 0.013, 6, 14, Math.PI), lineMat);
      happy.position.copy(eye.position);
      happy.position.z += 0.02;
      happy.visible = false;
      this.head.add(happy);
      this.happyEyes.push(happy);
      const sleepy = ball(r * 0.9, lineMat, 1, 0.22, 0.4);
      sleepy.position.copy(eye.position);
      sleepy.position.y -= 0.01;
      sleepy.visible = false;
      this.head.add(sleepy);
      this.sleepyEyes.push(sleepy);

      if (E.shape !== 'frog') {
        const bx = side * (E.spread + 0.08);
        const blush = ball(0.05, toon(0xff9fb5), 1.3, 0.7, 0.4);
        blush.position.set(bx, -0.07, this.front(bx, -0.07) - 0.03);
        this.head.add(blush);
      }
    }
    // Boca: sorriso e boca aberta de alegria
    const mouthY = this.prof.muzzle === 'none' ? -0.1 : -0.11;
    const mz = this.prof.muzzle === 'none' ? this.front(0, mouthY) : this.muzzleTip - 0.04;
    const wide = look.species === 'frog' ? 2.6 : 1;
    if (look.species !== 'owl') {
      const smile = new THREE.Mesh(new THREE.TorusGeometry(0.035 * wide, 0.01, 6, 12, Math.PI), toon(look.species === 'frog' ? 0x2d4a2a : 0x5a2f2f));
      smile.rotation.z = Math.PI;
      smile.position.set(0, mouthY, mz);
      this.head.add(smile);
      this.mouthSmile = smile;
      const open = ball(0.035, toon(0x8a2f3f), wide * 0.8, 0.9, 0.4);
      open.position.set(0, mouthY - 0.02, mz - 0.01);
      open.visible = false;
      this.head.add(open);
      this.mouthOpen = open;
    } else {
      const beak = mesh(cone, toon(0xffc36b));
      beak.scale.set(0.05, 0.1, 0.05);
      beak.rotation.x = Math.PI;
      beak.position.set(0, -0.07, this.front(0, -0.07) + 0.02);
      this.head.add(beak);
    }
  }

  private buildEars(look: CreatureLook, bodyMat: THREE.Material, accentMat: THREE.Material, bellyMat: THREE.Material): void {
    const H = this.prof.head;
    const top = H.r * H.sy;
    const add = (obj: THREE.Object3D) => this.head.add(obj);
    switch (look.species) {
      case 'bunny':
        // Orelhas compridas EM PÉ (a direita dobradinha na ponta): a marca da Puff
        for (const side of [-1, 1]) {
          const ear = new THREE.Group();
          ear.position.set(side * 0.1, top - 0.04, -0.02);
          ear.rotation.z = -side * 0.14;
          const outer = mesh(capsule, bodyMat);
          outer.scale.set(0.072, 0.17, 0.05);
          outer.position.y = 0.2;
          const inner = mesh(capsule, accentMat);
          inner.scale.set(0.04, 0.14, 0.03);
          inner.position.set(0, 0.2, 0.032);
          ear.add(outer, inner);
          if (side === 1) {
            const tip = new THREE.Group();
            tip.position.y = 0.33;
            tip.rotation.x = 0.9;
            const t1 = mesh(capsule, bodyMat);
            t1.scale.set(0.066, 0.06, 0.046);
            t1.position.y = 0.07;
            tip.add(t1);
            ear.add(tip);
            outer.scale.y = 0.13;
            outer.position.y = 0.17;
            inner.scale.y = 0.11;
            inner.position.y = 0.17;
          }
          add(ear);
        }
        break;
      case 'fox':
      case 'wolf':
      case 'cat': {
        const tall = look.species === 'fox' ? 0.32 : look.species === 'wolf' ? 0.3 : 0.2;
        const wide = look.species === 'fox' ? 0.13 : look.species === 'wolf' ? 0.1 : 0.11;
        for (const side of [-1, 1]) {
          const ear = new THREE.Group();
          ear.position.set(side * H.r * H.sx * 0.55, top - 0.05, -0.03);
          ear.rotation.z = -side * (look.species === 'fox' ? 0.42 : 0.22);
          const outer = mesh(cone, bodyMat);
          outer.scale.set(wide, tall, wide * 0.6);
          outer.position.y = tall * 0.45;
          const inner = mesh(cone, look.species === 'fox' ? bellyMat : look.species === 'cat' ? toon(0xffb3c8) : accentMat);
          inner.scale.set(wide * 0.55, tall * 0.7, wide * 0.3);
          inner.position.set(0, tall * 0.38, wide * 0.25);
          ear.add(outer, inner);
          if (look.species === 'fox') {
            const tipDark = mesh(cone, toon(0x3a2418));
            tipDark.scale.set(wide * 0.45, tall * 0.35, wide * 0.4);
            tipDark.position.y = tall * 0.82;
            ear.add(tipDark);
          }
          add(ear);
        }
        break;
      }
      case 'dragon':
        // Chifres curvos para trás + crista
        for (const side of [-1, 1]) {
          const horn = new THREE.Group();
          horn.position.set(side * 0.13, top - 0.04, -0.06);
          horn.rotation.set(-0.6, 0, -side * 0.3);
          const h1 = mesh(capsule, toon(0xfff0b3));
          h1.scale.set(0.045, 0.07, 0.045);
          h1.position.y = 0.06;
          const h2 = mesh(cone, toon(0xfff0b3));
          h2.scale.set(0.045, 0.12, 0.045);
          h2.position.set(0, 0.17, -0.03);
          h2.rotation.x = -0.5;
          horn.add(h1, h2);
          add(horn);
        }
        break;
      case 'owl':
        // Tufos altos que viram "orelhinhas" na silhueta
        for (const side of [-1, 1]) {
          const tuft = mesh(cone, accentMat);
          tuft.scale.set(0.075, 0.22, 0.06);
          tuft.position.set(side * H.r * H.sx * 0.72, top + 0.04, -0.02);
          tuft.rotation.z = -side * 0.45;
          add(tuft);
        }
        break;
      case 'bear':
      case 'mouse':
      case 'panda':
        for (const side of [-1, 1]) {
          const r = look.species === 'mouse' ? 0.16 : 0.1;
          const ear = ball(r, look.species === 'panda' ? accentMat : bodyMat, 1, 1, 0.5);
          ear.position.set(side * H.r * H.sx * 0.68, top * 0.75, -0.03);
          add(ear);
          const inner = ball(r * 0.6, look.species === 'mouse' ? toon(0xffb3c8) : look.species === 'panda' ? accentMat : bellyMat, 1, 1, 0.3);
          inner.position.set(side * H.r * H.sx * 0.68, top * 0.75, 0.01);
          add(inner);
        }
        break;
      case 'hedgehog':
      case 'frog':
        break;
    }
  }

  private buildTail(look: CreatureLook, bodyMat: THREE.Material, accentMat: THREE.Material, bellyMat: THREE.Material): void {
    const B = this.prof.body;
    const tail = new THREE.Group();
    tail.position.set(0, B.y - 0.1, -B.r * B.sz * 0.85);
    switch (look.species) {
      case 'fox': {
        // Caudona felpuda curvada para o lado: aparece de frente (marca da Florzinha)
        const curl = new THREE.Group();
        curl.position.set(0.12, 0.02, 0);
        curl.rotation.set(0.5, 0, -0.9);
        const fluff = ball(0.19, bodyMat, 0.95, 1.9, 0.95);
        fluff.position.y = 0.22;
        const tip = ball(0.13, bellyMat, 1, 1.25, 1);
        tip.position.y = 0.48;
        curl.add(fluff, tip);
        tail.add(curl);
        break;
      }
      case 'wolf': {
        const t = new THREE.Group();
        t.rotation.set(-0.7, 0, -0.35);
        const fluff = ball(0.12, bodyMat, 0.9, 2, 0.9);
        fluff.position.y = 0.18;
        const tip = ball(0.08, accentMat, 1, 1.2, 1);
        tip.position.y = 0.38;
        t.add(fluff, tip);
        tail.add(t);
        break;
      }
      case 'dragon': {
        // Rabo grosso que aparece do lado
        const t = new THREE.Group();
        t.rotation.set(-1.25, 0, -0.75);
        const base = mesh(cone, bodyMat);
        base.scale.set(0.14, 0.5, 0.14);
        base.position.y = 0.22;
        t.add(base);
        const fin = mesh(cone, accentMat);
        fin.scale.set(0.06, 0.12, 0.03);
        fin.position.set(0, 0.42, -0.04);
        t.add(fin);
        tail.add(t);
        break;
      }
      case 'bunny':
        tail.add(ball(0.12, toon(0xffffff)));
        break;
      case 'bear':
      case 'panda':
        tail.add(ball(0.08, bodyMat));
        break;
      case 'cat': {
        // Cauda em "?" que sobe atrás do ombro
        const t = new THREE.Group();
        t.position.x = 0.1;
        const a = mesh(capsule, bodyMat);
        a.scale.set(0.04, 0.17, 0.04);
        a.rotation.x = -0.5;
        a.position.set(0, 0.14, -0.06);
        const b = mesh(capsule, bodyMat);
        b.scale.set(0.04, 0.1, 0.04);
        b.position.set(0, 0.38, -0.08);
        const c = ball(0.05, accentMat);
        c.position.set(0, 0.47, -0.02);
        t.add(a, b, c);
        tail.add(t);
        break;
      }
      case 'mouse': {
        const c = mesh(capsule, toon(0xffb3c8));
        c.scale.set(0.02, 0.26, 0.02);
        c.rotation.set(-1.1, 0, -0.6);
        c.position.set(0.08, 0.05, -0.15);
        tail.add(c);
        break;
      }
      default:
        return;
    }
    this.body.add(tail);
    this.tail = tail;
  }

  /** Detalhes que mudam a silhueta: espinhos, listras, bigodes, estrela na testa. */
  private buildExtras(look: CreatureLook, bodyMat: THREE.Material, accentMat: THREE.Material, bellyMat: THREE.Material): void {
    const B = this.prof.body;
    const H = this.prof.head;
    switch (look.species) {
      case 'dragon': {
        // Espinhos grandes pelas costas e na cabeça
        for (let i = 0; i < 5; i++) {
          const a = -0.4 + i * 0.32;
          const at = new THREE.Vector3(0, B.y + Math.cos(a) * B.r * B.sy * 0.95, -Math.sin(a + 0.6) * B.r * B.sz * 0.95);
          const dir = new THREE.Vector3(0, Math.cos(a), -Math.sin(a + 0.6));
          this.body.add(spike(accentMat, at, dir, 0.06, 0.14 - Math.abs(i - 2) * 0.015));
        }
        for (let i = 0; i < 2; i++) {
          this.head.add(spike(accentMat, new THREE.Vector3(0, H.r * H.sy * (0.92 - i * 0.25), -H.r * (0.25 + i * 0.45)), new THREE.Vector3(0, 1 - i * 0.3, -0.5 - i * 0.4), 0.05, 0.11));
        }
        // Listras na barriga
        for (let i = 0; i < 3; i++) {
          const s = ball(B.r * 0.55, toon(0xffe08a), 1.2 - i * 0.1, 0.12, 0.5);
          s.position.set(0, B.y + 0.06 - i * 0.09, B.r * B.sz * 0.7);
          this.body.add(s);
        }
        break;
      }
      case 'hedgehog': {
        // Casaco de espinhos cobrindo costas e cabeça
        const coat = toon(look.accent);
        for (let row = 0; row < 4; row++) {
          for (let col = 0; col < 7; col++) {
            const th = -1.2 + (col / 6) * 2.4;
            const ph = 0.35 + row * 0.33;
            const dir = new THREE.Vector3(Math.sin(th) * Math.sin(ph), Math.cos(ph) * 0.9 + 0.15, -Math.cos(th) * Math.sin(ph) - 0.35);
            const at = new THREE.Vector3(dir.x * B.r * B.sx, B.y + dir.y * B.r * B.sy * 0.9, dir.z * B.r * B.sz * 0.85);
            this.body.add(spike(coat, at, dir, 0.055, 0.17));
          }
        }
        for (let i = 0; i < 7; i++) {
          const th = -1 + (i / 6) * 2;
          const dir = new THREE.Vector3(Math.sin(th) * 0.8, 0.75, -0.55);
          const at = new THREE.Vector3(dir.x * H.r, H.r * 0.55, -H.r * 0.45);
          this.head.add(spike(coat, at, dir, 0.05, 0.15));
        }
        break;
      }
      case 'cat':
        // Bigodes
        for (const side of [-1, 1]) {
          for (let i = 0; i < 2; i++) {
            const w = mesh(capsule, toon(0x5a5470));
            w.scale.set(0.006, 0.09, 0.006);
            w.rotation.z = side * (Math.PI / 2 + (i - 0.5) * 0.25);
            w.position.set(side * 0.15, -0.06 - i * 0.025, this.muzzleTip - 0.04);
            this.head.add(w);
          }
        }
        break;
      case 'owl': {
        // Disco facial claro (formato de coração)
        for (const side of [-1, 1]) {
          const disc = ball(0.15, bellyMat, 1, 1.1, 0.3);
          disc.position.set(side * 0.1, 0.0, this.front(side * 0.1, 0) - 0.04);
          this.head.add(disc);
        }
        break;
      }
      default:
        break;
    }
    void bodyMat;
  }

  private buildWings(style: WingStyle, color: number): void {
    const B = this.prof.body;
    const shape = new THREE.Shape();
    let opacity = 0.55;
    let glowAmt = 0.7;
    switch (style) {
      case 'dragonfly':
        shape.ellipse(0.22, 0.05, 0.24, 0.08, 0, Math.PI * 2, false, 0.25);
        break;
      case 'leaf':
        shape.moveTo(0, 0);
        shape.quadraticCurveTo(0.15, 0.25, 0.42, 0.12);
        shape.quadraticCurveTo(0.25, -0.05, 0, 0);
        opacity = 0.9;
        glowAmt = 0.35;
        break;
      case 'bat':
        shape.moveTo(0, 0);
        shape.lineTo(0.12, 0.22);
        shape.lineTo(0.3, 0.16);
        shape.quadraticCurveTo(0.26, 0.08, 0.3, 0.02);
        shape.quadraticCurveTo(0.2, 0.0, 0.16, -0.06);
        shape.quadraticCurveTo(0.08, 0, 0, 0);
        opacity = 0.95;
        glowAmt = 0.15;
        break;
      case 'constellation':
        shape.moveTo(0, 0);
        shape.quadraticCurveTo(0.12, 0.3, 0.4, 0.18);
        shape.quadraticCurveTo(0.3, -0.02, 0, 0);
        opacity = 0.45;
        glowAmt = 0.5;
        break;
      case 'feather':
        shape.moveTo(0, 0);
        shape.quadraticCurveTo(0.1, 0.24, 0.34, 0.1);
        shape.quadraticCurveTo(0.3, 0.02, 0.36, -0.04);
        shape.quadraticCurveTo(0.15, -0.06, 0, 0);
        opacity = 0.85;
        glowAmt = 0.4;
        break;
    }
    const geo = new THREE.ShapeGeometry(shape, 12);
    const mat = wingMaterial(color, opacity, glowAmt);
    for (const side of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.1, B.y + B.r * B.sy * 0.6, -B.r * B.sz * 0.8);
      const w = new THREE.Mesh(geo, mat);
      w.scale.set(side, 1, 1);
      w.rotation.x = -0.25;
      pivot.add(w);
      if (style === 'dragonfly') {
        const lower = new THREE.Mesh(geo, mat);
        lower.scale.set(side * 0.8, 0.8, 1);
        lower.rotation.z = side * -0.5;
        lower.position.y = -0.06;
        pivot.add(lower);
      }
      if (style === 'constellation') {
        const starMat = glow(0xffffff, 3);
        for (let i = 0; i < 4; i++) {
          const star = ball(0.012, starMat, 1, 1, 1, false);
          star.castShadow = false;
          star.position.set(side * (0.08 + i * 0.07), 0.06 + Math.sin(i * 2) * 0.04, 0.01);
          pivot.add(star);
        }
      }
      this.body.add(pivot);
      this.wings.push(pivot);
    }
  }

  /** Acessório característico de cada herói (reconhecível de longe). */
  private buildAccessory(kind: Accessory, look: CreatureLook): void {
    const H = this.prof.head;
    const B = this.prof.body;
    const k = H.r / 0.3;
    const top = H.r * H.sy;
    const g = new THREE.Group();
    switch (kind) {
      case 'bow': {
        const m = toon(0xff7fb0);
        const l = mesh(cone, m);
        l.scale.set(0.07, 0.1, 0.05);
        l.rotation.z = Math.PI / 2;
        l.position.x = -0.06;
        const r = l.clone();
        r.rotation.z = -Math.PI / 2;
        r.position.x = 0.06;
        g.add(l, r, ball(0.03, m));
        g.position.set(-0.1, top - 0.02, 0.06);
        g.rotation.z = 0.3;
        break;
      }
      case 'leafCrown': {
        const colors = [0xffb347, 0x8fd16a, 0xd9531e];
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const leaf = ball(0.06, toon(colors[i % 3]!), 0.5, 0.25, 1);
          leaf.position.set(Math.cos(a) * 0.19, 0, Math.sin(a) * 0.19);
          leaf.rotation.y = -a;
          leaf.rotation.z = 0.5;
          g.add(leaf);
        }
        g.position.y = top - 0.06;
        break;
      }
      case 'chefHat': {
        const white = toon(0xffffff);
        const band = mesh(new THREE.CylinderGeometry(1, 1, 1, 20), white);
        band.scale.set(0.15, 0.1, 0.15);
        g.add(band);
        for (const [x, z] of [
          [0, 0],
          [-0.08, 0.03],
          [0.08, 0.03],
          [0, -0.07],
        ] as const) {
          const puff = ball(0.1, white);
          puff.position.set(x, 0.12, z);
          g.add(puff);
        }
        g.position.set(0, top + 0.02, -0.01);
        g.rotation.z = 0.12;
        break;
      }
      case 'starScarf': {
        const neck = B.y + B.r * B.sy * 0.78;
        const scarf = mesh(new THREE.TorusGeometry(B.r * B.sx * 0.72, 0.045, 8, 24), toon(0x2f3d73));
        scarf.rotation.x = Math.PI / 2;
        g.add(scarf);
        const tail = ball(0.05, toon(0x2f3d73), 0.8, 1.6, 0.5);
        tail.position.set(0.12, -0.08, B.r * B.sz * 0.6);
        g.add(tail);
        g.position.y = neck;
        this.body.add(g);
        // Estrela na testa (marca do Astro)
        const star = mesh(new THREE.OctahedronGeometry(0.045), glow(0xfff27a, 2));
        star.position.set(0, 0.17, this.front(0, 0.17) + 0.01);
        this.head.add(star);
        return;
      }
      case 'glasses': {
        const gold = toon(0xd9a440);
        for (const p of this.eyePos) {
          const ring = mesh(new THREE.TorusGeometry(0.085, 0.013, 6, 18), gold);
          ring.position.copy(p).add(new THREE.Vector3(0, 0, 0.03));
          this.head.add(ring);
        }
        const a = this.eyePos[0]!;
        const bridge = ball(0.03, gold, 1, 0.3, 0.3);
        bridge.position.set(0, a.y + 0.03, a.z + 0.03);
        this.head.add(bridge);
        return;
      }
      case 'bambooLeaf': {
        const leaf = ball(0.09, toon(0x8fd16a), 0.45, 0.18, 1.3);
        leaf.position.set(0.05, top, 0);
        leaf.rotation.set(0.3, 0.4, 0.5);
        const stem = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.12, 6), toon(0x6ab04c));
        stem.position.set(0, top - 0.02, 0);
        g.add(leaf, stem);
        break;
      }
      case 'flower': {
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          const petal = ball(0.05, toon(0xff9fc8), 1, 0.5, 1);
          petal.position.set(Math.cos(a) * 0.055, 0, Math.sin(a) * 0.055);
          g.add(petal);
        }
        g.add(ball(0.035, toon(0xffd23f)));
        g.position.set(0.04, top + 0.08, 0.02);
        g.rotation.x = 0.5;
        break;
      }
      case 'crown': {
        const gold = toon(0xffc83d, 0xffa000, 0.3);
        const ring = mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.07, 16, 1, true), gold);
        g.add(ring);
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          const tip = mesh(cone, gold);
          tip.scale.set(0.025, 0.07, 0.025);
          tip.position.set(Math.cos(a) * 0.11, 0.07, Math.sin(a) * 0.11);
          g.add(tip);
        }
        const gem = ball(0.022, glow(0xff7fb0, 1.5));
        gem.position.set(0, 0, 0.12);
        g.add(gem);
        g.position.set(0, top + (look.species === 'frog' ? 0.06 : 0), -0.04);
        break;
      }
      case 'moonClip': {
        const moon = mesh(new THREE.TorusGeometry(0.06, 0.022, 8, 16, Math.PI * 1.3), glow(0xd9c8ff, 1.6));
        moon.rotation.z = 0.8;
        g.add(moon);
        g.position.set(0.17, top - 0.06, 0.08);
        break;
      }
    }
    g.scale.setScalar(k);
    this.head.add(g);
  }

  /** Pulinho de alegria + giro. */
  celebrate(): void {
    this.celebrateLeft = 0.8;
  }

  /** Pulinho curto (pegar/soltar). */
  hop(): void {
    this.hopLeft = 0.18;
  }

  update(dt: number): void {
    this.t += dt;
    const t = this.t;

    // Piscar
    this.blinkIn -= dt;
    if (this.blinkIn <= 0) {
      this.blinkLeft = 0.12;
      this.blinkIn = 2 + Math.random() * 3.5;
    }
    this.blinkLeft = Math.max(0, this.blinkLeft - dt);
    const eyeY = this.blinkLeft > 0 ? 0.12 : 1;
    const mood: Mood = this.celebrateLeft > 0 ? 'happy' : this.mood;
    this.eyes.forEach((e) => {
      e.scale.y = eyeY;
      e.visible = mood === 'normal';
    });
    this.happyEyes.forEach((e) => (e.visible = mood === 'happy'));
    this.sleepyEyes.forEach((e) => (e.visible = mood === 'sleepy'));
    if (this.mouthOpen && this.mouthSmile) {
      this.mouthOpen.visible = mood === 'happy';
      this.mouthSmile.visible = mood !== 'happy';
    }

    // Manias de cada herói quando está parado (pulinho ou inclinar a cabeça)
    if (this.moving < 0.1 && !this.sitting && !this.working) {
      this.fidgetIn -= dt;
      if (this.fidgetIn <= 0) {
        this.fidgetIn = 3 + Math.random() * 5;
        if (this.style.bounce > 1.2) this.hopLeft = 0.18;
        else this.fidgetLeft = 0.9;
      }
    }
    this.fidgetLeft = Math.max(0, this.fidgetLeft - dt);

    // Andar: saltitar e inclinar
    const walkPhase = t * 13;
    const bounce = this.moving * Math.abs(Math.sin(walkPhase)) * 0.09 * this.style.bounce;
    const breathe = Math.sin(t * 2.4) * 0.012;
    const hover = this.sitting ? 0 : Math.sin(t * 3) * this.hoverAmp;
    let y = bounce + hover;
    let spin = 0;
    if (this.celebrateLeft > 0) {
      this.celebrateLeft -= dt;
      const k = 1 - this.celebrateLeft / 0.8;
      y += Math.sin(k * Math.PI) * 0.45;
      spin = k * Math.PI * 2;
    }
    if (this.hopLeft > 0) {
      this.hopLeft -= dt;
      y += Math.sin((1 - this.hopLeft / 0.18) * Math.PI) * 0.08;
    }
    this.rig.position.y = y + (this.sitting ? 0.32 : 0);
    this.rig.rotation.y = spin;
    this.body.rotation.x = this.moving * 0.14;
    this.body.scale.set(1 - breathe, 1 + breathe - bounce * 0.4, 1 - breathe);
    this.feet.forEach((f, i) => {
      f.position.z = 0.08 + (this.sitting ? 0.18 : Math.sin(walkPhase + i * Math.PI) * 0.1 * this.moving);
      f.position.y = this.sitting ? 0.3 : 0.06;
    });

    // Patas
    const front = this.pawZ + 0.2;
    this.paws.forEach((p, i) => {
      const side = i === 0 ? -1 : 1;
      if (this.working) {
        p.position.set(side * 0.2, this.pawY + 0.1 + Math.abs(Math.sin(t * 16 + i)) * 0.12, front);
      } else if (this.holding) {
        p.position.set(side * 0.2, this.pawY + 0.1, front);
      } else if (this.eating) {
        p.position.set(side * 0.16, this.pawY + 0.14 + Math.max(0, Math.sin(t * 6 + i * Math.PI)) * 0.14, front - 0.04);
      } else {
        p.position.set(side * this.pawX, this.pawY + Math.sin(walkPhase + i * Math.PI) * 0.04 * this.moving, this.pawZ);
      }
    });

    // Cabeça: balança levemente; ao comer, "nham nham"
    this.head.rotation.z = Math.sin(t * 1.7) * 0.05 * this.style.wiggle + Math.sin((this.fidgetLeft / 0.9) * Math.PI) * 0.35;
    this.head.rotation.x = this.eating ? Math.sin(t * 12) * 0.08 : 0;

    // Asas e cauda
    const flap = this.moving > 0.1 || this.celebrateLeft > 0 ? this.flapSpeed * 1.6 : this.flapSpeed * 0.5;
    this.wings.forEach((w, i) => {
      const side = i === 0 ? -1 : 1;
      w.rotation.y = side * (0.35 + Math.sin(t * flap) * 0.45);
    });
    if (this.tail) {
      const wag = this.celebrateLeft > 0 ? 0.9 : 0.25;
      this.tail.rotation.y = Math.sin(t * (this.celebrateLeft > 0 ? 22 : 4)) * wag;
    }
  }
}
