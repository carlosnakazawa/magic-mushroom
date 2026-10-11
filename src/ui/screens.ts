import { HEROES, type HeroDef } from '../data/characters';
import { FAMILIES, familyDef, type FamilyId } from '../data/families';
import { LEVELS, levelDef } from '../data/levels';
import { audio } from '../core/audio';
import { keyLabel } from '../core/input';
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
    <div><b>Jogador 1</b><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> andar</span><span><kbd>${k(keys.p1.pick)}</kbd> pegar / soltar</span><span><kbd>${k(keys.p1.use)}</kbd> usar</span><span><kbd>${k(keys.p1.swap)}</kbd> trocar herói (solo)</span></div>
    <div><b>Jogador 2</b><span><kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> andar</span><span><kbd>${k(keys.p2.pick)}</kbd> pegar / soltar</span><span><kbd>${k(keys.p2.use)}</kbd> usar</span><span>🎮 Controle: A pegar · X usar · Y trocar</span></div>
  </div>`;
}

const TOUCH_HELP = `
  <div class="controls-help touch-help">
    <div><b>No celular</b><span>🕹️ Arraste o dedo no lado esquerdo para andar</span><span>✋ <b>Pegar</b>: pegar, soltar e servir</span><span>⭐ <b>Usar</b>: cortar, lavar, anotar, ligar, apagar fogo</span><span>🔄 Troca de herói · ⏸ pausa</span></div>
  </div>`;

/** Tela cheia + deitado (Android/tablets; no iPhone use "Adicionar à Tela de Início"). */
function goFullscreen(): void {
  const el = document.documentElement;
  void el
    .requestFullscreen?.({ navigationUI: 'hide' })
    .then(() => (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape'))
    .catch(() => {});
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

  title(save: SaveData, onStart: (c: TitleChoice) => void, onOptions: () => void): void {
    const panel = this.open('title');
    const team = teamHeroes(save);
    this.selected = this.selected.filter((h) => team.includes(h));
    if (!this.selected.length) this.selected = [HEROES[0]!, HEROES[2]!];
    const progress = save.day > 1 ? `<p class="save-line">📅 Dia ${save.day} · 🪙 ${save.wallet} · ⭐ ${totalStars(save)}</p>` : '';
    panel.innerHTML = `
      <h1 class="logo"><span>Bistrô do</span> Cogumelo Mágico <i>🍄</i></h1>
      ${progress}
      <p class="subtitle">Escolha <b>2 heróis</b> para abrir o bistrô hoje!</p>`;
    // Cards compactos (rosto + nome) e um painel de detalhes do herói em foco:
    // cabe em celular deitado e continua legível com muitos heróis.
    const cards = el('div', 'hero-cards compact');
    const detail = el('div', 'hero-detail');
    const showDetail = (h: HeroDef) => {
      const locked = !team.includes(h);
      const how = h.price ? `🔒 Contrate na loja da noite por 🪙 ${h.price}` : h.family ? `🔒 ${familyDef(h.family).emoji} Chega com a ${familyDef(h.family).name} (⭐ ${familyDef(h.family).starsToUnlock})` : '';
      detail.style.setProperty('--hc', hex(h.body));
      detail.innerHTML = `
        <div class="hd-face">${locked && h.family ? '❔' : SPECIES_EMOJI[h.species]}</div>
        <div class="hd-text">
          <b>${locked && h.family ? '???' : h.name}</b> <small>${locked && h.family ? '' : h.title}</small>
          <p>${locked && h.family ? 'Um novo amigo da floresta…' : h.blurb}</p>
          <p class="perk">${locked && h.family ? '' : `⚡ ${h.perkText}`}</p>
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
          <b>${locked && h.family ? '???' : h.name}</b>`;
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
    const solo = button('▶ Jogar sozinho', 'btn big', () => start(1));
    const duo = button(this.touch ? '👥 Em dupla (com controle)' : '👥 Jogar em dupla', 'btn big alt', () => start(2));
    const help = el('div', `help-box${this.touch ? ' hidden' : ''}`, this.touch ? TOUCH_HELP : controlsHtml(save.settings.keys));
    const helpBtn = button('❓ Como jogar', 'btn', () => help.classList.toggle('hidden'));
    buttons.append(solo, duo, button('⚙️ Opções', 'btn', onOptions), helpBtn);
    if (this.touch && document.fullscreenEnabled && !document.fullscreenElement) buttons.append(button('⛶ Tela cheia', 'btn', goFullscreen));
    panel.append(cards, detail, buttons, help);
    render();
    showDetail(this.selected[this.selected.length - 1] ?? HEROES[0]!);
    this.onSelectionChange([...this.selected]);
    solo.focus();
  }

  levels(save: SaveData, onPick: (levelId: number) => void, onBack: () => void, available: (levelId: number) => boolean = () => true): void {
    const panel = this.open('levels');
    panel.innerHTML = `<h2>🗺️ Qual cozinha abrimos hoje?</h2><p class="save-line">📅 Dia ${save.day} · 🪙 ${save.wallet} · ⭐ ${totalStars(save)}${save.rested ? ' · 😴 Equipe descansada!' : ''}</p>`;
    const grid = el('div', 'level-cards');
    let first: HTMLButtonElement | null = null;
    for (const lv of LEVELS) {
      const unlocked = isLevelUnlocked(save, lv.id);
      const best = save.bestStars[lv.id] ?? 0;
      const stars = [0, 1, 2].map((i) => `<span class="${i < best ? 'lit' : ''}">★</span>`).join('');
      const card = el('button', `level-card${unlocked ? '' : ' locked'}`);
      card.innerHTML = `
        <div class="lv-emoji">${unlocked ? lv.emoji : '🔒'}</div>
        <b>Nível ${lv.id}</b><strong>${lv.name}</strong>
        <small>${unlocked ? lv.blurb : `Consiga ⭐ no Nível ${lv.id - 1} para liberar`}</small>
        <div class="lv-stars">${stars}</div>
        ${unlocked && !save.played.includes(lv.id) ? '<span class="lv-new">NOVO!</span>' : ''}
        ${unlocked && !available(lv.id) ? '<span class="lv-full">⭐ Versão completa</span>' : ''}`;
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
      `<h3>🏡 Famílias da floresta</h3>` +
      FAMILIES.map((f) => {
        const got = save.families.includes(f.id);
        return `<div class="fam${got ? ' got' : ''}"><span>${f.emoji}</span><b>${f.name}</b><small>${got ? 'Chegou! 🎉' : f.available ? `⭐ ${Math.min(totalStars(save), f.starsToUnlock)}/${f.starsToUnlock}` : `⭐ ${f.starsToUnlock} · em breve`}</small></div>`;
      }).join('');
    panel.appendChild(fams);
    const buttons = el('div', 'buttons');
    buttons.append(button('🏠 Menu', 'btn', onBack));
    panel.appendChild(buttons);
    first?.focus();
  }

  pause(opts: { onResume: () => void; onRestart: () => void; onMenu: () => void; onOptions: () => void; musicOn: boolean; onMusic: () => boolean; keys: Settings['keys'] }): void {
    const panel = this.open('pause');
    panel.innerHTML = `<h2>⏸️ Pausa</h2>`;
    const buttons = el('div', 'buttons column');
    const resume = button('▶ Continuar', 'btn big', opts.onResume);
    const music = button(opts.musicOn ? '🎵 Música: ligada' : '🔇 Música: desligada', 'btn', () => {
      music.textContent = opts.onMusic() ? '🎵 Música: ligada' : '🔇 Música: desligada';
    });
    buttons.append(resume, music, button('⚙️ Opções', 'btn', opts.onOptions), button('🔄 Recomeçar o dia', 'btn', opts.onRestart), button('🏠 Menu inicial', 'btn', opts.onMenu));
    panel.append(buttons);
    panel.insertAdjacentHTML('beforeend', this.touch ? TOUCH_HELP : controlsHtml(opts.keys));
    resume.focus();
  }

  results(r: DayReport, onNight: () => void, onAgain: () => void): void {
    const panel = this.open('results');
    const lv = levelDef(r.levelId);
    const stars = [0, 1, 2].map((i) => `<span class="rstar${i < r.stars ? ' lit' : ''}" style="animation-delay:${0.4 + i * 0.35}s">★</span>`).join('');
    const msg = ['Amanhã vai ser melhor! 💪', 'Bom trabalho! 🌱', 'Que dia incrível! ✨', 'Bistrô lendário!! 🏆'][r.stars]!;
    const unlocks: string[] = [];
    if (r.newBest && r.stars > 0) unlocks.push(`<div class="unlock">🏅 Novo recorde no ${lv.name}!</div>`);
    if (r.unlockedLevel) {
      const n = levelDef(r.unlockedLevel);
      unlocks.push(`<div class="unlock big">🔓 Nível ${n.id} liberado: <b>${n.emoji} ${n.name}</b>!</div>`);
    }
    for (const f of r.newFamilies) {
      const fam = familyDef(f);
      unlocks.push(`<div class="unlock family"><div class="fam-emoji">${fam.emoji}</div><div><b>A ${fam.name} chegou!</b><ul>${fam.perks.map((p) => `<li>${p}</li>`).join('')}</ul></div></div>`);
    }
    panel.innerHTML = `
      <h2>🌇 Fim do dia!</h2>
      <div class="rstars">${stars}</div>
      <p class="rmsg">${msg}</p>
      <div class="rstats">
        <div><span>🪙</span><b>+${r.coins}</b><small>moedas (total ${r.wallet})</small></div>
        <div><span>🍽️</span><b>${r.served}</b><small>pratos servidos</small></div>
        <div><span>😊</span><b>${r.happy}</b><small>clientes felizes</small></div>
        <div><span>${r.fires ? '🧯' : '💢'}</span><b>${r.fires ? r.fires : r.angry}</b><small>${r.fires ? 'incêndios apagados' : 'foram embora'}</small></div>
      </div>
      <p class="rgoals">Metas: ★ ${lv.starGoals[0]} · ★★ ${lv.starGoals[1]} · ★★★ ${lv.starGoals[2]}</p>
      ${unlocks.join('')}`;
    const buttons = el('div', 'buttons');
    const night = button('🌙 Ir para a noite', 'btn big night', onNight);
    buttons.append(night, button('🔄 Jogar este dia de novo', 'btn', onAgain));
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
    },
  ): void {
    const panel = this.open('settings');
    let s: Settings = structuredClone(save.settings);
    panel.innerHTML = `<h2>⚙️ Opções</h2>`;
    const list = el('div', 'settings-list');
    const toggle = (key: 'noRush' | 'bigText' | 'reducedFx' | 'music', label: string, help: string) => {
      const row = el('div', 'set-row', `<div><b>${label}</b><small>${help}</small></div>`);
      const b = button(s[key] ? 'Ligado ✓' : 'Desligado', `btn small toggle${s[key] ? ' on' : ''}`, () => {
        s = { ...s, [key]: !s[key] };
        b.textContent = s[key] ? 'Ligado ✓' : 'Desligado';
        b.classList.toggle('on', s[key]);
        opts.onChange(s);
      });
      row.appendChild(b);
      list.appendChild(row);
    };
    toggle('noRush', '🐢 Sem pressa', 'Clientes esperam para sempre e nada queima. Ótimo para os menores!');
    toggle('bigText', '🔠 Texto grande', 'Letras e botões maiores.');
    toggle('reducedFx', '✨ Menos efeitos', 'Menos brilhos e partículas, tela não treme.');
    toggle('music', '🎵 Música', 'Música de fundo do dia e da noite.');
    panel.appendChild(list);

    const keys = el('div', 'settings-list keys');
    keys.innerHTML = '<h3>⌨️ Teclas</h3>';
    const bind = (player: 'p1' | 'p2', action: 'pick' | 'use' | 'swap', label: string) => {
      const row = el('div', 'set-row', `<div><b>${player === 'p1' ? 'Jogador 1' : 'Jogador 2'}</b><small>${label}</small></div>`);
      const b = button(`<kbd>${keyLabel(s.keys[player][action])}</kbd>`, 'btn small', () => {
        b.innerHTML = '⌛ Aperte uma tecla…';
        opts.onRebind(player, action, (code) => {
          if (code) s = { ...s, keys: { ...s.keys, [player]: { ...s.keys[player], [action]: code } } };
          b.innerHTML = `<kbd>${keyLabel(s.keys[player][action])}</kbd>`;
          opts.onChange(s);
        });
      });
      row.appendChild(b);
      keys.appendChild(row);
    };
    bind('p1', 'pick', 'Pegar / soltar');
    bind('p1', 'use', 'Usar');
    bind('p1', 'swap', 'Trocar herói (solo)');
    bind('p2', 'pick', 'Pegar / soltar');
    bind('p2', 'use', 'Usar');
    const resetKeys = button('↺ Teclas padrão', 'btn small', () => {
      s = { ...s, keys: structuredClone(DEFAULT_KEYS) };
      opts.onChange(s);
      this.settings({ ...save, settings: s }, opts);
    });
    keys.appendChild(resetKeys);
    panel.appendChild(keys);

    const buttons = el('div', 'buttons');
    const back = button('✔ Pronto', 'btn big', opts.onBack);
    let armed = false;
    const reset = button('🗑️ Começar do zero', 'btn danger', () => {
      if (!armed) {
        armed = true;
        reset.textContent = '⚠️ Apagar tudo? Clique de novo';
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
      <h2>⭐ Bistrô Completo</h2>
      <p>Todos os níveis, máquinas, a loja da noite inteira e as famílias da floresta — uma compra só, sem anúncios.</p>
      <p class="gate-q">👨‍👩‍👧 <b>Pergunta para um adulto:</b> ${ch.question}</p>`;
    const input = el('input', 'gate-input');
    input.type = 'number';
    input.inputMode = 'numeric';
    input.placeholder = '?';
    panel.appendChild(input);
    const msg = el('p', 'gate-msg');
    panel.appendChild(msg);
    const buttons = el('div', 'buttons');
    buttons.append(
      button('Continuar', 'btn big', async () => {
        if (Number(input.value) !== ch.answer) {
          audio.deny();
          msg.textContent = 'Resposta errada. Peça ajuda para um adulto 🙂';
          return;
        }
        msg.textContent = 'Abrindo a loja…';
        if (await entitlements.purchaseFull()) {
          audio.fanfare();
          onDone();
        } else msg.textContent = 'Não foi possível concluir a compra.';
      }),
      button('Agora não', 'btn', onCancel),
    );
    panel.appendChild(buttons);
    input.focus();
  }

  /** Contagem "3, 2, 1" antes do dia começar. */
  countdown(levelName: string, onDone: () => void): void {
    this.root.innerHTML = '';
    this.root.className = 'screens countdown';
    const words = ['3', '2', '1', `Abrindo: ${levelName}! ✨`];
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
