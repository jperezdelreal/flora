import { Application } from 'pixi.js';
import { SceneManager, GameLoop, InputManager, AssetLoader } from './core';
import { BootScene, GardenScene } from './scenes';
import { GAME, SCENES } from './config';

async function main(): Promise<void> {
  const app = new Application();

  await app.init({
    background: GAME.BACKGROUND_COLOR,
    resizeTo: window,
  });

  document.body.appendChild(app.canvas);

  // Core systems
  const input = new InputManager();
  const assets = new AssetLoader();
  const sceneManager = new SceneManager(app, input, assets);

  // Register all scenes
  sceneManager.register(new BootScene(), new GardenScene());

  // Boot the first scene
  await sceneManager.switchTo(SCENES.BOOT);

  // Fixed-timestep game loop (60 FPS deterministic updates)
  const gameLoop = new GameLoop(app.ticker, GAME.TARGET_FPS);

  gameLoop.setUpdateCallback((dt: number) => {
    sceneManager.update(dt);
    input.endFrame();
  });

  gameLoop.start();
}

main().catch(console.error);
