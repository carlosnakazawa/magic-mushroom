# Arquitetura

## Por que esta stack
| Escolha | Motivo |
|---|---|
| **Three.js (WebGL)** | Visual 3D com câmera aérea inclinada (Overcooked também é 3D por baixo). Dá luz dinâmica, sombras, bloom (brilho mágico) e a transição dia/noite fica linda. Roda no navegador — qualquer PC, sem instalar nada. |
| **Modelos procedurais** (primitivas em código) | Não depende de arquivos de arte; qualquer agente consegue criar/ajustar personagens e móveis editando TypeScript. Estilo "toon" fofo e coerente. |
| **TypeScript estrito + Vite** | Segurança de tipos, recarga instantânea, build estático simples (GitHub Pages). |
| **Vitest** | Testes rápidos da lógica pura (grupos, receitas, economia, tutorial). |
| **Playwright (smoke)** | Joga o tutorial num navegador real e tira screenshots — agentes conseguem *ver* o jogo. |
| **Web Audio sintetizado** | Efeitos e música sem arquivos de áudio. |
| **HTML/CSS para HUD** | Texto nítido, emoji coloridos, animações CSS fáceis. Rótulos 3D (balões, dicas) são HTML posicionados por projeção. |

## Camadas (regra de dependência: de cima para baixo)
```
main.ts ─► game/Game.ts (orquestra estados, regras do dia, efeitos, HUD)
              │
              ├─ game/*        entidades com visual: World, Chef, Customer, ItemViews, interact, tutorial
              ├─ ui/*          HTML: Hud, Screens (título/pausa/resultado), WorldUI (rótulos 3D)
              ├─ models/*      construtores de malhas 3D (Creature, props, food)
              ├─ render/*      Stage (renderer, câmera, luzes, bloom), materiais, texturas em canvas
              ├─ fx/*          partículas e vaga-lumes
              ├─ core/*        Input (teclado + gamepad), audio
              ├─ sim/*         LÓGICA PURA — sem Three.js, sem DOM. Testada com Vitest.
              └─ data/*        definições: personagens, ingredientes, receitas, níveis
config.ts  — todos os números de balanceamento (TUNING)
```
**Regras:**
- `sim/` e `data/` **nunca** importam `three` nem acessam `document`/`window`. Toda regra de jogo que puder ser pura vai para `sim/` com teste.
- Números de balanceamento ficam em `src/config.ts` (`TUNING`), não espalhados.
- Conteúdo novo (receita, ingrediente, nível, herói, cliente) começa em `src/data/`.

## Mapa de arquivos
| Arquivo | Responsabilidade |
|---|---|
| `src/data/levels.ts` | Níveis: mapa ASCII (legenda no GDD B3), receitas, ritmo de clientes, metas de estrelas |
| `src/data/recipes.ts` | Receitas + `matchRecipe`/`canAddToBowl` |
| `src/data/characters.ts` | 5 heróis (cores, espécie, asas, efeito de comemoração) e visuais de clientes |
| `src/sim/party.ts` | `Party`: fluxo do grupo (chegando → anotar → comer → sair), paciência, pagamentos |
| `src/sim/items.ts` | Itens (ingrediente/tigela), `tryMerge` (montagem em qualquer ordem) |
| `src/sim/economy.ts` | Gorjeta, bônus de banquete, estrelas |
| `src/sim/spawner.ts` | Sorteio de grupos e intervalos (+ RNG determinístico) |
| `src/game/world.ts` | Lê o mapa e monta o restaurante 3D: `Station`, `Table` (assentos, pratos, moedas), cenário externo |
| `src/game/interact.ts` | **Regras de interação**: `findTarget`, `pickAction` (Espaço), `useAction` (E). Cada `Action` gera a dica *e* executa — nunca divergem |
| `src/game/Game.ts` | Estados (título/contagem/jogando/pausa/resultado), trabalho nas estações, clientes, spawn, efeitos, tutorial |
| `src/game/chef.ts` | Herói controlável: movimento, colisão círculo×grade, segurar item |
| `src/game/customer.ts` | Cliente: caminha por waypoints, senta, come |
| `src/game/itemviews.ts` | Liga item lógico ↔ malha 3D (reconstrói quando `item.version` muda) |
| `src/game/tutorial.ts` | Passos do Dia 1 (concluíveis fora de ordem), congela relógio até 1ª entrega |
| `src/models/creature.ts` | Criatura chibi procedural (corpo, cabeça, orelhas/cauda por espécie, asas por estilo, piscar, andar, comemorar) |
| `src/models/props.ts` | Balcões, caixotes, tábua, pia, lixeira, mesa/banquinho de cogumelo, árvores, placa, janelas |
| `src/models/food.ts` | Ingredientes crus/picados, tigelas, moedas |
| `src/render/stage.ts` | Renderer, câmera inclinada (56°), luzes, sombras, bloom, `toScreen` |
| `src/ui/hud.ts` | Relógio, comandas (selo dourado), moedas, metas, cartões de jogador, tutorial, avisos |
| `src/ui/screens.ts` | Título/seleção de heróis, pausa, resultado, contagem regressiva |
| `src/ui/worldui.ts` | Rótulos HTML presos a pontos 3D (balões, barras de progresso, dicas) |

## Coordenadas
- Célula `(x, z)` do mapa ASCII → centro no ponto `(x, 0, z)` do mundo. Linha 0 = parede do fundo (longe da câmera).
- A câmera olha do **sul** (+z) para o norte. "Frente" de um personagem = `+z` local; `facing = atan2(dx, dz)`.
- Alturas: tampo dos balcões `COUNTER_TOP = 0.92`, tampo das mesas `TABLE_TOP = 0.74`.

## Brilho mágico (bloom)
O bloom tem `threshold = 1.0`: só brilha o que tem **emissivo forte** (`glow()` em `render/materials.ts`). Para algo brilhar, use `glow(cor, intensidade>1)`. Superfícies comuns usam `toon(cor)`. Se a cena ficar "lavada", reduza luzes em `Stage` antes de mexer no bloom.

## Como adicionar…
- **Receita:** `data/recipes.ts` (ingredientes + preço) → incluir no `recipes` do nível em `data/levels.ts` → teste em `sim/items.test.ts`.
- **Ingrediente:** `data/ingredients.ts` → modelo cru/picado em `models/food.ts` → letra no mapa (`world.ts` `CRATE_KINDS`).
- **Estação nova (ex.: liquidificador):** novo `StationKind` + modelo em `props.ts` + letra no mapa em `world.ts` + regras em `interact.ts` (`pickAction`/`useAction`) + progresso em `Game.updateWork`.
- **Mesa família:** `Table` já aceita qualquer lista de assentos e `Party` já suporta 1–6 membros; basta um modelo novo e uma letra no mapa (ou posicionamento pela loja noturna).
- **Herói/cliente:** `data/characters.ts`; espécies novas precisam de orelhas/cauda em `models/creature.ts` e emoji em `ui/hud.ts` (`SPECIES_EMOJI`).

## Depuração
- `window.game` no console dá acesso ao estado (ex.: `game.timeLeft = 5`, `game.coins`).
- `?speed=4` na URL acelera a simulação (usado pelo smoke test).
- `npm run smoke` gera screenshots em `.screenshots/`.
