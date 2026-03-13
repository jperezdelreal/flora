// TLDR: Structure entity — a utility building placed on a garden tile

import type { Entity } from './index';
import { StructureType } from '../config/structures';

/** TLDR: Serialisable structure state for save/load */
export interface StructureState {
  id: string;
  type: StructureType;
  row: number;
  col: number;
}

/** TLDR: Structure entity placed on the garden grid */
export class Structure implements Entity {
  readonly id: string;
  readonly type: StructureType;
  x: number;
  y: number;
  active = true;

  constructor(id: string, type: StructureType, col: number, row: number) {
    this.id = id;
    this.type = type;
    this.x = col;
    this.y = row;
  }

  get row(): number {
    return this.y;
  }

  get col(): number {
    return this.x;
  }

  /** TLDR: Serialise to plain object for persistence */
  toState(): StructureState {
    return { id: this.id, type: this.type, row: this.y, col: this.x };
  }

  /** TLDR: Reconstruct from saved state */
  static fromState(state: StructureState): Structure {
    return new Structure(state.id, state.type, state.col, state.row);
  }
}
