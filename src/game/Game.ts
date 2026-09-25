import * as THREE from 'three';
import { TUNING } from '../config';
import { audio } from '../core/audio';
import { Input, type PlayerInput } from '../core/input';
import { CUSTOMER_LOOKS, HEROES, type CustomerLook, type HeroDef } from '../data/characters';
import { INGREDIENTS } from '../data/ingredients';
import { LEVELS, type LevelDef } from '../data/levels';
import { RECIPES } from '../data/recipes';
import { Particles, type BurstOpts } from '../fx/particles';
import { bowlMesh, coinPile } from '../models/food';
import { Creature } from '../models/creature';
import { glow } from '../render/materials';
import { Stage } from '../render/stage';
import { starsFor } from '../sim/economy';
import { bowlRecipe, type Item } from '../sim/items';
import { Party, type PartyEvent } from '../sim/party';
import { nextSpawnDelay, rollParty } from '../sim/spawner';
import { Hud, patienceColor } from '../ui/hud';
import { PLAYER_COLORS, Screens } from '../ui/screens';
import { WorldUI, type WorldLabel } from '../ui/worldui';
import { Chef } from './chef';
import { Customer } from './customer';
import { findTarget, pickAction, useAction, type Action, type ActionHost, type GameEvent, type Target } from './interact';
import { ItemViews } from './itemviews';
import { Tutorial, type TutorialEvent } from './tutorial';
import { World, type Station, type Table } from './world';

type GameState = 'title' | 'countdown' | 'playing' | 'paused' | 'results';

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

const KEYS_BY_SLOT = [
  { pick: 'Espaço', use: 'E' },
  { pick: 'Enter', use: 'Shift' },
];

/** Orquestra tudo: estados (título → dia → resultado), regras do dia, efeitos e HUD. */
export class Game implements ActionHost {
  private stage: Stage;
  private input = new Input();
  private worldUI: WorldUI;
  private hud: Hud;
  private screens: Screens;
  private particles: Particles;
  private views = new ItemViews();
  private world!: World;
  private level: LevelDef = LEVELS[0]!;
  private state: GameState = 'title';
  private chefs: Chef[] = [];
  private titleCreatures: { hero: HeroDef; creature: Creature }[] = [];
  private parties: ActiveParty[] = [];
  private heroes: HeroDef[] = [HEROES[0]!, HEROES[2]!];
  private playerCount: 1 | 2 = 1;
  private day = 1;
  private timeLeft = 0;
  private coins = 0;
  private stats = { served: 0, happy: 0, angry: 0 };
  private spawnIn = 0;
  private tutorial: Tutorial | null = null;
  private tutorialArrow: THREE.Group;
  private bars = new Map<Station, WorldLabel>();
  private sinkShown = new Map<Station, number>();
  private coinPiles = new Map<Table, THREE.Group>();
  private lastSecond = -1;
  private timer = new THREE.Timer();
  private t = 0;
  private trailTimer = 0;
  /** Depuração: `?speed=4` roda a simulação 4× mais rápido (útil em testes automatizados). */
  private timeScale = Math.max(1, Math.min(8, Number(new URLSearchParams(location.search).get('speed')) || 1));

  constructor(private container: HTMLElement) {
    const stageEl = document.createElement('div');
    stageEl.className = 'stage';
    container.appendChild(stageEl);
    this.stage = new Stage(stageEl);
    const labelLayer = document.createElement('div');
    labelLayer.className = 'world-ui';
    container.appendChild(labelLayer);
    this.worldUI = new WorldUI(labelLayer);
    this.hud = new Hud(container);
    this.screens = new Screens(container);
    this.particles = new Particles(this.stage.scene);
    this.tutorialArrow = makeArrow();
    this.stage.scene.add(this.tutorialArrow);

    this.input.onKey((code) => {
      audio.unlock();
      if (code === 'Escape' || code === 'KeyP') this.togglePause();
      if (code === 'KeyM') this.hud.toast(audio.toggleMusic() ? '🎵 Música ligada' : '🔇 Música desligada');
    });
    window.addEventListener('pointerdown', () => audio.unlock());

    this.buildWorld();
    this.showTitle();
    this.loop();
  }

  // ───────────────────────────── estados ─────────────────────────────

  private buildWorld(): void {
    if (this.world) {
      this.stage.scene.remove(this.world.root);
      this.world.dispose();
    }
    this.views.clear();
    this.worldUI.clear();
    this.bars.clear();
    this.sinkShown.clear();
    this.coinPiles.clear();
    this.world = new World(this.level);
    this.stage.scene.add(this.world.root);
    for (const s of this.world.stations) {
      if (s.kind === 'bowls') {
        s.bowls = TUNING.kitchen.startingBowls;
        s.refreshStack();
      }
    }
  }

  private showTitle(): void {
    this.state = 'title';
    audio.stopMusic();
    this.hud.show(false);
    this.clearActors();
    this.titleCreatures = HEROES.map((hero, i) => {
      const creature = new Creature(hero, 1.35);
      creature.root.position.set(9.6 + i * 1.25, 0, 5.6 + (i % 2) * 0.35);
      creature.root.rotation.y = 0;
      this.stage.scene.add(creature.root);
      return { hero, creature };
    });
    this.stage.frame(12.1, 6.9, 12, 3.2);
    this.screens.onSelectionChange = (sel) => {
      this.titleCreatures.forEach((c) => {
        if (sel.includes(c.hero)) {
          c.creature.celebrate();
          this.heroBurst(c.hero, c.creature.root.position.clone().setY(1.2));
        }
      });
    };
    this.screens.title(({ heroes, players }) => {
      this.heroes = heroes;
      this.playerCount = players;
      this.day = 1;
      this.startDay();
    });
  }

  private clearActors(): void {
    this.titleCreatures.forEach((c) => this.stage.scene.remove(c.creature.root));
    this.titleCreatures = [];
    this.chefs.forEach((c) => {
      this.stage.scene.remove(c.root);
      this.worldUI.remove(c.hint);
    });
    this.chefs = [];
    this.parties.forEach((p) => p.customers.forEach((c) => this.stage.scene.remove(c.root)));
    this.parties = [];
  }

  private startDay(): void {
    this.clearActors();
    this.buildWorld();
    this.screens.hide();
    this.stage.frame(7.5, 4.6, 16.4, 10);

    this.heroes.slice(0, 2).forEach((hero, i) => {
      const chef = new Chef(hero);
      chef.pos.copy(this.world.spawns[i] ?? new THREE.Vector3(2, 0, 4 + i));
      chef.facing = Math.PI / 2;
      chef.controller = this.playerCount === 2 ? i : i === 0 ? 0 : -1;
      chef.hint = this.worldUI.add('chef-hint', chef.creature.head, 0.55);
      this.stage.scene.add(chef.root);
      this.chefs.push(chef);
    });
    this.refreshChefRings();

    this.timeLeft = this.level.dayLength;
    this.coins = 0;
    this.stats = { served: 0, happy: 0, angry: 0 };
    this.spawnIn = 2.5;
    this.lastSecond = -1;
    this.tutorial = this.day === 1 && this.level.tutorial ? new Tutorial() : null;
    this.hud.setDay(this.day, this.level.starGoals);
    this.hud.setCoins(0);
    this.hud.show(true);
    this.refreshTutorial();
    this.updatePlayerCards();
    this.state = 'countdown';
    this.screens.countdown(() => {
      this.state = 'playing';
      audio.startDayMusic();
      if (this.tutorial) this.hud.toast('Siga a setinha brilhante! ✨', 'info', 3500);
    });
  }

  private endDay(): void {
    this.state = 'results';
    audio.stopMusic();
    audio.whistle();
    // Moedas esquecidas nas mesas entram mesmo assim (jogo gentil)
    for (const t of this.world.tables) {
      this.coins += t.coins;
      t.coins = 0;
    }
    this.hud.setCoins(this.coins);
    this.chefs.forEach((c) => {
      c.creature.celebrate();
      c.workingAt = null;
    });
    const stars = starsFor(this.coins, this.level.starGoals);
    window.setTimeout(() => {
      this.screens.results(
        { coins: this.coins, stars, served: this.stats.served, happy: this.stats.happy, angry: this.stats.angry, goals: this.level.starGoals },
        () => {
          this.day++;
          this.startDay();
        },
        () => {
          this.buildWorld();
          this.showTitle();
        },
      );
    }, 900);
  }

  private togglePause(): void {
    if (this.state === 'playing') {
      this.state = 'paused';
      audio.stopMusic();
      this.screens.pause({
        onResume: () => this.togglePause(),
        onRestart: () => this.startDay(),
        onMenu: () => {
          this.buildWorld();
          this.showTitle();
        },
        musicOn: audio.musicOn,
        onMusic: () => audio.toggleMusic(),
      });
    } else if (this.state === 'paused') {
      this.screens.hide();
      this.state = 'playing';
      audio.startDayMusic();
    }
  }

  // ───────────────────────────── loop ─────────────────────────────

  private loop = (): void => {
    requestAnimationFrame(this.loop);
    this.timer.update();
    const dt = Math.min(0.05, this.timer.getDelta());
    this.t += dt;

    if (this.state === 'playing') {
      const inputs = this.input.read(this.playerCount);
      if (this.input.padPausePressed()) this.togglePause();
      else {
        this.updatePlaying(dt, inputs);
        const idle = inputs.map((i) => ({ ...i, pick: false, use: false, swap: false }));
        for (let i = 1; i < this.timeScale && this.state === 'playing'; i++) this.updatePlaying(dt, idle);
      }
    } else {
      const pads = this.input.pollMenuPads();
      if (pads.pause && this.state === 'paused') this.togglePause();
      if (pads.confirm) (document.activeElement as HTMLElement | null)?.click?.();
      this.chefs.forEach((c) => {
        c.creature.moving = 0;
        c.creature.update(dt);
      });
      this.parties.forEach((p) => p.customers.forEach((c) => c.creature.update(dt)));
      this.titleCreatures.forEach((c, i) => {
        c.creature.update(dt);
        c.creature.root.rotation.y = Math.sin(this.t * 0.8 + i) * 0.25;
      });
    }
    this.input.endFrame();

    this.world.update(dt);
    this.views.update(dt);
    this.particles.update(dt);
    this.updateArrow(dt);
    this.worldUI.update(this.stage);
    this.hud.update(dt);
    this.stage.render(dt);
  };

  private updatePlaying(dt: number, inputs: PlayerInput[]): void {
    // Troca de herói no modo solo
    if (this.playerCount === 1 && inputs[0]?.swap && this.chefs.length > 1) {
      const cur = this.chefs.findIndex((c) => c.controller === 0);
      const next = (cur + 1) % this.chefs.length;
      this.chefs[cur]!.controller = -1;
      this.chefs[next]!.controller = 0;
      this.chefs[next]!.creature.hop();
      audio.swap();
      this.burst(this.chefs[next]!.pos.clone().setY(0.5), { kind: 'sparkle', count: 10, colors: [0x4fc3ff, 0xffffff] });
      this.refreshChefRings();
      this.updatePlayerCards();
    }

    for (const chef of this.chefs) {
      const input = chef.controller >= 0 ? inputs[chef.controller] ?? null : null;
      chef.move(input, this.world, dt);
    }
    if (this.chefs.length > 1) this.chefs[0]!.separate(this.chefs[1]!);

    // Alvos, dicas e ações
    this.world.stations.forEach((s) => (s.highlight.visible = false));
    this.world.tables.forEach((t) => (t.highlight.visible = false));
    for (const chef of this.chefs) {
      if (chef.controller < 0) {
        this.showIdleHint(chef);
        continue;
      }
      const input = inputs[chef.controller]!;
      const target = findTarget(this.world, chef);
      this.highlight(target, PLAYER_COLORS[chef.controller]!);
      const pick = pickAction(this, chef, target);
      const use = useAction(this, chef, target);
      this.showHint(chef, pick, use);
      if (input.pick) this.runAction(pick);
      if (input.use) this.runAction(use ?? (pick?.label === 'Anotar pedido' ? pick : null));
    }

    this.updateWork(dt);
    this.updateParties(dt);
    this.updateSpawns(dt);
    this.updateStationsVisuals();
    this.updateTrails(dt);

    // Relógio
    const frozen = !!this.tutorial?.clockFrozen;
    if (!frozen) this.timeLeft -= dt;
    this.hud.setClock(this.timeLeft, this.level.dayLength, frozen);
    const sec = Math.ceil(this.timeLeft);
    if (sec !== this.lastSecond) {
      if (sec === 30) this.hud.toast('⏰ Últimos 30 segundos!', 'bad');
      if (sec <= 10 && sec > 0) audio.tick();
      this.lastSecond = sec;
    }
    this.hud.syncOrders(
      this.parties.map((p) => p.party),
      (party) => this.parties.find((p) => p.party === party)!.look.species,
    );
    if (this.timeLeft <= 0) this.endDay();
  }

  private runAction(action: Action | null): void {
    if (!action) return;
    if (action.disabled) {
      audio.deny();
      this.hud.toast(`🙅 ${action.label}`, 'bad', 1400);
    }
    action.run();
  }

  // ───────────────────────────── ActionHost ─────────────────────────────

  hold(chef: Chef, item: Item | null): void {
    if (chef.held && chef.held !== item) this.views.get(chef.held)?.removeFromParent();
    chef.held = item;
    if (item) {
      this.views.attach(item, chef.creature.holdAnchor, -0.05);
      this.views.pop(item);
    }
  }

  place(station: Station, item: Item | null): void {
    if (station.item && station.item !== item) this.views.get(station.item)?.removeFromParent();
    station.item = item;
    if (item) {
      this.views.attach(item, station.anchor, 0);
      this.views.pop(item);
    }
  }

  emit(e: GameEvent): void {
    switch (e.type) {
      case 'pickup':
        audio.pickup();
        e.chef.creature.hop();
        if (e.item.type === 'ingredient' && e.item.kind === 'lettuce' && e.from === 'crate') this.tutorialEvent('pickLettuce');
        break;
      case 'place':
        audio.drop();
        e.chef.creature.hop();
        if (e.station.kind === 'sink') this.burst(e.station.worldTop.clone().setY(1), { kind: 'dot', colors: [0xbfe8ff, 0xffffff], count: 8, up: 1.5 });
        break;
      case 'merge': {
        audio.drop();
        const recipe = bowlRecipe(e.bowl);
        this.burst(e.at.clone().setY(1.1), { kind: 'sparkle', count: recipe ? 18 : 8, colors: [0xfff27a, 0xffffff, 0xb58cff] });
        if (recipe) {
          audio.done();
          this.worldUI.popup(`${recipe.emoji} ${recipe.name}!`, e.at.clone().setY(1.4));
          this.tutorialEvent('saladReady');
        }
        break;
      }
      case 'trash':
        audio.drop();
        this.burst(e.at.clone().setY(0.9), { kind: 'leaf', count: 6, colors: [0x8fd16a, 0xd8f7a5], additive: false });
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
    this.burst(new THREE.Vector3(table.x, 1.6, table.z), { kind: 'sparkle', count: 10, colors: [0xfff27a, 0xffffff] });
    const names = ap.party.members.map((m) => RECIPES[m.recipe].name);
    this.hud.toast(`📝 ${names.join(' + ')}`, 'info', 1800);
    this.tutorialEvent('orderTaken');
  }

  serve(table: Table, chef: Chef): void {
    const ap = this.parties.find((p) => p.table === table);
    const dish = chef.held;
    const recipe = bowlRecipe(dish);
    if (!ap || !dish || !recipe) return;
    const idx = ap.party.serve(recipe.id);
    if (idx < 0) return;
    const seat = table.seats[idx]!;
    this.hold(chef, null);
    seat.dish = dish;
    this.views.attach(dish, seat.plate, 0);
    this.views.pop(dish);
    ap.customers[idx]!.creature.eating = true;
    this.stats.served++;
    audio.serve();
    chef.creature.celebrate();
    this.heroBurst(chef.hero, chef.pos.clone().setY(1.2));
    this.burst(seat.plate.getWorldPosition(new THREE.Vector3()).setY(1.1), { kind: 'sparkle', count: 16, colors: [0xffd700, 0xfff27a, 0xffffff] });
    this.tutorialEvent('served');
  }

  clearDish(table: Table, chef: Chef): void {
    const seat = table.seats.find((s) => s.dish?.type === 'bowl' && s.dish.dirty);
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
      this.flyCoins(new THREE.Vector3(table.x, 1, table.z), amount);
      this.worldUI.popup(`+${amount} 🪙`, new THREE.Vector3(table.x, 1.5, table.z), 'pop coin');
    }
    this.tutorialEvent('cleared');
  }

  startWork(chef: Chef, station: Station): void {
    chef.workingAt = station;
    chef.vel.set(0, 0, 0);
    // Vira para a estação
    chef.facing = Math.atan2(station.x - chef.pos.x, station.z - chef.pos.z);
  }

  // ───────────────────────────── sistemas ─────────────────────────────

  private updateWork(dt: number): void {
    for (const s of this.world.stations) s.busy = false;
    for (const chef of this.chefs) {
      const s = chef.workingAt;
      if (!s) continue;
      const valid = s.kind === 'board' ? s.item?.type === 'ingredient' && !s.item.chopped : s.kind === 'sink' && s.dirty.length > 0;
      if (!valid || s.busy) {
        chef.workingAt = null;
        continue;
      }
      s.busy = true;
      const before = s.progress;
      const total = s.kind === 'board' ? TUNING.work.chopTime : TUNING.work.washTime;
      s.progress = Math.min(1, s.progress + dt / total);
      const beat = 0.22;
      if (Math.floor(before / (beat / total)) !== Math.floor(s.progress / (beat / total))) {
        if (s.kind === 'board') {
          audio.chop();
          const color = s.item?.type === 'ingredient' ? INGREDIENTS[s.item.kind].color : 0xffffff;
          this.burst(s.worldTop.clone().setY(1.05), { kind: 'dot', count: 3, colors: [color], speed: 1, up: 1.2, size: 0.12, additive: false });
        } else {
          audio.splash();
          this.burst(s.worldTop.clone().setY(1.0), { kind: 'dot', count: 4, colors: [0xbfe8ff, 0xffffff], speed: 0.8, up: 1.4, size: 0.16 });
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
          this.views.pop(s.item);
          this.burst(s.worldTop.clone().setY(1.1), { kind: 'sparkle', count: 10, colors: [0xffffff, 0xfff27a] });
          this.tutorialEvent('chopped');
        } else if (s.kind === 'sink') {
          s.dirty.shift();
          const stack = this.world.stations.find((st) => st.kind === 'bowls');
          if (stack) {
            stack.bowls++;
            stack.refreshStack();
            this.burst(stack.worldTop.clone().setY(1.2), { kind: 'sparkle', count: 10, colors: [0xbfe8ff, 0xffffff] });
          }
          this.tutorialEvent('washed');
        }
      }
    }
  }

  private updateStationsVisuals(): void {
    for (const s of this.world.stations) {
      const needsBar = s.progress > 0 && ((s.kind === 'board' && s.item?.type === 'ingredient' && !s.item.chopped) || (s.kind === 'sink' && s.dirty.length > 0));
      let bar = this.bars.get(s);
      if (needsBar && !bar) {
        bar = this.worldUI.add('work-bar', s.anchor, 0.55);
        this.bars.set(s, bar);
      }
      if (bar) {
        bar.visible = needsBar;
        bar.html = `<i style="width:${(s.progress * 100).toFixed(0)}%"></i>`;
      }
      if (s.kind === 'board' && s.knife && !s.busy) s.knife.position.y = 0.99;
      if (s.kind === 'sink' && s.dirtyGroup && this.sinkShown.get(s) !== s.dirty.length) {
        s.dirtyGroup.clear();
        s.dirty.forEach((_, i) => {
          const b = bowlMesh([], true, false);
          b.position.set(0, i * 0.06, 0);
          b.rotation.set(0.15, i, 0);
          s.dirtyGroup!.add(b);
        });
        this.sinkShown.set(s, s.dirty.length);
      }
    }
  }

  private updateSpawns(dt: number): void {
    if (this.timeLeft < 12) return;
    const tut = this.tutorial;
    const firstParty = this.stats.served === 0 && this.parties.length === 0 && tut && !tut.isDone('orderTaken');
    if (tut?.spawnsBlocked && !firstParty) return;
    this.spawnIn -= dt;
    if (this.spawnIn > 0) return;
    const free = this.world.tables.filter((t) => t.free);
    if (!free.length) {
      this.spawnIn = 2;
      return;
    }
    const maxSeats = Math.max(...free.map((t) => t.capacity));
    const recipes = firstParty ? (['salad_green'] as const) : rollParty(this.level, maxSeats, Math.random);
    const fitting = free.filter((t) => t.capacity >= recipes.length);
    const table = firstParty ? free.sort((a, b) => a.x - b.x || a.z - b.z)[0]! : fitting[Math.floor(Math.random() * fitting.length)]!;
    this.spawnParty(table, [...recipes]);
    this.spawnIn = nextSpawnDelay(this.level, Math.random) * (this.parties.length > 2 ? 1.3 : 1);
  }

  private spawnParty(table: Table, recipes: Party['members'][number]['recipe'][]): void {
    const party = new Party(recipes);
    table.party = party;
    const look = CUSTOMER_LOOKS[Math.floor(Math.random() * CUSTOMER_LOOKS.length)]!;
    const door = this.world.door;
    const ap: ActiveParty = {
      party,
      table,
      customers: [],
      labels: [],
      look,
      orderBubble: this.worldUI.add('order-bubble', new THREE.Vector3(table.x, 1.75, table.z)),
      seated: 0,
      gone: 0,
    };
    ap.orderBubble.visible = false;
    recipes.forEach((_, i) => {
      const seat = table.seats[i]!;
      // Adultos e filhotes: o primeiro é maior
      const c = new Customer(look, i === 0 ? 1.15 : 0.95);
      c.pos.set(door.x + 2.5 + i * 0.9, 0, door.z);
      const rowZ = table.z - 0.95;
      const path = [
        new THREE.Vector3(door.x, 0, door.z),
        new THREE.Vector3(this.world.aisleX, 0, door.z),
        new THREE.Vector3(this.world.aisleX, 0, rowZ),
        new THREE.Vector3(seat.pos.x, 0, rowZ),
        seat.pos.clone(),
      ];
      c.walk(
        path,
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
      this.stage.scene.add(c.root);
      ap.customers.push(c);
      ap.labels.push(this.worldUI.add('cbubble', c.creature.head, 0.42));
    });
    this.parties.push(ap);
  }

  private updateParties(dt: number): void {
    for (const ap of [...this.parties]) {
      const { party, table } = ap;
      const events = party.update(dt);
      for (const e of events) this.onPartyEvent(ap, e);

      ap.customers.forEach((c) => c.update(dt));

      // Balão ❗ com anel de paciência enquanto espera anotar
      ap.orderBubble.visible = party.phase === 'waitingOrder';
      if (ap.orderBubble.visible) {
        const p = party.patience;
        ap.orderBubble.html = `<div class="ring" style="--p:${(p * 360).toFixed(0)}deg;--c:${patienceColor(p)}"><span>❗</span></div>`;
      }
      ap.customers.forEach((c, i) => {
        const m = party.members[i]!;
        const label = ap.labels[i]!;
        let html = '';
        if (party.phase === 'angry') html = '💢';
        else if (party.phase === 'finished') html = '💖';
        else if (party.phase === 'ordered') {
          if (!m.served) {
            const ings = RECIPES[m.recipe].ingredients.map((k) => INGREDIENTS[k].emoji).join('');
            html = `<span class="want" style="border-color:${patienceColor(party.patience)}">${ings}</span>`;
          } else html = m.done ? '💖' : '😋';
        }
        label.visible = !!html && c.state !== 'gone';
        label.html = html;
      });

      // Todos saíram: libera
      if (party.isLeaving && ap.gone >= ap.customers.length) {
        ap.customers.forEach((c) => this.stage.scene.remove(c.root));
        ap.labels.forEach((l) => this.worldUI.remove(l));
        this.worldUI.remove(ap.orderBubble);
        this.parties.splice(this.parties.indexOf(ap), 1);
        table.seats.forEach((s) => {
          if (ap.customers.includes(s.customer!)) s.customer = null;
        });
      }
    }
  }

  private onPartyEvent(ap: ActiveParty, e: PartyEvent): void {
    const { table } = ap;
    switch (e.type) {
      case 'memberDone': {
        const seat = table.seats[e.member]!;
        const dish = seat.dish;
        if (dish?.type === 'bowl') {
          dish.dirty = true;
          dish.contents = [];
          dish.version++;
        }
        ap.customers[e.member]!.creature.eating = false;
        table.coins += e.coins;
        this.refreshCoinPile(table);
        audio.coin();
        this.worldUI.popup(`+${e.coins} 🪙`, seat.plate.getWorldPosition(new THREE.Vector3()).setY(1.3), 'pop coin');
        break;
      }
      case 'banquet':
        table.coins += e.bonus;
        this.refreshCoinPile(table);
        audio.banquet();
        this.stage.addShake(0.12);
        this.hud.toast(`🎉 Banquete completo! Bônus +${e.bonus} 🪙`, 'good', 2600);
        this.burst(new THREE.Vector3(table.x, 1.4, table.z), { kind: 'sparkle', count: 40, speed: 3, up: 3.5, colors: [0xffd700, 0xff7fb0, 0x7fd8ff, 0xb58cff] });
        break;
      case 'finished':
        this.stats.happy += ap.party.size;
        ap.customers.forEach((c) => {
          c.creature.celebrate();
          this.burst(c.pos.clone().setY(1.2), { kind: 'heart', count: 5, colors: [0xff7fb0, 0xffb3d1], additive: false, up: 2.5 });
        });
        this.leave(ap);
        break;
      case 'angry':
        this.stats.angry += ap.party.size;
        audio.angry();
        this.hud.toast('💢 Um cliente cansou de esperar…', 'bad');
        // Quem estava comendo larga o prato (vira louça suja)
        table.seats.forEach((s) => {
          if (s.dish?.type === 'bowl' && !s.dish.dirty) {
            s.dish.dirty = true;
            s.dish.contents = [];
            s.dish.version++;
          }
        });
        this.leave(ap);
        break;
    }
  }

  private leave(ap: ActiveParty): void {
    const { table } = ap;
    table.party = null;
    const door = this.world.door;
    ap.customers.forEach((c, i) => {
      c.creature.eating = false;
      const rowZ = table.z - 0.95;
      c.walk(
        [
          new THREE.Vector3(c.pos.x, 0, rowZ),
          new THREE.Vector3(this.world.aisleX, 0, rowZ),
          new THREE.Vector3(this.world.aisleX, 0, door.z),
          new THREE.Vector3(door.x, 0, door.z),
          new THREE.Vector3(door.x + 4 + i, 0, door.z),
        ],
        () => {
          c.state = 'gone';
          c.root.visible = false;
          ap.gone++;
        },
      );
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
    const keys = this.playerCount === 1 ? KEYS_BY_SLOT[0]! : KEYS_BY_SLOT[chef.controller]!;
    const row = (k: string, a: Action) => `<div class="hint${a.disabled ? ' off' : ''}"><kbd>${a.disabled ? '✖' : k}</kbd>${a.label}</div>`;
    let html = '';
    if (pick) html += row(keys.pick, pick);
    if (use && use.label !== pick?.label) html += row(keys.use, use);
    label.visible = true;
    label.html = html;
  }

  private showIdleHint(chef: Chef): void {
    const label = chef.hint!;
    label.visible = this.playerCount === 1;
    label.html = `<div class="hint idle"><kbd>Q</kbd>trocar</div>`;
  }

  private refreshChefRings(): void {
    this.chefs.forEach((c) => c.setRingColor(c.controller >= 0 ? PLAYER_COLORS[c.controller]! : null));
  }

  private updatePlayerCards(): void {
    this.hud.setPlayers(
      this.chefs.map((c, i) => {
        const slot = this.playerCount === 2 ? i : 0;
        const k = KEYS_BY_SLOT[slot]!;
        return {
          hero: c.hero,
          label: this.playerCount === 2 ? `Jogador ${i + 1}` : c.controller === 0 ? 'Você' : 'Descansando (Q)',
          keys: this.playerCount === 2 && i === 1 ? `Setas · ${k.pick} · ${k.use}` : `WASD · ${k.pick} · ${k.use}`,
          color: PLAYER_COLORS[slot]!,
          active: c.controller >= 0,
        };
      }),
    );
  }

  private burst(at: THREE.Vector3, opts: BurstOpts): void {
    this.particles.burst(at, opts);
  }

  /** Comemoração com a "assinatura" de cada herói (corações, folhas, faíscas...). */
  private heroBurst(hero: HeroDef, at: THREE.Vector3): void {
    switch (hero.celebrate) {
      case 'hearts':
        this.burst(at, { kind: 'heart', count: 8, colors: [0xff7fb0, 0xffb3d1], additive: false });
        break;
      case 'leaves':
        this.burst(at, { kind: 'leaf', count: 10, colors: [0xffa25e, 0xffc94d, 0xd9531e], additive: false, gravity: 2 });
        break;
      case 'sparks':
        this.burst(at, { kind: 'sparkle', count: 18, colors: [0xff5a5a, 0xffd23f, 0x3fd2ff, 0x9dff6b, 0xff7fe0], speed: 3, up: 3 });
        break;
      case 'stars':
        this.burst(at, { kind: 'sparkle', count: 14, colors: [0x9fd0ff, 0xffffff, 0xfff27a], speed: 2 });
        break;
      case 'dust':
        this.burst(at, { kind: 'dot', count: 16, colors: [0xf6e7ff, 0xc7a5e8, 0xffffff], speed: 1.5, gravity: 1 });
        break;
    }
  }

  /** Rastro sutil: pó cintilante da Estrelinha e faíscas do Pipoca ao correr. */
  private updateTrails(dt: number): void {
    this.trailTimer -= dt;
    if (this.trailTimer > 0) return;
    this.trailTimer = 0.12;
    for (const c of this.chefs) {
      if (c.creature.moving < 0.5) continue;
      const at = c.pos.clone().setY(0.6).addScaledVector(c.forward, -0.3);
      if (c.hero.celebrate === 'dust') this.burst(at, { kind: 'dot', count: 1, colors: [0xf6e7ff], speed: 0.2, up: 0.4, gravity: -0.3, size: 0.14 });
      if (c.hero.celebrate === 'sparks' && Math.random() < 0.35) this.burst(at, { kind: 'sparkle', count: 1, colors: [0xffd23f, 0xff7fe0], speed: 0.5, up: 1, size: 0.12 });
    }
  }

  private flyCoins(from: THREE.Vector3, amount: number): void {
    const start = { x: 0, y: 0, visible: true };
    this.stage.toScreen(from, start);
    const end = this.hud.coinsScreenPos();
    const n = Math.min(8, 2 + Math.floor(amount / 5));
    for (let i = 0; i < n; i++) {
      const c = document.createElement('div');
      c.className = 'fly-coin';
      c.textContent = '🪙';
      c.style.left = `${start.x + (Math.random() - 0.5) * 40}px`;
      c.style.top = `${start.y + (Math.random() - 0.5) * 30}px`;
      this.container.appendChild(c);
      window.setTimeout(() => {
        c.style.left = `${end.x}px`;
        c.style.top = `${end.y}px`;
        c.style.transform = 'scale(0.6)';
      }, 30 + i * 60);
      window.setTimeout(() => {
        c.remove();
        audio.coin();
        if (i === n - 1) this.hud.setCoins(this.coins);
      }, 700 + i * 60);
    }
  }

  // ───────────────────────────── tutorial ─────────────────────────────

  private tutorialEvent(e: TutorialEvent): void {
    const tut = this.tutorial;
    if (!tut || !tut.handle(e)) return;
    audio.done();
    this.refreshTutorial();
    if (tut.finished) {
      this.hud.toast('🎉 Tutorial completo! Agora é com vocês!', 'good', 3200);
      this.hud.setTutorial(null, 0);
      this.tutorial = null;
    }
  }

  private refreshTutorial(): void {
    const tut = this.tutorial;
    this.hud.setTutorial(tut ? tut.steps : null, tut?.current ?? 0);
  }

  private updateArrow(dt: number): void {
    const arrow = this.tutorialArrow;
    const focus = this.state === 'playing' ? this.tutorial?.focus : null;
    let pos: THREE.Vector3 | null = null;
    const station = (k: Station['kind'], ing?: string) => this.world.stations.find((s) => s.kind === k && (!ing || s.ingredient === ing));
    switch (focus) {
      case 'firstTable': {
        const ap = this.parties[0];
        if (ap) pos = new THREE.Vector3(ap.table.x, 1.9, ap.table.z);
        break;
      }
      case 'crateLettuce':
        pos = station('crate', 'lettuce')?.worldTop.setY(1.9) ?? null;
        break;
      case 'board': {
        const b = this.world.stations.find((s) => s.kind === 'board' && s.item) ?? station('board');
        pos = b?.worldTop.setY(1.9) ?? null;
        break;
      }
      case 'bowls':
        pos = station('bowls')?.worldTop.setY(1.9) ?? null;
        break;
      case 'sink':
        pos = station('sink')?.worldTop.setY(1.9) ?? null;
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
