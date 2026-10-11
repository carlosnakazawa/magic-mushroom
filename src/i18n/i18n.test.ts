import { describe, expect, it } from 'vitest';
import { ALL_DICTS, LANGS, resolveLang, setLang, t, tl, type TKey } from './index';
import { en } from './en';
import { HEROES } from '../data/characters';
import { RECIPES } from '../data/recipes';

const vars = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const keys = Object.keys(en) as TKey[];

describe('traduções', () => {
  for (const { id } of LANGS) {
    const dict = ALL_DICTS[id];

    it(`${id}: mesmas variáveis {..} que o inglês`, () => {
      for (const k of keys) expect([k, vars(dict[k])]).toEqual([k, vars(en[k])]);
    });

    it(`${id}: listas com o mesmo número de itens e sem frases vazias`, () => {
      for (const k of keys) {
        const base = en[k];
        if (base === '') {
          expect(dict[k]).toBe('');
          continue;
        }
        expect(dict[k].trim(), k).not.toBe('');
        if (base.includes('|')) expect([k, dict[k].split('|').length]).toEqual([k, base.split('|').length]);
      }
    });

    it(`${id}: nomes dos heróis não são traduzidos (são nomes próprios)`, () => {
      setLang(id);
      expect(HEROES.map((h) => h.name)).toEqual(['Puff', 'Florzinha', 'Pipoca', 'Astro', 'Estrelinha', 'Mochi', 'Bolota', 'Gota', 'Lumi']);
      setLang('en');
    });
  }

  it('dados mudam de idioma na hora (getters)', () => {
    setLang('pt');
    expect(RECIPES.salad_green.name).toBe('Salada Verde');
    expect(HEROES[0]!.phrases.serve.length).toBeGreaterThan(0);
    setLang('ja');
    expect(RECIPES.salad_green.name).toBe('みどりのサラダ');
    setLang('en');
    expect(RECIPES.salad_green.name).toBe('Green Salad');
    expect(t('hud.day', { n: 3 })).toBe('Day 3');
    expect(tl('hero.puff.serve').length).toBe(3);
  });

  it('escolhe o idioma: URL > salvo > aparelho > inglês', () => {
    expect(resolveLang('', ['pt-BR', 'en-US'])).toBe('pt');
    expect(resolveLang('', ['de-DE', 'zh-CN'])).toBe('zh');
    expect(resolveLang('', ['de-DE'])).toBe('en');
    expect(resolveLang('fr', ['pt-BR'])).toBe('fr');
    expect(resolveLang('fr', ['pt-BR'], 'ja')).toBe('ja');
    expect(resolveLang('xx', [], 'yy')).toBe('en');
  });
});
