import { Graphics, Text, Container } from 'pixi.js';
import type { Scene, SceneContext } from '../core';
import { GARDEN, COLORS } from '../config';

/**
 * Garden scene stub — colored background, 8x8 plot grid, and title text.
 * Ready for gameplay systems to be wired in.
 */
export class GardenScene implements Scene {
  readonly name = 'garden';
  private container = new Container();

  async init(ctx: SceneContext): Promise<void> {
    const { app } = ctx;
    const sceneStage = app.stage.children[0] as Container;
    sceneStage.addChild(this.container);

    const cx = app.screen.width / 2;
    const cy = app.screen.height / 2;

    // Sky / background
    const bg = new Graphics();
    bg.rect(0, 0, app.screen.width, app.screen.height);
    bg.fill({ color: COLORS.SKY_BLUE });
    this.container.addChild(bg);

    // Ground strip
    const ground = new Graphics();
    ground.rect(0, app.screen.height * 0.55, app.screen.width, app.screen.height * 0.45);
    ground.fill({ color: COLORS.MID_GREEN });
    this.container.addChild(ground);

    // 8x8 garden grid (centered)
    const gridWidth = GARDEN.GRID_COLS * GARDEN.CELL_SIZE;
    const gridHeight = GARDEN.GRID_ROWS * GARDEN.CELL_SIZE;
    const gridX = cx - gridWidth / 2;
    const gridY = cy - gridHeight / 2 + 40;

    for (let row = 0; row < GARDEN.GRID_ROWS; row++) {
      for (let col = 0; col < GARDEN.GRID_COLS; col++) {
        const cell = new Graphics();
        const x = gridX + col * GARDEN.CELL_SIZE;
        const y = gridY + row * GARDEN.CELL_SIZE;
        cell.rect(x, y, GARDEN.CELL_SIZE, GARDEN.CELL_SIZE);
        cell.fill({ color: GARDEN.SOIL_COLOR });
        cell.stroke({ color: GARDEN.CELL_BORDER_COLOR, width: 1 });
        this.container.addChild(cell);
      }
    }

    // Title
    const title = new Text({
      text: '🌿 Flora',
      style: {
        fontFamily: 'Arial',
        fontSize: 32,
        fill: '#ffffff',
        align: 'center',
        dropShadow: {
          color: '#000000',
          blur: 4,
          distance: 2,
          angle: Math.PI / 4,
        },
      },
    });
    title.anchor.set(0.5);
    title.x = cx;
    title.y = 36;
    this.container.addChild(title);

    // Day counter placeholder
    const dayText = new Text({
      text: 'Day 1 · Spring',
      style: {
        fontFamily: 'Arial',
        fontSize: 18,
        fill: '#2d5a27',
        align: 'center',
      },
    });
    dayText.anchor.set(0.5);
    dayText.x = cx;
    dayText.y = 72;
    this.container.addChild(dayText);

    // Hint text
    const hint = new Text({
      text: 'Press E to interact · Arrow keys to move',
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: '#1a3a18',
        align: 'center',
      },
    });
    hint.anchor.set(0.5);
    hint.x = cx;
    hint.y = app.screen.height - 30;
    this.container.addChild(hint);
  }

  update(_dt: number, _ctx: SceneContext): void {
    // Gameplay systems will hook in here
  }

  destroy(): void {
    this.container.destroy({ children: true });
    this.container = new Container();
  }
}
