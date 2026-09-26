import * as THREE from 'three';
import { TUNING } from '../config';
import { audio } from '../core/audio';
import { keyLabel, type Input, type PlayerInput } from '../core/input';
import { CUSTOMER_LOOKS, FAMILY_LOOKS, type CustomerLook, type HeroDef } from '../data/characters';
import { INGREDIENTS } from '../data/ingredients';
import type { LevelDef } from '../data/levels';
import { RECIPES, type RecipeId } from '../data/recipes';
import { coinPile } from '../models/food';
import { glow } from '../render/materials';
import type { Stage } from '../render/stage';
import { starsFor } from '../sim/economy';
import { dishRecipe, makeExtinguisher, soil, type Item } from '../sim/items';
import type { MachineEvent } from '../sim/machine';
import { Party, type PartyEvent } from '../sim/party';
import { charm, patienceScale, type SaveData } from '../sim/progress';
import { nextSpawnDelay, rollPartySize, rollRecipes } from '../sim/spawner';
import { patienceColor, type Hud } from '../ui/hud';
import { PLAYER_COLORS } from '../ui/screens';
import type { WorldLabel, WorldUI } from '../ui/worldui';
import { Chef } from './chef';
import { Customer } from './customer';
import type { Fx } from './fx';
import { findTarget, pickAction, useAction, type Action, type ActionHost, type GameEvent, type Target } from './interact';
import type { ItemViews } from './itemviews';
import { Tutorial, type TutorialEvent } from './tutorial';
import type { Station, Table, World } from './world';

interface ActiveParty {
  party: Party;
  table: Table;
  customers: Customer[];
  labels: WorldLabel[];
  look: CustomerLook;
  orderBubble: WorldLabel;
  seated: number;
  gone: number;
}

export interface DayContext {
  stage: Stage;
  world: World;
  hud: Hud;
  worldUI: WorldUI;
  fx: Fx;
  views: ItemViews;
  input: Input;
}

export interface DayOptions {
  level: LevelDef;
  heroes: HeroDef[];
  playerCount: 1 | 2;
  save: SaveData;
}

export interface DayStats {
  coins: number;
  stars: number;
  served: number;
  happy: number;
  angry: number;
  fires: number;
}

/** Um dia de trabalho (turno de caos): heróis, clientes, estações, máquinas, tutorial. */
export class DayRun implements ActionHost {
  readonly chefs: Chef[] = [];
  readonly parties: ActiveParty[] = [];
  coins = 0;
  timeLeft: number;
  readonly stats = { served: 0, happy: 0, angry: 0, fires: 0 };
  tutorial: Tutorial | null;
  ended = false;
  private spawnIn = 2.5;
  private lastSecond = -1;
  private t = 0;
  private trailTimer = 0;
  private fxTimer = 0;
  private restLeft: number;
  private drainScale: number;
  private bars = new Map<Station, WorldLabel>();
  private coinPiles = new Map<Table, THREE.Group>();
  private arrow: THREE.Group;
  private tipsLeft = 0;

  constructor(
    private ctx: DayContext,
    private opts: DayOptions,
    private onEnd: (stats: DayStats) => void,
  ) {
    const { world, worldUI, stage, hud } = ctx;
    const { level, save } = opts;
    this.timeLeft = level.dayLength;
    this.restLeft = save.rested ? TUNING.rest.duration : 0;
    this.drainScale = patienceScale(charm(save), save.settings.noRush);

    for (const s of world.stations) {
      if (s.kind === 'stack' && s.vessel) {
        s.count = level.vessels[s.vessel] ?? 2;
        s.refreshStack();
      }
      if (s.machine) s.machine.safe = save.settings.noRush;
      if (s.startItem === 'extinguisher') this.place(s, makeExtinguisher());
    }

    opts.heroes.slice(0, 2).forEach((hero, i) => {
      const chef = new Chef(hero);
      chef.pos.copy(world.spawns[i] ?? new THREE.Vector3(3, 0, 4 + i));
      chef.facing = Math.PI / 2;
      chef.controller = opts.playerCount === 2 ? i : i === 0 ? 0 : -1;
      chef.hint = worldUI.add('chef-hint', chef.creature.head, 0.55);
      stage.scene.add(chef.root);
      chef.creature.celebrate();
      this.chefs.push(chef);
    });
    this.refreshChefRings();

    this.tutorial = level.tutorial && !save.tutorialDone ? new Tutorial() : null;
    this.arrow = makeArrow();
    stage.scene.add(this.arrow);

    hud.setDay(save.day, level.starGoals);
    hud.setCoins(0);
    hud.setChips(this.chipList());
    this.refreshTutorial();
    this.updatePlayerCards();
  }

  /** Mostra as dicas de novidade do nível (primeira vez). */
  showIntro(): void {
    const { level, save } = this.opts;
    if (this.tutorial) {
      this.ctx.hud.toast('Siga a setinha brilhante! ✨', 'info', 3500);
      return;
    }
    if (level.intro.length && !save.played.includes(level.id)) {
      this.ctx.hud.setTips(level.intro, this.keyNames());
      this.tipsLeft = 22;
    }
  }

  private keyNames(): { pick: string; use: string } {
    const p1 = this.ctx.input.binds(0);
    const p2 = this.ctx.input.binds(1);
    return this.opts.playerCount === 2
      ? { pick: `${keyLabel(p1.pick)} / ${keyLabel(p2.pick)}`, use: `${keyLabel(p1.use)} / ${keyLabel(p2.use)}` }
      : { pick: keyLabel(p1.pick), use: keyLabel(p1.use) };
  }

  private slotKeys(slot: number): { pick: string; use: string; swap: string } {
    const b = this.ctx.input.binds(slot === 1 ? 1 : 0);
    return { pick: keyLabel(b.pick), use: keyLabel(b.use), swap: keyLabel(b.swap) };
  }

  private chipList(): string[] {
    const chips: string[] = [];
    const c = charm(this.opts.save);
    if (c > 0) chips.push(`✨ Charme ${c}`);
    if (this.restLeft > 0) chips.push(`😴 Descansados ${Math.ceil(this.restLeft)}s`);
    if (this.opts.save.settings.noRush) chips.push('🐢 Sem pressa');
    return chips;
  }

  // ───────────────────────────── loop ─────────────────────────────

  update(dt: number, inputs: PlayerInput[]): void {
    if (this.ended) return;
    this.t += dt;
    const { world, hud } = this.ctx;

    // Troca de herói no modo solo
    if (this.opts.playerCount === 1 && inputs[0]?.swap && this.chefs.length > 1) {
      const cur = this.chefs.findIndex((c) => c.controller === 0);
      const next = (cur + 1) % this.chefs.length;
      this.chefs[cur]!.controller = -1;
      this.chefs[next]!.controller = 0;
      this.chefs[next]!.creature.hop();
      audio.swap();
      this.ctx.fx.burst(this.chefs[next]!.pos.clone().setY(0.5), { kind: 'sparkle', count: 10, colors: [0x4fc3ff, 0xffffff] });
      this.refreshChefRings();
      this.updatePlayerCards();
    }

    for (const chef of this.chefs) chef.move(chef.controller >= 0 ? (inputs[chef.controller] ?? null) : null, world, dt);
    if (this.chefs.length > 1) this.chefs[0]!.separate(this.chefs[1]!);

    world.stations.forEach((s) => (s.highlight.visible = false));
    world.tables.forEach((t) => (t.highlight.visible = false));
    for (const chef of this.chefs) {
      if (chef.controller < 0) {
        this.showIdleHint(chef);
        continue;
      }
      const input = inputs[chef.controller]!;
      const target = findTarget(world, chef);
      this.highlight(target, PLAYER_COLORS[chef.controller]!);
      const pick = pickAction(this, chef, target);
      const use = useAction(this, chef, target);
      this.showHint(chef, pick, use);
      if (input.pick) this.runAction(pick);
      if (input.use) this.runAction(use ?? (pick?.label === 'Anotar pedido' ? pick : null));
    }

    if (this.restLeft > 0) {
      const before = Math.ceil(this.restLeft);
      this.restLeft = Math.max(0, this.restLeft - dt);
      if (Math.ceil(this.restLeft) !== before) hud.setChips(this.chipList());
    }
    if (this.tipsLeft > 0) {
      this.tipsLeft -= dt;
      if (this.tipsLeft <= 0) hud.setTips(null);
    }

    this.updateWork(dt);
    this.updateMachines(dt);
    this.updateParties(dt);
    this.updateSpawns(dt);
    this.updateStationBars();
    this.updateTrails(dt);
    this.updateArrow(dt);

    const frozen = !!this.tutorial?.clockFrozen;
    if (!frozen) this.timeLeft -= dt;
    hud.setClock(this.timeLeft, this.opts.level.dayLength, frozen);
    const sec = Math.ceil(this.timeLeft);
    if (sec !== this.lastSecond) {
      if (sec === 30) hud.toast('⏰ Últimos 30 segundos!', 'bad');
      if (sec <= 10 && sec > 0) audio.tick();
      this.lastSecond = sec;
    }
    hud.syncOrders(
      this.parties.map((p) => p.party),
      (party) => this.parties.find((p) => p.party === party)!.look.species,
    );
    if (this.timeLeft <= 0) this.finish();
  }

  /** Animação enquanto o jogo não roda (pausa, contagem, resultado). */
  idle(dt: number): void {
    this.chefs.forEach((c) => {
      c.creature.moving = 0;
      c.creature.update(dt);
    });
    this.parties.forEach((p) => p.customers.forEach((c) => c.creature.update(dt)));
    this.arrow.visible = false;
    for (const s of this.ctx.world.stations) if (s.machine && s.machineView) s.machineView.update(s.machine, this.t);
  }

  private finish(): void {
    this.ended = true;
    audio.stopMusic();
    audio.whistle();
    // Moedas esquecidas nas mesas entram mesmo assim (jogo gentil)
    for (const t of this.ctx.world.tables) {
      this.coins += t.coins;
      t.coins = 0;
    }
    this.ctx.hud.setCoins(this.coins);
    this.ctx.hud.setTips(null);
    this.chefs.forEach((c) => {
      c.creature.celebrate();
      c.workingAt = null;
    });
    const stars = starsFor(this.coins, this.opts.level.starGoals);
    window.setTimeout(() => this.onEnd({ coins: this.coins, stars, ...this.stats }), 900);
  }

  dispose(): void {
    const { stage, worldUI } = this.ctx;
    this.chefs.forEach((c) => {
      stage.scene.remove(c.root);
      worldUI.remove(c.hint);
    });
    this.parties.forEach((p) => {
      p.customers.forEach((c) => stage.scene.remove(c.root));
      p.labels.forEach((l) => worldUI.remove(l));
      worldUI.remove(p.orderBubble);
    });
    this.bars.forEach((b) => worldUI.remove(b));
    stage.scene.remove(this.arrow);
    this.ctx.hud.setTips(null);
    this.ctx.hud.setTutorial(null, 0);
  }

  private runAction(action: Action | null): void {
    if (!action) return;
    if (action.disabled) {
      audio.deny();
      this.ctx.hud.toast(`🙅 ${action.label}`, 'bad', 1400);
    }
    action.run();
  }

  // ───────────────────────────── ActionHost ─────────────────────────────

  hold(chef: Chef, item: Item | null): void {
    if (chef.held && chef.held !== item) this.ctx.views.get(chef.held)?.removeFromParent();
    chef.held = item;
    if (item) {
      this.ctx.views.attach(item, chef.creature.holdAnchor, -0.05);
      this.ctx.views.pop(item);
    }
  }

  place(station: Station, item: Item | null): void {
    if (station.item && station.item !== item) this.ctx.views.get(station.item)?.removeFromParent();
    station.item = item;
    if (item) {
      this.ctx.views.attach(item, station.anchor, 0);
      this.ctx.views.pop(item);
    }
  }

  emit(e: GameEvent): void {
    const { fx, worldUI } = this.ctx;
    switch (e.type) {
      case 'pickup':
        audio.pickup();
        e.chef.creature.hop();
        if (e.item.type === 'ingredient' && e.item.kind === 'lettuce' && e.from === 'crate') this.tutorialEvent('pickLettuce');
        break;
      case 'place':
        audio.drop();
        e.chef.creature.hop();
        if (e.station.kind === 'sink') fx.burst(e.station.worldTop.setY(1), { kind: 'dot', colors: [0xbfe8ff, 0xffffff], count: 8, up: 1.5 });
        break;
      case 'merge': {
        audio.drop();
        const recipe = dishRecipe(e.bowl);
        fx.burst(e.at.clone().setY(1.1), { kind: 'sparkle', count: recipe ? 18 : 8, colors: [0xfff27a, 0xffffff, 0xb58cff] });
        if (recipe) {
          audio.done();
          worldUI.popup(`${recipe.emoji} ${recipe.name}!`, e.at.clone().setY(1.4));
          this.tutorialEvent('saladReady');
        }
        break;
      }
      case 'trash':
        audio.drop();
        fx.burst(e.at.clone().setY(0.9), { kind: 'leaf', count: 6, colors: [0x8fd16a, 0xd8f7a5], additive: false });
        break;
      case 'machineAdd': {
        audio.drop();
        e.chef.creature.hop();
        const m = e.station.machine!;
        fx.burst(e.station.worldTop.setY(e.station.worldTop.y + 0.2), { kind: 'sparkle', count: 8, colors: [0xfff27a, 0xffffff] });
        if (m.phase === 'working') {
          if (m.kind === 'griddle') audio.sizzle();
          else audio.bubble();
        } else if (m.kind === 'blender' && m.recipe) {
          worldUI.popup(`${this.slotKeys(e.chef.controller).use}: ligar ▶`, e.station.worldTop.setY(1.9));
        }
        break;
      }
      case 'machineStart':
        audio.blend();
        e.chef.creature.hop();
        fx.burst(e.station.worldTop.setY(1.4), { kind: 'sparkle', count: 12, colors: [0x7fd8ff, 0xffffff, 0xb58cff] });
        break;
      case 'machineTake': {
        audio.done();
        const recipe = dishRecipe(e.vessel);
        fx.burst(e.station.worldTop.setY(1.3), { kind: 'sparkle', count: 16, colors: [0xfff27a, 0xffffff, 0xff7fb0] });
        if (recipe) worldUI.popup(`${recipe.emoji} ${recipe.name}!`, e.station.worldTop.setY(1.6));
        break;
      }
      case 'dump':
        audio.poof();
        fx.burst(e.station.worldTop.setY(1.1), { kind: 'dot', count: 12, colors: [0x6b6570, 0x9a949f], additive: false, up: 1.5, gravity: -0.5 });
        break;
      case 'deny':
        break;
    }
  }

  takeOrder(table: Table, chef: Chef): void {
    const ap = this.parties.find((p) => p.table === table);
    if (!ap || !ap.party.takeOrder()) return;
    audio.order();
    chef.creature.hop();
    this.ctx.fx.burst(new THREE.Vector3(table.x, 1.6, table.z), { kind: 'sparkle', count: ap.party.size > 2 ? 24 : 10, colors: [0xfff27a, 0xffffff] });
    const names = ap.party.members.map((m) => `${RECIPES[m.recipe].emoji} ${RECIPES[m.recipe].name}`);
    this.ctx.hud.toast(ap.party.size > 2 ? `📝 Pedido da família: ${ap.party.size} pratos!` : `📝 ${names.join(' + ')}`, 'info', 2000);
    this.tutorialEvent('orderTaken');
  }

  serve(table: Table, chef: Chef): void {
    const ap = this.parties.find((p) => p.table === table);
    const dish = chef.held;
    const recipe = dishRecipe(dish);
    if (!ap || !dish || !recipe) return;
    const idx = ap.party.serve(recipe.id);
    if (idx < 0) return;
    const seat = table.seats[idx]!;
    this.hold(chef, null);
    seat.dish = dish;
    this.ctx.views.attach(dish, seat.plate, 0);
    this.ctx.views.pop(dish);
    ap.customers[idx]!.creature.eating = true;
    ap.customers[idx]!.creature.hop();
    this.stats.served++;
    audio.serve();
    chef.creature.celebrate();
    this.ctx.fx.heroBurst(chef.hero, chef.pos.clone().setY(1.2));
    this.ctx.fx.burst(seat.plate.getWorldPosition(new THREE.Vector3()).setY(1.1), { kind: 'sparkle', count: 16, colors: [0xffd700, 0xfff27a, 0xffffff] });
    this.tutorialEvent('served');
  }

  clearDish(table: Table, chef: Chef): void {
    const seat = table.seats.find((s) => s.dish?.type === 'vessel' && s.dish.dirty);
    if (!seat?.dish) return;
    const dish = seat.dish;
    seat.dish = null;
    this.hold(chef, dish);
    audio.pickup();
    chef.creature.hop();
    if (table.coins > 0) {
      const amount = table.coins;
      this.coins += amount;
      table.coins = 0;
      this.refreshCoinPile(table);
      this.ctx.fx.flyCoins(new THREE.Vector3(table.x, 1, table.z), this.ctx.hud.coinsScreenPos(), amount, () => this.ctx.hud.setCoins(this.coins));
      this.ctx.worldUI.popup(`+${amount} 🪙`, new THREE.Vector3(table.x, 1.5, table.z), 'pop coin');
    }
    this.tutorialEvent('cleared');
  }

  startWork(chef: Chef, station: Station): void {
    chef.workingAt = station;
    chef.vel.set(0, 0, 0);
    chef.facing = Math.atan2(station.x - chef.pos.x, station.z - chef.pos.z);
  }

  // ───────────────────────────── sistemas ─────────────────────────────

  private get workSpeed(): number {
    return this.restLeft > 0 ? TUNING.rest.workSpeed : 1;
  }

  private updateWork(dt: number): void {
    const { world, fx } = this.ctx;
    for (const s of world.stations) s.busy = false;
    for (const chef of this.chefs) {
      const s = chef.workingAt;
      if (!s) continue;
      const spraying = s.kind === 'machine' && s.machine!.phase === 'fire' && chef.held?.type === 'tool';
      const valid = spraying || (s.kind === 'board' ? s.item?.type === 'ingredient' && !s.item.chopped : s.kind === 'sink' && s.dirty.length > 0);
      if (!valid || s.busy) {
        chef.workingAt = null;
        continue;
      }
      s.busy = true;
      if (spraying) {
        fx.burst(chef.pos.clone().setY(0.9).addScaledVector(chef.forward, 0.5), { kind: 'dot', count: 2, colors: [0xdff6ff, 0xffffff, 0x9fe8ff], speed: 1.2, up: 0.8, size: 0.2, gravity: 0 });
        if (Math.random() < dt * 5) audio.spray();
        if (s.machine!.spray(dt * this.workSpeed)) {
          chef.workingAt = null;
          audio.poof();
          fx.burst(s.worldTop.setY(1.2), { kind: 'dot', count: 20, colors: [0xffffff, 0xdff6ff], additive: false, up: 2, gravity: -0.3 });
          fx.burst(s.worldTop.setY(1.4), { kind: 'sparkle', count: 14, colors: [0x9fe8ff, 0xffffff] });
          chef.creature.celebrate();
          this.ctx.hud.toast('💪 Fogo apagado!', 'good');
        }
        continue;
      }
      const before = s.progress;
      const total = s.kind === 'board' ? TUNING.work.chopTime : TUNING.work.washTime;
      s.progress = Math.min(1, s.progress + (dt * this.workSpeed) / total);
      const beat = 0.22;
      if (Math.floor(before / (beat / total)) !== Math.floor(s.progress / (beat / total))) {
        if (s.kind === 'board') {
          audio.chop();
          const color = s.item?.type === 'ingredient' ? INGREDIENTS[s.item.kind].color : 0xffffff;
          fx.burst(s.worldTop.setY(1.05), { kind: 'dot', count: 3, colors: [color], speed: 1, up: 1.2, size: 0.12, additive: false });
        } else {
          audio.splash();
          fx.burst(s.worldTop.setY(1.0), { kind: 'dot', count: 4, colors: [0xbfe8ff, 0xffffff], speed: 0.8, up: 1.4, size: 0.16 });
        }
      }
      if (s.knife) s.knife.position.y = 0.99 + Math.abs(Math.sin(this.t * 18)) * 0.08;
      if (s.progress >= 1) {
        s.progress = 0;
        chef.workingAt = null;
        audio.done();
        if (s.kind === 'board' && s.item?.type === 'ingredient') {
          s.item.chopped = true;
          s.item.version++;
          this.ctx.views.pop(s.item);
          fx.burst(s.worldTop.setY(1.1), { kind: 'sparkle', count: 10, colors: [0xffffff, 0xfff27a] });
          this.tutorialEvent('chopped');
        } else if (s.kind === 'sink') {
          const clean = s.dirty.shift()!;
          const stack = world.stations.find((st) => st.kind === 'stack' && st.vessel === clean.vessel);
          if (stack) {
            stack.count++;
            stack.refreshStack();
            fx.burst(stack.worldTop.setY(1.2), { kind: 'sparkle', count: 10, colors: [0xbfe8ff, 0xffffff] });
          }
          this.tutorialEvent('washed');
        }
      }
    }
  }

  private updateMachines(dt: number): void {
    const { world, fx } = this.ctx;
    this.fxTimer -= dt;
    const emitFx = this.fxTimer <= 0;
    if (emitFx) this.fxTimer = 0.12;
    for (const s of world.stations) {
      const m = s.machine;
      if (!m) continue;
      for (const ev of m.update(dt, this.workSpeed)) this.onMachineEvent(s, ev);
      s.machineView!.update(m, this.t);
      if (!emitFx) continue;
      const top = s.worldTop;
      if (m.phase === 'fire') {
        fx.burst(top.clone().setY(top.y + 0.3), { kind: 'sparkle', count: 2, colors: [0xff5a2a, 0xffd23f, 0xff9a2a], speed: 0.6, up: 2.2, gravity: -1, size: 0.2 });
        fx.burst(top.clone().setY(top.y + 0.6), { kind: 'dot', count: 1, colors: [0x5a5560], additive: false, speed: 0.3, up: 1.2, gravity: -0.6, size: 0.35, life: 1.6 });
      } else if (m.phase === 'burnt' || m.phase === 'warning') {
        fx.burst(top.clone().setY(top.y + 0.2), { kind: 'dot', count: 1, colors: m.phase === 'burnt' ? [0x4a4550] : [0xb9b3bf], additive: false, speed: 0.2, up: 0.9, gravity: -0.4, size: 0.28, life: 1.4 });
      } else if (m.phase === 'working' && m.kind !== 'blender' && Math.random() < 0.5) {
        fx.burst(top.clone().setY(top.y + 0.1), { kind: 'dot', count: 1, colors: [0xffffff], additive: false, speed: 0.15, up: 0.7, gravity: -0.3, size: 0.18, life: 1 });
      }
    }
  }

  private onMachineEvent(s: Station, ev: MachineEvent): void {
    const { fx, hud, stage, worldUI } = this.ctx;
    const top = s.worldTop;
    switch (ev) {
      case 'done':
        audio.done();
        fx.burst(top.clone().setY(top.y + 0.4), { kind: 'sparkle', count: 12, colors: [0xfff27a, 0xffffff] });
        worldUI.popup('✅ Pronto!', top.clone().setY(top.y + 0.8));
        break;
      case 'warning':
        audio.warn();
        worldUI.popup('⚠️ Vai queimar!', top.clone().setY(top.y + 0.8), 'pop warn');
        break;
      case 'burnt':
        audio.poof();
        hud.toast('💨 Queimou! Limpe antes que pegue fogo', 'bad');
        break;
      case 'fire':
        audio.fire();
        this.stats.fires++;
        stage.addShake(0.18);
        hud.toast('🔥 Fogo! Pegue o extintor mágico 🧯', 'bad', 3000);
        break;
      case 'extinguished':
        break;
    }
  }

  private updateStationBars(): void {
    const { world, worldUI } = this.ctx;
    for (const s of world.stations) {
      const m = s.machine;
      let html = '';
      if (m) {
        if (m.phase === 'working') html = `<div class="work-bar"><i style="width:${(m.progress * 100).toFixed(0)}%"></i></div>`;
        else if (m.phase === 'done') html = `<div class="mbubble ok">${RECIPES[m.recipe!.id].emoji}✅</div>`;
        else if (m.phase === 'warning') html = `<div class="mbubble warn">⚠️<div class="work-bar danger"><i style="width:${((1 - m.progress) * 100).toFixed(0)}%"></i></div></div>`;
        else if (m.phase === 'burnt') html = `<div class="mbubble bad">💨</div>`;
        else if (m.phase === 'fire') html = `<div class="mbubble fire">🔥<div class="work-bar water"><i style="width:${(m.extinguish * 100).toFixed(0)}%"></i></div></div>`;
        else if (m.contents.length) html = `<div class="mbubble">${m.contents.map((k) => INGREDIENTS[k].emoji).join('')}${m.kind === 'blender' && m.recipe ? ' ▶' : ''}</div>`;
      } else if (s.progress > 0 && ((s.kind === 'board' && s.item?.type === 'ingredient' && !s.item.chopped) || (s.kind === 'sink' && s.dirty.length > 0))) {
        html = `<div class="work-bar"><i style="width:${(s.progress * 100).toFixed(0)}%"></i></div>`;
      }
      let bar = this.bars.get(s);
      if (html && !bar) {
        bar = worldUI.add('station-label', s.anchor, 0.5);
        this.bars.set(s, bar);
      }
      if (bar) {
        bar.visible = !!html;
        bar.html = html;
      }
      if (s.kind === 'board' && s.knife && !s.busy) s.knife.position.y = 0.99;
      if (s.kind === 'sink') s.refreshDirty();
    }
  }

  private updateSpawns(dt: number): void {
    if (this.timeLeft < 12) return;
    const tut = this.tutorial;
    const firstParty = this.stats.served === 0 && this.parties.length === 0 && tut && !tut.isDone('orderTaken');
    if (tut?.spawnsBlocked && !firstParty) return;
    this.spawnIn -= dt;
    if (this.spawnIn > 0) return;
    const free = this.ctx.world.tables.filter((t) => t.free);
    const small = free.filter((t) => !t.isFamily);
    const family = free.filter((t) => t.isFamily);
    if (!free.length) {
      this.spawnIn = 2;
      return;
    }
    const { level } = this.opts;
    if (firstParty) {
      const table = small.sort((a, b) => a.x - b.x || a.z - b.z)[0] ?? free[0]!;
      this.spawnParty(table, ['salad_green'], this.pickLook(1));
    } else {
      const minSeats = small.length ? 1 : 3;
      const maxSeats = family.length ? Math.max(...family.map((t) => t.capacity)) : 2;
      const size = rollPartySize(level, minSeats, maxSeats, Math.random);
      const pool = size >= 3 ? family.filter((t) => t.capacity >= size) : small;
      if (!pool.length) {
        this.spawnIn = 2;
        return;
      }
      const table = pool[Math.floor(Math.random() * pool.length)]!;
      const look = this.pickLook(size);
      this.spawnParty(table, this.pickRecipes(size, look), look);
    }
    this.spawnIn = nextSpawnDelay(level, Math.random) * (this.parties.length > 2 ? 1.3 : 1);
  }

  private pickLook(size: number): CustomerLook {
    const panda = FAMILY_LOOKS.panda;
    if (panda && this.opts.save.families.includes('panda') && size >= 2 && Math.random() < 0.5) return panda;
    return CUSTOMER_LOOKS[Math.floor(Math.random() * CUSTOMER_LOOKS.length)]!;
  }

  /** Pandas adoram Sopa de Bambu (quando o nível tem caldeirão e bambu). */
  private pickRecipes(size: number, look: CustomerLook): RecipeId[] {
    const pool = [...this.opts.level.recipes];
    const hasBamboo = this.ctx.world.stations.some((s) => s.ingredient === 'bamboo');
    if (look.species === 'panda' && hasBamboo) pool.push({ id: 'soup_bamboo', weight: 5 });
    return rollRecipes(pool, size, Math.random);
  }

  private spawnParty(table: Table, recipes: RecipeId[], look: CustomerLook): void {
    const { world, worldUI, stage, hud } = this.ctx;
    const party = new Party(recipes);
    table.party = party;
    const ap: ActiveParty = {
      party,
      table,
      customers: [],
      labels: [],
      look,
      orderBubble: worldUI.add('order-bubble', new THREE.Vector3(table.x, table.isFamily ? 1.9 : 1.75, table.z)),
      seated: 0,
      gone: 0,
    };
    ap.orderBubble.visible = false;
    if (recipes.length >= 3) {
      hud.toast(`👨‍👩‍👧 Chegou uma família de ${recipes.length}!`, 'good', 2200);
      stage.zoomPulse();
    }
    recipes.forEach((_, i) => {
      const seat = table.seats[i]!;
      // Adultos na frente; filhotes menores atrás
      const scale = i < 2 ? (i === 0 ? 1.15 : 1.08) : 0.85 + Math.random() * 0.1;
      const c = new Customer(look, scale);
      const start = world.outside(i * 0.9);
      c.pos.copy(start);
      c.walk(
        world.route(start, seat.pos),
        () => {
          c.sit();
          ap.seated++;
          if (ap.seated === ap.customers.length) {
            party.seated();
            audio.arrive();
          }
        },
        seat.facing,
      );
      seat.customer = c;
      stage.scene.add(c.root);
      ap.customers.push(c);
      ap.labels.push(worldUI.add('cbubble', c.creature.head, 0.42));
    });
    this.parties.push(ap);
  }

  private updateParties(dt: number): void {
    const { worldUI, stage } = this.ctx;
    for (const ap of [...this.parties]) {
      const { party, table } = ap;
      for (const e of party.update(dt, this.drainScale)) this.onPartyEvent(ap, e);
      ap.customers.forEach((c) => c.update(dt));

      ap.orderBubble.visible = party.phase === 'waitingOrder';
      if (ap.orderBubble.visible) {
        const p = party.patience;
        ap.orderBubble.html = `<div class="ring${party.size > 2 ? ' family' : ''}" style="--p:${(p * 360).toFixed(0)}deg;--c:${patienceColor(p)}"><span>${party.size > 2 ? '📜' : '❗'}</span></div>`;
      }
      ap.customers.forEach((c, i) => {
        const m = party.members[i]!;
        const label = ap.labels[i]!;
        let html = '';
        if (party.phase === 'angry') html = '💢';
        else if (party.phase === 'finished') html = '💖';
        else if (party.phase === 'ordered') {
          if (!m.served) {
            const r = RECIPES[m.recipe];
            const ings = r.ingredients.map((k) => INGREDIENTS[k].emoji).join('');
            html = `<span class="want v-${r.vessel}" style="border-color:${patienceColor(party.patience)}">${ings}</span>`;
          } else html = m.done ? '💖' : '😋';
        }
        label.visible = !!html && c.state !== 'gone';
        label.html = html;
      });

      if (party.isLeaving && ap.gone >= ap.customers.length) {
        ap.customers.forEach((c) => stage.scene.remove(c.root));
        ap.labels.forEach((l) => worldUI.remove(l));
        worldUI.remove(ap.orderBubble);
        this.parties.splice(this.parties.indexOf(ap), 1);
        if (table.party === party) table.party = null;
        table.seats.forEach((s) => {
          if (s.customer && ap.customers.includes(s.customer)) s.customer = null;
        });
      }
    }
  }

  private onPartyEvent(ap: ActiveParty, e: PartyEvent): void {
    const { table } = ap;
    const { fx, hud, stage, worldUI } = this.ctx;
    switch (e.type) {
      case 'memberDone': {
        const seat = table.seats[e.member]!;
        if (seat.dish?.type === 'vessel') soil(seat.dish);
        ap.customers[e.member]!.creature.eating = false;
        table.coins += e.coins;
        this.refreshCoinPile(table);
        audio.coin();
        worldUI.popup(`+${e.coins} 🪙`, seat.plate.getWorldPosition(new THREE.Vector3()).setY(1.3), 'pop coin');
        break;
      }
      case 'banquet':
        table.coins += e.bonus;
        this.refreshCoinPile(table);
        audio.banquet();
        stage.addShake(0.12);
        stage.zoomPulse();
        hud.toast(`🎉 Banquete completo! Bônus +${e.bonus} 🪙`, 'good', 2600);
        fx.burst(new THREE.Vector3(table.x, 1.4, table.z), { kind: 'sparkle', count: 40, speed: 3, up: 3.5, colors: [0xffd700, 0xff7fb0, 0x7fd8ff, 0xb58cff] });
        break;
      case 'finished':
        this.stats.happy += ap.party.size;
        ap.customers.forEach((c) => {
          c.creature.celebrate();
          fx.burst(c.pos.clone().setY(1.2), { kind: 'heart', count: 5, colors: [0xff7fb0, 0xffb3d1], additive: false, up: 2.5 });
        });
        this.leave(ap);
        break;
      case 'angry':
        this.stats.angry += ap.party.size;
        audio.angry();
        hud.toast(ap.party.size > 2 ? '💢 A família cansou de esperar…' : '💢 Um cliente cansou de esperar…', 'bad');
        table.seats.forEach((s) => {
          if (s.dish?.type === 'vessel' && !s.dish.dirty) soil(s.dish);
        });
        this.leave(ap);
        break;
    }
  }

  private leave(ap: ActiveParty): void {
    const { world } = this.ctx;
    // A mesa só é liberada quando o último cliente sair (ver updateParties).
    ap.customers.forEach((c, i) => {
      c.creature.eating = false;
      c.walk(world.route(c.pos, world.outside(1.5 + i)), () => {
        c.state = 'gone';
        c.root.visible = false;
        ap.gone++;
      });
    });
  }

  private refreshCoinPile(table: Table): void {
    this.coinPiles.get(table)?.removeFromParent();
    if (table.coins <= 0) {
      this.coinPiles.delete(table);
      return;
    }
    const pile = coinPile(table.coins);
    table.coinAnchor.add(pile);
    this.coinPiles.set(table, pile);
  }

  // ───────────────────────────── feedback visual ─────────────────────────────

  private highlight(target: Target | null, color: number): void {
    if (!target) return;
    const h = target.kind === 'station' ? target.station.highlight : target.table.highlight;
    h.visible = true;
    const mat = h.material as THREE.MeshBasicMaterial;
    mat.color.setHex(color);
    mat.opacity = 0.65 + Math.sin(this.t * 8) * 0.3;
  }

  private showHint(chef: Chef, pick: Action | null, use: Action | null): void {
    const label = chef.hint!;
    if (chef.workingAt || (!pick && !use)) {
      label.visible = false;
      return;
    }
    const keys = this.slotKeys(this.opts.playerCount === 1 ? 0 : chef.controller);
    const row = (k: string, a: Action) => `<div class="hint${a.disabled ? ' off' : ''}"><kbd>${a.disabled ? '✖' : k}</kbd>${a.label}</div>`;
    let html = '';
    if (pick) html += row(keys.pick, pick);
    if (use && use.label !== pick?.label) html += row(keys.use, use);
    label.visible = true;
    label.html = html;
  }

  private showIdleHint(chef: Chef): void {
    const label = chef.hint!;
    label.visible = this.opts.playerCount === 1;
    label.html = `<div class="hint idle"><kbd>${this.slotKeys(0).swap}</kbd>trocar</div>`;
  }

  private refreshChefRings(): void {
    this.chefs.forEach((c) => c.setRingColor(c.controller >= 0 ? PLAYER_COLORS[c.controller]! : null));
  }

  updatePlayerCards(): void {
    const two = this.opts.playerCount === 2;
    this.ctx.hud.setPlayers(
      this.chefs.map((c, i) => {
        const slot = two ? i : 0;
        const k = this.slotKeys(slot);
        return {
          hero: c.hero,
          label: two ? `Jogador ${i + 1}` : c.controller === 0 ? 'Você' : `Esperando (${k.swap})`,
          keys: two && i === 1 ? `Setas · ${k.pick} · ${k.use}` : `WASD · ${k.pick} · ${k.use}`,
          color: PLAYER_COLORS[slot]!,
          active: c.controller >= 0,
        };
      }),
    );
  }

  /** Rastro sutil: pó cintilante da Estrelinha e faíscas do Pipoca ao correr. */
  private updateTrails(dt: number): void {
    this.trailTimer -= dt;
    if (this.trailTimer > 0 || this.ctx.fx.amount < 1) return;
    this.trailTimer = 0.12;
    for (const c of this.chefs) {
      if (c.creature.moving < 0.5) continue;
      const at = c.pos.clone().setY(0.6).addScaledVector(c.forward, -0.3);
      if (c.hero.celebrate === 'dust') this.ctx.fx.burst(at, { kind: 'dot', count: 1, colors: [0xf6e7ff], speed: 0.2, up: 0.4, gravity: -0.3, size: 0.14 });
      if (c.hero.celebrate === 'sparks' && Math.random() < 0.35) this.ctx.fx.burst(at, { kind: 'sparkle', count: 1, colors: [0xffd23f, 0xff7fe0], speed: 0.5, up: 1, size: 0.12 });
    }
  }

  // ───────────────────────────── tutorial ─────────────────────────────

  private tutorialEvent(e: TutorialEvent): void {
    const tut = this.tutorial;
    if (!tut || !tut.handle(e)) return;
    audio.done();
    this.refreshTutorial();
    if (tut.finished) {
      this.ctx.hud.toast('🎉 Tutorial completo! Agora é com vocês!', 'good', 3200);
      this.ctx.hud.setTutorial(null, 0);
      this.tutorial = null;
    }
  }

  private refreshTutorial(): void {
    const tut = this.tutorial;
    this.ctx.hud.setTutorial(tut ? tut.steps : null, tut?.current ?? 0, this.keyNames());
  }

  private updateArrow(dt: number): void {
    const arrow = this.arrow;
    const focus = this.tutorial?.focus;
    const { world } = this.ctx;
    let pos: THREE.Vector3 | null = null;
    const find = (pred: (s: Station) => boolean) => world.stations.find(pred)?.worldTop.setY(1.9) ?? null;
    switch (focus) {
      case 'firstTable': {
        const ap = this.parties[0];
        if (ap) pos = new THREE.Vector3(ap.table.x, 1.9, ap.table.z);
        break;
      }
      case 'crateLettuce':
        pos = find((s) => s.ingredient === 'lettuce');
        break;
      case 'board':
        pos = find((s) => s.kind === 'board' && !!s.item) ?? find((s) => s.kind === 'board');
        break;
      case 'bowls':
        pos = find((s) => s.kind === 'stack' && s.vessel === 'bowl');
        break;
      case 'sink':
        pos = find((s) => s.kind === 'sink');
        break;
    }
    arrow.visible = !!pos;
    if (pos) {
      arrow.position.lerp(pos, arrow.position.distanceTo(pos) > 4 ? 1 : Math.min(1, dt * 8));
      arrow.position.y = pos.y + Math.abs(Math.sin(this.t * 4)) * 0.25;
      arrow.rotation.y += dt * 2;
    }
  }
}

function makeArrow(): THREE.Group {
  const g = new THREE.Group();
  const mat = glow(0xfff27a, 1.8);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.35, 4), mat);
  head.rotation.x = Math.PI;
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.1), mat);
  shaft.position.y = 0.3;
  g.add(head, shaft);
  g.visible = false;
  return g;
}
