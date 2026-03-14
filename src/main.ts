import { Application } from 'pixi.js';
import { SceneManager, GameLoop, InputManager, AssetLoader, FPSMonitor } from './core';
import { BootScene, GardenScene, MenuScene, SeedSelectionScene } from './scenes';
import { GAME, SCENES } from './config';
import { audioManager, SeedSelectionSystem, EncyclopediaSystem, SaveManager } from './systems';
import { initAriaLiveRegion, loadAccessibilityPrefs, announce } from './utils/accessibility';
import { eventBus } from './core/EventBus';

async function main(): Promise<void> {
  const app = new Application();

  await app.init({
    background: GAME.BACKGROUND_COLOR,
    resizeTo: window,
  });

  document.body.appendChild(app.canvas);

  // TLDR: Initialize accessibility — ARIA live region + load persisted preferences
  initAriaLiveRegion();
  loadAccessibilityPrefs();

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
    new MenuScene(saveManager),
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

  // TLDR: FPS monitor — enabled in dev mode only
  const isDev = import.meta.env?.DEV ?? false;
  const fpsMonitor = new FPSMonitor(isDev);
  if (isDev) {
    fpsMonitor.setPosition(app.screen.width - 100, 10);
    app.stage.addChild(fpsMonitor.getContainer());
    fpsMonitor.setQualityChangeCallback((tier) => {
      console.warn(`[FPSMonitor] Quality tier changed to: ${tier}`);
    });
  }

  // Fixed-timestep game loop (60 FPS deterministic updates)
  const gameLoop = new GameLoop(app.ticker, GAME.TARGET_FPS);
  gameLoop.setFPSMonitor(fpsMonitor);

  gameLoop.setUpdateCallback((dt: number) => {
    sceneManager.update(dt);
    input.endFrame();
  });

  gameLoop.start();

  // TLDR: Announce key game events to screen readers via ARIA live region
  eventBus.on('plant:harvested', (data) => {
    announce(`Plant harvested. Seeds collected: ${data.seeds}.`);
  });
  eventBus.on('day:advanced', (data) => {
    announce(`Day ${data.day} has begun.`);
  });
  eventBus.on('season:ended', (data) => {
    announce(`The ${data.season} season has ended.`);
  });
  eventBus.on('milestone:unlocked', (data) => {
    announce(`Milestone unlocked: ${data.milestoneName}!`, 'assertive');
  });
  eventBus.on('achievement:unlocked', (data) => {
    announce(`Achievement unlocked: ${data.achievementName}!`, 'assertive');
  });
  eventBus.on('discovery:new', (data) => {
    announce(`New plant discovered: ${data.plantName}!`, 'assertive');
  });
  eventBus.on('pest:spawned', () => {
    announce('A pest has appeared in the garden.');
  });
  eventBus.on('weather:warning', (data) => {
    announce(`Weather warning: ${data.type} expected in ${data.daysUntil} days.`);
  });
}

main().catch(console.error);
