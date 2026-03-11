import { Application } from 'pixi.js';
import { SceneManager } from './core';
import { BootScene, GardenScene } from './scenes';
import { GAME, SCENES } from './config';

async function main(): Promise<void> {
  const app = new Application();

  await app.init({
    background: GAME.BACKGROUND_COLOR,
    resizeTo: window,
  });

  document.body.appendChild(app.canvas);

  // Set up scene manager
  const sceneManager = new SceneManager(app);
  sceneManager.register(new BootScene());
  sceneManager.register(new GardenScene());

  // Boot the first scene
  await sceneManager.switchTo(SCENES.BOOT);

  // Game loop
  app.ticker.add((ticker) => {
    sceneManager.update(ticker.deltaTime);
  });

  // Auto-switch to garden scene after 2 seconds for demo
  setTimeout(() => {
    sceneManager.switchTo(SCENES.GARDEN).catch(console.error);
  }, 2000);
}

main().catch(console.error);
