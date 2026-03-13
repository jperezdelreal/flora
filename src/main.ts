import { Application } from 'pixi.js';
import { SceneManager, GameLoop, InputManager, AssetLoader } from './core';
import { BootScene, GardenScene, SeedSelectionScene } from './scenes';
import { GAME, SCENES } from './config';
import { audioManager, SeedSelectionSystem, EncyclopediaSystem, SaveManager } from './systems';

async function main(): Promise<void> {
  const app = new Application();

  await app.init({
    background: GAME.BACKGROUND_COLOR,
    resizeTo: window,
  });

  document.body.appendChild(app.canvas);

  // TLDR: Create centralized save manager (must exist before systems that persist data)
  const saveManager = new SaveManager();

  // TLDR: Initialize audio system (requires user interaction to resume AudioContext)
  audioManager.init(saveManager);

  // Core systems
  const input = new InputManager();
  const assets = new AssetLoader();
  const sceneManager = new SceneManager(app, input, assets);

  // TLDR: Initialize systems for seed selection (with SaveManager persistence)
  const seedSelectionSystem = new SeedSelectionSystem();
  const encyclopediaSystem = new EncyclopediaSystem(saveManager);

  // Register all scenes
  sceneManager.register(
    new BootScene(),
    new SeedSelectionScene(seedSelectionSystem, encyclopediaSystem),
    new GardenScene(saveManager)
  );

  // Boot the first scene
  await sceneManager.switchTo(SCENES.BOOT);

  // TLDR: Resume audio on first user interaction
  let audioResumed = false;
  const resumeAudio = async () => {
    if (!audioResumed) {
      await audioManager.resume();
      audioResumed = true;
      document.removeEventListener('click', resumeAudio);
      document.removeEventListener('keydown', resumeAudio);
    }
  };
  document.addEventListener('click', resumeAudio);
  document.addEventListener('keydown', resumeAudio);

  // Fixed-timestep game loop (60 FPS deterministic updates)
  const gameLoop = new GameLoop(app.ticker, GAME.TARGET_FPS);

  gameLoop.setUpdateCallback((dt: number) => {
    sceneManager.update(dt);
    input.endFrame();
  });

  gameLoop.start();
}

main().catch(console.error);
