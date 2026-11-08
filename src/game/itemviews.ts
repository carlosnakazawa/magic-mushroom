import * as THREE from 'three';
import { itemMesh } from '../models/food';
import type { Item } from '../sim/items';

interface View {
  item: Item;
  obj: THREE.Group;
  version: number;
  /** Tamanho final (o "pop" cresce até ele). */
  size: number;
}

/**
 * Liga cada item lógico (sim/items) ao seu visual 3D. O item muda de "pai"
 * (mão do herói, balcão, mesa) com `attach`; o visual é refeito quando `item.version` muda.
 */
export class ItemViews {
  private views = new Map<number, View>();

  attach(item: Item, parent: THREE.Object3D, y = 0, size = 1): THREE.Group {
    let v = this.views.get(item.id);
    if (!v) {
      v = { item, obj: new THREE.Group(), version: -1, size };
      this.views.set(item.id, v);
    }
    this.rebuild(v);
    parent.add(v.obj);
    v.obj.position.set(0, y, 0);
    v.obj.rotation.set(0, 0, 0);
    v.size = size;
    v.obj.scale.setScalar(size);
    return v.obj;
  }

  get(item: Item): THREE.Group | null {
    return this.views.get(item.id)?.obj ?? null;
  }

  remove(item: Item): void {
    const v = this.views.get(item.id);
    if (!v) return;
    v.obj.removeFromParent();
    this.views.delete(item.id);
  }

  private rebuild(v: View): void {
    if (v.version === v.item.version) return;
    v.obj.clear();
    v.obj.add(itemMesh(v.item));
    v.version = v.item.version;
  }

  update(dt: number): void {
    for (const [id, v] of this.views) {
      // Item descartado (lixeira, pia...) ficou sem pai: libera o visual.
      if (!v.obj.parent) {
        this.views.delete(id);
        continue;
      }
      this.rebuild(v);
      // Pequeno "pop" quando o item acabou de ser colocado
      if (v.obj.scale.x < v.size) v.obj.scale.setScalar(Math.min(v.size, v.obj.scale.x + dt * 6 * v.size));
    }
  }

  /** Faz o item "pular" de tamanho (feedback ao colocar). */
  pop(item: Item): void {
    const v = this.views.get(item.id);
    v?.obj.scale.setScalar(0.6 * v.size);
  }

  clear(): void {
    for (const v of this.views.values()) v.obj.removeFromParent();
    this.views.clear();
  }
}
