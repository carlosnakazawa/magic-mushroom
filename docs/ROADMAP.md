# Roadmap — Mushmallow

Cada etapa = **1 branch + 1 Pull Request** revisado pelo **Gemini Code Assist** antes do merge.
Fluxo detalhado em [`AGENTS.md`](../AGENTS.md#fluxo-de-etapas-e-pull-requests).

Legenda: ✅ feito · 🚧 em andamento · ⬜ pendente

**Status atual:** Etapa 8 (feedback das crianças, parte 2) mergeada e publicada (2026-11-08). Etapas 6 e 7 mergeadas e publicadas (2026-11-07). Etapas 1–3 e "Jogar no Celular" publicadas em https://carlosnakazawa.github.io/magic-mushroom/. Etapa 4 (personagens, usabilidade, preparação para lojas) no PR #4. Próximo grande passo: **Fase A do `docs/LANCAMENTO.md`** (idiomas, nome internacional, testes em celulares reais).

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

## Etapa 4 — "Personagens, Usabilidade e Lançamento" — ✅ (PR #4)
Branch: `melhorias/personagens-usabilidade-lancamento`
- ✅ Todas as 10 correções do teste de usabilidade (`docs/USABILIDADE.md`)
- ✅ Movimento mais rápido, mira instantânea e mira inteligente
- ✅ Personalidade: acessórios, jeito de se mexer, vozes, falas em balão, olhos felizes/dormindo
- ✅ Super-poderes leves por herói + 3 heróis novos contratáveis na loja da noite (Bolota, Gota, Lumi)
- ✅ Presente de boas-vindas na 1ª noite; "faltam N 🪙" nos botões
- ✅ Camada de plataforma, pausa em segundo plano, grátis × completo com portão dos pais, Capacitor configurado
- ✅ Plano de lançamento e monetização (`docs/LANCAMENTO.md`) e política de privacidade publicada
- ✅ **6 idiomas** (en padrão, es, pt, fr, zh, ja) com troca ao vivo, testes de completude e smoke por idioma

## Etapa 5 — "Heróis únicos e Mushmallow" — ✅ (PR #5)
Branch: `etapa-5/herois-unicos-mushmallow`
- ✅ Silhuetas únicas por espécie (perfis de corpo, focinhos, olhos, orelhas, caudas, espinhos, listras, bigodes)
- ✅ Cores ajustadas (Estrelinha caramelo, Gota rosa) para não confundir
- ✅ Ferramenta `?lineup` / `?lineup=sombra` + `scripts/lineup.mjs` (teste da sombra)
- ✅ Novo nome: **Mushmallow**, igual em todos os idiomas, com subtítulo traduzido

## Etapa 6 — "Tutorial compacto" — ✅ (PR #6)
Branch: `etapa-6/tutorial-compacto`
- ✅ Tutorial e dicas de nível viram uma faixa no rodapé (só o passo atual + bolinhas de progresso), em vez do painel grande que tampava o salão
- ✅ A faixa fica transparente quando um herói passa por baixo (`Hud.seeThrough`)
- ✅ No celular: entre o joystick e os botões; selos saem do caminho enquanto ela aparece
- ✅ Smoke confere que a faixa não encosta nos botões de toque

## Etapa 7 — "Feedback das crianças" — ✅ (PR #7)
Branch: `etapa-7/feedback-criancas`
- ✅ Gota virou sapo de verdade: verde-limão, pintas, barriga amarelinha, olhos saltados, bochechas e dedinhos
- ✅ Item selecionado nos menus bem visível (anel dourado, fundo amarelinho, pulsar)
- ✅ Corrida automática ao segurar o direcional (até 1,4×, com poeirinha)
- ✅ Controle DualSense/PlayStation no Windows: normalização de botões e direcional, aviso "Controle conectado", textos A/✕ X/□ Y/△
- ✅ Comandas compactas com 4+ pedidos (tablet) — ⬜ confirmar no tablet real das crianças (não reproduzido no emulador)
- ✅ "Como fazer": tocar numa comanda ou 📖 Receitas na pausa mostra o passo a passo em figuras
- ✅ Retratos 3D dos heróis nos cartões (seleção, loja da noite, cartões de jogador)

## Etapa 8 — "Feedback das crianças, parte 2" — ✅ (PR #8 mergeado)
Branch: `etapa-8/feedback-criancas-2`
- ✅ Heróis esbarram nos clientes que estão entrando (antes atravessavam)
- ✅ Selinho sobre o herói com o que ele carrega (emoji + nome, dourado se o prato está pronto) e item maior na mão
- ✅ Alface picada direto na pilha de tigelas vira salada (sem soltar no balcão antes); tutorial atualizado
- ✅ Fim do dia gentil: sem clientes novos nos últimos 30 s e "hora de fechar" 🌙 (até 45 s) para atender quem ficou
- ✅ Andar de verdade: passos acompanham a velocidade, pés sobem, corpo balança — cada herói com seu jeito de andar
- ✅ Personalidade: mania de cada herói quando parado (com partículas) e guia `docs/PERSONAGENS.md`
- ✅ Dicas, tutorial e cartões mostram os botões do aparelho em uso (A/X/Y, ✕/□/△, toque ou teclado)

## Próximo: Lançamento (ver `docs/LANCAMENTO.md`)
- 🚧 Fase A — ✅ idiomas; ⬜ revisão nativa zh/ja, nome internacional, celulares reais, trilha sonora, conteúdo extra, créditos
- ⬜ Fase B — Android/Google Play (teste fechado de 14 dias com 12 testadores)
- ⬜ Fase C — iOS/App Store
- ⬜ Fase D — PC/Steam (página "em breve" cedo, demo, Next Fest)

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
| 2026-11-08 | 8 | Feedback 2 das crianças: colisão com clientes, selinho do item carregado, alface direto na tigela, fim do dia com "hora de fechar", animação de andar e manias por herói (`docs/PERSONAGENS.md`, `?lineup=andar`), dicas com botões do controle. |
| 2026-11-08 | 8 | Revisão do PR #8: fala não cobre mais o selinho, pausa congela passos e manias, seta do tutorial aponta a alface esquecida na tábua, juntar duas meias-saladas, atalho da tigela só para ingredientes de salada, anel do relógio na hora de fechar, dicas não alternam com teclado + controle juntos, manias com partículas no título e no `?lineup`. |
| 2026-11-08 | 8 | Ajustes pós-publicação: tela de título cabe todos os heróis (Puff ficava atrás do balcão), retratos dos cartões com cores vivas (tone mapping igual ao jogo), andar bem mais exagerado + "rebolado" (`yaw`) porque de longe ainda parecia deslizar. |
| 2026-11-09 | 8 | Ajustes 3: fila do título termina antes da parede (sapo cortado), cartões de herói com retrato ocupando o cartão e nome por cima, passos do herói no ritmo da velocidade real (`Creature.speed` — herói anda 2,4× mais rápido que os clientes e deslizava), dicas e selinho em figurinha (emojis) fora do tutorial, barra de estrelas numa pílula com as estrelas em cima da barra. Próximo: proposta de visual mais elaborado + personalização dos heróis. |
| 2026-11-09 | 8 | Revisão do PR #10: ingrediente picado ganha 🔪 no selinho/dica (inteiro × picado), sem mão repetida no toque (`[✋] ✋🍄`), nomes inteiros nos cartões do celular, retratos bloqueados centralizados, estrelas menores no celular, CSS dos cartões sem duplicação/`!important`, `cadence()` usa `TUNING.customer.walkSpeed`. |
| 2026-11-07 | 7 | Feedback dos filhos do Carlos: Gota verde/sapo, destaque forte nos menus, corrida automática, DualSense no Windows, comandas no tablet, guia "Como fazer" das receitas, retratos 3D dos heróis. Revisão do Gemini tratada; PRs #6 e #7 mergeados (pedido do Carlos). |
| 2026-10-12 | 6 | Tutorial compacto no rodapé (antes tampava o salão e o herói no celular). PR #6. |
| 2026-10-11 | 5 | Heróis redesenhados com silhuetas únicas (teste da sombra antes/depois) e nome Mushmallow em todo o jogo. PR #5. |
| 2026-10-11 | 4 | Revisão do PR #4 tratada (gorjeta sem mutar evento). Traduções completas: inglês (padrão), espanhol, português, francês, chinês e japonês. |
| 2026-10-11 | 4 | Teste de usabilidade no site publicado (computador + celular emulado) → `docs/USABILIDADE.md`. Corrigido tudo; personagens com personalidade, super-poderes e heróis contratáveis; movimento/mira mais intuitivos; preparação para lojas e plano `docs/LANCAMENTO.md`. PR #4. |
| 2026-09-26 | Extra | PR #2 revisado e mergeado; site publicado no Pages. Controles de toque e layout para celular (PR #3). Próximo: testar em celulares reais e ajustar tamanhos/ritmo com o feedback da família. |
| 2026-09-26 | 2 + 3 | Corrigidos os pontos da revisão do PR #1 e merge na main (pedido do Carlos). Implementadas as Etapas 2 e 3 completas (noite, loja, decoração, famílias, liquidificador, caldeirão/chapa/fogo, Panda, opções, gamepad, Pages). Smoke test cobre o ciclo inteiro. PR #2 aberto. Próximo passo: tratar revisão do Gemini no PR #2. |
| 2026-09-25 | 1 | Criado projeto, documentação (GDD, arquitetura, AGENTS/CLAUDE), implementação completa da Etapa 1. PR #1 aberto para revisão do Gemini. |
