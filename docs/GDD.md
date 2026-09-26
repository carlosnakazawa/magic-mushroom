# Bistrô do Cogumelo Mágico — Documento de Design (GDD)

> Ideia original criada pela filha do Carlos. A **Parte A** é a transcrição fiel da ideia.
> A **Parte B** traduz essa ideia em regras jogáveis (decisões de design tomadas durante a implementação).
> Se uma regra da Parte B conflitar com a Parte A, a Parte A vence — ajuste a Parte B.

---

## Parte A — A ideia original (não editar o conteúdo, só a formatação)

### 1. Visão Geral do Jogo
- **Gênero:** Gerenciamento cooperativo casual (híbrido de correria culinária e decoração relaxante).
- **Perspectiva:** Câmera 2D aérea inclinada (estilo Overcooked).
- **Público-Alvo:** Famílias, crianças e jogadores casuais.
- **Ciclo Central:**
  - **Dia (Turno de Caos):** Atendimento e preparo contra o relógio, com foco em ritmo, agilidade e entrega.
  - **Noite (Turno Aconchegante):** Sem cronômetro, com música suave, uso das moedas ganhas para comprar móveis, iluminação mágica e descanso dos ajudantes.

### 2. Elenco Inicial de Personagens
Todos os personagens são versáteis e não possuem papéis fixos: qualquer um pode atuar como Chef na cozinha ou Garçom no salão, alternando funções livremente a qualquer momento.

- **Puff (O Coelhinho Alado)**
  - Visual: Macio como nuvem, orelhas longas caídas e asas de libélula translúcidas com brilho suave.
  - Perfil: O coração meigo da equipe; dócil, saltitante e muito dedicado aos detalhes.
- **Florzinha (A Raposinha das Folhas)**
  - Visual: Pelagem laranja-damasco, cauda felpuda e asas em formato de folhas de outono ou mariposa.
  - Perfil: Rápida, engenhosa e cheia de atitude; especialista em reflexos rápidos e curvas ágeis pelo salão.
- **Pipoca (O Dragãozinho Enérgico)**
  - Visual: Rechonchudo, escamas cintilantes, chifrinhos arredondados e asinhas fofas de couro.
  - Perfil: Pura energia; solta pequenas faíscas coloridas quando fica empolgado e comanda as panelas mais pesadas com determinação.
- **Astro (O Lobinho Estelar)**
  - Visual: Pelagem cinza-azulada profunda, olhos brilhantes e asas transparentes decoradas com constelações que cintilam.
  - Perfil: Focado e heróico; tenta manter uma postura séria, mas abana o rabo de alegria quando um pedido sai perfeito.
- **Estrelinha (A Corujinha Feérica)**
  - Visual: Penugem suave em tons claros, olhos grandes e expressivos, asas delicadas que soltam pózinho cintilante.
  - Perfil: Graciosa, atenta e organizada; memoriza pedidos com facilidade e voa suavemente sem esbarrar nas mesas.

### 3. Tipos de Mesas e Capacidade
- **Mesa de Cogumelo Individual/Dupla**
  - Cogumelo clássico com 1 a 2 banquinhos menores ao redor.
  - Recebe clientes individuais ou duplas rápidas.
  - Ocupa pouco espaço e garante um fluxo constante de comandas rápidas.
- **Mesa Cogumelo Duplo / Tronco Encantado (Para Famílias Grandes)**
  - Conjunto expandido de cogumelos interligados ou tronco oco com múltiplos banquinhos acolchoados (4 a 6 lugares).
  - Comprada na loja noturna com as moedas acumuladas.
  - Serve para acomodar grupos inteiros, criando picos de alta demanda e exigindo cooperação máxima dos jogadores.

### 4. Fluxo de Atendimento: Pedido Sozinho (Mesa Pequena)
1. **Chegada:** O cliente entra no bistrô e senta no banquinho de cogumelo.
2. **Registro:** O jogador interage diretamente com o cliente e a comanda individual sobe para o topo da tela com sua barra de paciência.
3. **Preparo:** A equipe processa o item (ex: cortar ingredientes na tábua ou bater no liquidificador).
4. **Entrega e Saída:** O prato pronto é levado à mesa. O cliente consome rapidamente, deixa moedas na mesa e vai embora, liberando o espaço assim que a louça for retirada.

### 5. Fluxo de Atendimento: Pedido em Grupo (Mesa Família)
1. **Entrada Coletiva:** A família entra reunida no salão (pais, avós e filhotes) e ocupa todos os assentos da mesa grande ao mesmo tempo.
2. **Explosão de Comandas:** Todos fazem seus pedidos juntos no momento da chegada. No topo da tela, surge uma fileira de pedidos conectados sob o mesmo banner da família (ex: 2 Saladas, 1 Suco e 1 Sopa de Caldeirão).
3. **Preparo Simultâneo:** A equipe divide as tarefas para rodar várias estações ao mesmo tempo (tábua de corte, caldeirão e liquidificador).
4. **Entrega Prato por Prato:** Não é necessário aguardar todo o banquete ficar pronto para começar a servir. Conforme cada item sai da cozinha:
   - Qualquer personagem com as mãos livres pega o prato e entrega na mesa.
   - O integrante da família atendido começa a comer imediatamente, recuperando parte da barra de paciência do grupo todo.
   - A comanda ganha um selo dourado no prato entregue.
5. **Finalização do Banquete:** Quando o último prato chega à mesa, a família comemora em conjunto com brilhos mágicos, concede um bônus especial de gorjeta e deixa a mesa pronta para ser limpa.

### 6. Progressão de Estações e Desbloqueio Futuro de Famílias
- **Tutorial (Nível 1):** Salada Feérica (ensina movimentação, pegar itens, cortar na tábua e montar tigelas sem perigo de queimar).
- **Nível 2:** Liquidificador de Cristal (adiciona tempo de espera das máquinas e gerenciamento de sucos e poções).
- **Níveis Avançados:** Caldeirões e Chapas Mágicas (introduz pratos quentes, risco de queimar a comida e uso de extintor mágico).
- **Desbloqueio Progressivo de Famílias (Conteúdo Futuro):**
  - As famílias completas de animais não começam liberadas de início; elas são desbloqueadas ao longo da progressão do jogo, conforme o restaurante evolui e atinge novos marcos.
  - Cada família desbloqueada (como a Família Panda, a Família Ovelha, além das linhagens de Axolotes e Esquilos) traz:
    - Novos clientes no salão para ocupar as mesas grandes de família;
    - Membros dessas famílias que podem ser contratados para trabalhar na cozinha/salão junto ao quinteto inicial;
    - Novas receitas temáticas e móveis exclusivos para a loja noturna.

---

## Parte B — Regras jogáveis (decisões de implementação)

### B1. Pilares de experiência (usar para desempatar decisões)
1. **Visual encantador primeiro:** tudo que brilha, pula ou comemora deixa o jogo melhor. Cada ação importante tem feedback visual + sonoro (squash, partículas, som).
2. **Usável por criança:** nunca deixar o jogador sem saber o que fazer. Dicas contextuais flutuam sobre o personagem ("Espaço: pegar Alface"), a estação alvo fica destacada, balões com emoji mostram o que cada cliente quer.
3. **Caos gentil:** o dia é corrido, mas errar não pune forte. Cliente impaciente vai embora sem pagar; nunca há "game over".
4. **Cooperação:** tudo pode ser feito por qualquer personagem; o jogo fica mais fácil quando os jogadores dividem tarefas.

### B2. Controles
| Ação | Jogador 1 | Jogador 2 | Controle (gamepad) |
|---|---|---|---|
| Mover | W A S D | Setas | Analógico esquerdo / D-pad |
| Pegar / Soltar / Entregar | Espaço | Enter | A (Cruz) |
| Usar (cortar, lavar, anotar, ligar, apagar fogo) | E | Shift direito | X (Quadrado) |
| Trocar de personagem (modo solo) | Q | — | Y (Triângulo) |
| Pausar | Esc / P | Esc / P | Start |
| Música liga/desliga | M | M | — |
| Menus | Setas/WASD + Enter, ou mouse | | D-pad + A (B volta) |

**Celular/tablet (toque, jogador 1):** joystick que aparece onde o polegar encosta na metade esquerda da tela; botões grandes à direita — ✋ **Pegar**, ⭐ **Usar**, 🔄 **Trocar** (solo) — e ⏸ pausa. As dicas e o tutorial mostram esses ícones no lugar das teclas. O jogo pede para girar o celular (deitado); tem botão de tela cheia e pode ser instalado com "Adicionar à tela inicial". Modo dupla no celular precisa de um controle Bluetooth.

- As teclas de **pegar/usar/trocar** podem ser **remapeadas** em ⚙️ Opções (movimento é fixo).
- **Modo solo:** o jogador controla 2 personagens e alterna com `Q` (o outro fica parado — estilo Overcooked). Quem estava cortando/lavando/apagando continua o trabalho.
- **Modo 2 jogadores:** cooperação local no mesmo teclado (ou teclado + controle).
- Tábua/pia/extintor: apertar **usar uma vez** inicia o trabalho, que continua sozinho enquanto o personagem fica parado. Andar pausa (o progresso é mantido).

### B3. Itens e estações
| Estação | Símbolo no mapa | O que faz |
|---|---|---|
| Parede | `W` | — |
| Balcão | `#` | Guarda qualquer item |
| Caixote | `L` alface, `T` tomate, `M` cogumelo-brilhante, `R` frutinhas, `N` cenoura, `A` massa, `Y` bambu* | Fonte infinita do ingrediente cru (*`Y` só com a Família Panda; senão vira balcão) |
| Tábua de corte | `C` | Cru → picado (usar). Frutinhas e massa não se cortam |
| Pilhas de recipientes | `B` tigelas, `U` copos, `O` pratos | Quantidade limitada por nível — lave na pia! |
| Pia | `S` | Qualquer recipiente sujo → limpo (usar); volta para a pilha certa |
| Lixeira | `X` | Descarta ingrediente / esvazia recipiente |
| Liquidificador de Cristal | `J` | Ingredientes **crus**; ligar com **usar**; trabalha sozinho; nunca queima |
| Caldeirão | `K` | Ingredientes **picados**; começa sozinho quando a receita fica completa; **pode queimar** |
| Chapa Mágica | `G` | Massa crua; começa sozinha; **pode queimar** |
| Extintor mágico | `Z` | Balcão que começa com o extintor 🧯 |
| Mesa de cogumelo | `t` | 2 lugares |
| Espaço da mesa família | `F F` | 2 células; recebe a mesa comprada na loja (senão é chão livre) |
| Heróis / Porta | `P` / `D` | Início dos heróis / entrada e saída dos clientes |

- **Montagem (saladas):** ingrediente **picado** + tigela limpa, em qualquer ordem.
- **Máquinas:** coloque os ingredientes; quando pronto, leve o **recipiente vazio certo** (copo/tigela/prato) e aperte pegar para servir.
- **Queimar (caldeirão/chapa):** pronto → 7 s seguro → ⚠️ aviso (5 s, bipes e fumaça) → 💨 queimado (dá para limpar com as mãos livres) → 4 s → 🔥 **fogo**. Fogo: pegue o extintor e segure **usar** na frente da máquina. O fogo não se espalha (caos gentil).
- **Louça:** depois de comer, o cliente deixa o recipiente sujo e moedas. Pegar a louça coleta as moedas. A mesa só libera quando toda a louça sai **e** o último cliente atravessa a porta.

### B4. Receitas
| Receita | Recipiente | Como | Ingredientes | Nível | Preço |
|---|---|---|---|---|---|
| Salada Verde | tigela | montar | alface picada | 1 | 5 |
| Salada Rubi | tigela | montar | alface + tomate picados | 1 | 8 |
| Salada Feérica | tigela | montar | alface + tomate + cogumelo picados | 1 | 12 |
| Suco de Frutinhas | copo | liquidificador | frutinhas | 2 | 7 |
| Poção Borbulhante | copo | liquidificador | frutinhas + cogumelo (inteiro) | 2 | 12 |
| Sopa de Cenoura | tigela | caldeirão | cenoura picada | 3 | 10 |
| Sopa de Caldeirão | tigela | caldeirão | cenoura + cogumelo picados | 3 | 15 |
| Panqueca Mágica | prato | chapa | massa | 3 | 11 |
| Sopa de Bambu 🐼 | tigela | caldeirão | bambu + cenoura picados | 3 (Família Panda) | 16 |

Comandas e balões mostram os **ingredientes em emoji** e o formato do recipiente (balão arredondado = prato, "copo" = bebida).

### B5. Grupos, paciência e moedas
- Todo atendimento é um **grupo** (`Party`): 1–2 clientes nas mesas pequenas; **famílias de 3–6** só na mesa família (quando comprada e posicionada).
- **Estados:** `chegando` → `esperando anotar` (❗, ou 📜 para famílias) → `pedido anotado` (comanda no topo; famílias com banner "Família …") → `comendo` → `saindo`.
- **Paciência compartilhada**: cai devagar esperando anotar e mais rápido esperando comida; cada prato entregue recupera **+35%** para o grupo todo; em 0% o grupo vai embora (💢), sem pagar.
- **Moedas:** preço + gorjeta pela paciência (até +50%). Grupo de 3+ que recebe tudo ganha **bônus de banquete** (+5 por membro), com brilhos e zoom de câmera.
- **Fim do dia:** estrelas por meta de moedas. Moedas esquecidas nas mesas entram mesmo assim. As moedas vão para a **carteira** (loja noturna).
- Clientes caminham por **A\*** (desviam de balcões, mesas e móveis).

### B6. Ciclo dia/noite
- Fluxo: **Título** (escolha 2 heróis, solo/dupla) → **Mapa de níveis** → contagem → **Dia** → **Resultado** → **Noite** → Mapa de níveis…
- **Noite:** sem relógio; transição de luz (céu azul-escuro, janelas/lanternas/cogumelos brilham mais, vaga-lumes maiores); música calma; toda a equipe liberada dorme em volta de uma lanterna (💤).
- **Descanso dos ajudantes:** depois de uma noite, a equipe corta, lava, cozinha e apaga fogo **30% mais rápido nos primeiros 60 s** do dia (selo "😴 Descansados").
- **Loja noturna** (painel à direita; a cena é reenquadrada para não ficar coberta):
  - Abas: Mesas, Luzes, Enfeites, Tapetes, Parede, Cores e Meus móveis.
  - Comprar leva direto a escolher o lugar. Os espaços brilham no salão, com um "fantasma" translúcido do móvel e um feixe de luz. Dá para escolher pelos botões (teclado/controle) ou clicando no círculo.
  - Espaço ocupado → o móvel antigo volta para o inventário ("Meus móveis" → Colocar/Guardar).
- **Charme ✨:** soma do charme dos móveis e da parede. Cada ponto reduz 1% a perda de paciência dos clientes (máx. 30%).
- **Catálogo:** `src/data/furniture.ts` (mesas de família com 4 ou 6 lugares, 3 luminárias com luz real, 5 enfeites de chão, 3 tapetes, 3 enfeites de parede, 4 cores de parede).
- **Progresso salvo** em `localStorage`: dia, carteira, total de moedas, melhores estrelas por nível, móveis, parede, famílias, opções. Saves corrompidos voltam ao padrão sem travar.

### B7. Níveis
| Nível | Novidade | Libera com |
|---|---|---|
| 1 — Salada Feérica | Tutorial guiado (relógio pausado até a 1ª entrega) | — |
| 2 — Liquidificador de Cristal | Máquina que trabalha sozinha; copos | ⭐ no Nível 1 |
| 3 — Caldeirão & Chapa | Pratos quentes, queimar, fogo, extintor; pratos | ⭐ no Nível 2 |

Na primeira vez em cada nível novo, um painel "Novidades" explica as máquinas (some sozinho).

### B8. Famílias
| Família | Libera com | Traz |
|---|---|---|
| 🐼 Panda (implementada) | ⭐ 4 estrelas no total | Clientes panda (em grupos), **Mochi** (herói contratável), **Sopa de Bambu** + caixote de bambu no Nível 3, **Lanterna de Bambu** na loja |
| 🐑 Ovelha, 🦎 Axolote, 🐿️ Esquilo | ⭐ 7 / 8 / 9 | Aparecem no mapa como "em breve" — próximas a implementar (mesmo padrão da Panda) |

### B9. Acessibilidade e opções
- 🐢 **Sem pressa:** clientes nunca perdem a paciência e nada queima.
- 🔠 **Texto grande**, ✨ **Menos efeitos** (menos partículas, sem tremor/zoom, bloom suave), 🎵 **Música**.
- ⌨️ **Remapear teclas** (pegar/usar/trocar dos dois jogadores) e voltar ao padrão.
- 🗑️ **Começar do zero** (confirmação em dois cliques).

