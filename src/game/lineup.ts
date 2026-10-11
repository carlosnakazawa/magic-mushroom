import * as THREE from 'three';
import { HEROES } from '../data/characters';
import { Creature } from '../models/creature';
import type { Stage } from '../render/stage';
import type { WorldUI } from '../ui/worldui';

/**
 * Ferramenta de design de personagens (`?lineup` na URL): todos os heróis lado a lado,
 * de frente e em 3/4. Com `?lineup=sombra`, tudo vira silhueta preta — o "teste da sombra":
 * se dá para reconhecer cada herói só pelo formato, o design está bom.
 */
export class Lineup {
  private creatures: Creature[] = [];

  constructor(
    stage: Stage,
    worldUI: WorldUI,
    silhouette: boolean,
  ) {
    const n = HEROES.length;
    const spacing = 1.25;
    HEROES.forEach((hero, i) => {
      for (const row of [0, 1]) {
        const c = new Creature(hero, 1.2);
        c.root.position.set((i - (n - 1) / 2) * spacing, 0, row * 1.9);
        c.root.rotation.y = row === 0 ? -0.6 : 0;
        stage.scene.add(c.root);
        this.creatures.push(c);
        if (row === 1) {
          const label = worldUI.add('lineup-name', new THREE.Vector3(c.root.position.x, -0.05, c.root.position.z + 0.55));
          label.html = hero.name;
        }
      }
    });
    stage.frame(0, 0.6, n * spacing + 0.8, 3.2);
    if (silhouette) {
      stage.scene.overrideMaterial = new THREE.MeshBasicMaterial({ color: 0x1d1b22 });
      stage.scene.background = new THREE.Color(0xf4f1ea);
      stage.scene.fog = null;
      stage.bloom.strength = 0;
    }
  }

  update(dt: number): void {
    for (const c of this.creatures) c.update(dt);
  }
}
