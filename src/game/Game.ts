import * as THREE from 'three';
import { audio } from '../core/audio';
import { Input } from '../core/input';
import { clearSave, loadSave, writeSave } from '../core/storage';
import { HEROES, type HeroDef } from '../data/characters';
import { levelDef, type LevelDef } from '../data/levels';
import { Creature } from '../models/creature';
import { Lighting } from '../render/lighting';
import { Stage } from '../render/stage';
import { claimWelcomeGift, defaultSave, recordDay, teamHeroes, type SaveData, type Settings } from '../sim/progress';
import { Hud } from '../ui/hud';
import { moveFocus } from '../ui/nav';
import { Screens } from '../ui/screens';
import { TouchControls, isTouchDevice } from '../ui/touch';
import { entitlements } from '../platform/entitlements';
import { platform } from '../platform/platform';
import { WorldUI } from '../ui/worldui';
import { DayRun, type DayStats } from './Day';
import { Fx } from './fx';
import { ItemViews } from './itemviews';
import { NightRun } from './Night';
import { World } from './world';

/** Câmera que segue no celular: largura (em células) da faixa visível. */
const TUNING_CAM = { width: 14.5 };

type GameState = 'title' | 'levels' | 'settings' | 'countdown' | 'day' | 'paused' | 'results' | 'night';

/**
 * Orquestra os estados do jogo:
 * título → mapa de níveis → dia (DayRun) → resultado → noite (NightRun) → mapa de níveis…
 */
export class Game {
  readonly stage: Stage;
  readonly input = new Input();
  readonly worldUI: WorldUI;
  readonly hud: Hud;
  readonly screens: Screens;
  readonly fx: Fx;
  readonly views = new ItemViews();
  readonly lighting: Lighting;
  world!: World;
  save: SaveData;
  level: LevelDef = levelDef(1);
  state: GameState = 'title';
  day: DayRun | null = null;
  night: NightRun | null = null;
  private titleCreatures: { hero: HeroDef; creature: Creature }[] = [];
  private heroes: HeroDef[] = [HEROES[0]!, HEROES[2]!];
  private playerCount: 1 | 2 = 1;
  private timer = new THREE.Timer();
  private t = 0;
  private lastNight = -1;
  private debugEl: HTMLDivElement | null = null;
  private touch: TouchControls | null = null;
  private touchShown = false;
  /** Celular: a câmera segue os heróis de perto (no salão inteiro eles ficavam pequenos). */
  private followCam = false;
  private camX = 8.6;
  /** Depuração: `?speed=4` roda a simulação 4× mais rápido (útil em testes automatizados). */
  private timeScale = Math.max(1, Math.min(8, Number(new URLSearchParams(location.search).get('speed')) || 1));

  constructor(private container: HTMLElement) {
    const stageEl = document.createElement('div');
    stageEl.className = 'stage';
    container.appendChild(stageEl);
    const touch = isTouchDevice();
    document.documentElement.classList.toggle('touch', touch);
    this.stage = new Stage(stageEl, touch);
    this.followCam = touch && Math.min(window.innerWidth, window.innerHeight) < 600;
    const labelLayer = document.createElement('div');
    labelLayer.className = 'world-ui';
    container.appendChild(labelLayer);
    this.worldUI = new WorldUI(labelLayer);
    this.hud = new Hud(container);
    this.screens = new Screens(container, touch);
    if (touch) {
      this.touch = new TouchControls(container);
      this.touch.onPause = () => {
        audio.unlock();
        if (this.state === 'day') this.togglePause();
      };
      this.input.attachTouch(this.touch);
      this.buildRotateNotice();
    }
    this.fx = new Fx(this.stage, container);
    this.lighting = new Lighting(this.stage);
    this.save = loadSave();
    this.applySettings();

    this.input.onKey((code) => {
      audio.unlock();
      if (this.state === 'day' && (code === 'Escape' || code === 'KeyP')) {
        this.togglePause();
        this.input.endFrame();
      } else if (this.state === 'paused' && code === 'KeyP') {
        this.togglePause();
        this.input.endFrame();
      }
      if (code === 'KeyM' && this.state !== 'settings') this.setMusic(!this.save.settings.music);
    });
    window.addEventListener('pointerdown', () => audio.unlock());
    // App em segundo plano (trocou de app, bloqueou a tela): pausa o dia e a música.
    platform.onVisibility((visible) => {
      if (!visible) {
        if (this.state === 'day') this.togglePause();
        audio.stopMusic();
      } else if (this.state === 'night' && this.save.settings.music) {
        audio.startNightMusic();
      }
    });

    if (new URLSearchParams(location.search).has('debug')) {
      this.debugEl = document.createElement('div');
      this.debugEl.className = 'debug';
      container.appendChild(this.debugEl);
    }

    this.level = levelDef(this.save.played[this.save.played.length - 1] ?? 1);
    this.buildWorld();
    this.showTitle();
    this.loop();
  }

  /** Celular em pé: pede para girar (dá para dispensar). */
  private buildRotateNotice(): void {
    const el = document.createElement('div');
    el.className = 'rotate';
    el.innerHTML = `<div><div class="rotate-icon">📱</div><p>Gire o celular para jogar deitado!</p><button class="btn small">Jogar assim mesmo</button></div>`;
    el.querySelector('button')!.onclick = () => el.remove();
    this.container.appendChild(el);
  }

  // ───────────────────────────── configurações ─────────────────────────────

  private applySettings(): void {
    const s = this.save.settings;
    this.input.setKeys(s.keys);
    audio.musicOn = s.music;
    document.documentElement.classList.toggle('big-text', s.bigText);
    this.fx.amount = s.reducedFx ? 0.35 : 1;
    this.stage.shakeEnabled = !s.reducedFx;
    this.lighting.bloomScale = s.reducedFx ? 0.5 : 1;
    this.lighting.set(this.lighting.target === 1, true);
  }

  private updateSettings(s: Settings): void {
    this.save = { ...this.save, settings: s };
    writeSave(this.save);
    const musicChanged = audio.musicOn !== s.music;
    this.applySettings();
    if (musicChanged) this.setMusic(s.music);
    this.day?.updatePlayerCards();
  }

  private setMusic(on: boolean): void {
    this.save = { ...this.save, settings: { ...this.save.settings, music: on } };
    writeSave(this.save);
    if (this.state === 'day' || this.state === 'night') audio.setMusic(on);
    else audio.musicOn = on;
    this.hud.toast(on ? '🎵 Música ligada' : '🔇 Música desligada');
  }

  // ───────────────────────────── estados ─────────────────────────────

  private buildWorld(): void {
    if (this.world) {
      this.stage.scene.remove(this.world.root);
      this.world.dispose();
    }
    this.views.clear();
    this.world = new World(this.level, this.save);
    this.stage.scene.add(this.world.root);
    this.world.setNight(this.lighting.value);
  }

  private endRuns(): void {
    this.day?.dispose();
    this.day = null;
    this.night?.dispose();
    this.night = null;
  }

  private clearTitle(): void {
    this.titleCreatures.forEach((c) => this.stage.scene.remove(c.creature.root));
    this.titleCreatures = [];
  }

  showTitle(): void {
    this.endRuns();
    this.state = 'title';
    audio.stopMusic();
    this.hud.show(false);
    this.lighting.set(false);
    this.clearTitle();
    const team = teamHeroes(this.save);
    const x0 = 13.5 - ((team.length - 1) * 1.15) / 2;
    this.titleCreatures = team.map((hero, i) => {
      const creature = new Creature(hero, 1.35);
      creature.root.position.set(x0 + i * 1.15, 0, 2.7 + (i % 2) * 0.3);
      this.stage.scene.add(creature.root);
      return { hero, creature };
    });
    this.stage.frame(13.5, 4.1, 12.5, 3.2);
    this.screens.onSelectionChange = (sel) => {
      this.titleCreatures.forEach((c) => {
        if (sel.includes(c.hero)) {
          c.creature.celebrate();
          this.fx.heroBurst(c.hero, c.creature.root.position.clone().setY(1.2));
        }
      });
    };
    this.screens.title(
      this.save,
      ({ heroes, players }) => {
        this.heroes = heroes;
        this.playerCount = players;
        this.showLevels();
      },
      () => this.showSettings('title'),
    );
  }

  showLevels(): void {
    this.endRuns();
    this.state = 'levels';
    this.hud.show(false);
    this.screens.levels(
      this.save,
      (id) => {
        if (entitlements.levelAvailable(id)) this.startDay(id);
        else this.screens.fullGameGate(() => this.showLevels(), () => this.showLevels());
      },
      () => this.showTitle(),
      (id) => entitlements.levelAvailable(id),
    );
  }

  private showSettings(from: 'title' | 'paused'): void {
    this.state = 'settings';
    this.screens.settings(this.save, {
      onChange: (s) => this.updateSettings(s),
      onRebind: (_player, _action, done) => this.input.captureNextKey(done),
      onReset: () => {
        clearSave();
        this.save = defaultSave();
        this.applySettings();
        this.level = levelDef(1);
        this.buildWorld();
        this.showTitle();
      },
      onBack: () => {
        if (from === 'title') this.showTitle();
        else {
          this.state = 'day';
          this.togglePause();
        }
      },
    });
  }

  startDay(levelId: number): void {
    this.endRuns();
    this.clearTitle();
    this.level = levelDef(levelId);
    this.lighting.set(false);
    this.buildWorld();
    this.screens.hide();
    this.stage.frame(8.6, 5.2, 20.2, 11.4);
    this.camX = 4;
    const day = new DayRun(
      { stage: this.stage, world: this.world, hud: this.hud, worldUI: this.worldUI, fx: this.fx, views: this.views, input: this.input },
      { level: this.level, heroes: this.heroes, playerCount: this.playerCount, save: this.save },
      (stats) => this.onDayEnd(stats),
    );
    this.day = day;
    this.hud.show(true);
    this.state = 'countdown';
    this.screens.countdown(this.level.name, () => {
      if (this.day !== day) return;
      this.state = 'day';
      audio.startDayMusic();
      day.showIntro();
    });
  }

  private onDayEnd(stats: DayStats): void {
    const res = recordDay(this.save, this.level.id, stats.coins, stats.stars);
    this.save = res.save;
    writeSave(this.save);
    this.state = 'results';
    if (res.newFamilies.length || res.unlockedLevel) window.setTimeout(() => audio.fanfare(), 1400);
    this.screens.results(
      { levelId: this.level.id, ...stats, wallet: this.save.wallet, newBest: res.newBest, unlockedLevel: res.unlockedLevel, newFamilies: res.newFamilies },
      () => this.startNight(),
      () => this.startDay(this.level.id),
    );
  }

  startNight(): void {
    this.endRuns();
    this.clearTitle();
    this.hud.show(false);
    this.state = 'night';
    this.save = { ...this.save, rested: true };
    const gift = claimWelcomeGift(this.save);
    this.save = gift.save;
    writeSave(this.save);
    this.buildWorld();
    this.lighting.set(true);
    this.stage.frame(8.6, 5.2, 20.2, 11.4);
    audio.startNightMusic();
    this.screens.banner('🌙 Anoitece no bistrô…', 1500, () => {
      if (this.state !== 'night') return;
      this.night = new NightRun(
        {
          stage: this.stage,
          hud: this.hud,
          worldUI: this.worldUI,
          fx: this.fx,
          container: this.container,
          getWorld: () => this.world,
          rebuildWorld: (save) => {
            this.save = save;
            this.buildWorld();
          },
        },
        this.save,
        (save) => {
          this.save = save;
          writeSave(save);
          audio.stopMusic();
          this.showLevels();
        },
      );
    });
    // O HUD de avisos (toasts) continua visível à noite
    this.hud.showToastsOnly(true);
    if (gift.amount) {
      // Presente de boas-vindas: a 1ª loja não fica com tudo bloqueado
      window.setTimeout(() => {
        audio.buy();
        this.hud.toast(`🎁 Presente da floresta: +${gift.amount} 🪙 para decorar!`, 'good', 4500);
        this.fx.burst(new THREE.Vector3(4.5, 1.5, 6.5), { kind: 'sparkle', count: 40, speed: 3, up: 3, colors: [0xffd700, 0xff7fb0, 0x7fd8ff] });
      }, 1800);
    }
  }

  private togglePause(): void {
    if (this.state === 'day') {
      this.state = 'paused';
      audio.stopMusic();
      this.screens.pause({
        onResume: () => this.togglePause(),
        onRestart: () => this.startDay(this.level.id),
        onMenu: () => this.showTitle(),
        onOptions: () => this.showSettings('paused'),
        musicOn: this.save.settings.music,
        onMusic: () => {
          this.setMusic(!this.save.settings.music);
          audio.stopMusic();
          return this.save.settings.music;
        },
        keys: this.save.settings.keys,
      });
    } else if (this.state === 'paused') {
      this.screens.hide();
      this.state = 'day';
      if (this.save.settings.music) audio.startDayMusic();
    }
  }

  /** Celular: enquadra uma faixa do restaurante centrada nos heróis (eles ficam ~35% maiores). */
  private updateFollowCam(dt: number): void {
    if (!this.followCam || !this.day || (this.state !== 'day' && this.state !== 'countdown' && this.state !== 'paused')) return;
    const active = this.day.chefs.filter((c) => c.controller >= 0);
    const xs = (active.length ? active : this.day.chefs).map((c) => c.pos.x);
    const avg = xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
    const half = TUNING_CAM.width / 2;
    const target = Math.max(half - 0.9, Math.min(this.world.width - half + 0.4, avg));
    this.camX += (target - this.camX) * Math.min(1, dt * 3);
    this.stage.frame(this.camX, 5.2, TUNING_CAM.width, 11.4);
  }

  // ───────────────────────────── loop ─────────────────────────────

  private loop = (): void => {
    requestAnimationFrame(this.loop);
    this.timer.update();
    const dt = Math.min(0.05, this.timer.getDelta());
    this.t += dt;

    if (this.state === 'day' && this.day) {
      const inputs = this.input.read(this.playerCount);
      if (this.input.padPausePressed()) this.togglePause();
      else {
        this.day.update(dt, inputs);
        const idle = inputs.map((i) => ({ ...i, pick: false, use: false, swap: false }));
        for (let i = 1; i < this.timeScale && this.state === 'day' && !this.day.ended; i++) this.day.update(dt, idle);
      }
    } else {
      const m = this.input.menu(dt);
      if (m.dx || m.dy) moveFocus(m.dx, m.dy);
      if (m.confirm) (document.activeElement as HTMLElement | null)?.click?.();
      if (m.pause && this.state === 'paused') this.togglePause();
      else if (m.back) {
        if (this.state === 'paused') this.togglePause();
        else if (this.state === 'levels') this.showTitle();
      }
      this.day?.idle(dt);
      this.night?.update(dt);
      this.titleCreatures.forEach((c, i) => {
        c.creature.update(dt);
        c.creature.root.rotation.y = Math.sin(this.t * 0.8 + i) * 0.25;
      });
    }
    this.input.endFrame();
    const showTouch = this.state === 'day' || this.state === 'countdown';
    if (this.touch && showTouch !== this.touchShown) {
      this.touchShown = showTouch;
      this.touch.show(showTouch, this.playerCount === 1);
    }

    this.updateFollowCam(dt);
    this.lighting.update(dt);
    if (this.lighting.value !== this.lastNight) {
      this.lastNight = this.lighting.value;
      this.world.setNight(this.lighting.value);
    }
    this.world.update(dt);
    this.views.update(dt);
    this.fx.update(dt);
    this.worldUI.update(this.stage);
    this.hud.update(dt);
    this.stage.render(dt);
    if (this.debugEl) {
      const info = this.stage.renderer.info.render;
      this.debugEl.textContent = `${Math.round(1 / Math.max(dt, 0.001))} fps · ${info.calls} draw calls · ${info.triangles} tris`;
    }
  };
}
