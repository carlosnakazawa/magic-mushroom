import { audio } from '../core/audio';
import { familyDef } from '../data/families';
import { DECOR_SLOTS, WALLS, furnitureDef, type FurnitureDef, type FurnitureId, type SlotKind, type WallId } from '../data/furniture';
import { charm, heroesForSale, nextFamily, placedCount, shopCatalog, teamHeroes, totalStars, unplaced, type SaveData } from '../sim/progress';
import { SPECIES_EMOJI } from './hud';
import { TUNING } from '../config';
import { t, tk } from '../i18n';

type Tab = SlotKind | 'colors' | 'mine' | 'heroes';

const TABS: readonly Tab[] = ['family', 'light', 'corner', 'rug', 'wall', 'colors', 'heroes', 'mine'];

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
  hire(heroId: string): void;
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
      `<h2>${t('night.title')}</h2>
       <div class="np-stats">
         <span class="np-coins">🪙 ${save.wallet}</span>
         <span class="np-charm">${t('night.charm', { n: c, pct: bonus })}</span>
       </div>
       <p class="np-rest">${t('night.rest')}</p>
       ${fam ? `<p class="np-goal">${fam.emoji} ${fam.name}: ⭐ ${Math.min(totalStars(save), fam.starsToUnlock)}/${fam.starsToUnlock}${fam.available ? '' : t('night.soon')}</p>` : ''}`,
    );
    this.root.appendChild(head);

    if (this.placing) {
      this.root.appendChild(this.renderPlacing(save, this.placing));
    } else {
      const tabs = el('div', 'np-tabs');
      for (const tab of TABS) {
        const b = el('button', `np-tab${tab === this.tab ? ' on' : ''}`, tk(`night.tab.${tab}`));
        b.dataset.key = `tab-${tab}`;
        b.onclick = () => {
          audio.click();
          this.tab = tab;
          this.render(save);
        };
        tabs.appendChild(b);
      }
      this.root.appendChild(tabs);
      const list = el('div', 'np-list');
      if (this.tab === 'colors') this.renderWalls(list, save);
      else if (this.tab === 'heroes') this.renderHeroes(list, save);
      else if (this.tab === 'mine') this.renderMine(list, save);
      else for (const f of shopCatalog(save).filter((f) => f.kind === this.tab)) list.appendChild(this.card(f, save));
      this.root.appendChild(list);
    }

    const morning = el('button', 'btn big np-morning', t('night.morning'));
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
       <span class="np-tags">✨ +${f.charm}${f.seats ? ` · ${t('night.seats', { n: f.seats })}` : ''}${f.family ? ` · ${familyDef(f.family).emoji}` : ''}${owned ? ` · 📦 ${owned}` : ''}</span></div>`,
    );
    const btns = el('div', 'np-btns');
    if (free > 0) {
      const place = el('button', 'btn small', t('night.place'));
      place.dataset.key = `place-${f.id}`;
      place.onclick = () => this.actions.choose(f.id);
      btns.appendChild(place);
    }
    // "Faltam N" visível no botão (no toque não existe tooltip)
    const buy = el('button', 'btn small buy', save.wallet >= f.price ? t('night.buy', { price: f.price }) : `🪙${f.price}<small>${t('night.short', { n: f.price - save.wallet })}</small>`);
    buy.dataset.key = `buy-${f.id}`;
    buy.disabled = save.wallet < f.price;
    buy.onclick = () => this.actions.buy(f.id);
    btns.appendChild(buy);
    card.appendChild(btns);
    return card;
  }

  private renderHeroes(list: HTMLElement, save: SaveData): void {
    const forSale = heroesForSale(save);
    const team = teamHeroes(save);
    list.appendChild(el('p', 'np-empty', t('night.team', { list: team.map((h) => h.name).join(', ') })));
    if (!forSale.length) {
      list.appendChild(el('p', 'np-empty', t('night.allHired')));
      return;
    }
    for (const h of forSale) {
      const card = el(
        'div',
        'np-card hero',
        `<div class="np-emoji face" style="background:#${h.body.toString(16).padStart(6, '0')}">${SPECIES_EMOJI[h.species]}</div>
         <div class="np-info"><b>${h.name}</b><small>${h.title} — ${h.blurb}</small><span class="np-tags">⚡ ${h.perkText}</span></div>`,
      );
      const price = h.price ?? 0;
      const b = el('button', 'btn small buy', save.wallet >= price ? t('night.hire', { price }) : `🪙${price}<small>${t('night.short', { n: price - save.wallet })}</small>`);
      b.dataset.key = `hire-${h.id}`;
      b.disabled = save.wallet < price;
      b.onclick = () => this.actions.hire(h.id);
      card.appendChild(b);
      list.appendChild(card);
    }
  }

  private renderWalls(list: HTMLElement, save: SaveData): void {
    for (const w of WALLS) {
      const owned = save.wallsOwned.includes(w.id);
      const using = save.wall === w.id;
      const card = el(
        'div',
        'np-card',
        `<div class="np-emoji swatch" style="background:repeating-linear-gradient(90deg, ${w.base} 0 10px, ${w.stripe} 10px 20px)"><i style="background:${w.motif}"></i></div>
         <div class="np-info"><b>${t('night.wallName', { name: w.name })}</b><span class="np-tags">✨ +${w.charm}</span></div>`,
      );
      const btn = el('button', 'btn small buy', using ? t('night.using') : owned ? t('night.use') : t('night.buy', { price: w.price }));
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
      list.appendChild(el('p', 'np-empty', t('night.empty')));
      return;
    }
    for (const [slotId, id] of placed) {
      const f = furnitureDef(id);
      const card = el('div', 'np-card', `<div class="np-emoji">${f.emoji}</div><div class="np-info"><b>${f.name}</b><small>${t('night.placed')}</small></div>`);
      const b = el('button', 'btn small', t('night.store'));
      b.dataset.key = `store-${slotId}`;
      b.onclick = () => this.actions.store(slotId);
      card.appendChild(b);
      list.appendChild(card);
    }
    for (const id of new Set(loose)) {
      const f = furnitureDef(id);
      const card = el('div', 'np-card', `<div class="np-emoji">${f.emoji}</div><div class="np-info"><b>${f.name}</b><small>${t('night.stored')}</small></div>`);
      const b = el('button', 'btn small', t('night.place'));
      b.dataset.key = `place-${id}`;
      b.onclick = () => this.actions.choose(id);
      card.appendChild(b);
      list.appendChild(card);
    }
  }

  private renderPlacing(save: SaveData, id: FurnitureId): HTMLElement {
    const f = furnitureDef(id);
    const box = el('div', 'np-placing', `<h3>${t('night.where', { emoji: f.emoji, name: f.name })}</h3><p>${t('night.whereHelp')}</p>`);
    const slots = el('div', 'np-slots');
    DECOR_SLOTS.filter((s) => s.kind === f.kind).forEach((slot, i) => {
      const cur = save.placed[slot.id];
      const b = el('button', 'btn slot', `${t('night.slot', { n: i + 1 })} <small>${cur ? t('night.slotSwap', { emoji: furnitureDef(cur).emoji }) : t('night.slotFree')}</small>`);
      b.dataset.key = `slot-${slot.id}`;
      b.onmouseenter = () => this.actions.preview(slot.id);
      b.onfocus = () => this.actions.preview(slot.id);
      b.onclick = () => this.actions.placeAt(slot.id);
      slots.appendChild(b);
    });
    box.appendChild(slots);
    const cancel = el('button', 'btn small', t('night.back'));
    cancel.dataset.key = 'cancel';
    cancel.onclick = () => this.actions.cancelPlace();
    box.appendChild(cancel);
    return box;
  }
}
