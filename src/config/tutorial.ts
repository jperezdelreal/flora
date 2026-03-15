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
    message: 'Your garden awaits! Each day you get 3 actions to plant, water, and harvest. Use them wisely — the day advances when you run out!',
    icon: '🌻',
    completionEvent: null,
    autoDismissMs: 0,
  },
  {
    id: 'movement',
    title: 'Getting Around',
    message: 'Use WASD or Arrow keys to move. Click any tile to walk there. Moving is FREE — it doesn\'t cost actions!',
    icon: '🚶',
    completionEvent: null,
    autoDismissMs: 0,
  },
  {
    id: 'planting',
    title: 'Planting Seeds (Action 1/3)',
    message: 'Select the Seed tool from the toolbar, then click an empty tile to plant. This costs 1 action. Watch your action counter in the top-right!',
    icon: '🌱',
    completionEvent: 'plant:created',
    autoDismissMs: 0,
  },
  {
    id: 'watering',
    title: 'Watering Plants (Action 2/3)',
    message: 'Select the Watering Can, then click your planted tile to water it. This costs 1 action. Watered plants grow faster!',
    icon: '💧',
    completionEvent: 'plant:watered',
    autoDismissMs: 0,
  },
  {
    id: 'actions',
    title: 'Understanding Actions',
    message: 'You have 3 actions per day. Each tool use costs 1 action. When you run out, the day advances and your plants grow. Your actions refresh each day!',
    icon: '⚡',
    completionEvent: null,
    autoDismissMs: 0,
  },
  {
    id: 'growing',
    title: 'The Day Cycle',
    message: 'Each day your plants grow: Seedling → Sprout → Mature. Days pass automatically when you use all actions. You have 12 days per season!',
    icon: '🌿',
    completionEvent: null,
    autoDismissMs: 0,
  },
  {
    id: 'harvesting',
    title: 'Harvesting at Maturity',
    message: 'When a plant is fully grown (look for the bright glow!), click it to harvest. You\'ll earn seeds and discover new plant varieties!',
    icon: '🌾',
    completionEvent: 'plant:harvested',
    autoDismissMs: 0,
  },
  {
    id: 'complete',
    title: 'You\'re Ready! 🎉',
    message: 'Remember: Plant → Water → Wait for growth → Harvest → Repeat! Watch your action counter and plan your days wisely. Happy gardening!',
    icon: '✨',
    completionEvent: null,
    autoDismissMs: 0,
  },
] as const;

/** TLDR: Contextual hints triggered on first encounter of each mechanic */
export const TUTORIAL_HINTS: readonly TutorialHint[] = [
  {
    id: 'hint_actions_reminder',
    message: 'Remember: Each tool use costs 1 action. You get 3 actions per day. The day advances when you run out!',
    icon: '⚡',
    triggerEvent: 'tutorial:completed',
    durationMs: 6000,
  },
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
    title: 'The Day Cycle',
    icon: '☀️',
    lines: ['Each day = 3 actions (plant, water, harvest)', 'Day advances when actions run out', 'Plants grow at the start of each day', '12 days per season'],
  },
  {
    title: 'Movement',
    icon: '🚶',
    lines: ['WASD / Arrow keys to move', 'Click any tile to walk there', 'Movement is FREE — no action cost!'],
  },
  {
    title: 'Tools & Actions',
    icon: '🔧',
    lines: ['Each tool use = 1 action', 'Seed: plant on empty tiles', 'Water: hydrate plants to grow faster', 'Watch action counter (top-right)'],
  },
  {
    title: 'Growth',
    icon: '🌱',
    lines: ['Plants grow at day start: Seedling → Sprout → Mature', 'Water boosts growth speed', 'Harvest when mature (glowing)'],
  },
  {
    title: 'Hazards',
    icon: '🐛',
    lines: ['Pests can infest your plants', 'Click infested tiles to remove them', 'Weather warnings appear 2 days early'],
  },
  {
    title: 'Synergies',
    icon: '✨',
    lines: ['Some plants boost their neighbors', 'Plant complementary species nearby', 'Check tooltips for synergy details'],
  },
  {
    title: 'Seasons',
    icon: '🍂',
    lines: ['Each run is one 12-day season', 'Your garden resets between seasons', 'Discoveries persist forever!'],
  },
] as const;

/** TLDR: localStorage key for tutorial/hint persistence */
export const TUTORIAL_STORAGE_KEY = 'flora_tutorial';
