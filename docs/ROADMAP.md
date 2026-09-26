# Roadmap — 3 Etapas

Cada etapa = **1 branch + 1 Pull Request** revisado pelo **Gemini Code Assist** antes do merge.
Fluxo detalhado em [`AGENTS.md`](../AGENTS.md#fluxo-de-etapas-e-pull-requests).

Legenda: ✅ feito · 🚧 em andamento · ⬜ pendente

**Status atual:** Etapas 1, 2 e 3 mergeadas e publicadas em https://carlosnakazawa.github.io/magic-mushroom/. Extra "Jogar no Celular" no PR #3.

---

## Etapa 1 — "A Cozinha do Dia" (fundação + Nível 1 jogável) — ✅ mergeada (PR #1)
- ✅ Vite + TypeScript + Three.js, Vitest
- ✅ Palco 3D: câmera aérea inclinada, luz quente, sombras, bloom, floresta com cogumelos brilhantes e vaga-lumes
- ✅ 5 heróis procedurais com asas animadas e comemoração própria; clientes da floresta
- ✅ Movimento com colisão, pegar/soltar, alvo destacado, dicas contextuais
- ✅ Estações, saladas, grupos com paciência compartilhada, selo dourado, bônus de banquete
- ✅ HUD, tutorial guiado, menu, pausa, resultado, sons sintetizados, CI

## Etapa 2 — "A Noite Aconchegante" — ✅ (PR #2)
- ✅ Transição dia → noite animada (céu, luz, janelas, lanternas, vaga-lumes) e música calma de noite
- ✅ Loja noturna com 6 abas: mesas de família (Cogumelo Duplo 4 lugares / Tronco Encantado 6), luminárias com luz real, enfeites, tapetes, parede, cores de parede
- ✅ Modo decoração: espaços pré-definidos, pré-visualização translúcida, clique/teclado/controle, troca e "guardar"
- ✅ Famílias (grupos 3–6) na mesa família, com banner "Família …" nas comandas e balão 📜
- ✅ Nível 2: Liquidificador de Cristal (liga e trabalha sozinho), copos, sucos e poções
- ✅ Descanso dos ajudantes (equipe dormindo à noite + bônus de velocidade de 60 s no dia seguinte)
- ✅ Charme ✨ da decoração deixa clientes mais pacientes
- ✅ Salvamento em `localStorage` com validação
- ✅ Mapa de níveis com estrelas, cadeados e trilha de famílias
- ✅ Clientes com caminho A* (desviam de móveis)

## Etapa 3 — "Fogo Mágico & Polimento" — ✅ (PR #2)
- ✅ Nível 3: Caldeirão e Chapa Mágica, pratos, pronto → aviso → queimado → fogo, extintor mágico
- ✅ Marcos por estrelas + Família Panda: clientes panda, herói Mochi, Sopa de Bambu, Lanterna de Bambu
- ✅ Gamepad completo (jogo + menus com foco espacial) e remapeamento de teclas
- ✅ Acessibilidade: modo sem pressa, texto grande, menos efeitos, música
- ✅ Polimento: zoom de câmera em famílias/banquetes, heróis comemorando ao entrar, fumaça/faíscas/névoa do extintor, dicas de novidade por nível
- ✅ Otimização: cenário estático mesclado por material (`render/merge.ts`), alocações reduzidas no loop, overlay `?debug` com FPS e draw calls
- ✅ Publicação: workflow de GitHub Pages (publica a cada merge na `main`)

## Extra — "Jogar no Celular" — ✅ (PR #3)
Branch: `mobile/controles-touch`
- ✅ Joystick dinâmico + botões ✋ Pegar / ⭐ Usar / 🔄 Trocar / ⏸ Pausa (multi-toque, vibração leve)
- ✅ Dicas e tutorial com ícones dos botões no modo toque
- ✅ Layout compacto para celular deitado (HUD, tutorial só com o passo atual, título, loja noturna)
- ✅ Aviso "gire o celular", botão de tela cheia, manifest + ícone para instalar como app
- ✅ Renderização mais leve em celulares (resolução e sombras)
- ✅ Smoke test com celular emulado (toque, joystick, botão, retrato)

## Ideias para depois (pós-Etapa 3)
- Famílias Ovelha, Axolote e Esquilo (mesmo padrão da Panda: `data/families.ts`, `FAMILY_LOOKS`, herói, receita, móvel)
- Mais níveis/mapas (ex.: cozinha dividida por um rio, esteira mágica)
- Música com instrumentos gravados (arquivos livres) e vozes fofas dos personagens
- Modo online / 3–4 jogadores locais
- Testes automatizados do smoke no CI (precisa de Chromium no runner)

---

## Registro de sessões
Adicione uma linha por sessão de trabalho (mais recente no topo).

| Data | Etapa | Resumo |
|---|---|---|
| 2026-09-26 | Extra | PR #2 revisado e mergeado; site publicado no Pages. Controles de toque e layout para celular (PR #3). Próximo: testar em celulares reais e ajustar tamanhos/ritmo com o feedback da família. |
| 2026-09-26 | 2 + 3 | Corrigidos os pontos da revisão do PR #1 e merge na main (pedido do Carlos). Implementadas as Etapas 2 e 3 completas (noite, loja, decoração, famílias, liquidificador, caldeirão/chapa/fogo, Panda, opções, gamepad, Pages). Smoke test cobre o ciclo inteiro. PR #2 aberto. Próximo passo: tratar revisão do Gemini no PR #2. |
| 2026-09-25 | 1 | Criado projeto, documentação (GDD, arquitetura, AGENTS/CLAUDE), implementação completa da Etapa 1. PR #1 aberto para revisão do Gemini. |
