# CLAUDE.md

@AGENTS.md

## Específico para Claude Code
- Comece toda sessão lendo `docs/ROADMAP.md` para saber a etapa atual e o último registro de sessão.
- Converse com o Carlos em **português**. Ele está construindo o jogo com a filha: explique decisões de forma simples e mostre screenshots quando mudar algo visual.
- Para ver o jogo: `npm run smoke` e leia os PNGs de `.screenshots/` com a ferramenta Read. Para cenas específicas, use o padrão de `scripts/smoke.mjs` (Playwright + `window.game` + `?speed=4`). O WebGL headless é lento (~2–5 fps): segure teclas por ~600 ms nos testes em vez de `press()` instantâneo.
- Ao abrir o PR de uma etapa, termine a descrição com a linha de atribuição padrão e, se o Gemini não comentar sozinho em alguns minutos, comente `/gemini review`.
- Nunca faça merge; o Carlos aprova e faz o merge depois da revisão do Gemini.
- **Push no Windows deste PC:** o git do Git Bash falha com "SSL certificate problem". Use `git -c http.sslBackend=schannel push …` (o `gh` funciona normalmente).
