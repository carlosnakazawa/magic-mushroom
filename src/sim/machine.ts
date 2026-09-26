import { TUNING } from '../config';
import type { IngredientKind } from '../data/ingredients';
import { METHOD_VESSEL, canAddIngredient, matchRecipe, needsChopped, type Method, type RecipeDef, type Vessel } from '../data/recipes';

export type MachineKind = 'blender' | 'cauldron' | 'griddle';

/**
 * idle → working → done → (só caldeirão/chapa) warning → burnt → fire
 * O liquidificador nunca queima (Nível 2 ensina só a "espera da máquina").
 */
export type MachinePhase = 'idle' | 'working' | 'done' | 'warning' | 'burnt' | 'fire';

export type MachineEvent = 'done' | 'warning' | 'burnt' | 'fire' | 'extinguished';

const METHOD: Record<MachineKind, Method> = { blender: 'blend', cauldron: 'cook', griddle: 'grill' };

/**
 * Uma máquina de cozinha (lógica pura, testada).
 * - Liquidificador: precisa ser ligado (`start`, botão usar); depois trabalha sozinho.
 * - Caldeirão/chapa: começam sozinhos quando a receita está completa, e podem queimar.
 */
export class Machine {
  contents: IngredientKind[] = [];
  phase: MachinePhase = 'idle';
  /** Progresso da fase atual (0..1). */
  progress = 0;
  /** Progresso do extintor apagando o fogo (0..1). */
  extinguish = 0;
  /** Desliga a queima (modo "sem pressa"). */
  safe = false;
  /** Incrementa quando o visual precisa mudar. */
  version = 0;

  constructor(readonly kind: MachineKind) {}

  get method(): Method {
    return METHOD[this.kind];
  }

  get vessel(): Vessel {
    return METHOD_VESSEL[this.method];
  }

  get burns(): boolean {
    return this.kind !== 'blender';
  }

  /** Receita que o conteúdo atual forma (completa), ou null. */
  get recipe(): RecipeDef | null {
    return matchRecipe(this.method, this.contents);
  }

  get ready(): boolean {
    return this.phase === 'done' || this.phase === 'warning';
  }

  canAdd(kind: IngredientKind, chopped: boolean): boolean {
    if (this.phase !== 'idle') return false;
    if (chopped !== needsChopped(this.method)) return false;
    return canAddIngredient(this.method, this.contents, kind);
  }

  add(kind: IngredientKind): boolean {
    if (this.phase !== 'idle' || !canAddIngredient(this.method, this.contents, kind)) return false;
    this.contents.push(kind);
    this.version++;
    // Caldeirão e chapa começam sozinhos quando a receita fica completa.
    if (this.kind !== 'blender' && this.recipe) this.begin();
    return true;
  }

  /** Liga o liquidificador (precisa de uma receita completa). */
  start(): boolean {
    if (this.kind !== 'blender' || this.phase !== 'idle' || !this.recipe) return false;
    this.begin();
    return true;
  }

  private begin(): void {
    this.phase = 'working';
    this.progress = 0;
    this.version++;
  }

  private workTime(): number {
    const m = TUNING.machines;
    return this.kind === 'blender' ? m.blendTime : this.kind === 'cauldron' ? m.cookTime : m.grillTime;
  }

  /** `speed` acelera o trabalho (bônus de descanso). */
  update(dt: number, speed = 1): MachineEvent[] {
    const m = TUNING.machines;
    const events: MachineEvent[] = [];
    const advance = (time: number, next: MachinePhase, ev: MachineEvent) => {
      this.progress += dt / time;
      if (this.progress >= 1) {
        this.phase = next;
        this.progress = 0;
        this.version++;
        events.push(ev);
      }
    };
    switch (this.phase) {
      case 'working':
        this.progress += (dt * speed) / this.workTime();
        if (this.progress >= 1) {
          this.phase = 'done';
          this.progress = 0;
          this.version++;
          events.push('done');
        }
        break;
      case 'done':
        if (this.burns && !this.safe) advance(m.safeTime, 'warning', 'warning');
        break;
      case 'warning':
        if (this.safe) break;
        advance(m.warnTime, 'burnt', 'burnt');
        break;
      case 'burnt':
        if (this.safe) break;
        advance(m.burntToFire, 'fire', 'fire');
        break;
      default:
        break;
    }
    return events;
  }

  /** Retira o resultado pronto (para encher um recipiente). */
  take(): { method: Method; contents: IngredientKind[]; recipe: RecipeDef } | null {
    const recipe = this.recipe;
    if (!this.ready || !recipe) return null;
    const out = { method: this.method, contents: [...this.contents], recipe };
    this.reset();
    return out;
  }

  /** Joga fora comida queimada (antes de pegar fogo). */
  dump(): boolean {
    if (this.phase !== 'burnt' && !(this.phase === 'idle' && this.contents.length)) return false;
    this.reset();
    return true;
  }

  /** Aplica o extintor por `dt` segundos. Retorna true quando o fogo apagou. */
  spray(dt: number): boolean {
    if (this.phase !== 'fire') return false;
    this.extinguish += dt / TUNING.machines.extinguishTime;
    if (this.extinguish >= 1) {
      this.reset();
      return true;
    }
    return false;
  }

  private reset(): void {
    this.contents = [];
    this.phase = 'idle';
    this.progress = 0;
    this.extinguish = 0;
    this.version++;
  }
}
