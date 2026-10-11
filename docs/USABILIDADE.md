# Teste de usabilidade — 2026-09-26

Feito no **site publicado** (https://carlosnakazawa.github.io/magic-mushroom/) com navegador automatizado, jogando com **entradas reais**:
- **Computador:** 1280×720, teclado.
- **Celular emulado:** iPhone 13 deitado (750×342 úteis) e Pixel 5, **só toque** (joystick com o "dedo", toques nos botões).

Sem teleporte e sem acelerar o tempo.

> Limite do teste: WebGL por software (~3 quadros/s). Tempos de carregamento e fluidez são piores que num aparelho real; as conclusões de layout, textos, fluxo e regras valem.

## O que funcionou bem ✅
- Fluxo completo no computador: título → níveis → tutorial inteiro → pausa → opções → resultado → noite → recarregar.
- Zero erros no console.
- Título, níveis e pausa navegáveis só pelo teclado. O foco começa no botão certo e as setas movem o foco.
- Todas as dicas batem com a ação e com o passo do tutorial:
  - "Anotar pedido", "Pegar Alface", "Colocar na tábua", "Cortar", "Juntar Alface", "Servir Salada Verde", "Colocar na pia".
- O relógio fica pausado até a 1ª entrega e depois volta a correr.
- O save persiste depois de recarregar (dia, carteira, opção "sem pressa", tutorial feito).
- No celular:
  - o joystick levou o herói até a mesa e o caixote;
  - ⭐ anotou o pedido e ✋ pegou a alface;
  - as dicas aparecem com ícones;
  - os controles somem na pausa;
  - nenhum controle cobre o HUD;
  - o aviso de girar aparece em pé.

## Problemas encontrados (por prioridade)

### P1 — atrapalham ou frustram
1. **Mapa de níveis no celular quebra:** os cards ficam empilhados e "Nível 2", "Nível 3" e "🏠 Menu" ficam fora da tela (só rolando, e a criança não sabe que precisa rolar).
2. **Mirar exige segurar a direção:** o herói só "olha" para a estação depois de girar suavemente. A 60 fps isso leva ~160 ms; em celular lento, bem mais.
   - Um toque rápido na direção não mira, então não aparece dica e o botão não faz nada.
   - No teste, o herói parado na frente do caixote estava virado para o lado e nada acontecia.
3. **Primeira noite sem graça:** depois do Dia 1 (tutorial) a criança tem ~8 moedas, e todos os itens da loja custam 15+. Todos os botões aparecem desabilitados.

### P2 — confusos ou difíceis de ler
4. **Salão vazio depois do tutorial:** o próximo cliente só chega 13–21 s depois, justo quando a criança quer continuar.
5. **Textos pequenos no celular** (tamanho efetivo):

   | Onde | Tamanho |
   |---|---|
   | Tutorial | ~10 px |
   | Nome do prato na comanda | ~8 px |
   | Subtítulos dos heróis | ~7 px |
   | Rótulos dos botões de toque | ~10 px |

   Botões de menu com 30–37 px de altura (o recomendado é ≥ 44 px).
6. **Loja noturna no celular:** abas com 21 px de altura (difícil acertar) e a lista mostra só ~1,5 item por vez.
7. **Sem dica ao segurar ingrediente na pilha de tigelas:** a criança não entende que precisa largar a alface num balcão antes de pegar a tigela.
8. **Botão de compra desabilitado** mostra só o preço; o "faltam X moedas" fica num *tooltip*, que não aparece no toque.

### P3 — polimento
9. **Personagens pequenos no celular:** a câmera mostra o restaurante inteiro; num iPhone deitado cada herói tem ~35 px.
10. **Textos de 12 px** nos cards de herói no computador. Para crianças, 14 px lê melhor.

## Status das correções (2026-10-11, PR #4) — todas aplicadas ✅

## Correções sugeridas
| # | Correção (✅ feita) |
|---|---|
| 1 | Em telas baixas, cards de nível lado a lado e compactos; trilha de famílias em uma linha menor |
| 2 | Mira instantânea (direção lógica muda na hora; só o modelo gira suave) + mira tolerante: sem nada à frente, usa a estação vizinha mais próxima |
| 3 | Presente de boas-vindas na 1ª noite (ex.: +40 🪙) e/ou itens baratos (10–15 🪙) |
| 4 | Próximo cliente ~4 s depois da 1ª entrega do tutorial |
| 5, 6 | Layout de celular com tamanho mínimo de fonte (13 px) e toque (44 px); loja em tela cheia com abas maiores |
| 7 | Dica "Solte a alface num balcão primeiro" |
| 8 | Texto "Faltam N 🪙" visível no botão |
| 9 | Câmera um pouco mais próxima no celular |
