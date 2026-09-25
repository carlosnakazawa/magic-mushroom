# 🍄 Bistrô do Cogumelo Mágico

Jogo cooperativo e fofo de cozinha mágica: de **dia** atenda clientes da floresta contra o relógio; à **noite** (em breve) decore o bistrô com móveis e luzes mágicas.
Ideia original criada pela filha do Carlos — veja o [documento de design](docs/GDD.md).

## Jogar
```bash
npm install
npm run dev
```
Abra http://localhost:5173, escolha 2 heróis e clique em **Jogar sozinho** ou **Jogar em dupla**.

| | Jogador 1 | Jogador 2 | Controle |
|---|---|---|---|
| Andar | W A S D | Setas | Analógico |
| Pegar / soltar / servir | Espaço | Enter | A |
| Usar (cortar, lavar, anotar) | E | Shift direito | X |
| Trocar de herói (solo) | Q | — | Y |
| Pausa · Música | Esc / P · M | | Start |

## Como se joga (Dia 1)
1. Cliente chega e senta → vá até a mesa e **anote o pedido** (❗).
2. A comanda aparece no topo com os ingredientes (🥬🍅🍄).
3. Pegue ingredientes nos caixotes, **corte na tábua**, junte numa **tigela**.
4. **Sirva** na mesa — o cliente come e deixa moedas.
5. **Recolha a louça** (pega as moedas) e **lave na pia**: as tigelas são poucas!

## Documentação
- [docs/GDD.md](docs/GDD.md) — ideia original + regras
- [docs/ROADMAP.md](docs/ROADMAP.md) — as 3 etapas e o progresso
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — stack e código
- [AGENTS.md](AGENTS.md) / [CLAUDE.md](CLAUDE.md) — instruções para agentes de IA

## Scripts
`npm run dev` · `npm run check` (tipos + testes) · `npm run build` · `npm run smoke` (screenshots automáticos)
