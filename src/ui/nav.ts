/**
 * Navegação espacial de foco para menus com controle/teclado:
 * move o foco para o botão mais próximo na direção pedida.
 */
export function focusables(root: ParentNode = document): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>('.screens.open button:not([disabled]), .night-panel button:not([disabled])')).filter(
    (el) => el.offsetParent !== null,
  );
}

export function moveFocus(dx: number, dy: number): void {
  const items = focusables();
  if (!items.length) return;
  const cur = document.activeElement as HTMLElement | null;
  if (!cur || !items.includes(cur)) {
    items[0]!.focus();
    return;
  }
  const a = cur.getBoundingClientRect();
  const ax = a.left + a.width / 2;
  const ay = a.top + a.height / 2;
  let best: HTMLElement | null = null;
  let bestScore = Infinity;
  for (const el of items) {
    if (el === cur) continue;
    const b = el.getBoundingClientRect();
    const vx = b.left + b.width / 2 - ax;
    const vy = b.top + b.height / 2 - ay;
    const along = vx * dx + vy * dy;
    if (along <= 4) continue;
    const across = Math.abs(dx ? vy : vx);
    const score = along + across * 2.2;
    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }
  best?.focus();
  best?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
