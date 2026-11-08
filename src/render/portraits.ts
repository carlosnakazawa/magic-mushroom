import * as THREE from 'three';
import { HEROES, type HeroDef } from '../data/characters';
import { Creature } from '../models/creature';

/**
 * Retratos dos heróis: cada um é desenhado UMA vez a partir do próprio modelo 3D
 * e vira uma imagem (data URL) usada nos cartões de seleção, na loja da noite e
 * nos cartões de jogador. Assim o ícone é exatamente o personagem, não um emoji.
 * Se o WebGL falhar, devolve '' e a interface usa o emoji da espécie.
 */
const SIZE = 192;
const cache = new Map<string, string>();
let tried = false;

function renderAll(): void {
  tried = true;
  let renderer: THREE.WebGLRenderer | null = null;
  try {
    const canvas = document.createElement('canvas');
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);
    renderer.setSize(SIZE, SIZE, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    // Mesma "revelação" de cor do jogo (sem ela, e com luz forte, os retratos saíam desbotados)
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xfff6e8, 0x9a8fb0, 1.1));
    const sun = new THREE.DirectionalLight(0xffffff, 1.9);
    sun.position.set(1.5, 3, 3);
    scene.add(sun);
    // Enquadra cabeça e corpo, de frente e um pouco de lado (3/4)
    const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
    cam.position.set(0.35, 1.05, 2.6);
    cam.lookAt(0, 0.52, 0);
    for (const h of HEROES) {
      const c = new Creature(h, 1);
      c.update(0.016);
      c.root.rotation.y = 0.32;
      // Some com a sombra de contato e asas grandes não cortam: só o personagem
      scene.add(c.root);
      renderer.render(scene, cam);
      cache.set(h.id, canvas.toDataURL('image/png'));
      scene.remove(c.root);
    }
  } catch (e) {
    console.warn('[retratos] sem WebGL, usando emojis', e);
    cache.clear();
  } finally {
    renderer?.dispose();
    renderer?.forceContextLoss();
  }
}

/** Imagem do herói (data URL) ou '' se não deu para desenhar. */
export function heroPortrait(h: HeroDef): string {
  if (!tried) renderAll();
  return cache.get(h.id) ?? '';
}

/** HTML do rosto do herói: retrato 3D ou, sem WebGL, o emoji. */
export function heroFaceHtml(h: HeroDef, fallback: string): string {
  const src = heroPortrait(h);
  return src ? `<img class="face-img" src="${src}" alt="${h.name}" draggable="false">` : fallback;
}
