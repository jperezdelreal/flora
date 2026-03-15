// TLDR: Expose game internals to window for Playwright E2E testing
// Only active in dev mode — stripped from production builds

import type { SceneManager } from '../core/SceneManager';
import type { EventMap } from '../core/EventBus';
import { eventBus } from '../core/EventBus';

// TLDR: Maximum event log entries to prevent memory leaks in long-running test sessions
const MAX_EVENT_LOG = 1000;

// TLDR: Events captured for Playwright assertions
const TRACKED_EVENTS: Array<keyof EventMap> = [
  'plant:created',
  'plant:grew',
  'plant:watered',
  'plant:harvested',
  'plant:died',
  'day:advanced',
  'season:ended',
  'seed:selected',
  'pest:spawned',
  'pest:removed',
  'action:consumed',
];

export interface FloraTestHooks {
  sceneManager: {
    currentScene: string;
    switchTo: (name: string) => Promise<void>;
  };
  getPlayerState: () => {
    day: number;
    actionsRemaining: number;
    maxActions: number;
    selectedTool: string | null;
    gridPosition: { row: number; col: number };
    row: number;
    col: number;
    isMoving: boolean;
  };
  getGridState: () => {
    rows: number;
    cols: number;
    tiles: Array<{ row: number; col: number; state: string; hasPlant: boolean }>;
  };
  getPlantCount: () => number;
  getActivePlants: () => Array<{
    id: string;
    x: number;
    y: number;
    growthStage: string;
    configId: string;
  }>;
  getTileScreenPosition: (row: number, col: number) => { x: number; y: number };
  getEvents: () => string[];
  clearEvents: () => void;
  getSeedPool: () => string[];
  selectTool: (tool: string) => void;
  performAction: () => { success: boolean; message: string };
  movePlayer: (row: number, col: number) => void;
  rest: () => boolean;
}

interface FloraEventLogEntry {
  type: string;
  data: unknown;
  timestamp: number;
}

declare global {
  interface Window {
    __FLORA__?: FloraTestHooks;
    __FLORA_EVENTS__?: FloraEventLogEntry[];
  }
}

/** TLDR: Install test hooks on window — call once after scene registration and game loop start */
export function setupTestHooks(sceneManager: SceneManager): void {
  if (typeof window === 'undefined') return;

  // TLDR: Initialize the event log array
  window.__FLORA_EVENTS__ = [];

  // TLDR: Subscribe to tracked events and push to the log (capped at MAX_EVENT_LOG)
  for (const eventName of TRACKED_EVENTS) {
    eventBus.on(eventName, (data: EventMap[typeof eventName]) => {
      const log = window.__FLORA_EVENTS__;
      if (!log) return;
      log.push({ type: eventName, data, timestamp: Date.now() });
      if (log.length > MAX_EVENT_LOG) {
        log.splice(0, log.length - MAX_EVENT_LOG);
      }
    });
  }

  window.__FLORA__ = {
    sceneManager: {
      get currentScene() {
        return sceneManager.activeScene?.name ?? '';
      },
      switchTo: (name: string) => sceneManager.switchTo(name),
    },

    getPlayerState: () => {
      const garden = getGardenScene(sceneManager);
      if (!garden) return { day: 0, actionsRemaining: 0, maxActions: 0, selectedTool: null, gridPosition: { row: 0, col: 0 }, row: 0, col: 0, isMoving: false };
      return garden.getTestPlayerState();
    },

    getGridState: () => {
      const garden = getGardenScene(sceneManager);
      if (!garden) return { rows: 0, cols: 0, tiles: [] };
      return garden.getTestGridState();
    },

    getPlantCount: () => {
      const garden = getGardenScene(sceneManager);
      if (!garden) return 0;
      return garden.getTestPlantCount();
    },

    getActivePlants: () => {
      const garden = getGardenScene(sceneManager);
      if (!garden) return [];
      return garden.getTestActivePlants();
    },

    getTileScreenPosition: (row: number, col: number) => {
      const garden = getGardenScene(sceneManager);
      if (!garden) return { x: 0, y: 0 };
      return garden.getTestTileScreenPosition(row, col);
    },

    getEvents: () => {
      return (window.__FLORA_EVENTS__ ?? []).map((e) => e.type);
    },

    clearEvents: () => {
      if (window.__FLORA_EVENTS__) {
        window.__FLORA_EVENTS__.length = 0;
      }
    },

    getSeedPool: () => {
      const garden = getGardenScene(sceneManager);
      if (!garden) return [];
      return garden.getTestSeedPool();
    },

    // TLDR: Select a tool by string name for E2E tests (#284)
    selectTool: (tool: string) => {
      const garden = getGardenScene(sceneManager);
      if (garden) garden.selectTestTool(tool);
    },

    // TLDR: Execute current tool on player's tile for E2E tests (#299)
    performAction: () => {
      const garden = getGardenScene(sceneManager);
      if (!garden) return { success: false, message: 'Not in garden' };
      return garden.performTestAction();
    },

    // TLDR: Move player to tile instantly for E2E tests (#299)
    movePlayer: (row: number, col: number) => {
      const garden = getGardenScene(sceneManager);
      if (garden) garden.moveTestPlayer(row, col);
    },

    // TLDR: Rest and advance day for E2E tests (#299)
    rest: () => {
      const garden = getGardenScene(sceneManager);
      if (!garden) return false;
      return garden.performTestRest();
    },
  };
}

/** TLDR: Helper to safely retrieve the GardenScene when it's the active scene */
function getGardenScene(sceneManager: SceneManager) {
  const scene = sceneManager.activeScene;
  if (!scene || scene.name !== 'garden') return null;
  // TLDR: Use structural typing — if the scene has our test getters, it's GardenScene
  return scene as unknown as ReturnType<typeof toGardenTestable>;
}

// TLDR: Type helper so callers don't need direct GardenScene import
type GardenTestable = {
  name: string;
  getTestPlayerState: () => {
    day: number;
    actionsRemaining: number;
    maxActions: number;
    selectedTool: string | null;
    gridPosition: { row: number; col: number };
    row: number;
    col: number;
    isMoving: boolean;
  };
  getTestGridState: () => {
    rows: number;
    cols: number;
    tiles: Array<{ row: number; col: number; state: string; hasPlant: boolean }>;
  };
  getTestPlantCount: () => number;
  getTestActivePlants: () => Array<{
    id: string;
    x: number;
    y: number;
    growthStage: string;
    configId: string;
  }>;
  getTestTileScreenPosition: (row: number, col: number) => { x: number; y: number };
  getTestSeedPool: () => string[];
  selectTestTool: (tool: string) => void;
  performTestAction: () => { success: boolean; message: string };
  moveTestPlayer: (row: number, col: number) => void;
  performTestRest: () => boolean;
};

function toGardenTestable(): GardenTestable {
  throw new Error('Type helper only');
}
