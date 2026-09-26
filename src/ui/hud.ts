import type { HeroDef, Species } from '../data/characters';
import { INGREDIENTS } from '../data/ingredients';
import { RECIPES } from '../data/recipes';
import type { Party } from '../sim/party';

export const SPECIES_EMOJI: Record<Species, string> = {
  bunny: '🐰',
  fox: '🦊',
  dragon: '🐲',
  wolf: '🐺',
  owl: '🦉',
  bear: '🐻',
  cat: '🐱',
  mouse: '🐭',
  frog: '🐸',
  hedgehog: '🦔',
};

export function patienceColor(p: number): string {
  if (p > 0.6) return '#5fd38a';
  if (p > 0.3) return '#ffc94d';
  return '#ff6b6b';
}

export function hex(c: number): string {
  return `#${c.toString(16).padStart(6, '0')}`;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, html = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

interface Ticket {
  root: HTMLDivElement;
  bar: HTMLDivElement;
  dishes: HTMLDivElement[];
}

export interface PlayerCardInfo {
  hero: HeroDef;
  label: string;
  keys: string;
  color: number;
  active: boolean;
}

/** Interface do dia: relógio, comandas, moedas, jogadores, tutorial, avisos. */
export class Hud {
  readonly root: HTMLDivElement;
  private clock: HTMLDivElement;
  private clockText: HTMLSpanElement;
  private clockRing: HTMLDivElement;
  private coinsText: HTMLSpanElement;
  private coinsBox: HTMLDivElement;
  private goalFill: HTMLDivElement;
  private goalStars: HTMLSpanElement[] = [];
  private orders: HTMLDivElement;
  private players: HTMLDivElement;
  private tutorial: HTMLDivElement;
  private toastBox: HTMLDivElement;
  private tickets = new Map<number, Ticket>();
  private shownCoins = 0;
  private targetCoins = 0;
  private goals: readonly [number, number, number] = [1, 2, 3];

  constructor(parent: HTMLElement) {
    this.root = el('div', 'hud hidden');
    parent.appendChild(this.root);

    const top = el('div', 'hud-top');
    this.clock = el('div', 'clock');
    this.clockRing = el('div', 'clock-ring');
    this.clockText = el('span', 'clock-text', '3:30');
    this.clock.append(this.clockRing, this.clockText);
    const clockWrap = el('div', 'clock-wrap');
    clockWrap.append(this.clock, el('div', 'day-label', 'Dia 1'));

    this.orders = el('div', 'orders');

    this.coinsBox = el('div', 'coins');
    this.coinsText = el('span', 'coins-text', '0');
    this.coinsBox.append(el('span', 'coin-icon', '🪙'), this.coinsText);
    const goal = el('div', 'goal');
    const goalBar = el('div', 'goal-bar');
    this.goalFill = el('div', 'goal-fill');
    goalBar.appendChild(this.goalFill);
    const starsRow = el('div', 'goal-stars');
    for (let i = 0; i < 3; i++) {
      const s = el('span', 'goal-star', '★');
      this.goalStars.push(s);
      starsRow.appendChild(s);
    }
    goal.append(goalBar, starsRow);
    const right = el('div', 'coins-wrap');
    right.append(this.coinsBox, goal);

    top.append(clockWrap, this.orders, right);

    this.players = el('div', 'players');
    this.tutorial = el('div', 'tutorial hidden');
    this.toastBox = el('div', 'toasts');
    this.root.append(top, this.players, this.tutorial, this.toastBox);
  }

  show(v: boolean): void {
    this.root.classList.toggle('hidden', !v);
  }

  setDay(day: number, goals: readonly [number, number, number]): void {
    this.root.querySelector('.day-label')!.textContent = `Dia ${day}`;
    this.goals = goals;
    this.shownCoins = this.targetCoins = 0;
    this.coinsText.textContent = '0';
    this.tickets.forEach((t) => t.root.remove());
    this.tickets.clear();
  }

  setClock(timeLeft: number, total: number, frozen: boolean): void {
    const t = Math.max(0, Math.ceil(timeLeft));
    this.clockText.textContent = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
    const frac = Math.max(0, timeLeft / total);
    this.clockRing.style.background = `conic-gradient(${timeLeft < 30 ? '#ff6b6b' : '#ffc94d'} ${frac * 360}deg, rgba(255,255,255,0.25) 0deg)`;
    this.clock.classList.toggle('urgent', timeLeft < 30 && !frozen);
    this.clock.classList.toggle('frozen', frozen);
  }

  setCoins(coins: number): void {
    if (coins > this.targetCoins) {
      this.coinsBox.classList.remove('bump');
      void this.coinsBox.offsetWidth;
      this.coinsBox.classList.add('bump');
    }
    this.targetCoins = coins;
  }

  /** Posição (em pixels) do contador de moedas — destino das moedinhas voando. */
  coinsScreenPos(): { x: number; y: number } {
    const r = this.coinsBox.getBoundingClientRect();
    return { x: r.left + 24, y: r.top + r.height / 2 };
  }

  setPlayers(cards: PlayerCardInfo[]): void {
    this.players.innerHTML = '';
    for (const c of cards) {
      const card = el('div', `pcard${c.active ? ' active' : ''}`);
      card.style.setProperty('--pc', hex(c.color));
      card.innerHTML = `
        <div class="pcard-face" style="background:${hex(c.hero.body)}">${SPECIES_EMOJI[c.hero.species]}</div>
        <div class="pcard-info"><b>${c.hero.name}</b><small>${c.label}</small><small class="keys">${c.keys}</small></div>`;
      this.players.appendChild(card);
    }
  }

  /** Atualiza as comandas no topo (só grupos cujo pedido já foi anotado). */
  syncOrders(parties: Party[], speciesOf: (p: Party) => Species): void {
    const alive = new Set<number>();
    for (const p of parties) {
      if (p.phase !== 'ordered') continue;
      alive.add(p.id);
      let t = this.tickets.get(p.id);
      if (!t) {
        const root = el('div', `ticket${p.size >= 3 ? ' family' : ''}`);
        const head = el('div', 'ticket-head', `${SPECIES_EMOJI[speciesOf(p)]}${p.size > 1 ? `<span>×${p.size}</span>` : ''}`);
        const list = el('div', 'ticket-dishes');
        const dishes = p.members.map((m) => {
          const r = RECIPES[m.recipe];
          const ings = r.ingredients.map((k) => INGREDIENTS[k].emoji).join('');
          const d = el('div', 'dish', `<span class="dish-ings">${ings}</span><small>${r.name}</small><i class="seal">✔</i>`);
          list.appendChild(d);
          return d;
        });
        const barWrap = el('div', 'ticket-bar');
        const bar = el('div', 'ticket-fill');
        barWrap.appendChild(bar);
        root.append(head, list, barWrap);
        this.orders.appendChild(root);
        t = { root, bar, dishes };
        this.tickets.set(p.id, t);
      }
      t.bar.style.width = `${p.patience * 100}%`;
      t.bar.style.background = patienceColor(p.patience);
      t.root.classList.toggle('hurry', p.patience < 0.3);
      p.members.forEach((m, i) => t!.dishes[i]!.classList.toggle('served', m.served));
    }
    for (const [id, t] of this.tickets) {
      if (!alive.has(id)) {
        t.root.classList.add('leaving');
        this.tickets.delete(id);
        window.setTimeout(() => t.root.remove(), 400);
      }
    }
  }

  setTutorial(steps: { text: string; done: boolean }[] | null, current: number, keys = { pick: 'Espaço', use: 'E' }): void {
    this.tutorial.classList.toggle('hidden', !steps);
    if (!steps) return;
    this.tutorial.innerHTML =
      `<h3>🍄 Aprendendo!</h3>` +
      steps
        .map((s, i) => `<div class="tstep${s.done ? ' done' : ''}${i === current ? ' current' : ''}">${s.done ? '✅' : i === current ? '👉' : '⬜'} ${s.text.replaceAll('{pick}', `<kbd>${keys.pick}</kbd>`).replaceAll('{use}', `<kbd>${keys.use}</kbd>`)}</div>`)
        .join('');
  }

  toast(text: string, kind: 'info' | 'good' | 'bad' = 'info', ms = 2200): void {
    const t = el('div', `toast ${kind}`, text);
    this.toastBox.appendChild(t);
    window.setTimeout(() => t.classList.add('out'), ms);
    window.setTimeout(() => t.remove(), ms + 500);
  }

  update(dt: number): void {
    if (this.shownCoins !== this.targetCoins) {
      const step = Math.max(1, Math.ceil(Math.abs(this.targetCoins - this.shownCoins) * dt * 6));
      this.shownCoins += Math.sign(this.targetCoins - this.shownCoins) * Math.min(step, Math.abs(this.targetCoins - this.shownCoins));
      this.coinsText.textContent = String(this.shownCoins);
    }
    const max = this.goals[2];
    this.goalFill.style.width = `${Math.min(1, this.shownCoins / max) * 100}%`;
    this.goalStars.forEach((s, i) => {
      s.classList.toggle('lit', this.shownCoins >= this.goals[i]!);
      s.style.left = `${(this.goals[i]! / max) * 100}%`;
    });
  }
}
