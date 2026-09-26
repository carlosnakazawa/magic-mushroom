/** Caminhos para clientes (A* em grade, 8 direções sem cortar quinas). Puro e testado. */

export type Cell = readonly [number, number];
export type Walkable = (x: number, z: number) => boolean;

const DIRS: readonly [number, number, number][] = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, Math.SQRT2],
  [1, -1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [-1, -1, Math.SQRT2],
];

export function findPath(walkable: Walkable, start: Cell, goal: Cell, maxNodes = 4000): Cell[] | null {
  const key = (x: number, z: number) => `${x},${z}`;
  const h = (x: number, z: number) => Math.hypot(goal[0] - x, goal[1] - z);
  const open: { x: number; z: number; f: number }[] = [{ x: start[0], z: start[1], f: h(start[0], start[1]) }];
  const g = new Map<string, number>([[key(start[0], start[1]), 0]]);
  const came = new Map<string, Cell>();
  let visited = 0;
  while (open.length && visited++ < maxNodes) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (open[i]!.f < open[bi]!.f) bi = i;
    const cur = open.splice(bi, 1)[0]!;
    if (cur.x === goal[0] && cur.z === goal[1]) {
      const path: Cell[] = [[cur.x, cur.z]];
      let k = key(cur.x, cur.z);
      while (came.has(k)) {
        const p = came.get(k)!;
        path.unshift(p);
        k = key(p[0], p[1]);
      }
      return path;
    }
    const cg = g.get(key(cur.x, cur.z))!;
    for (const [dx, dz, cost] of DIRS) {
      const nx = cur.x + dx;
      const nz = cur.z + dz;
      const isGoal = nx === goal[0] && nz === goal[1];
      if (!isGoal && !walkable(nx, nz)) continue;
      // Diagonal só se as duas laterais forem livres (não corta quina de balcão)
      if (dx && dz && (!walkable(cur.x + dx, cur.z) || !walkable(cur.x, cur.z + dz))) continue;
      const ng = cg + cost;
      const nk = key(nx, nz);
      if (ng < (g.get(nk) ?? Infinity)) {
        g.set(nk, ng);
        came.set(nk, [cur.x, cur.z]);
        open.push({ x: nx, z: nz, f: ng + h(nx, nz) });
      }
    }
  }
  return null;
}

/** Linha reta entre dois pontos não passa por célula bloqueada (amostragem). */
export function clearLine(walkable: Walkable, ax: number, az: number, bx: number, bz: number, margin = 0.3): boolean {
  const len = Math.hypot(bx - ax, bz - az);
  const steps = Math.max(1, Math.ceil(len / 0.2));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = ax + (bx - ax) * t;
    const z = az + (bz - az) * t;
    // Checa um "corpo" em volta do ponto, não só o centro
    for (const [ox, oz] of [
      [0, 0],
      [margin, 0],
      [-margin, 0],
      [0, margin],
      [0, -margin],
    ] as const) {
      if (!walkable(Math.round(x + ox), Math.round(z + oz))) return false;
    }
  }
  return true;
}

/** Remove pontos intermediários quando dá para ir reto (movimento mais natural). */
export function simplify(walkable: Walkable, pts: readonly (readonly [number, number])[]): [number, number][] {
  if (pts.length <= 2) return pts.map((p) => [p[0], p[1]]);
  const out: [number, number][] = [[pts[0]![0], pts[0]![1]]];
  let anchor = 0;
  for (let i = 2; i < pts.length; i++) {
    const a = pts[anchor]!;
    const b = pts[i]!;
    if (!clearLine(walkable, a[0], a[1], b[0], b[1])) {
      const prev = pts[i - 1]!;
      out.push([prev[0], prev[1]]);
      anchor = i - 1;
    }
  }
  const last = pts[pts.length - 1]!;
  out.push([last[0], last[1]]);
  return out;
}
