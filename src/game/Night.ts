import * as THREE from 'three';
import { audio } from '../core/audio';
import { writeSave } from '../core/storage';
import { HEROES, type HeroDef } from '../data/characters';
import { DECOR_SLOTS, furnitureDef, type FurnitureId } from '../data/furniture';
import { Creature } from '../models/creature';
import { decorMesh } from '../models/decor';
import { glow, mesh, toon } from '../render/materials';
import type { Stage } from '../render/stage';
import { buyFurniture, buyWall, placeFurniture, removeFurniture, type SaveData } from '../sim/progress';
import type { Hud } from '../ui/hud';
import { NightPanel } from '../ui/night';
import type { WorldLabel, WorldUI } from '../ui/worldui';
import type { Fx } from './fx';
import type { World } from './world';

export interface NightContext {
  stage: Stage;
  hud: Hud;
  worldUI: WorldUI;
  fx: Fx;
  container: HTMLElement;
  getWorld(): World;
  /** Recria o salão com o save novo (depois de comprar/posicionar). */
  rebuildWorld(save: SaveData): void;
}

/**
 * Turno aconchegante: sem relógio, música calma, equipe descansando
 * e loja noturna para comprar e posicionar móveis.
 */
export class NightRun {
  private panel: NightPanel;
  private resting: { creature: Creature; zzz: WorldLabel; phase: number }[] = [];
  private campfire: THREE.Group;
  private placing: FurnitureId | null = null;
  private preview: THREE.Group | null = null;
  private t = 0;
  private raycaster = new THREE.Raycaster();
  private onPointer = (e: PointerEvent) => this.pointer(e);

  constructor(
    private ctx: NightContext,
    public save: SaveData,
    private onMorning: (save: SaveData) => void,
  ) {
    this.panel = new NightPanel(ctx.container, {
      buy: (id) => this.buy(id),
      buyWall: (id) => {
        const r = buyWall(this.save, id);
        if (typeof r === 'string') return audio.deny();
        audio.buy();
        this.commit(r);
      },
      useWall: (id) => {
        audio.place();
        this.commit({ ...this.save, wall: id });
      },
      choose: (id) => this.startPlacing(id),
      preview: (slot) => this.showPreview(slot),
      placeAt: (slot) => this.placeAt(slot),
      cancelPlace: () => this.stopPlacing(),
      store: (slot) => {
        audio.drop();
        this.commit(removeFurniture(this.save, slot));
      },
      morning: () => {
        audio.click();
        this.onMorning(this.save);
      },
    });
    this.panel.render(save);
    ctx.stage.setInsetRight(this.panel.width);
    ctx.stage.renderer.domElement.addEventListener('pointerdown', this.onPointer);

    // Cantinho do descanso na cozinha: todos os heróis liberados dormindo em volta de uma lanterna
    this.campfire = new THREE.Group();
    this.campfire.position.set(4.5, 0, 6.5);
    const rug = mesh(new THREE.CircleGeometry(1.7, 32), toon(0xb8a2e8), false);
    rug.rotation.x = -Math.PI / 2;
    rug.position.y = 0.01;
    rug.receiveShadow = true;
    this.campfire.add(rug);
    const lamp = mesh(new THREE.SphereGeometry(0.18, 16, 12), glow(0xffc46b, 1.8));
    lamp.position.y = 0.3;
    this.campfire.add(lamp, mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.12, 16), toon(0x8a5a3a)));
    const light = new THREE.PointLight(0xffb86b, 4, 6, 1.5);
    light.position.y = 0.6;
    this.campfire.add(light);
    ctx.stage.scene.add(this.campfire);

    const team = HEROES.filter((h: HeroDef) => !h.family || save.families.includes(h.family));
    team.forEach((hero, i) => {
      const creature = new Creature(hero, 1.1);
      const a = (i / team.length) * Math.PI * 2 + 0.3;
      creature.root.position.set(4.5 + Math.cos(a) * 1.15, 0, 6.5 + Math.sin(a) * 1.15);
      creature.root.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a));
      creature.sitting = true;
      ctx.stage.scene.add(creature.root);
      const zzz = ctx.worldUI.add('zzz', creature.head, 0.45);
      zzz.html = '💤';
      this.resting.push({ creature, zzz, phase: Math.random() * 6 });
    });
    audio.yawn();
  }

  private buy(id: FurnitureId): void {
    const r = buyFurniture(this.save, id);
    if (typeof r === 'string') {
      audio.deny();
      this.ctx.hud.toast(r === 'noMoney' ? '🪙 Moedas insuficientes — sirva mais clientes amanhã!' : '🔒 Ainda bloqueado', 'bad');
      return;
    }
    audio.buy();
    this.ctx.hud.toast(`🛍️ ${furnitureDef(id).name} comprado! Agora escolha um lugar.`, 'good');
    this.commit(r);
    this.startPlacing(id);
  }

  private startPlacing(id: FurnitureId): void {
    this.placing = id;
    this.panel.setPlacing(id);
    this.ctx.getWorld().showSlots(furnitureDef(id).kind, null);
    this.panel.render(this.save);
  }

  private stopPlacing(): void {
    this.placing = null;
    this.panel.setPlacing(null);
    this.ctx.getWorld().showSlots(null, null);
    this.clearPreview();
    this.panel.render(this.save);
  }

  private placeAt(slotId: string): void {
    if (!this.placing) return;
    const next = placeFurniture(this.save, slotId, this.placing);
    if (!next) return audio.deny();
    audio.place();
    const slot = DECOR_SLOTS.find((s) => s.id === slotId)!;
    this.placing = null;
    this.panel.setPlacing(null);
    this.clearPreview();
    this.commit(next);
    const y = slot.kind === 'light' ? 2.3 : slot.kind === 'wall' ? 1.6 : 0.8;
    this.ctx.fx.burst(new THREE.Vector3(slot.x, y, slot.z), { kind: 'sparkle', count: 30, speed: 2.5, up: 2.5, colors: [0xfff27a, 0xffffff, 0xb58cff, 0x7fd8ff] });
    this.resting[Math.floor(Math.random() * this.resting.length)]?.creature.celebrate();
  }

  private showPreview(slotId: string | null): void {
    if (!this.placing) return;
    this.ctx.getWorld().showSlots(furnitureDef(this.placing).kind, slotId);
    this.clearPreview();
    const slot = DECOR_SLOTS.find((s) => s.id === slotId);
    if (!slot) return;
    const piece = decorMesh(this.placing, slot.kind, slot.id);
    // Fantasminha translúcido (materiais clonados para não afetar os originais)
    piece.group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        const mat = (m.material as THREE.Material).clone();
        mat.transparent = true;
        mat.opacity = 0.55;
        mat.depthWrite = false;
        m.material = mat;
        m.castShadow = false;
      }
    });
    piece.light?.removeFromParent();
    piece.group.position.set(slot.x, slot.kind === 'light' ? 2.45 : slot.kind === 'wall' ? 1.55 : 0.02, slot.z + (slot.kind === 'wall' ? 0.06 : 0));
    this.preview = piece.group;
    this.ctx.stage.scene.add(piece.group);
  }

  private clearPreview(): void {
    if (!this.preview) return;
    this.ctx.stage.scene.remove(this.preview);
    this.preview.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) (m.material as THREE.Material).dispose();
    });
    this.preview = null;
  }

  /** Clique no círculo brilhante do salão também escolhe o lugar. */
  private pointer(e: PointerEvent): void {
    if (!this.placing) return;
    const el = this.ctx.stage.renderer.domElement;
    const r = el.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.ctx.stage.camera);
    const markers = this.ctx.getWorld().slotMarkers;
    const hit = this.raycaster.intersectObjects(markers.map((m) => m.mesh))[0];
    if (hit) this.placeAt(hit.object.userData.slotId as string);
  }

  private commit(save: SaveData): void {
    this.save = save;
    writeSave(save);
    this.ctx.rebuildWorld(save);
    if (this.placing) this.ctx.getWorld().showSlots(furnitureDef(this.placing).kind, null);
    this.panel.render(save);
  }

  update(dt: number): void {
    this.t += dt;
    for (const r of this.resting) {
      r.creature.update(dt);
      r.creature.root.position.y = 0;
      const k = (this.t * 0.6 + r.phase) % 3;
      r.zzz.el.style.opacity = String(0.4 + Math.abs(Math.sin(this.t * 1.2 + r.phase)) * 0.6);
      if (k < dt * 0.6) this.ctx.fx.burst(r.creature.root.position.clone().setY(1.3), { kind: 'dot', count: 1, colors: [0xd9c8ff], speed: 0.1, up: 0.5, gravity: -0.2, size: 0.12, life: 1.5 });
    }
    this.preview?.rotation.set(0, Math.sin(this.t * 2) * 0.05, 0);
  }

  dispose(): void {
    this.panel.destroy();
    this.clearPreview();
    this.ctx.getWorld().showSlots(null, null);
    this.ctx.stage.setInsetRight(0);
    this.ctx.stage.renderer.domElement.removeEventListener('pointerdown', this.onPointer);
    this.ctx.stage.scene.remove(this.campfire);
    for (const r of this.resting) {
      this.ctx.stage.scene.remove(r.creature.root);
      this.ctx.worldUI.remove(r.zzz);
    }
  }
}
