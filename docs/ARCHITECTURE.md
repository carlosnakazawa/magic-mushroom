# Arquitetura

## Por que esta stack
| Escolha | Motivo |
|---|---|
| **Three.js (WebGL)** | Visual 3D com câmera aérea inclinada (Overcooked também é 3D por baixo). Luz dinâmica, sombras, bloom (brilho mágico) e a transição dia/noite. Roda no navegador — qualquer PC, sem instalar nada, publicável no GitHub Pages. |
| **Modelos procedurais** (primitivas em código) | Sem arquivos de arte; qualquer agente cria/ajusta personagens, máquinas e móveis editando TypeScript. |
| **TypeScript estrito + Vite** | Segurança de tipos, recarga instantânea, build estático. |
| **Vitest** | Testes rápidos da lógica pura (grupos, receitas, máquinas, caminhos, save/loja). |
| **Playwright (smoke)** | Joga o ciclo inteiro num navegador real e tira screenshots — agentes conseguem *ver* o jogo. |
| **Web Audio sintetizado** | Efeitos e músicas (dia/noite) sem arquivos de áudio. |
| **HTML/CSS para HUD e menus** | Texto nítido, emoji, animações CSS, navegação por teclado/controle. |

## Camadas (regra de dependência: de cima para baixo)
```
main.ts ─► game/Game.ts         estados: título → níveis → dia → resultado → noite → níveis…
              ├─ game/Day.ts     DayRun: um dia (heróis, clientes, estações, máquinas, fogo, tutorial)
              ├─ game/Night.ts   NightRun: noite (descanso, loja, posicionar móveis)
              ├─ game/*          World, Chef, Customer, ItemViews, interact (regras), tutorial, fx
              ├─ ui/*            HTML: Hud, Screens, NightPanel, WorldUI (rótulos 3D), nav (foco p/ controle)
              ├─ models/*        malhas 3D: creature, props, food, machines, decor
              ├─ render/*        Stage, Lighting (dia/noite), materiais, texturas, merge (otimização)
              ├─ fx/*            partículas e vaga-lumes
              ├─ core/*          Input (teclado/gamepad/remap), audio, storage (localStorage)
              ├─ sim/*           LÓGICA PURA — sem Three.js, sem DOM. Testada com Vitest.
              └─ data/*          definições: personagens, famílias, ingredientes, receitas, níveis, móveis
config.ts  — todos os números de balanceamento (TUNING)
```
**Regras:**
- `sim/` e `data/` **nunca** importam `three` nem acessam `document`/`window`. Regra de jogo nova → primeiro em `sim/` com teste.
- Balanceamento só em `src/config.ts` (`TUNING`).
- Conteúdo novo (receita, ingrediente, nível, herói, móvel, família) começa em `src/data/`.
- `Game` só orquestra; regras do dia ficam em `DayRun`, da noite em `NightRun`.

## Mapa de arquivos
| Arquivo | Responsabilidade |
|---|---|
| `data/levels.ts` | 3 níveis: mapa ASCII (legenda no GDD B3), receitas, ritmo, metas, recipientes, dicas de novidade |
| `data/recipes.ts` | Receitas com `vessel` (tigela/copo/prato) e `method` (montar/bater/cozinhar/grelhar); `matchRecipe`, `canAddIngredient` |
| `data/ingredients.ts` | Ingredientes (cor, emoji, se pode picar) |
| `data/characters.ts` | Heróis (incl. Mochi, liberado pela Família Panda), clientes, visuais de família |
| `data/families.ts` | Famílias desbloqueáveis e metas de estrelas |
| `data/furniture.ts` | Catálogo da loja, cores de parede e **espaços de decoração** (`DECOR_SLOTS`) do salão |
| `sim/party.ts` | `Party`: fluxo do grupo, paciência (com `drainScale` do charme/sem pressa), pagamentos |
| `sim/items.ts` | Itens: ingrediente, recipiente (`VesselItem`), ferramenta (extintor); `tryMerge`, `dishRecipe` |
| `sim/machine.ts` | `Machine`: idle → working → done → warning → burnt → fire; `take`, `dump`, `spray` |
| `sim/pathfind.ts` | A* em grade + simplificação de caminho (clientes) |
| `sim/progress.ts` | Save (validação), níveis liberados, `recordDay`, famílias, loja, posicionamento, charme |
| `sim/economy.ts`, `sim/spawner.ts` | Gorjeta/banquete/estrelas; sorteio de grupos (tamanho mín./máx.) |
| `game/world.ts` | Monta o restaurante 3D a partir do mapa + decoração do save; `Station` (com `Machine`), `Table` (pequena/família), rotas, noite, marcadores de espaço |
| `game/interact.ts` | **Regras de interação**: `findTarget`, `pickAction`, `useAction` (cada `Action` gera a dica *e* executa) |
| `game/Day.ts` | Dia: movimento, ações, trabalho manual, máquinas/fogo, clientes/famílias, spawn, HUD, tutorial, dicas, bônus de descanso |
| `game/Night.ts` | Noite: equipe dormindo, loja, pré-visualização, clique no salão (raycast) |
| `game/Game.ts` | Estados, configurações, pausa, menus com controle, música, overlay `?debug` |
| `game/fx.ts` | Partículas (respeitam "menos efeitos"), comemoração de cada herói, moedas voando |
| `models/machines.ts` | Liquidificador, caldeirão e chapa animados conforme a fase (chamas, bolhas, líquido) |
| `models/decor.ts` | Mesas de família, luminárias (com `PointLight`), enfeites, tapetes, parede |
| `models/creature.ts` | Criatura chibi procedural: `PROFILES` por espécie (corpo, cabeça, focinho, olhos) + orelhas, caudas e detalhes que definem a silhueta |
| `game/lineup.ts` | Ferramenta `?lineup` / `?lineup=sombra` (heróis lado a lado; teste da sombra) |
| `models/food.ts` | Ingredientes crus/picados, tigela/copo/prato, extintor, moedas |
| `render/stage.ts` | Renderer, câmera (56°), sombras, bloom, `zoomPulse`, `setInsetRight` (painel da noite) |
| `render/lighting.ts` | Presets dia/noite interpolados |
| `render/merge.ts` | Junta malhas estáticas por material (menos draw calls) |
| `core/input.ts` | Teclado (teclas remapeáveis), gamepad (jogo e menus), `keyLabel` |
| `core/storage.ts` | Lê/grava o save no `localStorage` sem nunca quebrar |
| `ui/hud.ts` | Relógio, comandas (banner de família, selo dourado), moedas, metas, cartões, tutorial e dicas (faixa compacta no rodapé, transparente quando o herói passa por baixo — `seeThrough`), selos |
| `ui/screens.ts` | Título (heróis bloqueados), mapa de níveis, pausa, resultado (desbloqueios), opções, contagem |
| `ui/night.ts` | Painel da loja noturna |
| `ui/nav.ts` | Foco espacial para menus com controle/setas |
| `sim/perks.ts` | Super-poderes dos heróis → multiplicadores (`perkMods`) e aura de equipe (`teamDrainScale`) |
| `platform/platform.ts` | Onde o jogo roda (web/android/ios/desktop), vibração, aviso de segundo plano |
| `platform/entitlements.ts` | Versão grátis × completa, compra (stub) e portão dos pais |
| `style-phone.css` | Layout de celular deitado com mínimos de 13 px (texto) e 44 px (toque) |
| `capacitor.config.json` | Configuração do app Android/iOS (Capacitor) — ver docs/LANCAMENTO.md |
| `public/privacidade.html` | Política de privacidade publicada no site (URL para as lojas) |
| `i18n/index.ts` | Traduções: `t()`, `tk()`, `tl()`, `localize()` (getters nos dados), `resolveLang()` |
| `i18n/en.ts` | **Fonte** de todas as frases (inglês, idioma padrão); os outros (`es`, `pt`, `fr`, `zh`, `ja`) são tipados a partir dele |
| `ui/touch.ts` | Controles de toque (joystick + botões), `isTouchDevice`, ícones usados nas dicas |
| `style-mobile.css` | Layout de celular (telas baixas), botões de toque, aviso de girar |
| `public/` | `manifest.webmanifest` e ícones (instalar como app). `scripts/icons.mjs` regenera os PNGs a partir do SVG |

## Idiomas (i18n)
- Todo texto visível passa por `t('chave')`. Dados (`data/`) têm os textos como *getters* (`localize`), então `RECIPES.x.name` já vem no idioma atual.
- **Frase nova:** adicione a chave em `i18n/en.ts` e nos outros 5 dicionários. O TypeScript **não compila** se faltar alguma; os testes conferem variáveis `{n}` e listas `a|b|c`.
- Listas (falas, dicas) usam `|` e são lidas com `tl()`.
- Trocar o idioma ao vivo: `Game.changeLanguage()` (salva em `settings.lang`, recria telas, a placa 3D e os controles de toque).

## Coordenadas
- Célula `(x, z)` do mapa → ponto `(x, 0, z)`. Linha 0 = parede do fundo. Mapas têm 18×11; o salão (colunas 10–17) é igual em todos os níveis.
- Câmera olha do **sul** (+z). "Frente" de um personagem = `+z` local; `facing = atan2(dx, dz)`.
- Alturas: balcões `COUNTER_TOP = 0.92`, mesas `TABLE_TOP = 0.74`.

## Brilho mágico (bloom) e noite
- Bloom com `threshold = 1.0`: só brilha o que tem emissivo forte (`glow(cor, >1)`).
- `Lighting` interpola céu/luzes/exposição/bloom; `World.setNight(v)` realça emissivos (janelas, lanternas, cogumelos) e luminárias compradas.

## Como adicionar…
- **Receita:** `data/recipes.ts` (vessel + method + ingredientes) → pesos no nível → teste.
- **Ingrediente:** `data/ingredients.ts` → modelo em `models/food.ts` → letra em `world.ts` (`CRATE_KINDS`).
- **Máquina nova:** `MachineKind` + tempos em `TUNING.machines` + visual em `models/machines.ts` + letra em `world.ts` (`MACHINE_KINDS`) + testes.
- **Móvel:** `FURNITURE` + modelo em `models/decor.ts` (`decorMesh`). Novo tipo de espaço → `SlotKind` + `DECOR_SLOTS`.
- **Herói:** `data/characters.ts` (acessório, `perk`, `style`, `voice`, `phrases`, `price` se for contratável). Super-poder novo → `PerkId` + `sim/perks.ts` + teste. Acessório novo → `Creature.buildAccessory`.
- **Família:** `data/families.ts` (`available: true`) + `FAMILY_LOOKS` + espécie em `creature.ts`/`SPECIES_EMOJI`/`SPECIES_FAMILY_NAME` + herói com `family` + receita/móvel com `family`.
- **Nível:** novo item em `LEVELS` (copie o salão das colunas 10–17), `intro` com dicas.

## Depuração
- `window.game` no console (ex.: `game.day.timeLeft = 5`, `game.save`, `game.showLevels()`).
- `?speed=4` acelera a simulação; `?debug` mostra FPS e draw calls; `?touch` força os controles de toque no computador (`?touch=0` desliga).
- `npm run smoke` gera screenshots em `.screenshots/`.
- Para zerar o progresso: ⚙️ Opções → Começar do zero (ou apagar `bistro-cogumelo-save-v1` do localStorage).
