import { Application } from 'pixi.js';
import { SceneManager } from './core';
import { BootScene } from './scenes';
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

  // Boot the first scene
  await sceneManager.switchTo(SCENES.BOOT);

  // Game loop
  app.ticker.add((ticker) => {
    sceneManager.update(ticker.deltaTime);
  });
}

main().catch(console.error);
