# Roadmap — 3 Etapas

Cada etapa = **1 branch + 1 Pull Request** revisado pelo **Gemini Code Assist** antes do merge.
Fluxo detalhado em [`AGENTS.md`](../AGENTS.md#fluxo-de-etapas-e-pull-requests).

Legenda: ✅ feito · 🚧 em andamento · ⬜ pendente

---

## Etapa 1 — "A Cozinha do Dia" (fundação + Nível 1 jogável)
Branch: `etapa-1/cozinha-do-dia`

**Objetivo:** um dia completo de salada jogável do início ao fim, bonito e com sensação boa.

- ✅ Projeto Vite + TypeScript + Three.js, testes com Vitest
- ✅ Palco 3D: câmera aérea inclinada, luz quente, sombras suaves, bloom (brilho mágico), floresta ao redor com cogumelos brilhantes e vaga-lumes
- ✅ 5 heróis procedurais (Puff, Florzinha, Pipoca, Astro, Estrelinha) com asas animadas, piscar de olhos e comemoração própria
- ✅ Clientes da floresta (espécies/cores variadas)
- ✅ Movimento com colisão, pegar/soltar, alvo destacado, dicas contextuais
- ✅ Estações: caixotes, tábua de corte, pilha de tigelas, pia, lixeira, balcões
- ✅ Receitas de salada (Verde, Rubi, Feérica) com montagem em qualquer ordem
- ✅ Sistema de grupos genérico (1–6 membros), paciência compartilhada, entrega prato a prato, selo dourado, bônus de banquete
- ✅ HUD: comandas no topo, moedas animadas, relógio do dia, balões de emoji nos clientes
- ✅ Tutorial guiado (checklist de passos) no Dia 1
- ✅ Menu inicial com escolha de personagens, 1 ou 2 jogadores, pausa, tela de resultado com estrelas
- ✅ Efeitos sonoros sintetizados (Web Audio, sem arquivos)
- ✅ CI no GitHub Actions (typecheck + testes + build)

## Etapa 2 — "A Noite Aconchegante" (ciclo completo + mesa família + liquidificador)
Branch: `etapa-2/noite-aconchegante`

- ⬜ Transição dia → noite animada (céu, luz, vaga-lumes, música calma)
- ⬜ Loja noturna: Tronco Encantado (mesa 4–6), luminárias mágicas, plantas, tapetes, cor de parede
- ⬜ Modo decoração: posicionar móveis em espaços pré-definidos com pré-visualização
- ⬜ Chegada de famílias (grupos 4–6) usando a mesa grande — banner de família no HUD
- ⬜ Nível 2: Liquidificador de Cristal (máquina trabalha sozinha; sucos e poções em copos)
- ⬜ Descanso dos ajudantes (animação + bônus leve no dia seguinte)
- ⬜ Salvamento em `localStorage` (dia, moedas, compras, níveis)
- ⬜ Seleção de nível / mapa de progresso
- ⬜ Música ambiente (dia animada, noite calma) sintetizada ou arquivos livres

## Etapa 3 — "Fogo Mágico & Polimento" (níveis avançados + publicação)
Branch: `etapa-3/fogo-magico`

- ⬜ Nível 3: Caldeirão e Chapa Mágica, comida queimando, fogo e extintor mágico
- ⬜ Sistema de marcos + primeira família desbloqueável (Panda) como prova de conceito
- ⬜ Suporte completo a gamepad + remapeamento simples
- ⬜ Acessibilidade: modo "sem pressa" (paciência infinita), tamanho de texto, reduzir efeitos
- ⬜ Polimento: animações de entrada/saída, câmera com leve zoom nos momentos de festa, mais partículas
- ⬜ Otimização (instancing, orçamento de draw calls) e teste em notebook modesto
- ⬜ Publicação no GitHub Pages (workflow de deploy)

---

## Registro de sessões
Adicione uma linha por sessão de trabalho (mais recente no topo).

| Data | Etapa | Resumo |
|---|---|---|
| 2026-09-25 | 1 | Criado projeto, documentação (GDD, arquitetura, AGENTS/CLAUDE), implementação completa da Etapa 1 e PR aberto para revisão do Gemini. |
