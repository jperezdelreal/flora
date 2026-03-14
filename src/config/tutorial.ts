// TLDR: Tutorial step definitions and contextual hint configs

/** TLDR: A single guided tutorial step shown during first run */
export interface TutorialStep {
  readonly id: string;
  readonly title: string;
  readonly message: string;
  readonly icon: string;
  /** TLDR: EventBus event that completes this step (or null for click-to-advance) */
  readonly completionEvent: string | null;
  /** TLDR: Milliseconds to auto-dismiss if no completion event (0 = wait for event) */
  readonly autoDismissMs: number;
}

/** TLDR: A contextual hint shown on first encounter of a mechanic */
export interface TutorialHint {
  readonly id: string;
  readonly message: string;
  readonly icon: string;
  /** TLDR: EventBus event that triggers this hint */
  readonly triggerEvent: string;
  /** TLDR: Milliseconds before auto-fade (default 5000) */
  readonly durationMs: number;
}

/** TLDR: Guided first-season steps — walk the player through plant → water → harvest */
export const TUTORIAL_STEPS: readonly TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Flora! 🌱',
    message: 'Your garden awaits! Each season, you\'ll plant seeds, tend your garden, and harvest what you grow. Let\'s get started!',
    icon: '🌻',
    completionEvent: null,
    autoDismissMs: 0,
  },
  {
    id: 'movement',
    title: 'Getting Around',
    message: 'Use WASD or Arrow keys to move around the garden. Click any tile to move there directly!',
    icon: '🚶',
    completionEvent: null,
    autoDismissMs: 0,
  },
  {
    id: 'planting',
    title: 'Planting Seeds',
    message: 'Select the Seed tool from the toolbar below, then click an empty tile to plant. Each plant has its own growth time!',
    icon: '🌱',
    completionEvent: 'plant:created',
    autoDismissMs: 0,
  },
  {
    id: 'watering',
    title: 'Watering Plants',
    message: 'Select the Watering Can, then click a planted tile to water it. Plants need water to grow healthy and strong!',
    icon: '💧',
    completionEvent: 'plant:watered',
    autoDismissMs: 0,
  },
  {
    id: 'growing',
    title: 'Watch Them Grow',
    message: 'Plants grow over time through stages: Seedling → Sprout → Mature. Hover over a plant to see its progress!',
    icon: '🌿',
    completionEvent: null,
    autoDismissMs: 0,
  },
  {
    id: 'harvesting',
    title: 'Harvesting',
    message: 'When a plant reaches maturity, click it to harvest! You\'ll earn seeds and discover new plant varieties.',
    icon: '🌾',
    completionEvent: 'plant:harvested',
    autoDismissMs: 0,
  },
  {
    id: 'complete',
    title: 'You\'re Ready! 🎉',
    message: 'That\'s the basics! Explore synergies, watch for weather, and fill your encyclopedia. Happy gardening!',
    icon: '✨',
    completionEvent: null,
    autoDismissMs: 0,
  },
] as const;

/** TLDR: Contextual hints triggered on first encounter of each mechanic */
export const TUTORIAL_HINTS: readonly TutorialHint[] = [
  {
    id: 'hint_pest',
    message: 'Oh no, a pest! Click on infested tiles to shoo them away before they damage your plants.',
    icon: '🐛',
    triggerEvent: 'pest:spawned',
    durationMs: 5000,
  },
  {
    id: 'hint_synergy',
    message: 'Nice placement! Some plants boost their neighbors. Try planting complementary species next to each other.',
    icon: '✨',
    triggerEvent: 'synergy:activated',
    durationMs: 5000,
  },
  {
    id: 'hint_drought',
    message: 'A drought is coming! Water your plants extra — soil dries faster during droughts.',
    icon: '☀️',
    triggerEvent: 'drought:started',
    durationMs: 5000,
  },
  {
    id: 'hint_frost',
    message: 'Frost warning! Harvest vulnerable plants quickly, or they may take damage overnight.',
    icon: '❄️',
    triggerEvent: 'frost:started',
    durationMs: 5000,
  },
  {
    id: 'hint_discovery',
    message: 'New discovery! Check your Encyclopedia to learn more about the plants you\'ve found.',
    icon: '📖',
    triggerEvent: 'discovery:new',
    durationMs: 5000,
  },
  {
    id: 'hint_score',
    message: 'Points! You earn score for harvesting, discovering new plants, and surviving hazards. Aim for milestones!',
    icon: '⭐',
    triggerEvent: 'score:milestone',
    durationMs: 5000,
  },
  {
    id: 'hint_day_advance',
    message: 'A new day! Your actions refresh each day. Plan your moves carefully — time marches on!',
    icon: '🌅',
    triggerEvent: 'day:advanced',
    durationMs: 5000,
  },
  {
    id: 'hint_weed',
    message: 'A weed appeared! Pull it before it spreads. Weeds slow nearby plant growth, but yield compost when removed.',
    icon: '🌿',
    triggerEvent: 'weed:spawned',
    durationMs: 5000,
  },
  {
    id: 'hint_compost',
    message: 'You earned compost! Use the Compost tool on any tile to boost its soil quality by 20%.',
    icon: '🪴',
    triggerEvent: 'compost:generated',
    durationMs: 5000,
  },
] as const;

/** TLDR: How to Play content for PauseMenu reference screen */
export interface HowToPlaySection {
  readonly title: string;
  readonly icon: string;
  readonly lines: readonly string[];
}

export const HOW_TO_PLAY: readonly HowToPlaySection[] = [
  {
    title: 'Movement',
    icon: '🚶',
    lines: ['WASD / Arrow keys to move', 'Click any tile to walk there'],
  },
  {
    title: 'Tools',
    icon: '🔧',
    lines: ['Select a tool from the toolbar', 'Click a tile to use it', 'Seed: plant on empty tiles', 'Water: hydrate your plants'],
  },
  {
    title: 'Growth',
    icon: '🌱',
    lines: ['Plants grow through stages over days', 'Water regularly for healthy growth', 'Harvest mature plants for seeds'],
  },
  {
    title: 'Hazards',
    icon: '🐛',
    lines: ['Pests can infest your plants', 'Click infested tiles to remove pests', 'Watch for weather warnings!'],
  },
  {
    title: 'Synergies',
    icon: '✨',
    lines: ['Some plants boost their neighbors', 'Experiment with placement patterns', 'Check tooltips for synergy info'],
  },
  {
    title: 'Seasons',
    icon: '🍂',
    lines: ['Each run is one 12-day season', 'Your garden resets between seasons', 'Discoveries persist forever!'],
  },
] as const;

/** TLDR: localStorage key for tutorial/hint persistence */
export const TUTORIAL_STORAGE_KEY = 'flora_tutorial';
