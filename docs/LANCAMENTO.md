# Plano de lançamento — Play Store, App Store e PC

> Objetivo: lançar o **Bistrô do Cogumelo Mágico** como app de celular (Android e iOS) e jogo de PC (Steam), com um modelo de negócio justo para famílias.
> Este documento é o mapa. O código já foi preparado para ele (ver "O que já está pronto").

---

## 1. Resumo das decisões

| Tema | Decisão recomendada | Por quê |
|---|---|---|
| **Tecnologia de app** | **Capacitor** (empacota o jogo web atual em app Android/iOS) | Zero reescrita: o mesmo código do site vira app. Acesso a compras, vibração e salvamento nativos via plugins. |
| **Tecnologia de PC** | **Electron + steamworks.js** (Windows/Mac/Linux, Steam Deck) | Mesmo código; conquistas e saves na nuvem da Steam. |
| **Celular: modelo** | **Grátis para experimentar + compra única "Bistrô Completo"** (sugestão: R$ 19,90 / US$ 4,99) | Pais testam antes de pagar. Sem anúncios e sem moedas pagas, o que cumpre as regras de apps infantis e dá boas avaliações. |
| **PC: modelo** | **Jogo pago** (sugestão: US$ 9,99 / R$ 29,90), com **demo grátis** para o Steam Next Fest | O cooperativo local e o **Remote Play Together** (jogar com amigos pela internet sem código de rede) são grandes atrativos na Steam. |
| **Depois do lançamento** | **Expansões pagas** (famílias Ovelha, Axolote, Esquilo: US$ 1,99–2,99 cada ou um "Passe das Famílias") | Receita contínua sem prejudicar quem já comprou. |
| **Nunca** | Anúncios, caixas-surpresa, moedas compradas com dinheiro real, "energia" que acaba | Proibido ou malvisto em jogos infantis, além de ruim para as crianças. |

### ✅ Nome decidido: **Mushmallow**
O nome é igual em todos os idiomas (mushroom + marshmallow) e só o subtítulo é traduzido. Pendente: pesquisa de marca (INPI/USPTO), domínio e um nome de repositório/URL novo, se quiserem (o GitHub Pages usa o nome do repositório).

### (Histórico) Atenção ao nome em inglês
Em inglês, *"magic mushroom"* é gíria para **cogumelo alucinógeno**. Um título como "Magic Mushroom Bistro" pode causar:
- classificação etária mais alta;
- rejeição em lojas;
- má impressão nos pais.

**Recomendação:** manter "Bistrô do Cogumelo Mágico" em português e usar outro nome internacional. Opções:
- **"Little Mushroom Bistro"**
- **"Fairy Fungi Bistro"**
- **"Mushroom Fairy Café"**

Pesquise marcas registradas (INPI e USPTO) e o domínio antes de decidir.

---

## 2. O que já está pronto no código
- ✅ Jogo roda 100% offline, salvamento local (sem servidor, sem coleta de dados).
- ✅ Controles de toque, gamepad (Steam Deck/consoles) e teclado remapeável.
- ✅ Layout para celular deitado: textos ≥ 13 px e toques ≥ 44 px (teste de usabilidade).
- ✅ Pausa automática quando o app vai para segundo plano (`src/platform/platform.ts`).
- ✅ Camada de plataforma (`web` / `android` / `ios` / `desktop`).
- ✅ Grátis × completo (`src/platform/entitlements.ts`): o Nível 1 é livre e o resto é liberado por compra. Antes de qualquer compra aparece o **portão dos pais** (continha), exigido pela Apple na categoria Kids. No site, tudo continua liberado; use `?demo` para testar a versão grátis.
- ✅ Capacitor instalado e configurado (`capacitor.config.json`, scripts `app:sync`, `app:android`, `app:ios`).
- ✅ Manifest e ícone (PWA).
- ✅ Política de privacidade publicada em `/privacidade.html` (URL exigida pelas lojas).
- ✅ Modo "sem pressa", texto grande e menos efeitos (acessibilidade conta pontos na curadoria das lojas).

---

## 3. Fases e checklist

### Fase A — Produto pronto para o mundo (3–4 semanas)
- [x] **Idiomas:** inglês (padrão), espanhol, português, francês, chinês simplificado e japonês, em `src/i18n/` (PR #4). Próximo passo: revisão por falantes nativos, principalmente zh e ja, antes do lançamento.
- [x] Nome internacional: **Mushmallow** (GDD B13). Falta pesquisa de marca e domínio.
- [ ] Testar em **celulares reais fracos** (Android de entrada, iPhone antigo): meta de 30 fps estáveis; ajustar `lowPower` (sombras/partículas) se preciso.
- [ ] Trocar a música sintetizada por trilha própria ou com licença livre (CC0/CC-BY, registrada em `docs/`), e criar sons de UI mais caprichados.
- [ ] Conteúdo para o "jogo completo" valer o preço:
  - mais 2–3 níveis;
  - Família Ovelha;
  - conquistas (ex.: "Servir 100 saladas").
- [ ] Tela de **créditos**: "Ideia original: [nome da filha]" — um ótimo diferencial na loja.
- [ ] Backup do save (exportar/importar código) para quem troca de aparelho.

### Fase B — Android / Google Play (2–4 semanas, inclui teste obrigatório)
1. Instalar o **Android Studio** (SDK).
2. `npx cap add android` (cria a pasta `android/`, que deve ser **commitada**) → `npm run app:sync` → `npm run app:android`.
3. Ícones e tela de abertura: `npx @capacitor/assets generate` a partir de `public/icon.svg`. Travar a orientação deitada no `AndroidManifest.xml`.
4. Compras: plugin de compras (sugestão: **RevenueCat** — `@revenuecat/purchases-capacitor` — simplifica Android + iOS e valida recibos). Ligar em `entitlements.purchaseFull()` e "Restaurar compras" nas Opções.
5. **Play Console** (US$ 25, taxa única):
   - formulário de **Segurança dos dados** (marcar "não coleta dados");
   - **público-alvo** inclui crianças → seguir a **Política de Famílias**;
   - classificação **IARC**;
   - política de privacidade (URL acima).
6. ⚠️ **Contas pessoais novas** precisam de **teste fechado com pelo menos 12 testadores por 14 dias seguidos** antes de publicar em produção. Família e amigos servem: comece cedo!
7. Gerar **AAB assinado**. Guarde a chave de upload com cuidado e use a Assinatura de apps do Google Play. Mire o **nível de API exigido no ano** (as regras mudam todo ano; confira na Play Console).
8. Página da loja:
   - ícone 512 px;
   - imagem de destaque 1024×500;
   - 4–8 screenshots deitadas;
   - vídeo curto;
   - descrição com o diferencial "um jogo criado por uma criança".

### Fase C — iPhone/iPad / App Store (2–3 semanas)
1. **Apple Developer Program** (US$ 99/ano).
2. Precisa de **Mac com Xcode** (ou Mac na nuvem: Codemagic, MacinCloud, runner macOS do GitHub Actions).
3. `npx cap add ios` → `npm run app:sync` → `npm run app:ios`.
4. In-App Purchase não-consumível "Bistrô Completo" + botão **Restaurar compras** (obrigatório).
5. **Categoria Kids** (opcional, mas dá destaque):
   - sem SDKs de terceiros de análise/anúncio (✅ não temos);
   - **portão dos pais** antes de compras e links externos (✅ pronto).
6. Rótulos de privacidade: "Dados não coletados". Classificação 4+.
7. **TestFlight** com a família → enviar para revisão.

### Fase D — PC / Steam (paralelo às fases B/C)
1. **Steam Direct**: US$ 100 por jogo (recuperável após US$ 1.000 em vendas). Preencher dados fiscais (W-8BEN).
2. **Crie a página "Em breve" o quanto antes:**
   - a revisão da página leva alguns dias;
   - a página precisa estar no ar **pelo menos 2 semanas** antes do lançamento;
   - lista de desejos é o que faz a Steam mostrar o jogo.
3. Empacotar com **Electron** (`electron/main.js` carregando `dist/`) + **steamworks.js**:
   - conquistas;
   - saves na nuvem;
   - **Remote Play Together** (já funciona com o cooperativo local).
4. **Steam Deck Verified**: controle completo (✅), texto legível em 1280×800 (opção de texto grande ✅), sem teclado obrigatório (✅).
5. Lançar uma **demo grátis** (Nível 1 + 1ª noite) e inscrever no **Steam Next Fest**.
6. Alternativas baratas para testar o público antes:
   - **itch.io** (grátis, "pague quanto quiser");
   - **Microsoft Store** via PWA (PWABuilder).

### Fase E — Lançamento e crescimento
- **História:** "um pai e a filha criando um jogo juntos" — devlog curto no TikTok/Instagram/YouTube (o vídeo da criança jogando o próprio jogo é o melhor marketing possível).
- **Press kit:** página com GIFs, logo e descrição.
- **Divulgação:** contato com canais de jogos para famílias e com curadores da Steam.
- **Preço:** desconto de lançamento de 10–15%; preços regionais (a Steam sugere automaticamente).
- **Depois de lançar:** atualizações com novas famílias. Candidatar a **Apple Arcade** e **Google Play Pass** (curadoria de jogos sem anúncios — combinam com o jogo).

---

## 4. Custos estimados (primeiro ano)
| Item | Custo |
|---|---|
| Google Play Console | US$ 25 (uma vez) |
| Apple Developer Program | US$ 99/ano |
| Steam Direct | US$ 100 (recuperável) |
| Mac na nuvem (se não tiver Mac) | ~US$ 20–50/mês durante a fase iOS |
| RevenueCat | grátis até US$ 2,5 mil/mês de receita |
| Domínio + e-mail de suporte | ~US$ 20/ano |
| Música/sons com licença (opcional) | US$ 0–300 |
| **Total mínimo** | **~US$ 250 + Mac** |

Taxas das lojas:
- Google e Apple: **15%** da receita no programa para pequenos desenvolvedores (até US$ 1 milhão/ano).
- Steam: **30%**.

---

## 5. Monetização — análise das opções
| Modelo | Celular | PC | Observação |
|---|---|---|---|
| **Grátis + desbloqueio único** | ✅ **Recomendado** | — | Melhor conversão em jogos familiares; os pais confiam. |
| Pago direto | possível | ✅ **Recomendado** | No celular, "pago" vende bem menos que "grátis para testar". |
| Anúncios | ❌ | ❌ | Política de Famílias/Kids restringe; atrapalha crianças. |
| Moedas pagas / caixas-surpresa | ❌ | ❌ | Antiético para crianças e restrito por lojas e leis. |
| Assinatura própria | ❌ | ❌ | Pouco conteúdo para justificar; Arcade/Play Pass fazem isso por nós. |
| Expansões (famílias) | ✅ depois | ✅ DLC | Receita contínua e justa. |

> No jogo, **moedas e heróis contratáveis são ganhos jogando** — nunca vendidos por dinheiro real. Essa regra deve ficar assim.

**Expectativa realista:** a maioria dos jogos independentes vende pouco no primeiro ano. O que faz diferença:
- lista de desejos na Steam;
- a história autêntica;
- boas avaliações dos pais.

Comece pequeno (itch.io + Play Store), aprenda com o público e invista em iOS/Steam com os dados em mãos.

---

## 6. Legal e privacidade
- **Privacidade:** o jogo **não coleta nenhum dado pessoal** (tudo fica no aparelho). Política em `public/privacidade.html`, publicada no site. Isso simplifica:
  - LGPD (art. 14, dados de crianças);
  - COPPA (EUA);
  - formulários das lojas.
- **Regra de ouro (também em AGENTS.md):** nenhum SDK de terceiros que colete dados. Analytics, se um dia necessário, só próprio e anônimo, e com revisão das políticas Kids/Famílias.
- **Autoria:** o Carlos publica, e a filha aparece como criadora da ideia nos créditos e na loja. Se a receita crescer, consultar um contador (MEI/CNPJ e impostos de receitas do exterior).
- **Classificação:** Livre / 4+ / E (Everyone).
