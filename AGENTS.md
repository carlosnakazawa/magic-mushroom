# AGENTS.md — Guia para agentes de IA (Claude, Gemini, Codex…)

Projeto: **Bistrô do Cogumelo Mágico** — jogo cooperativo casual de cozinha (dia) e decoração (noite), ideia criada pela filha do Carlos. Público: **crianças e famílias**.

## Leia primeiro (nesta ordem)
1. [`docs/ROADMAP.md`](docs/ROADMAP.md) — em qual etapa estamos, o que falta e o registro de sessões.
2. [`docs/GDD.md`](docs/GDD.md) — a ideia original (Parte A, **não alterar o conteúdo**) e as regras jogáveis (Parte B).
3. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — stack, camadas, mapa de arquivos, "como adicionar…".

## Stack (não trocar sem pedir ao Carlos)
TypeScript estrito · Vite · **Three.js** (3D com câmera aérea inclinada, bloom) · Vitest · Playwright (smoke visual) · Web Audio sintetizado · HUD em HTML/CSS · fonte Fredoka.

## Comandos
```bash
npm install
npm run dev        # http://localhost:5173
npm run check      # typecheck + testes — rode antes de todo commit
npm run build      # build de produção (dist/)
npm run smoke      # joga o tutorial num navegador headless e salva .screenshots/*.png
                   # (1ª vez: npx playwright install chromium)
```
Debug: `window.game` no console; `?speed=4` acelera a simulação.

## Pilares — use para desempatar decisões
1. **É um JOGO visual.** Toda ação importante precisa de feedback: animação (squash/pulo), partículas, som. Prefira algo que brilha, pula e comemora.
2. **Usabilidade para crianças.** Nunca deixe o jogador sem saber o que fazer: dicas contextuais sobre o herói (a mesma `Action` gera dica e executa), alvo destacado, balões com emoji, comandas com os ingredientes. Textos curtos, em **português do Brasil**.
3. **Caos gentil.** Sem game over; errar custa pouco. Nada de punição dura.
4. **Cooperação.** Qualquer herói faz qualquer tarefa; modo solo troca de herói com `Q`.

## Regras de código
- `src/sim/` e `src/data/` são **puros** (sem `three`, sem DOM) e têm testes. Regra de jogo nova → primeiro em `sim/` com teste.
- Balanceamento só em `src/config.ts` (`TUNING`).
- Identificadores em inglês; textos da interface, comentários e docs em português.
- Siga o estilo existente: funções pequenas, comentários curtos explicando o *porquê*.
- Modelos 3D são procedurais (`src/models/`); materiais via `toon()` / `glow()` / `wingMaterial()` de `render/materials.ts`. Para brilhar no bloom use `glow(cor, >1)`.
- Não adicione dependências pesadas sem necessidade. Arquivos de arte/áudio externos só com licença livre e registrados em `docs/`.

## Verificação antes de abrir PR
1. `npm run check` passa.
2. `npm run build` passa.
3. `npm run smoke` passa **e você olhou os screenshots** em `.screenshots/` (e tirou novos se mudou algo visual). Se criar um fluxo novo (ex.: noite, loja), estenda `scripts/smoke.mjs` para cobri-lo.
4. `docs/ROADMAP.md` atualizado (checklist + linha no registro de sessões). Se regras mudaram, atualize `docs/GDD.md` Parte B e `docs/ARCHITECTURE.md`.

## Fluxo de etapas e Pull Requests
O projeto tem **3 etapas** (ver ROADMAP). Cada etapa:
1. Branch `etapa-N/<nome>` a partir de `main` atualizada.
2. Commits pequenos e descritivos (em português).
3. PR para `main` com: resumo, o que testar (passo a passo jogável), screenshots, checklist da etapa.
4. **Revisão do Gemini Code Assist:** ele revisa automaticamente ao abrir o PR (configuração em `.gemini/`). Se não aparecer, comente `/gemini review` no PR.
5. Trate os comentários do Gemini: corrija o que fizer sentido, responda o que não for aplicar (com o porquê), rode a verificação de novo e faça push.
6. O **Carlos faz o merge**. Agentes não fazem merge nem push em `main`.

Para ler a revisão: `gh pr view <n> --comments` e `gh api repos/carlosnakazawa/magic-mushroom/pulls/<n>/comments`.

## Ao terminar uma sessão
Atualize `docs/ROADMAP.md` (status + registro de sessões) para que a próxima sessão continue de onde parou.
