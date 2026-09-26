# 🍄 Bistrô do Cogumelo Mágico

Jogo cooperativo e fofo de cozinha mágica: de **dia** atenda clientes da floresta contra o relógio; à **noite** descanse com a equipe e decore o bistrô com móveis e luzes mágicas.
Ideia original criada pela filha do Carlos — veja o [documento de design](docs/GDD.md).

**Jogar online:** https://carlosnakazawa.github.io/magic-mushroom/ (atualiza a cada merge na `main`)

## Jogar no computador
```bash
npm install
npm run dev
```
Abra http://localhost:5173, escolha 2 heróis e clique em **Jogar sozinho** ou **Jogar em dupla**.

| | Jogador 1 | Jogador 2 | Controle |
|---|---|---|---|
| Andar | W A S D | Setas | Analógico / D-pad |
| Pegar / soltar / servir | Espaço | Enter | A |
| Usar (cortar, lavar, anotar, ligar, apagar fogo) | E | Shift direito | X |
| Trocar de herói (solo) | Q | — | Y |
| Pausa · Música | Esc / P · M | | Start |

**No celular/tablet:** abra o link, deite o celular e jogue com o joystick (arraste o dedo no lado esquerdo) e os botões ✋ Pegar / ⭐ Usar / 🔄 Trocar. Dica: use "Adicionar à tela inicial" para abrir em tela cheia como um app.

As teclas podem ser trocadas em ⚙️ Opções. Lá também tem o modo **🐢 Sem pressa**, texto grande e menos efeitos.

## Como se joga
1. **Dia:** o cliente senta → anote o pedido (❗) → a comanda mostra os ingredientes (🥬🍅🍄🫐🥕🥚).
2. Corte na tábua, monte saladas na tigela, bata sucos no **liquidificador**, cozinhe sopas no **caldeirão** e panquecas na **chapa** (sem deixar queimar! 🔥 → use o extintor 🧯).
3. Sirva, recolha a louça (pega as moedas) e lave na pia — os recipientes são poucos!
4. **Famílias** chegam quando você compra a mesa grande; servindo todos, ganha bônus de banquete.
5. **Noite:** a equipe dorme 💤 e você gasta as moedas na loja: mesas, luminárias, plantas, tapetes, cores. O charme ✨ deixa os clientes mais pacientes.
6. Estrelas liberam novos níveis e a **Família Panda** 🐼 (com o herói Mochi e a Sopa de Bambu).

## Documentação
- [docs/GDD.md](docs/GDD.md) — ideia original + regras
- [docs/ROADMAP.md](docs/ROADMAP.md) — etapas e progresso
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — stack e código
- [AGENTS.md](AGENTS.md) / [CLAUDE.md](CLAUDE.md) — instruções para agentes de IA

## Scripts
`npm run dev` · `npm run check` (tipos + testes) · `npm run build` · `npm run smoke` (joga o ciclo inteiro e salva screenshots)
