import { audio } from '../core/audio';
import { familyDef } from '../data/families';
import { DECOR_SLOTS, WALLS, furnitureDef, type FurnitureDef, type FurnitureId, type SlotKind, type WallId } from '../data/furniture';
import { charm, nextFamily, placedCount, shopCatalog, totalStars, unplaced, type SaveData } from '../sim/progress';
import { TUNING } from '../config';

type Tab = SlotKind | 'colors' | 'mine';

const TABS: { id: Tab; label: string }[] = [
  { id: 'family', label: '🪑 Mesas' },
  { id: 'light', label: '💡 Luzes' },
  { id: 'corner', label: '🌿 Enfeites' },
  { id: 'rug', label: '🧶 Tapetes' },
  { id: 'wall', label: '🖼️ Parede' },
  { id: 'colors', label: '🎨 Cores' },
  { id: 'mine', label: '📦 Meus móveis' },
];

export interface NightActions {
  buy(id: FurnitureId): void;
  buyWall(id: WallId): void;
  useWall(id: WallId): void;
  /** Começa a escolher o lugar de um móvel. */
  choose(id: FurnitureId): void;
  /** Mostra (pré-visualiza) um espaço. */
  preview(slotId: string | null): void;
  placeAt(slotId: string): void;
  cancelPlace(): void;
  store(slotId: string): void;
  morning(): void;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, html = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

/** Painel da loja noturna (lado direito da tela). */
export class NightPanel {
  readonly root: HTMLDivElement;
  private tab: Tab = 'family';
  private placing: FurnitureId | null = null;

  constructor(
    parent: HTMLElement,
    private actions: NightActions,
  ) {
    this.root = el('div', 'night-panel');
    parent.appendChild(this.root);
  }

  get width(): number {
    return this.root.getBoundingClientRect().width + 24;
  }

  destroy(): void {
    this.root.remove();
  }

  setPlacing(id: FurnitureId | null): void {
    this.placing = id;
  }

  render(save: SaveData): void {
    const focusedKey = (document.activeElement as HTMLElement | null)?.dataset.key;
    this.root.innerHTML = '';
    const c = charm(save);
    const bonus = Math.round(Math.min(TUNING.decor.maxCharmBonus, c * TUNING.decor.charmPerPoint) * 100);
    const fam = nextFamily(save);
    const head = el(
      'div',
      'np-head',
      `<h2>🌙 Noite no Bistrô</h2>
       <div class="np-stats">
         <span class="np-coins">🪙 ${save.wallet}</span>
         <span class="np-charm" title="Clientes ficam mais pacientes">✨ Charme ${c} <small>(${bonus}% mais paciência)</small></span>
       </div>
       <p class="np-rest">😴 A equipe está descansando: amanhã cortam, lavam e cozinham mais rápido!</p>
       ${fam ? `<p class="np-goal">${fam.emoji} ${fam.name}: ⭐ ${Math.min(totalStars(save), fam.starsToUnlock)}/${fam.starsToUnlock}${fam.available ? '' : ' <small>(em breve)</small>'}</p>` : ''}`,
    );
    this.root.appendChild(head);

    if (this.placing) {
      this.root.appendChild(this.renderPlacing(save, this.placing));
    } else {
      const tabs = el('div', 'np-tabs');
      for (const t of TABS) {
        const b = el('button', `np-tab${t.id === this.tab ? ' on' : ''}`, t.label);
        b.dataset.key = `tab-${t.id}`;
        b.onclick = () => {
          audio.click();
          this.tab = t.id;
          this.render(save);
        };
        tabs.appendChild(b);
      }
      this.root.appendChild(tabs);
      const list = el('div', 'np-list');
      if (this.tab === 'colors') this.renderWalls(list, save);
      else if (this.tab === 'mine') this.renderMine(list, save);
      else for (const f of shopCatalog(save).filter((f) => f.kind === this.tab)) list.appendChild(this.card(f, save));
      this.root.appendChild(list);
    }

    const morning = el('button', 'btn big np-morning', '☀️ Abrir o bistrô!');
    morning.dataset.key = 'morning';
    morning.onclick = () => this.actions.morning();
    this.root.appendChild(morning);

    const again = focusedKey ? this.root.querySelector<HTMLElement>(`[data-key="${focusedKey}"]`) : null;
    (again ?? this.root.querySelector<HTMLElement>('.np-list button:not([disabled]), .np-slots button') ?? morning).focus({ preventScroll: true });
  }

  private card(f: FurnitureDef, save: SaveData): HTMLElement {
    const owned = save.owned[f.id] ?? 0;
    const onFloor = placedCount(save, f.id);
    const free = owned - onFloor;
    const card = el(
      'div',
      'np-card',
      `<div class="np-emoji">${f.emoji}</div>
       <div class="np-info"><b>${f.name}</b><small>${f.blurb}</small>
       <span class="np-tags">✨ +${f.charm}${f.seats ? ` · 🪑 ${f.seats} lugares` : ''}${f.family ? ` · ${familyDef(f.family).emoji}` : ''}${owned ? ` · 📦 ${owned}` : ''}</span></div>`,
    );
    const btns = el('div', 'np-btns');
    if (free > 0) {
      const place = el('button', 'btn small', '📍 Colocar');
      place.dataset.key = `place-${f.id}`;
      place.onclick = () => this.actions.choose(f.id);
      btns.appendChild(place);
    }
    const buy = el('button', 'btn small buy', save.wallet >= f.price ? `Comprar 🪙${f.price}` : `🪙${f.price}`);
    buy.dataset.key = `buy-${f.id}`;
    buy.disabled = save.wallet < f.price;
    buy.title = buy.disabled ? `Faltam ${f.price - save.wallet} moedas` : '';
    buy.onclick = () => this.actions.buy(f.id);
    btns.appendChild(buy);
    card.appendChild(btns);
    return card;
  }

  private renderWalls(list: HTMLElement, save: SaveData): void {
    for (const w of WALLS) {
      const owned = save.wallsOwned.includes(w.id);
      const using = save.wall === w.id;
      const card = el(
        'div',
        'np-card',
        `<div class="np-emoji swatch" style="background:repeating-linear-gradient(90deg, ${w.base} 0 10px, ${w.stripe} 10px 20px)"><i style="background:${w.motif}"></i></div>
         <div class="np-info"><b>Parede ${w.name}</b><span class="np-tags">✨ +${w.charm}</span></div>`,
      );
      const btn = el('button', 'btn small buy', using ? '✓ Usando' : owned ? 'Usar' : `Comprar 🪙${w.price}`);
      btn.dataset.key = `wall-${w.id}`;
      btn.disabled = using || (!owned && save.wallet < w.price);
      btn.onclick = () => (owned ? this.actions.useWall(w.id) : this.actions.buyWall(w.id));
      card.appendChild(btn);
      list.appendChild(card);
    }
  }

  private renderMine(list: HTMLElement, save: SaveData): void {
    const placed = Object.entries(save.placed);
    const loose = unplaced(save);
    if (!placed.length && !loose.length) {
      list.appendChild(el('p', 'np-empty', 'Nada por aqui ainda. Compre móveis nas outras abas! 🛍️'));
      return;
    }
    for (const [slotId, id] of placed) {
      const f = furnitureDef(id);
      const card = el('div', 'np-card', `<div class="np-emoji">${f.emoji}</div><div class="np-info"><b>${f.name}</b><small>No salão ✓</small></div>`);
      const b = el('button', 'btn small', '📦 Guardar');
      b.dataset.key = `store-${slotId}`;
      b.onclick = () => this.actions.store(slotId);
      card.appendChild(b);
      list.appendChild(card);
    }
    for (const id of new Set(loose)) {
      const f = furnitureDef(id);
      const card = el('div', 'np-card', `<div class="np-emoji">${f.emoji}</div><div class="np-info"><b>${f.name}</b><small>Guardado</small></div>`);
      const b = el('button', 'btn small', '📍 Colocar');
      b.dataset.key = `place-${id}`;
      b.onclick = () => this.actions.choose(id);
      card.appendChild(b);
      list.appendChild(card);
    }
  }

  private renderPlacing(save: SaveData, id: FurnitureId): HTMLElement {
    const f = furnitureDef(id);
    const box = el('div', 'np-placing', `<h3>${f.emoji} Onde colocar ${f.name}?</h3><p>Escolha um lugar brilhante (ou clique no círculo no salão).</p>`);
    const slots = el('div', 'np-slots');
    DECOR_SLOTS.filter((s) => s.kind === f.kind).forEach((slot, i) => {
      const cur = save.placed[slot.id];
      const b = el('button', 'btn slot', `Lugar ${i + 1} ${cur ? `<small>(troca ${furnitureDef(cur).emoji})</small>` : '<small>(livre)</small>'}`);
      b.dataset.key = `slot-${slot.id}`;
      b.onmouseenter = () => this.actions.preview(slot.id);
      b.onfocus = () => this.actions.preview(slot.id);
      b.onclick = () => this.actions.placeAt(slot.id);
      slots.appendChild(b);
    });
    box.appendChild(slots);
    const cancel = el('button', 'btn small', '↩ Voltar');
    cancel.dataset.key = 'cancel';
    cancel.onclick = () => this.actions.cancelPlace();
    box.appendChild(cancel);
    return box;
  }
}
