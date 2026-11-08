# Guia de Personagens — Mushmallow

Para que cada herói seja **marcante** (e, no futuro, vire boneco/pelúcia), ele precisa ser reconhecido de 4 jeitos:
pela **silhueta** (teste da sombra, GDD B14), pelo **jeito de andar**, por uma **mania** que faz quando está parado e pela **fala**.
A ideia original de cada um está no GDD Parte A §2 (não alterar); aqui ficam as decisões de animação e de "marca".

Ver no jogo: `?lineup=andar` (fileira de trás andando sem sair do lugar) e, no console, `game.lineup.quirks()` (todos fazem a mania).

| Herói | Em uma frase | Jeito de andar (`gait`) | Mania parado (`quirk`) | Assinatura para produto |
|---|---|---|---|---|
| **Puff** 🐰 | O coração meigo da equipe | `hop` — pulinhos com os pés juntos | `twirl` — dá um rodopio e solta coraçõezinhos | Orelhas em pé (uma dobradinha), laço rosa, asas de libélula |
| **Florzinha** 🦊 | Rápida e cheia de atitude | `trot` — passinhos rápidos, corpo para frente | `pose` — inclina, levanta a patinha e balança a cauda ("olha eu!") | Caudona felpuda, coroa de folhas, asas de folha de outono |
| **Pipoca** 🐲 | Pura energia | `stomp` — pisadas fortes, balançando de lado | `sneeze` — puxa o ar e espirra faíscas coloridas | O mais gordinho, chapéu de chef, chifrinhos, barriga listrada |
| **Astro** 🐺 | Sério e heroico (mas abana o rabo) | `march` — postura reta, passos firmes | `howl` — estufa o peito e uiva para as estrelas (brilhinhos) | O mais alto, estrela na testa, cachecol, olhos brilhantes |
| **Estrelinha** 🦉 | Graciosa e organizada | `glide` — flutua baixinho, pés encolhidos | `headSpin` — gira a cabeça inteira (coisa de coruja!) | Formato de ovo, óculos redondos, asas de pena |
| **Mochi** 🐼 | Calmo e comilão | `waddle` — gingado de lado a lado | `munch` — belisca um lanchinho, feliz | Folha de bambu na cabeça, manchas pretas |
| **Bolota** 🦔 | Tímido e caprichoso | `scurry` — passinhos miudinhos e ligeiros | `curl` — se encolhe numa bolinha de vergonha | Bolinha de espinhos com uma florzinha |
| **Gota** 🐸 | Brincalhona | `hop` — saltos de sapo, aterrissa achatadinha | `tongue` — estica a língua para pegar um mosquitinho | Olhos saltados, sorrisão, pintas, coroa, pés de 3 dedos |
| **Lumi** 🐱 | Sonhadora e tranquila | `tiptoe` — na pontinha das patas, rebolando | `stretch` — espreguiça como gato, olhinhos fechados | Presilha de lua, asas de constelação, bigodes |

## Regras para novos heróis
1. Escolha uma **espécie** com silhueta diferente das outras (passe no `?lineup=sombra`).
2. Escolha um **jeito de andar** que combine com a personalidade (ver `GAITS` em `models/creature.ts`; dá para criar um novo).
3. Crie uma **mania** curta (≈1,4 s) que dê para entender de longe e sem texto. Se ela "solta" algo, adicione em `Fx.quirkBurst`.
4. Um **acessório** e uma **cor principal** que ninguém mais usa.
5. **Falas** curtinhas nos 6 idiomas (`hero.<id>.start|serve|fire|swap`).

## Próximos passos (ideias, ainda não feitos)
- Expressões novas (bravinho, surpreso) para momentos do jogo (fogo, cliente indo embora).
- Ficha de cada herói com arte de frente/lado/costas para encomendar modelos 3D ou pelúcias.
- Validar com as crianças: "qual é o seu favorito e por quê?" — e reforçar o que elas citarem.
