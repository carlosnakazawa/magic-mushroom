# Guia de revisão — Bistrô do Cogumelo Mágico

**Escreva a revisão em português do Brasil.**

Contexto: jogo casual cooperativo para crianças e famílias, feito com TypeScript + Three.js + Vite.
Leia `AGENTS.md`, `docs/GDD.md` e `docs/ARCHITECTURE.md` para entender o projeto.

## O que mais importa (em ordem)
1. **Bugs de jogabilidade:** estados que travam o jogo, itens que somem/duplicam, cliente que nunca sai, mesa que nunca libera, ações que a dica mostra mas não acontecem (ou vice-versa).
2. **Usabilidade para crianças:** textos claros e curtos em português, feedback visual/sonoro para cada ação, nada punitivo demais.
3. **Arquitetura:** `src/sim/` e `src/data/` devem continuar puros (sem `three` e sem DOM) e testados; números de balanceamento só em `src/config.ts`.
4. **Desempenho:** alocações por frame no loop quente (`update`), materiais/geometrias recriados sem necessidade, vazamentos de objetos 3D ou elementos HTML.
5. **Tipos:** TypeScript estrito, sem `any` desnecessário.

## O que não comentar
- Preferências puramente estilísticas já consistentes no arquivo.
- Uso de emoji na interface (é intencional — público infantil).
- `window.game` e `?speed=` (ganchos de depuração intencionais).
