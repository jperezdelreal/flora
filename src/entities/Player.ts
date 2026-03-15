import { Entity } from './index';

export interface PlayerConfig {
  startRow: number;
  startCol: number;
  actionsPerDay: number;
}

export enum ToolType {
  WATER = 'water',
  HARVEST = 'harvest',
  REMOVE_PEST = 'remove_pest',
  REMOVE_WEED = 'remove_weed',
  COMPOST = 'compost',
  PEST_SPRAY = 'pest_spray',
  SOIL_TESTER = 'soil_tester',
  TRELLIS = 'trellis',
  SEED = 'seed',
}

export interface PlayerState {
  row: number;
  col: number;
  selectedTool: ToolType | null;
  actionsRemaining: number;
  maxActions: number;
  currentDay: number;
  isMoving: boolean;
  targetRow?: number;
  targetCol?: number;
}

export class Player implements Entity {
  readonly id: string;
  x: number;
  y: number;
  active: boolean;
  private state: PlayerState;

  constructor(id: string, config: PlayerConfig) {
    this.id = id;
    this.x = 0;
    this.y = 0;
    this.active = true;

    this.state = {
      row: config.startRow,
      col: config.startCol,
      selectedTool: null,
      actionsRemaining: config.actionsPerDay,
      maxActions: config.actionsPerDay,
      currentDay: 1,
      isMoving: false,
    };
  }

  getState(): Readonly<PlayerState> {
    return { ...this.state };
  }

  getGridPosition(): { row: number; col: number } {
    return { row: this.state.row, col: this.state.col };
  }

  setGridPosition(row: number, col: number): void {
    this.state.row = row;
    this.state.col = col;
  }

  moveTo(row: number, col: number): void {
    this.state.targetRow = row;
    this.state.targetCol = col;
    this.state.isMoving = true;
  }

  completeMovement(): void {
    if (this.state.targetRow !== undefined && this.state.targetCol !== undefined) {
      this.state.row = this.state.targetRow;
      this.state.col = this.state.targetCol;
    }
    this.state.isMoving = false;
    this.state.targetRow = undefined;
    this.state.targetCol = undefined;
  }

  isMoving(): boolean {
    return this.state.isMoving;
  }

  getSelectedTool(): ToolType | null {
    return this.state.selectedTool;
  }

  selectTool(tool: ToolType): void {
    this.state.selectedTool = tool;
  }

  deselectTool(): void {
    this.state.selectedTool = null;
  }

  hasActionsRemaining(): boolean {
    return this.state.actionsRemaining > 0;
  }

  consumeAction(): void {
    if (this.state.actionsRemaining > 0) {
      this.state.actionsRemaining--;
    }
  }

  getMaxActions(): number {
    return this.state.maxActions;
  }

  advanceDay(): void {
    this.state.currentDay++;
    this.state.actionsRemaining = this.state.maxActions;
  }

  /** TLDR: Reset day counter for multi-season transitions (#201) */
  resetDay(): void {
    this.state.currentDay = 1;
    this.state.actionsRemaining = this.state.maxActions;
  }

  getCurrentDay(): number {
    return this.state.currentDay;
  }

  getActionsRemaining(): number {
    return this.state.actionsRemaining;
  }
}
