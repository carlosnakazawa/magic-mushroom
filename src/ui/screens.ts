import { HEROES, type HeroDef } from '../data/characters';
import { audio } from '../core/audio';
import { SPECIES_EMOJI, hex } from './hud';

export const PLAYER_COLORS = [0x4fc3ff, 0xff7fb0] as const;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, html = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

const CONTROLS_HTML = `
  <div class="controls-help">
    <div><b>Jogador 1</b><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> andar</span><span><kbd>Espaço</kbd> pegar / soltar</span><span><kbd>E</kbd> usar</span><span><kbd>Q</kbd> trocar herói (solo)</span></div>
    <div><b>Jogador 2</b><span><kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> andar</span><span><kbd>Enter</kbd> pegar / soltar</span><span><kbd>Shift</kbd> direito: usar</span><span>🎮 Controles também funcionam!</span></div>
  </div>`;

export interface TitleChoice {
  heroes: HeroDef[];
  players: 1 | 2;
}

/** Telas por cima do jogo: título/seleção, pausa e resultado do dia. */
export class Screens {
  private root: HTMLDivElement;
  private selected: HeroDef[] = [];
  onSelectionChange: (heroes: HeroDef[]) => void = () => {};

  constructor(parent: HTMLElement) {
    this.root = el('div', 'screens');
    parent.appendChild(this.root);
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

  title(onStart: (c: TitleChoice) => void): void {
    const panel = this.open('title');
    this.selected = this.selected.length ? this.selected : [HEROES[0]!, HEROES[2]!];
    panel.innerHTML = `
      <h1 class="logo"><span>Bistrô do</span> Cogumelo Mágico <i>🍄</i></h1>
      <p class="subtitle">Escolha <b>2 heróis</b> para abrir o bistrô hoje!</p>`;
    const cards = el('div', 'hero-cards');
    const render = () => {
      cards.innerHTML = '';
      for (const h of HEROES) {
        const idx = this.selected.indexOf(h);
        const card = el('button', `hero-card${idx >= 0 ? ' picked' : ''}`);
        card.style.setProperty('--hc', hex(h.body));
        card.style.setProperty('--ha', hex(h.accent));
        card.innerHTML = `
          ${idx >= 0 ? `<span class="badge" style="background:${hex(PLAYER_COLORS[idx]!)}">${idx + 1}</span>` : ''}
          <div class="hero-face">${SPECIES_EMOJI[h.species]}</div>
          <b>${h.name}</b><small>${h.title}</small><p>${h.blurb}</p>`;
        card.onclick = () => {
          audio.unlock();
          audio.click();
          if (idx >= 0) this.selected.splice(idx, 1);
          else {
            if (this.selected.length >= 2) this.selected.shift();
            this.selected.push(h);
          }
          render();
          this.onSelectionChange([...this.selected]);
        };
        cards.appendChild(card);
      }
      solo.disabled = this.selected.length < 1;
      duo.disabled = this.selected.length < 2;
    };
    const buttons = el('div', 'buttons');
    const solo = el('button', 'btn big', '▶ Jogar sozinho');
    const duo = el('button', 'btn big alt', '👥 Jogar em dupla');
    const start = (players: 1 | 2) => {
      audio.unlock();
      audio.click();
      const heroes = [...this.selected];
      if (heroes.length < 2) heroes.push(HEROES.find((h) => !heroes.includes(h))!);
      onStart({ heroes, players });
    };
    solo.onclick = () => start(1);
    duo.onclick = () => start(2);
    buttons.append(solo, duo);
    panel.append(cards, buttons);
    panel.insertAdjacentHTML('beforeend', CONTROLS_HTML);
    render();
    this.onSelectionChange([...this.selected]);
    solo.focus();
  }

  pause(opts: { onResume: () => void; onRestart: () => void; onMenu: () => void; musicOn: boolean; onMusic: () => boolean }): void {
    const panel = this.open('pause');
    panel.innerHTML = `<h2>⏸️ Pausa</h2>`;
    const buttons = el('div', 'buttons column');
    const mk = (label: string, fn: () => void, cls = 'btn') => {
      const b = el('button', cls, label);
      b.onclick = () => {
        audio.click();
        fn();
      };
      buttons.appendChild(b);
      return b;
    };
    const resume = mk('▶ Continuar', opts.onResume, 'btn big');
    const music = mk(opts.musicOn ? '🎵 Música: ligada' : '🔇 Música: desligada', () => {
      music.textContent = opts.onMusic() ? '🎵 Música: ligada' : '🔇 Música: desligada';
    });
    mk('🔄 Recomeçar o dia', opts.onRestart);
    mk('🏠 Menu inicial', opts.onMenu);
    panel.append(buttons);
    panel.insertAdjacentHTML('beforeend', CONTROLS_HTML);
    resume.focus();
  }

  results(r: { coins: number; stars: number; served: number; happy: number; angry: number; goals: readonly number[] }, onAgain: () => void, onMenu: () => void): void {
    const panel = this.open('results');
    const stars = [0, 1, 2].map((i) => `<span class="rstar${i < r.stars ? ' lit' : ''}" style="animation-delay:${0.4 + i * 0.35}s">★</span>`).join('');
    const msg = ['Amanhã vai ser melhor! 💪', 'Bom trabalho! 🌱', 'Que dia incrível! ✨', 'Bistrô lendário!! 🏆'][r.stars]!;
    panel.innerHTML = `
      <h2>🌙 Fim do dia!</h2>
      <div class="rstars">${stars}</div>
      <p class="rmsg">${msg}</p>
      <div class="rstats">
        <div><span>🪙</span><b>${r.coins}</b><small>moedas</small></div>
        <div><span>🥗</span><b>${r.served}</b><small>pratos servidos</small></div>
        <div><span>😊</span><b>${r.happy}</b><small>clientes felizes</small></div>
        <div><span>💢</span><b>${r.angry}</b><small>foram embora</small></div>
      </div>
      <p class="rgoals">Metas: ★ ${r.goals[0]} · ★★ ${r.goals[1]} · ★★★ ${r.goals[2]}</p>
      <p class="rnext">🌙 Em breve: a <b>Noite Aconchegante</b> com loja de móveis mágicos!</p>`;
    const buttons = el('div', 'buttons');
    const again = el('button', 'btn big', '☀️ Próximo dia');
    again.onclick = () => {
      audio.click();
      onAgain();
    };
    const menu = el('button', 'btn', '🏠 Menu');
    menu.onclick = () => {
      audio.click();
      onMenu();
    };
    buttons.append(again, menu);
    panel.append(buttons);
    again.focus();
  }

  /** Contagem "Preparar... Já!" antes do dia começar. */
  countdown(onDone: () => void): void {
    this.root.innerHTML = '';
    this.root.className = 'screens countdown';
    const words = ['3', '2', '1', 'Abrindo o bistrô! ✨'];
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
}
