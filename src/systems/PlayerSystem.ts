import { Container, Graphics } from 'pixi.js';
import { Player, ToolType } from '../entities/Player';
import { GardenGrid } from '../entities/GardenGrid';
import { Plant } from '../entities/Plant';
import { InputManager } from '../core/InputManager';
import { getToolConfig, ToolActionResult } from '../config/tools';
import { System } from './index';
import { eventBus } from '../core/EventBus';

export class PlayerSystem implements System {
  readonly name = 'PlayerSystem';
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

    // TLDR: Emit movement event for SFX before position update (#306)
    const fromRow = currentPos.row;
    const fromCol = currentPos.col;

    // Movement is free — only tool use costs actions
    this.player.moveTo(targetRow, targetCol);
    this.moveAnimationT = 0;

    eventBus.emit('player:moved', {
      fromRow,
      fromCol,
      toRow: targetRow,
      toCol: targetCol,
    });
  }

  private updateMovementAnimation(deltaTime: number): void {
    this.moveAnimationT += deltaTime / this.moveAnimationDuration;

    if (this.moveAnimationT >= 1.0) {
      // Complete movement — no day-advance check here; only tool actions advance the day
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

    // Body (green overalls)
    this.playerGraphics.roundRect(-10, -6, 20, 22, 4);
    this.playerGraphics.fill({ color: 0x4caf50 });
    this.playerGraphics.roundRect(-10, -6, 20, 22, 4);
    this.playerGraphics.stroke({ color: 0x388e3c, width: 1.5 });

    // Overall straps
    this.playerGraphics.moveTo(-6, -6);
    this.playerGraphics.lineTo(-4, -14);
    this.playerGraphics.stroke({ color: 0x388e3c, width: 2 });
    this.playerGraphics.moveTo(6, -6);
    this.playerGraphics.lineTo(4, -14);
    this.playerGraphics.stroke({ color: 0x388e3c, width: 2 });

    // Head (skin-toned circle)
    this.playerGraphics.circle(0, -16, 10);
    this.playerGraphics.fill({ color: 0xffcc99 });
    this.playerGraphics.circle(0, -16, 10);
    this.playerGraphics.stroke({ color: 0xd4a373, width: 1 });

    // Straw hat (wide brim + dome)
    this.playerGraphics.ellipse(0, -26, 14, 4);
    this.playerGraphics.fill({ color: 0xc9a96e });
    this.playerGraphics.ellipse(0, -29, 9, 5);
    this.playerGraphics.fill({ color: 0xd4b896 });
    this.playerGraphics.ellipse(0, -26, 14, 4);
    this.playerGraphics.stroke({ color: 0x8b6914, width: 1 });

    // Hat band
    this.playerGraphics.rect(-9, -27, 18, 2);
    this.playerGraphics.fill({ color: 0xc0392b });

    // Eyes
    this.playerGraphics.circle(-4, -17, 2);
    this.playerGraphics.fill({ color: 0xffffff });
    this.playerGraphics.circle(-4, -17, 1);
    this.playerGraphics.fill({ color: 0x2c3e50 });
    this.playerGraphics.circle(4, -17, 2);
    this.playerGraphics.fill({ color: 0xffffff });
    this.playerGraphics.circle(4, -17, 1);
    this.playerGraphics.fill({ color: 0x2c3e50 });

    // Smile
    this.playerGraphics.arc(0, -14, 4, 0.1, Math.PI - 0.1);
    this.playerGraphics.stroke({ color: 0x8b5e3c, width: 1.2 });

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

    // TLDR: Find plant at current tile (optimized direct lookup by tile coordinates)
    const plant = Array.from(this.plants.values()).find(p => {
      const plantTile = this.grid.getTileAtPosition(p.x, p.y, 0, 0);
      return plantTile && plantTile.row === pos.row && plantTile.col === pos.col;
    }) || null;

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
      
      // TLDR: Emit action consumed event for UI feedback (#250)
      eventBus.emit('action:consumed', {
        actionsRemaining: this.player.getActionsRemaining(),
        maxActions: this.player.getMaxActions(),
      });

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

  /**
   * TLDR: Rest action — skip remaining actions, advance day, boost soil quality
   */
  rest(): void {
    if (!this.player.hasActionsRemaining()) {
      return; // No actions to skip
    }

    const SOIL_BOOST = 5;
    
    // TLDR: Apply soil quality boost to all tiles
    const allTiles = this.grid.getAllTiles();
    for (const tile of allTiles) {
      const newQuality = Math.min(100, tile.soilQuality + SOIL_BOOST);
      tile.setSoilQuality(newQuality);
    }

    // TLDR: Consume all remaining actions to force day advance
    while (this.player.hasActionsRemaining()) {
      this.player.consumeAction();
    }
    
    // TLDR: Advance to next day
    this.player.advanceDay();

    // TLDR: Emit rest event for scoring and UI feedback
    eventBus.emit('player:rested', {
      soilBoost: SOIL_BOOST,
      day: this.player.getCurrentDay(),
    });

    // TLDR: Trigger day advance callback
    if (this.onDayAdvance) {
      this.onDayAdvance();
    }
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
