import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/** Inclinação da câmera em relação ao chão (graus). ~55° dá a leitura "Overcooked". */
const PITCH_DEG = 56;
const FOV = 30;

/**
 * Renderer, cena, câmera aérea inclinada, luzes e pós-processamento (bloom).
 * O bloom só pega o que tem emissivo forte — é assim que as coisas "mágicas" brilham.
 */
export class Stage {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(FOV, 1, 0.5, 200);
  readonly sun: THREE.DirectionalLight;
  readonly hemi: THREE.HemisphereLight;
  private composer: EffectComposer;
  readonly bloom: UnrealBloomPass;
  readonly fill: THREE.DirectionalLight;
  private focus = new THREE.Vector3();
  // Vetores temporários reutilizados (evita alocação por frame)
  private tmpOff = new THREE.Vector3();
  private tmpTarget = new THREE.Vector3();
  private tmpProj = new THREE.Vector3();
  private focusSize = new THREE.Vector2(16, 10);
  private shake = 0;
  /** Pulso de zoom (momentos de festa). Decai sozinho. */
  private pulse = 0;
  /** Espaço (px) ocupado por painéis à direita: a cena é enquadrada no resto da tela. */
  private insetRight = 0;
  /** Zoom extra (1 = normal, <1 aproxima). */
  zoom = 1;
  private currentZoom = 1;

  constructor(private container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.95;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    // Contagem de draw calls somando todos os passes (overlay ?debug)
    this.renderer.info.autoReset = false;
    container.appendChild(this.renderer.domElement);

    this.scene.background = new THREE.Color(0x7fbf95);
    this.scene.fog = new THREE.Fog(0x7fbf95, 28, 60);

    this.hemi = new THREE.HemisphereLight(0xfff4e6, 0x7a8f6b, 0.85);
    this.scene.add(this.hemi);

    this.sun = new THREE.DirectionalLight(0xffe0b8, 1.55);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.02;
    this.sun.shadow.radius = 4;
    const sc = this.sun.shadow.camera;
    sc.left = -14;
    sc.right = 14;
    sc.top = 12;
    sc.bottom = -12;
    sc.near = 1;
    sc.far = 60;
    this.scene.add(this.sun, this.sun.target);

    this.fill = new THREE.DirectionalLight(0xc9e2ff, 0.3);
    this.fill.position.set(10, 8, 12);
    this.scene.add(this.fill);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.5, 0.5, 1.0);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  /** Enquadra a área (x,z do centro, largura e profundidade em unidades de mundo). */
  frame(cx: number, cz: number, width: number, depth: number): void {
    this.focus.set(cx, 0, cz);
    this.focusSize.set(width, depth);
    this.sun.position.set(cx - 7, 16, cz + 6);
    this.sun.shadow.camera.left = -Math.max(14, width * 0.9);
    this.sun.shadow.camera.right = Math.max(14, width * 0.9);
    this.sun.shadow.camera.updateProjectionMatrix();
    this.sun.target.position.set(cx, 0, cz);
    this.updateCamera();
  }

  /** Desliga o tremor de tela (modo menos efeitos). */
  shakeEnabled = true;

  /** Aproxima a câmera rapidinho (chegada de família, banquete). */
  zoomPulse(): void {
    if (this.shakeEnabled) this.pulse = 1;
  }

  setInsetRight(px: number): void {
    this.insetRight = px;
    this.resize();
  }

  addShake(amount: number): void {
    if (!this.shakeEnabled) return;
    this.shake = Math.min(0.35, this.shake + amount);
  }

  private updateCamera(): void {
    const pitch = THREE.MathUtils.degToRad(PITCH_DEG);
    const vfov = THREE.MathUtils.degToRad(FOV);
    const w = this.container.clientWidth || window.innerWidth;
    const aspect = this.camera.aspect * Math.max(0.3, (w - this.insetRight) / w);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect);
    // Distância para caber a largura e a profundidade projetada.
    const dW = this.focusSize.x / 2 / Math.tan(hfov / 2);
    const dD = ((this.focusSize.y * Math.sin(pitch)) / 2 + 1.2) / Math.tan(vfov / 2);
    const dist = Math.max(dW, dD) * this.currentZoom * (1 - 0.06 * Math.sin(Math.min(1, this.pulse) * Math.PI));
    const off = this.tmpOff.set(0, Math.sin(pitch), Math.cos(pitch)).multiplyScalar(dist);
    const target = this.tmpTarget.copy(this.focus);
    target.z += 0.4;
    this.camera.position.copy(target).add(off);
    if (this.shake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.shake;
      this.camera.position.y += (Math.random() - 0.5) * this.shake;
    }
    this.camera.lookAt(target);
  }

  resize(): void {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    if (this.insetRight > 0) this.camera.setViewOffset(w, h, this.insetRight / 2, 0, w, h);
    else this.camera.clearViewOffset();
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
    this.bloom.resolution.set(w / 2, h / 2);
    this.updateCamera();
  }

  render(dt: number): void {
    this.shake = Math.max(0, this.shake - dt * 1.5);
    this.currentZoom += (this.zoom - this.currentZoom) * Math.min(1, dt * 3);
    this.pulse = Math.max(0, this.pulse - dt * 0.8);
    this.updateCamera();
    this.renderer.info.reset();
    this.composer.render(dt);
  }

  /** Projeta um ponto do mundo para pixels da tela (para rótulos HTML). */
  toScreen(p: THREE.Vector3, out: { x: number; y: number; visible: boolean }): void {
    const v = this.tmpProj.copy(p).project(this.camera);
    out.x = (v.x * 0.5 + 0.5) * this.renderer.domElement.clientWidth;
    out.y = (-v.y * 0.5 + 0.5) * this.renderer.domElement.clientHeight;
    out.visible = v.z < 1;
  }
}
