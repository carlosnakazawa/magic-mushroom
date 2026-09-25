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
| Usar (cortar, lavar, anotar pedido) | E | Shift direito | X (Quadrado) |
| Trocar de personagem (modo solo) | Q | — | Y (Triângulo) |
| Pausar | Esc / P | Esc / P | Start |

- **Modo solo:** o jogador controla 2 personagens e alterna com `Q` (o outro fica parado — estilo Overcooked).
- **Modo 2 jogadores:** cooperação local no mesmo teclado (ou teclado + controle).
- Usar a tábua/pia: apertar `E` **uma vez** inicia o trabalho, que continua sozinho enquanto o personagem fica parado na frente da estação. Andar pausa (o progresso é mantido). Isso é mais gentil para crianças do que segurar o botão.

### B3. Itens e estações (Etapa 1)
| Estação | Símbolo no mapa | O que faz |
|---|---|---|
| Balcão | `#` | Guarda qualquer item |
| Caixote de ingrediente | `L` alface, `T` tomate, `M` cogumelo-brilhante | Fonte infinita do ingrediente cru |
| Tábua de corte | `C` | Cru → picado (usar `E`) |
| Pilha de tigelas | `B` | Pega tigelas limpas (quantidade limitada!) |
| Pia | `S` | Tigela suja → limpa (usar `E`); volta para a pilha |
| Lixeira | `X` | Descarta ingrediente / esvazia tigela |
| Mesa de cogumelo | `t` | Clientes sentam; entrega-se o prato aqui |
| Porta | `D` | Clientes entram/saem |

- **Montagem:** ingrediente **picado** + tigela limpa (em qualquer ordem: tigela na mão e ingrediente no balcão, ou vice-versa). A tigela vira prato quando o conjunto de ingredientes bate com uma receita.
- **Louça:** tigelas são limitadas (3 no início). Depois de comer, o cliente deixa a tigela suja e moedas na mesa. Pegar a tigela suja coleta as moedas. A mesa só libera quando toda a louça for retirada.

### B4. Receitas
| Receita | Ingredientes (picados) | Nível | Preço base |
|---|---|---|---|
| Salada Verde 🥬 | alface | 1 | 5 |
| Salada Rubi 🍅 | alface + tomate | 1 | 8 |
| Salada Feérica ✨ | alface + tomate + cogumelo-brilhante | 1 | 12 |
| Suco de Frutinhas (Etapa 2) | frutinhas no liquidificador | 2 | 9 |
| Poção Borbulhante (Etapa 2) | frutinhas + cogumelo no liquidificador | 2 | 14 |
| Sopa de Caldeirão (Etapa 3) | cenoura + cogumelo cozidos | 3 | 15 |
| Panqueca Mágica (Etapa 3) | massa na chapa | 3 | 13 |

### B5. Grupos, paciência e moedas
- Todo atendimento é um **grupo** (`Party`): cliente sozinho = grupo de 1; dupla = 2; família = 4–6. Isso unifica os fluxos das seções 4 e 5.
- **Estados do grupo:** `chegando` → `esperando anotar` (balão ❗) → `esperando comida` (comanda no topo) → `comendo` → `saindo` (deixa louça + moedas).
- **Paciência compartilhada** (0–100%): cai devagar enquanto espera anotar e mais rápido esperando comida. Cada prato entregue recupera **+35%** para o grupo todo. Em 0% o grupo vai embora bravo (💢), sem pagar.
- **Moedas:** preço do prato + gorjeta pela paciência restante (até +50%). Grupo de 3+ que recebe tudo ganha **bônus de banquete** (+5 por membro) e celebra com brilhos.
- **Fim do dia:** estrelas por meta de moedas (1★/2★/3★). Clientes já sentados continuam sendo atendidos até o relógio zerar.

### B6. Ciclo dia/noite (Etapa 2)
- **Noite:** sem cronômetro, iluminação azul com vaga-lumes, música calma.
- **Loja noturna:** mesa família (Tronco Encantado), luminárias mágicas, plantas, tapetes, cores de parede — comprados com moedas e posicionados em espaços pré-definidos do salão (grade simples, sem risco de bloquear o caminho).
- **Descanso dos ajudantes:** animação dos personagens dormindo/sentados; efeito de gameplay leve (ex.: ajudante descansado começa o dia com um brilho que acelera o corte por 30 s).
- **Progresso salvo** em `localStorage` (moedas, dia, itens comprados, níveis liberados).

### B7. Níveis (Etapas 2 e 3)
| Nível | Novidade | Receitas |
|---|---|---|
| 1 — Tutorial | Mover, pegar, cortar, montar, servir, lavar (guia passo a passo na tela) | Saladas |
| 2 — Cristal | Liquidificador (tempo de espera da máquina) | Saladas + sucos/poções |
| 3 — Caldeirão | Caldeirão e chapa: comida pode **queimar** e pegar **fogo**; extintor mágico | Tudo |

### B8. Famílias (conteúdo futuro, pós-Etapa 3)
Panda, Ovelha, Axolote, Esquilo — cada uma liberada por marco (ex.: total de moedas, estrelas). Trazem clientes, ajudantes contratáveis, receitas e móveis temáticos. A arquitetura de dados (`src/data/`) já prevê essas listas.
