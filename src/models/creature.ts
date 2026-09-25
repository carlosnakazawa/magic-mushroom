import * as THREE from 'three';
import type { Species, WingStyle } from '../data/characters';
import { glow, mesh, toon, wingMaterial } from '../render/materials';

export interface CreatureLook {
  species: Species;
  body: number;
  belly: number;
  accent: number;
  wing?: WingStyle;
  wingColor?: number;
  eyeColor?: number;
}

const sphere = new THREE.SphereGeometry(1, 24, 18);
const lowSphere = new THREE.SphereGeometry(1, 12, 10);
const cone = new THREE.ConeGeometry(1, 1, 16);
const capsule = new THREE.CapsuleGeometry(1, 1, 6, 12);

function ball(r: number, mat: THREE.Material, sx = 1, sy = 1, sz = 1, detail = true): THREE.Mesh {
  const m = mesh(detail ? sphere : lowSphere, mat);
  m.scale.set(r * sx, r * sy, r * sz);
  return m;
}

/**
 * Esqueleto simples de uma criatura fofa. Tudo é gerado por código (primitivas),
 * então novas espécies = novas funções de orelha/cauda/rosto.
 */
export class Creature {
  readonly root = new THREE.Group();
  /** Parte que pula/inclina (tudo menos a sombra). */
  readonly rig = new THREE.Group();
  readonly body = new THREE.Group();
  readonly head = new THREE.Group();
  readonly holdAnchor = new THREE.Object3D();
  private wings: THREE.Object3D[] = [];
  private tail: THREE.Object3D | null = null;
  private eyes: THREE.Object3D[] = [];
  private paws: THREE.Mesh[] = [];
  private feet: THREE.Mesh[] = [];
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

  constructor(readonly look: CreatureLook, scale = 1) {
    const bodyMat = toon(look.body);
    const bellyMat = toon(look.belly);
    const accentMat = toon(look.accent);

    this.root.add(this.rig);
    this.rig.add(this.body);

    // Corpo gordinho
    const torso = ball(0.3, bodyMat, 1, 1.02, 0.95);
    torso.position.y = 0.36;
    this.body.add(torso);
    const belly = ball(0.22, bellyMat, 1, 1.05, 0.6);
    belly.position.set(0, 0.34, 0.14);
    this.body.add(belly);

    // Patinhas (mãos) e pés
    for (const side of [-1, 1]) {
      const paw = ball(0.085, bodyMat);
      paw.position.set(side * 0.27, 0.36, 0.1);
      this.body.add(paw);
      this.paws.push(paw);
      const foot = ball(0.1, look.species === 'frog' ? accentMat : bodyMat, 1.1, 0.6, 1.4);
      foot.position.set(side * 0.13, 0.06, 0.08);
      this.rig.add(foot);
      this.feet.push(foot);
    }

    // Cabeça grande (chibi)
    this.head.position.y = 0.78;
    this.body.add(this.head);
    const skull = ball(0.3, bodyMat, 1.05, 0.95, 1);
    this.head.add(skull);
    const muzzle = ball(0.14, bellyMat, 1.25, 0.8, 0.8);
    muzzle.position.set(0, -0.08, 0.22);
    this.head.add(muzzle);

    this.buildFace(look);
    this.buildEars(look, bodyMat, accentMat, bellyMat);
    this.buildTail(look, bodyMat, accentMat, bellyMat);
    if (look.wing) this.buildWings(look.wing, look.wingColor ?? 0xffffff);

    // Ponto onde itens seguros aparecem
    this.holdAnchor.position.set(0, 0.55, 0.42);
    this.body.add(this.holdAnchor);

    // Sombra de contato suave (barata e bonita)
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.34, 24),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18, depthWrite: false }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    this.root.add(shadow);

    this.root.scale.setScalar(scale);
    this.flapSpeed = look.wing === 'bat' ? 14 : look.wing === 'feather' ? 7 : 11;
    this.hoverAmp = look.wing ? 0.035 : 0;
  }

  private buildFace(look: CreatureLook): void {
    const eyeMat = look.species === 'wolf' ? glow(look.eyeColor ?? 0x7fe8ff, 1.6) : toon(look.eyeColor ?? 0x2b2440);
    const white = toon(0xffffff, 0xffffff, 0.6);
    const big = look.species === 'owl' ? 1.45 : 1;
    for (const side of [-1, 1]) {
      const eye = new THREE.Group();
      eye.position.set(side * 0.11 * (look.species === 'owl' ? 1.15 : 1), 0.03, 0.27);
      if (look.species === 'owl') {
        const ring = ball(0.1, toon(0xffffff), 1, 1, 0.3);
        ring.position.z = -0.01;
        eye.add(ring);
      }
      const pupil = ball(0.052 * big, eyeMat, 1, 1.15, 0.6);
      eye.add(pupil);
      const shine = ball(0.018 * big, white);
      shine.position.set(0.018, 0.025, 0.03);
      eye.add(shine);
      if (look.species === 'frog') eye.position.set(side * 0.13, 0.22, 0.14);
      this.head.add(eye);
      this.eyes.push(eye);

      const blush = ball(0.05, toon(0xff9fb5), 1.3, 0.7, 0.4);
      blush.position.set(side * 0.19, -0.07, 0.23);
      this.head.add(blush);
    }
    if (look.species === 'owl') {
      const beak = mesh(cone, toon(0xffc36b));
      beak.scale.set(0.045, 0.09, 0.045);
      beak.rotation.x = Math.PI;
      beak.position.set(0, -0.06, 0.31);
      this.head.add(beak);
    } else if (look.species !== 'frog') {
      const nose = ball(0.035, toon(look.species === 'bunny' || look.species === 'mouse' ? 0xff8fb1 : 0x3b2a2a));
      nose.position.set(0, -0.04, 0.34);
      this.head.add(nose);
    }
    if (look.species === 'frog') {
      const smile = new THREE.Mesh(
        new THREE.TorusGeometry(0.09, 0.012, 6, 16, Math.PI),
        toon(0x2d4a2a),
      );
      smile.rotation.z = Math.PI;
      smile.position.set(0, -0.06, 0.27);
      this.head.add(smile);
    }
  }

  private buildEars(look: CreatureLook, bodyMat: THREE.Material, accentMat: THREE.Material, bellyMat: THREE.Material): void {
    const add = (obj: THREE.Object3D) => this.head.add(obj);
    switch (look.species) {
      case 'bunny':
        for (const side of [-1, 1]) {
          // Orelhas longas caídas
          const ear = new THREE.Group();
          ear.position.set(side * 0.16, 0.2, -0.02);
          ear.rotation.z = side * 1.9;
          ear.rotation.x = 0.2;
          const outer = mesh(capsule, bodyMat);
          outer.scale.set(0.075, 0.2, 0.05);
          outer.position.y = 0.2;
          const inner = mesh(capsule, accentMat);
          inner.scale.set(0.04, 0.16, 0.03);
          inner.position.set(0, 0.2, 0.03);
          ear.add(outer, inner);
          add(ear);
        }
        break;
      case 'fox':
      case 'wolf':
      case 'cat':
        for (const side of [-1, 1]) {
          const ear = mesh(cone, bodyMat);
          const tall = look.species === 'cat' ? 0.16 : look.species === 'fox' ? 0.24 : 0.22;
          ear.scale.set(0.1, tall, 0.07);
          ear.position.set(side * 0.17, 0.26, -0.02);
          ear.rotation.z = -side * 0.35;
          add(ear);
          const tip = mesh(cone, look.species === 'fox' ? toon(0x3a2418) : accentMat);
          tip.scale.set(0.05, tall * 0.45, 0.04);
          tip.position.set(side * 0.19, 0.33 + tall * 0.1, 0.0);
          tip.rotation.z = -side * 0.35;
          add(tip);
        }
        break;
      case 'dragon':
        for (const side of [-1, 1]) {
          const horn = mesh(capsule, toon(0xfff0b3));
          horn.scale.set(0.045, 0.06, 0.045);
          horn.position.set(side * 0.13, 0.27, -0.03);
          horn.rotation.z = -side * 0.4;
          add(horn);
        }
        for (let i = 0; i < 3; i++) {
          const spike = mesh(cone, accentMat);
          spike.scale.set(0.05, 0.09, 0.05);
          spike.position.set(0, 0.52 - i * 0.14, -0.28 + i * 0.02);
          spike.rotation.x = -0.5;
          this.body.add(spike);
        }
        break;
      case 'owl':
        for (const side of [-1, 1]) {
          const tuft = mesh(cone, accentMat);
          tuft.scale.set(0.06, 0.13, 0.05);
          tuft.position.set(side * 0.2, 0.26, 0);
          tuft.rotation.z = -side * 0.6;
          add(tuft);
        }
        break;
      case 'bear':
      case 'mouse':
        for (const side of [-1, 1]) {
          const r = look.species === 'mouse' ? 0.14 : 0.1;
          const ear = ball(r, bodyMat, 1, 1, 0.5);
          ear.position.set(side * 0.2, 0.22, -0.03);
          add(ear);
          const inner = ball(r * 0.6, look.species === 'mouse' ? accentMat : bellyMat, 1, 1, 0.3);
          inner.position.set(side * 0.2, 0.22, 0.01);
          add(inner);
        }
        break;
      case 'hedgehog':
        for (let i = 0; i < 9; i++) {
          const a = (i / 8) * Math.PI - Math.PI / 2;
          const spike = mesh(cone, accentMat);
          spike.scale.set(0.06, 0.16, 0.06);
          spike.position.set(Math.sin(a) * 0.2, 0.12 + Math.cos(a) * 0.12, -0.2);
          spike.rotation.set(-1.2, 0, -Math.sin(a) * 0.8);
          add(spike);
        }
        break;
      case 'frog':
        break;
    }
  }

  private buildTail(look: CreatureLook, bodyMat: THREE.Material, accentMat: THREE.Material, bellyMat: THREE.Material): void {
    const tail = new THREE.Group();
    tail.position.set(0, 0.25, -0.26);
    switch (look.species) {
      case 'fox': {
        const fluff = ball(0.16, bodyMat, 0.9, 0.9, 1.9);
        fluff.position.set(0, 0.12, -0.2);
        fluff.rotation.x = 0.7;
        const tip = ball(0.1, bellyMat, 1, 1, 1.2);
        tip.position.set(0, 0.3, -0.36);
        tail.add(fluff, tip);
        break;
      }
      case 'wolf': {
        const fluff = ball(0.12, bodyMat, 0.9, 0.9, 1.9);
        fluff.position.set(0, 0.1, -0.16);
        fluff.rotation.x = 0.8;
        const tip = ball(0.07, accentMat);
        tip.position.set(0, 0.24, -0.27);
        tail.add(fluff, tip);
        break;
      }
      case 'dragon': {
        const c = mesh(cone, bodyMat);
        c.scale.set(0.1, 0.35, 0.1);
        c.rotation.x = -1.9;
        c.position.set(0, -0.08, -0.12);
        tail.add(c);
        break;
      }
      case 'bunny':
      case 'bear':
        tail.add(ball(0.08, look.species === 'bunny' ? toon(0xffffff) : bodyMat));
        break;
      case 'cat':
      case 'mouse': {
        const c = mesh(capsule, look.species === 'mouse' ? accentMat : bodyMat);
        c.scale.set(0.03, 0.2, 0.03);
        c.rotation.x = -0.9;
        c.position.set(0, 0.1, -0.15);
        tail.add(c);
        break;
      }
      default:
        return;
    }
    this.body.add(tail);
    this.tail = tail;
  }

  private buildWings(style: WingStyle, color: number): void {
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
      pivot.position.set(side * 0.1, 0.56, -0.24);
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
        // Estrelinhas cintilando na asa
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
    this.eyes.forEach((e) => (e.scale.y = eyeY));

    // Andar: saltitar e inclinar
    const walkPhase = t * 13;
    const bounce = this.moving * Math.abs(Math.sin(walkPhase)) * 0.09;
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
    this.paws.forEach((p, i) => {
      const side = i === 0 ? -1 : 1;
      if (this.working) {
        p.position.set(side * 0.2, 0.46 + Math.abs(Math.sin(t * 16 + i)) * 0.12, 0.3);
      } else if (this.holding) {
        p.position.set(side * 0.2, 0.46, 0.3);
      } else if (this.eating) {
        p.position.set(side * 0.16, 0.5 + Math.max(0, Math.sin(t * 6 + i * Math.PI)) * 0.14, 0.26);
      } else {
        p.position.set(side * 0.27, 0.36 + Math.sin(walkPhase + i * Math.PI) * 0.04 * this.moving, 0.1);
      }
    });

    // Cabeça: balança levemente; ao comer, "nham nham"
    this.head.rotation.z = Math.sin(t * 1.7) * 0.05;
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
