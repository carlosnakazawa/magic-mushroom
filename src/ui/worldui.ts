import * as THREE from 'three';
import type { Stage } from '../render/stage';

type Anchor = THREE.Object3D | THREE.Vector3;

/** Elemento HTML que acompanha um ponto do mundo 3D (balões, barras, dicas). */
export class WorldLabel {
  readonly el: HTMLDivElement;
  visible = true;

  constructor(
    className: string,
    public anchor: Anchor,
    public offsetY = 0,
  ) {
    this.el = document.createElement('div');
    this.el.className = `wl ${className}`;
  }

  set html(v: string) {
    if (this.el.innerHTML !== v) this.el.innerHTML = v;
  }
}

const tmp = new THREE.Vector3();
const screen = { x: 0, y: 0, visible: true };

/** Camada de rótulos HTML sobre o canvas. HTML dá texto nítido e emoji coloridos. */
export class WorldUI {
  private labels = new Set<WorldLabel>();

  constructor(private layer: HTMLElement) {}

  add(className: string, anchor: Anchor, offsetY = 0): WorldLabel {
    const l = new WorldLabel(className, anchor, offsetY);
    this.layer.appendChild(l.el);
    this.labels.add(l);
    return l;
  }

  remove(l: WorldLabel | null | undefined): void {
    if (!l) return;
    l.el.remove();
    this.labels.delete(l);
  }

  /** Mostra um texto que sobe e some (ex: "+12 🪙"). */
  popup(text: string, at: THREE.Vector3, className = 'pop'): void {
    const l = this.add(className, at.clone(), 0);
    l.html = text;
    window.setTimeout(() => this.remove(l), 1200);
  }

  clear(): void {
    this.labels.forEach((l) => l.el.remove());
    this.labels.clear();
  }

  update(stage: Stage): void {
    for (const l of this.labels) {
      if (!l.visible) {
        l.el.style.display = 'none';
        continue;
      }
      if (l.anchor instanceof THREE.Object3D) l.anchor.getWorldPosition(tmp);
      else tmp.copy(l.anchor);
      tmp.y += l.offsetY;
      stage.toScreen(tmp, screen);
      l.el.style.display = screen.visible ? '' : 'none';
      l.el.style.transform = `translate(${screen.x.toFixed(1)}px, ${screen.y.toFixed(1)}px) translate(-50%, -100%)`;
    }
  }
}
