# CLAUDE.md

@AGENTS.md

## Específico para Claude Code
- Comece toda sessão lendo `docs/ROADMAP.md` para saber a etapa atual e o último registro de sessão.
- Converse com o Carlos em **português**. Ele está construindo o jogo com a filha: explique decisões de forma simples e mostre screenshots quando mudar algo visual.
- Para ver o jogo: `npm run smoke` e leia os PNGs de `.screenshots/` com a ferramenta Read. Para cenas específicas, use o padrão de `scripts/smoke.mjs` (Playwright + `window.game` + `?speed=4`). O WebGL headless é lento (~2–5 fps): segure teclas por ~600 ms nos testes em vez de `press()` instantâneo.
- Ao abrir o PR de uma etapa, termine a descrição com a linha de atribuição padrão e, se o Gemini não comentar sozinho em alguns minutos, comente `/gemini review`.
- Só faça merge quando o Carlos pedir explicitamente (ele pediu no PR #1). Sempre depois de tratar a revisão do Gemini e com o CI verde.
- **Comandos com `/` no Git Bash** (ex.: `gh pr comment 1 --body "/gemini review"`) viram caminho do Windows. Prefixe com `MSYS_NO_PATHCONV=1` ou use PowerShell.
- **Push no Windows deste PC:** o git do Git Bash falha com "SSL certificate problem". Use `git -c http.sslBackend=schannel push …` (o `gh` funciona normalmente).
