import { HEROES, type HeroDef } from '../data/characters';
import { FAMILIES, familyDef, type FamilyId } from '../data/families';
import { LEVELS, levelDef } from '../data/levels';
import { audio } from '../core/audio';
import { keyLabel } from '../core/input';
import { LANGS, getLang, t, type Lang } from '../i18n';
import { DEFAULT_KEYS, isLevelUnlocked, teamHeroes, totalStars, type SaveData, type Settings } from '../sim/progress';
import { entitlements, parentalChallenge } from '../platform/entitlements';
import { SPECIES_EMOJI, hex } from './hud';

export const PLAYER_COLORS = [0x4fc3ff, 0xff7fb0] as const;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, html = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

function button(label: string, cls: string, fn: () => void): HTMLButtonElement {
  const b = el('button', cls, label);
  b.onclick = () => {
    audio.unlock();
    audio.click();
    fn();
  };
  return b;
}

function controlsHtml(keys: Settings['keys']): string {
  const k = keyLabel;
  return `
  <div class="controls-help">
    <div><b>${t('help.p1')}</b><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> ${t('help.walk')}</span><span><kbd>${k(keys.p1.pick)}</kbd> ${t('help.pick')}</span><span><kbd>${k(keys.p1.use)}</kbd> ${t('help.use')}</span><span><kbd>${k(keys.p1.swap)}</kbd> ${t('help.swap')}</span></div>
    <div><b>${t('help.p2')}</b><span><kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> ${t('help.walk')}</span><span><kbd>${k(keys.p2.pick)}</kbd> ${t('help.pick')}</span><span><kbd>${k(keys.p2.use)}</kbd> ${t('help.use')}</span><span>${t('help.pad')}</span></div>
  </div>`;
}

function touchHelp(): string {
  return `
  <div class="controls-help touch-help">
    <div><b>${t('help.touch.title')}</b><span>${t('help.touch.walk')}</span><span>${t('help.touch.pick')}</span><span>${t('help.touch.use')}</span><span>${t('help.touch.more')}</span></div>
  </div>`;
}

/** Tela cheia + deitado (Android/tablets; no iPhone use "Adicionar à Tela de Início"). */
function goFullscreen(): void {
  const el = document.documentElement;
  void el
    .requestFullscreen?.({ navigationUI: 'hide' })
    .then(() => (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape'))
    .catch(() => {});
}

/** Botões de idioma (bandeira + nome no próprio idioma). */
function langPicker(onPick: (lang: Lang) => void): HTMLDivElement {
  const box = el('div', 'lang-picker');
  for (const l of LANGS) {
    const b = button(l.label, `btn small lang${l.id === getLang() ? ' on' : ''}`, () => onPick(l.id));
    b.dataset.key = `lang-${l.id}`;
    b.lang = l.html;
    box.appendChild(b);
  }
  return box;
}

export interface TitleChoice {
  heroes: HeroDef[];
  players: 1 | 2;
}

export interface DayReport {
  levelId: number;
  coins: number;
  stars: number;
  served: number;
  happy: number;
  angry: number;
  fires: number;
  wallet: number;
  newBest: boolean;
  unlockedLevel: number | null;
  newFamilies: FamilyId[];
}

/** Telas por cima do jogo: título, mapa de níveis, pausa, resultado, opções. */
export class Screens {
  private root: HTMLDivElement;
  private selected: HeroDef[] = [];
  onSelectionChange: (heroes: HeroDef[]) => void = () => {};

  constructor(
    parent: HTMLElement,
    private touch = false,
  ) {
    this.root = el('div', 'screens');
    parent.appendChild(this.root);
  }

  get isOpen(): boolean {
    return this.root.classList.contains('open');
  }

  hide(): void {
    this.root.innerHTML = '';
    this.root.className = 'screens';
  }

  private open(cls: string): HTMLDivElement {
    this.root.innerHTML = '';
    this.root.className = `screens open ${cls}`;
    const panel = el('div', 'panel');
    this.root.appendChild(panel);
    return panel;
  }

  title(save: SaveData, onStart: (c: TitleChoice) => void, onOptions: () => void, onLang: (lang: Lang) => void): void {
    const panel = this.open('title');
    const team = teamHeroes(save);
    this.selected = this.selected.filter((h) => team.includes(h));
    if (!this.selected.length) this.selected = [HEROES[0]!, HEROES[2]!];
    const progress = save.day > 1 ? `<p class="save-line">${t('title.progress', { day: save.day, coins: save.wallet, stars: totalStars(save) })}</p>` : '';
    panel.innerHTML = `
      <h1 class="logo">${t('game.brand')} <i>🍄</i><span class="logo-sub">${t('logo.sub')}</span></h1>
      ${progress}
      <p class="subtitle">${t('title.choose')}</p>`;
    // Cards compactos (rosto + nome) e um painel de detalhes do herói em foco:
    // cabe em celular deitado e continua legível com muitos heróis.
    const cards = el('div', 'hero-cards compact');
    const detail = el('div', 'hero-detail');
    const showDetail = (h: HeroDef) => {
      const locked = !team.includes(h);
      const secret = locked && !!h.family;
      const how = h.price
        ? t('hero.hireHow', { price: h.price })
        : h.family
          ? t('hero.familyHow', { emoji: familyDef(h.family).emoji, family: familyDef(h.family).name, stars: familyDef(h.family).starsToUnlock })
          : '';
      detail.style.setProperty('--hc', hex(h.body));
      detail.innerHTML = `
        <div class="hd-face">${secret ? '❔' : SPECIES_EMOJI[h.species]}</div>
        <div class="hd-text">
          <b>${secret ? t('hero.lockedName') : h.name}</b> <small>${secret ? '' : h.title}</small>
          <p>${secret ? t('hero.lockedBlurb') : h.blurb}</p>
          <p class="perk">${secret ? '' : `⚡ ${h.perkText}`}</p>
          ${locked ? `<p class="how">${how}</p>` : ''}
        </div>`;
    };
    const render = () => {
      cards.innerHTML = '';
      for (const h of HEROES) {
        const locked = !team.includes(h);
        const idx = this.selected.indexOf(h);
        const card = el('button', `hero-card${idx >= 0 ? ' picked' : ''}${locked ? ' locked' : ''}`);
        card.style.setProperty('--hc', hex(h.body));
        card.style.setProperty('--ha', hex(h.accent));
        card.dataset.key = `hero-${h.id}`;
        card.innerHTML = `
          ${idx >= 0 ? `<span class="badge" style="background:${hex(PLAYER_COLORS[idx]!)}">${idx + 1}</span>` : ''}
          <div class="hero-face">${locked ? (h.family ? '🔒' : `<span class="dim">${SPECIES_EMOJI[h.species]}</span><i class="lock">🔒</i>`) : SPECIES_EMOJI[h.species]}</div>
          <b>${locked && h.family ? t('hero.lockedName') : h.name}</b>`;
        card.onmouseenter = () => showDetail(h);
        card.onfocus = () => showDetail(h);
        card.onclick = () => {
          audio.unlock();
          showDetail(h);
          if (locked) {
            audio.deny();
            return;
          }
          audio.click();
          if (idx < 0) audio.voice(h.voice);
          if (idx >= 0) this.selected.splice(idx, 1);
          else {
            if (this.selected.length >= 2) this.selected.shift();
            this.selected.push(h);
          }
          render();
          this.onSelectionChange([...this.selected]);
          cards.querySelector<HTMLElement>(`[data-key="hero-${h.id}"]`)?.focus();
        };
        cards.appendChild(card);
      }
      solo.disabled = this.selected.length < 1;
      duo.disabled = this.selected.length < 2;
    };
    const start = (players: 1 | 2) => {
      const heroes = [...this.selected];
      if (heroes.length < 2) heroes.push(team.find((h) => !heroes.includes(h))!);
      onStart({ heroes, players });
    };
    const buttons = el('div', 'buttons');
    const solo = button(t('title.solo'), 'btn big', () => start(1));
    const duo = button(this.touch ? t('title.duoTouch') : t('title.duo'), 'btn big alt', () => start(2));
    const help = el('div', `help-box${this.touch ? ' hidden' : ''}`, this.touch ? touchHelp() : controlsHtml(save.settings.keys));
    const helpBtn = button(t('title.help'), 'btn', () => help.classList.toggle('hidden'));
    const langs = langPicker(onLang);
    langs.classList.add('hidden');
    const current = LANGS.find((l) => l.id === getLang())!;
    const langBtn = button(`🌐 ${current.label}`, 'btn lang-toggle', () => {
      langs.classList.toggle('hidden');
      langs.querySelector<HTMLElement>('.lang.on')?.focus();
    });
    buttons.append(solo, duo, button(t('title.options'), 'btn', onOptions), helpBtn, langBtn);
    if (this.touch && document.fullscreenEnabled && !document.fullscreenElement) buttons.append(button(t('title.fullscreen'), 'btn', goFullscreen));
    panel.append(cards, detail, buttons, langs, help);
    render();
    showDetail(this.selected[this.selected.length - 1] ?? HEROES[0]!);
    this.onSelectionChange([...this.selected]);
    solo.focus();
  }

  levels(save: SaveData, onPick: (levelId: number) => void, onBack: () => void, available: (levelId: number) => boolean = () => true): void {
    const panel = this.open('levels');
    panel.innerHTML = `<h2>${t('levels.title')}</h2><p class="save-line">${t('title.progress', { day: save.day, coins: save.wallet, stars: totalStars(save) })}${save.rested ? t('levels.rested') : ''}</p>`;
    const grid = el('div', 'level-cards');
    let first: HTMLButtonElement | null = null;
    for (const lv of LEVELS) {
      const unlocked = isLevelUnlocked(save, lv.id);
      const best = save.bestStars[lv.id] ?? 0;
      const stars = [0, 1, 2].map((i) => `<span class="${i < best ? 'lit' : ''}">★</span>`).join('');
      const card = el('button', `level-card${unlocked ? '' : ' locked'}`);
      card.innerHTML = `
        <div class="lv-emoji">${unlocked ? lv.emoji : '🔒'}</div>
        <b>${t('levels.level', { n: lv.id })}</b><strong>${lv.name}</strong>
        <small>${unlocked ? lv.blurb : t('levels.locked', { n: lv.id - 1 })}</small>
        <div class="lv-stars">${stars}</div>
        ${unlocked && !save.played.includes(lv.id) ? `<span class="lv-new">${t('levels.new')}</span>` : ''}
        ${unlocked && !available(lv.id) ? `<span class="lv-full">${t('levels.full')}</span>` : ''}`;
      card.disabled = !unlocked;
      card.onclick = () => {
        audio.click();
        onPick(lv.id);
      };
      if (unlocked) first = card;
      grid.appendChild(card);
    }
    panel.appendChild(grid);
    const fams = el('div', 'family-track');
    fams.innerHTML =
      `<h3>${t('levels.families')}</h3>` +
      FAMILIES.map((f) => {
        const got = save.families.includes(f.id);
        const status = got
          ? t('levels.famArrived')
          : f.available
            ? t('levels.famProgress', { have: Math.min(totalStars(save), f.starsToUnlock), need: f.starsToUnlock })
            : t('levels.famSoon', { need: f.starsToUnlock });
        return `<div class="fam${got ? ' got' : ''}"><span>${f.emoji}</span><b>${f.name}</b><small>${status}</small></div>`;
      }).join('');
    panel.appendChild(fams);
    const buttons = el('div', 'buttons');
    buttons.append(button(t('common.menu'), 'btn', onBack));
    panel.appendChild(buttons);
    first?.focus();
  }

  pause(opts: { onResume: () => void; onRestart: () => void; onMenu: () => void; onOptions: () => void; musicOn: boolean; onMusic: () => boolean; keys: Settings['keys'] }): void {
    const panel = this.open('pause');
    panel.innerHTML = `<h2>${t('pause.title')}</h2>`;
    const buttons = el('div', 'buttons column');
    const resume = button(t('pause.resume'), 'btn big', opts.onResume);
    const music = button(opts.musicOn ? t('pause.musicOn') : t('pause.musicOff'), 'btn', () => {
      music.textContent = opts.onMusic() ? t('pause.musicOn') : t('pause.musicOff');
    });
    buttons.append(resume, music, button(t('title.options'), 'btn', opts.onOptions), button(t('pause.restart'), 'btn', opts.onRestart), button(t('pause.menu'), 'btn', opts.onMenu));
    panel.append(buttons);
    panel.insertAdjacentHTML('beforeend', this.touch ? touchHelp() : controlsHtml(opts.keys));
    resume.focus();
  }

  results(r: DayReport, onNight: () => void, onAgain: () => void): void {
    const panel = this.open('results');
    const lv = levelDef(r.levelId);
    const stars = [0, 1, 2].map((i) => `<span class="rstar${i < r.stars ? ' lit' : ''}" style="animation-delay:${0.4 + i * 0.35}s">★</span>`).join('');
    const msg = t((['results.msg0', 'results.msg1', 'results.msg2', 'results.msg3'] as const)[r.stars] ?? 'results.msg0');
    const unlocks: string[] = [];
    if (r.newBest && r.stars > 0) unlocks.push(`<div class="unlock">${t('results.best', { level: lv.name })}</div>`);
    if (r.unlockedLevel) {
      const n = levelDef(r.unlockedLevel);
      unlocks.push(`<div class="unlock big">${t('results.unlocked', { n: n.id, emoji: n.emoji, name: n.name })}</div>`);
    }
    for (const f of r.newFamilies) {
      const fam = familyDef(f);
      unlocks.push(`<div class="unlock family"><div class="fam-emoji">${fam.emoji}</div><div><b>${t('results.family', { family: fam.name })}</b><ul>${fam.perks.map((p) => `<li>${p}</li>`).join('')}</ul></div></div>`);
    }
    panel.innerHTML = `
      <h2>${t('results.title')}</h2>
      <div class="rstars">${stars}</div>
      <p class="rmsg">${msg}</p>
      <div class="rstats">
        <div><span>🪙</span><b>+${r.coins}</b><small>${t('results.coins', { total: r.wallet })}</small></div>
        <div><span>🍽️</span><b>${r.served}</b><small>${t('results.served')}</small></div>
        <div><span>😊</span><b>${r.happy}</b><small>${t('results.happy')}</small></div>
        <div><span>${r.fires ? '🧯' : '💢'}</span><b>${r.fires ? r.fires : r.angry}</b><small>${r.fires ? t('results.fires') : t('results.angry')}</small></div>
      </div>
      <p class="rgoals">${t('results.goals', { a: lv.starGoals[0], b: lv.starGoals[1], c: lv.starGoals[2] })}</p>
      ${unlocks.join('')}`;
    const buttons = el('div', 'buttons');
    const night = button(t('results.night'), 'btn big night', onNight);
    buttons.append(night, button(t('results.again'), 'btn', onAgain));
    panel.append(buttons);
    night.focus();
  }

  settings(
    save: SaveData,
    opts: {
      onChange: (s: Settings) => void;
      onRebind: (player: 'p1' | 'p2', action: 'pick' | 'use' | 'swap', done: (code: string) => void) => void;
      onReset: () => void;
      onBack: () => void;
      onLang: (lang: Lang) => void;
    },
  ): void {
    const panel = this.open('settings');
    let s: Settings = structuredClone(save.settings);
    panel.innerHTML = `<h2>${t('set.title')}</h2>`;
    const list = el('div', 'settings-list');
    const langRow = el('div', 'set-row lang-row', `<div><b>${t('set.lang')}</b></div>`);
    langRow.appendChild(langPicker(opts.onLang));
    list.appendChild(langRow);
    const toggle = (key: 'noRush' | 'bigText' | 'reducedFx' | 'music', label: string, help: string) => {
      const row = el('div', 'set-row', `<div><b>${label}</b><small>${help}</small></div>`);
      const b = button(s[key] ? t('set.on') : t('set.off'), `btn small toggle${s[key] ? ' on' : ''}`, () => {
        s = { ...s, [key]: !s[key] };
        b.textContent = s[key] ? t('set.on') : t('set.off');
        b.classList.toggle('on', s[key]);
        opts.onChange(s);
      });
      row.appendChild(b);
      list.appendChild(row);
    };
    toggle('noRush', t('set.noRush'), t('set.noRush.help'));
    toggle('bigText', t('set.bigText'), t('set.bigText.help'));
    toggle('reducedFx', t('set.fx'), t('set.fx.help'));
    toggle('music', t('set.music'), t('set.music.help'));
    panel.appendChild(list);

    const keys = el('div', 'settings-list keys');
    keys.innerHTML = `<h3>${t('set.keys')}</h3>`;
    const bind = (player: 'p1' | 'p2', action: 'pick' | 'use' | 'swap', label: string) => {
      const row = el('div', 'set-row', `<div><b>${player === 'p1' ? t('help.p1') : t('help.p2')}</b><small>${label}</small></div>`);
      const b = button(`<kbd>${keyLabel(s.keys[player][action])}</kbd>`, 'btn small', () => {
        b.innerHTML = t('set.pressKey');
        opts.onRebind(player, action, (code) => {
          if (code) s = { ...s, keys: { ...s.keys, [player]: { ...s.keys[player], [action]: code } } };
          b.innerHTML = `<kbd>${keyLabel(s.keys[player][action])}</kbd>`;
          opts.onChange(s);
        });
      });
      row.appendChild(b);
      keys.appendChild(row);
    };
    bind('p1', 'pick', t('set.pick'));
    bind('p1', 'use', t('set.use'));
    bind('p1', 'swap', t('set.swap'));
    bind('p2', 'pick', t('set.pick'));
    bind('p2', 'use', t('set.use'));
    const resetKeys = button(t('set.resetKeys'), 'btn small', () => {
      s = { ...s, keys: structuredClone(DEFAULT_KEYS) };
      opts.onChange(s);
      this.settings({ ...save, settings: s }, opts);
    });
    keys.appendChild(resetKeys);
    panel.appendChild(keys);

    const buttons = el('div', 'buttons');
    const back = button(t('set.done'), 'btn big', opts.onBack);
    let armed = false;
    const reset = button(t('set.reset'), 'btn danger', () => {
      if (!armed) {
        armed = true;
        reset.textContent = t('set.resetConfirm');
        return;
      }
      opts.onReset();
    });
    buttons.append(back, reset);
    panel.appendChild(buttons);
    back.focus();
  }

  /**
   * Versão completa: portão dos pais (continha) antes de qualquer compra.
   * Obrigatório para jogos infantis na App Store e recomendado no Google Play.
   */
  fullGameGate(onDone: () => void, onCancel: () => void): void {
    const panel = this.open('gate');
    const ch = parentalChallenge();
    panel.innerHTML = `
      <h2>${t('gate.title')}</h2>
      <p>${t('gate.desc')}</p>
      <p class="gate-q">${t('gate.ask', { q: ch.question })}</p>`;
    const input = el('input', 'gate-input');
    input.type = 'number';
    input.inputMode = 'numeric';
    input.placeholder = '?';
    panel.appendChild(input);
    const msg = el('p', 'gate-msg');
    panel.appendChild(msg);
    const buttons = el('div', 'buttons');
    buttons.append(
      button(t('gate.continue'), 'btn big', async () => {
        if (Number(input.value) !== ch.answer) {
          audio.deny();
          msg.textContent = t('gate.wrong');
          return;
        }
        msg.textContent = t('gate.opening');
        if (await entitlements.purchaseFull()) {
          audio.fanfare();
          onDone();
        } else msg.textContent = t('gate.failed');
      }),
      button(t('gate.later'), 'btn', onCancel),
    );
    panel.appendChild(buttons);
    input.focus();
  }

  /** Contagem "3, 2, 1" antes do dia começar. */
  countdown(levelName: string, onDone: () => void): void {
    this.root.innerHTML = '';
    this.root.className = 'screens countdown';
    const words = ['3', '2', '1', t('cd.opening', { level: levelName })];
    let i = 0;
    const next = () => {
      if (i >= words.length) {
        this.hide();
        onDone();
        return;
      }
      this.root.innerHTML = `<div class="cd-word">${words[i]}</div>`;
      if (i < 3) audio.tick();
      else audio.arrive();
      i++;
      window.setTimeout(next, i === words.length ? 900 : 650);
    };
    next();
  }

  /** Transição curta com texto grande (ex.: "🌙 Anoitece…"). */
  banner(text: string, ms: number, onDone: () => void): void {
    this.root.innerHTML = `<div class="cd-word soft">${text}</div>`;
    this.root.className = 'screens countdown';
    window.setTimeout(() => {
      this.hide();
      onDone();
    }, ms);
  }
}
