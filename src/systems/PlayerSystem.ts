import { Container, Graphics } from 'pixi.js';
import { Player, ToolType } from '../entities/Player';
import { GardenGrid } from '../entities/GardenGrid';
import { Plant } from '../entities/Plant';
import { InputManager } from '../core/InputManager';
import { getToolConfig, ToolActionResult } from '../config/tools';

export class PlayerSystem {
  private container: Container;
  private player: Player;
  private grid: GardenGrid;
  private input: InputManager;
  private playerGraphics: Graphics;
  private plants: Map<string, Plant>;
  private moveAnimationT: number = 0;
  private moveAnimationDuration: number = 0.3; // seconds
  private startX: number = 0;
  private startY: number = 0;
  private targetX: number = 0;
  private targetY: number = 0;
  private onDayAdvance?: () => void;

  constructor(
    player: Player,
    grid: GardenGrid,
    input: InputManager,
    plants: Map<string, Plant>,
  ) {
    this.player = player;
    this.grid = grid;
    this.input = input;
    this.plants = plants;
    this.container = new Container();
    this.playerGraphics = new Graphics();
    this.container.addChild(this.playerGraphics);

    this.updatePlayerPosition();
    this.renderPlayer();
  }

  setOnDayAdvance(callback: () => void): void {
    this.onDayAdvance = callback;
  }

  update(deltaTime: number): void {
    // Handle movement animation
    if (this.player.isMoving()) {
      this.updateMovementAnimation(deltaTime);
      return; // Don't process input while moving
    }

    // Handle keyboard movement input
    this.handleMovementInput();

    // Update render
    this.renderPlayer();
  }

  private handleMovementInput(): void {
    const pos = this.player.getGridPosition();
    let targetRow = pos.row;
    let targetCol = pos.col;

    if (this.input.isPressed('up')) {
      targetRow = pos.row - 1;
    } else if (this.input.isPressed('down')) {
      targetRow = pos.row + 1;
    } else if (this.input.isPressed('left')) {
      targetCol = pos.col - 1;
    } else if (this.input.isPressed('right')) {
      targetCol = pos.col + 1;
    } else {
      return; // No movement input
    }

    // Validate move is within grid bounds
    const targetTile = this.grid.getTile(targetRow, targetCol);
    if (targetTile) {
      this.startMove(targetRow, targetCol);
    }
  }

  handleTileClick(row: number, col: number): void {
    // If player is moving, ignore
    if (this.player.isMoving()) return;

    const currentPos = this.player.getGridPosition();

    // If clicking current tile, execute tool action
    if (row === currentPos.row && col === currentPos.col) {
      this.executeToolAction();
      return;
    }

    // Check if tile is adjacent for movement
    const rowDiff = Math.abs(row - currentPos.row);
    const colDiff = Math.abs(col - currentPos.col);

    if (rowDiff + colDiff === 1) {
      // Adjacent tile - move there
      this.startMove(row, col);
    } else {
      // Non-adjacent tile - pathfind (simplified: just move if in same row/col)
      if (row === currentPos.row || col === currentPos.col) {
        this.startMove(row, col);
      }
    }
  }

  private startMove(targetRow: number, targetCol: number): void {
    const currentPos = this.player.getGridPosition();
    
    // Get current world position
    const currentWorldPos = this.grid.getTilePosition(currentPos.row, currentPos.col);
    this.startX = currentWorldPos.x + this.grid.config.tileSize / 2;
    this.startY = currentWorldPos.y + this.grid.config.tileSize / 2;

    // Get target world position
    const targetWorldPos = this.grid.getTilePosition(targetRow, targetCol);
    this.targetX = targetWorldPos.x + this.grid.config.tileSize / 2;
    this.targetY = targetWorldPos.y + this.grid.config.tileSize / 2;

    // Start movement
    this.player.moveTo(targetRow, targetCol);
    this.moveAnimationT = 0;
  }

  private updateMovementAnimation(deltaTime: number): void {
    this.moveAnimationT += deltaTime / this.moveAnimationDuration;

    if (this.moveAnimationT >= 1.0) {
      // Complete movement
      this.moveAnimationT = 1.0;
      this.player.completeMovement();
      this.updatePlayerPosition();
    }

    // Ease in-out cubic interpolation
    const t = this.easeInOutCubic(this.moveAnimationT);
    this.player.x = this.startX + (this.targetX - this.startX) * t;
    this.player.y = this.startY + (this.targetY - this.startY) * t;
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private updatePlayerPosition(): void {
    const pos = this.player.getGridPosition();
    const worldPos = this.grid.getTilePosition(pos.row, pos.col);
    const tileCenter = this.grid.config.tileSize / 2;
    this.player.x = worldPos.x + tileCenter;
    this.player.y = worldPos.y + tileCenter;
  }

  private renderPlayer(): void {
    this.playerGraphics.clear();

    // Draw player as a circle
    this.playerGraphics.circle(0, 0, 16);
    this.playerGraphics.fill({ color: 0x4db8ff });

    // Draw outline
    this.playerGraphics.circle(0, 0, 16);
    this.playerGraphics.stroke({ color: 0x0077cc, width: 2 });

    // Update position
    this.playerGraphics.x = this.player.x;
    this.playerGraphics.y = this.player.y;
  }

  executeToolAction(): ToolActionResult | null {
    const selectedTool = this.player.getSelectedTool();
    if (!selectedTool) {
      return {
        success: false,
        message: 'No tool selected',
      };
    }

    if (!this.player.hasActionsRemaining()) {
      return {
        success: false,
        message: 'No actions remaining',
      };
    }

    const pos = this.player.getGridPosition();
    const tile = this.grid.getTile(pos.row, pos.col);
    if (!tile) {
      return {
        success: false,
        message: 'Invalid tile',
      };
    }

    // Find plant at current position
    let plant: Plant | null = null;
    for (const p of this.plants.values()) {
      const plantTile = this.grid.getTileAtPosition(p.x, p.y, 0, 0);
      if (plantTile && plantTile.row === pos.row && plantTile.col === pos.col) {
        plant = p;
        break;
      }
    }

    const toolConfig = getToolConfig(selectedTool);

    // Validate action
    if (!toolConfig.validate(tile, plant)) {
      return {
        success: false,
        message: `Cannot use ${toolConfig.displayName} here`,
      };
    }

    // Execute action
    const result = toolConfig.execute(tile, plant);

    if (result.success) {
      this.player.consumeAction();

      // Check if day should advance
      if (result.advanceDay && !this.player.hasActionsRemaining()) {
        this.player.advanceDay();
        if (this.onDayAdvance) {
          this.onDayAdvance();
        }
      }
    }

    return result;
  }

  getContainer(): Container {
    return this.container;
  }

  getPlayer(): Player {
    return this.player;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
