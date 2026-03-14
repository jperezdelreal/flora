import { Container, Graphics, Text } from 'pixi.js';
import { ToolType } from '../entities/Player';
import { ALL_TOOLS, PROGRESSIVE_TOOL_BY_TYPE, TIER_STARS, ToolTier } from '../config/tools';
import { ANIMATION } from '../config/animations';
import type { ToolSystem } from '../systems/ToolSystem';

export class ToolBar {
  private container: Container;
  private toolButtons: Map<ToolType, Graphics>;
  private toolTexts: Map<ToolType, Text>;
  private toolIcons: Map<ToolType, Text>;
  private toolLockIcons: Map<ToolType, Text>;
  private toolTierTexts: Map<ToolType, Text>;
  private toolHintTexts: Map<ToolType, Text>;
  private selectedTool: ToolType | null = null;
  private unlockedTools: Set<ToolType> = new Set();
  private onToolSelect?: (tool: ToolType | null) => void;
  private toolSystem?: ToolSystem;

  constructor(toolSystem?: ToolSystem) {
    this.container = new Container();
    this.toolButtons = new Map();
    this.toolTexts = new Map();
    this.toolIcons = new Map();
    this.toolLockIcons = new Map();
    this.toolTierTexts = new Map();
    this.toolHintTexts = new Map();
    this.toolSystem = toolSystem;

    if (toolSystem) {
      // TLDR: Determine unlocked tools from ToolSystem
      for (const tool of ALL_TOOLS) {
        if (toolSystem.isToolUnlocked(tool.type)) {
          this.unlockedTools.add(tool.type);
        }
      }
    } else {
      // TLDR: Fallback — all tools start unlocked (MVP behavior)
      ALL_TOOLS.forEach((tool) => this.unlockedTools.add(tool.type));
    }
    
    this.initializeToolBar();
  }

  private initializeToolBar(): void {
    const buttonWidth = 80;
    const buttonHeight = 80;
    const padding = 10;

    ALL_TOOLS.forEach((tool, index) => {
      const buttonContainer = new Container();
      const x = index * (buttonWidth + padding);

      // Button background
      const button = new Graphics();
      button.rect(0, 0, buttonWidth, buttonHeight);
      button.fill({ color: 0x2c2c2c });
      button.stroke({ color: 0x4a4a4a, width: 2 });
      button.eventMode = 'static';
      button.cursor = 'pointer';

      button.on('pointerdown', () => {
        if (this.unlockedTools.has(tool.type)) {
          // TLDR: Click scale feedback — brief squish
          buttonContainer.scale.set(ANIMATION.BUTTON_CLICK_SCALE);
          setTimeout(() => {
            buttonContainer.scale.set(1);
          }, ANIMATION.BUTTON_BOUNCE_DURATION * 1000);
          this.selectTool(tool.type);
        }
      });

      button.on('pointerover', () => {
        if (this.unlockedTools.has(tool.type)) {
          // TLDR: Hover scale-up feedback
          buttonContainer.scale.set(ANIMATION.BUTTON_HOVER_SCALE);
          button.clear();
          button.rect(0, 0, buttonWidth, buttonHeight);
          button.fill({ color: 0x3c3c3c });
          button.stroke({ color: 0x6a6a6a, width: 2 });
        }
        // TLDR: Show unlock hint on hover for locked tools
        const hintText = this.toolHintTexts.get(tool.type);
        if (hintText && !this.unlockedTools.has(tool.type)) {
          hintText.visible = true;
        }
      });

      button.on('pointerout', () => {
        // TLDR: Reset scale on pointer out
        buttonContainer.scale.set(1);
        if (this.selectedTool !== tool.type) {
          this.updateButtonAppearance(tool.type);
        }
        // TLDR: Hide unlock hint
        const hintText = this.toolHintTexts.get(tool.type);
        if (hintText) {
          hintText.visible = false;
        }
      });

      buttonContainer.addChild(button);
      this.toolButtons.set(tool.type, button);

      // Tool icon
      const iconText = new Text({
        text: tool.icon,
        style: {
          fontSize: 32,
          align: 'center',
        },
      });
      iconText.anchor.set(0.5);
      iconText.x = buttonWidth / 2;
      iconText.y = buttonHeight / 2 - 14;
      buttonContainer.addChild(iconText);
      this.toolIcons.set(tool.type, iconText);

      // Lock icon (initially hidden)
      const lockIcon = new Text({
        text: '🔒',
        style: {
          fontSize: 28,
          align: 'center',
        },
      });
      lockIcon.anchor.set(0.5);
      lockIcon.x = buttonWidth / 2;
      lockIcon.y = buttonHeight / 2 - 14;
      lockIcon.visible = false;
      buttonContainer.addChild(lockIcon);
      this.toolLockIcons.set(tool.type, lockIcon);

      // TLDR: Tier indicator (stars) — top-right corner
      const tierText = new Text({
        text: '',
        style: { fontSize: 10, fill: '#ffd700', align: 'right' },
      });
      tierText.anchor.set(1, 0);
      tierText.x = buttonWidth - 4;
      tierText.y = 2;
      tierText.visible = false;
      buttonContainer.addChild(tierText);
      this.toolTierTexts.set(tool.type, tierText);

      // Tool name
      const nameText = new Text({
        text: tool.displayName,
        style: {
          fontSize: 12,
          fill: '#ffffff',
          align: 'center',
        },
      });
      nameText.anchor.set(0.5);
      nameText.x = buttonWidth / 2;
      nameText.y = buttonHeight - 15;
      buttonContainer.addChild(nameText);
      this.toolTexts.set(tool.type, nameText);

      // TLDR: Unlock hint text (shown on hover for locked tools)
      const progressiveConfig = PROGRESSIVE_TOOL_BY_TYPE[tool.type];
      const hintStr = progressiveConfig?.unlockHint ?? '';
      const hintText = new Text({
        text: hintStr,
        style: { fontSize: 10, fill: '#aaaaaa', align: 'center', wordWrap: true, wordWrapWidth: 100 },
      });
      hintText.anchor.set(0.5, 1);
      hintText.x = buttonWidth / 2;
      hintText.y = -4;
      hintText.visible = false;
      buttonContainer.addChild(hintText);
      this.toolHintTexts.set(tool.type, hintText);

      buttonContainer.x = x;
      this.container.addChild(buttonContainer);
    });

    // TLDR: Apply initial appearance for all tools
    for (const tool of ALL_TOOLS) {
      this.updateButtonAppearance(tool.type);
    }
  }

  /**
   * TLDR: Update button visual state based on locked/unlocked status
   */
  private updateButtonAppearance(tool: ToolType): void {
    const button = this.toolButtons.get(tool);
    const icon = this.toolIcons.get(tool);
    const lockIcon = this.toolLockIcons.get(tool);
    const nameText = this.toolTexts.get(tool);
    const tierText = this.toolTierTexts.get(tool);
    
    if (!button || !icon || !lockIcon || !nameText) return;

    const isLocked = !this.unlockedTools.has(tool);

    button.clear();
    button.rect(0, 0, 80, 80);
    
    if (isLocked) {
      // Locked appearance — grayed out
      button.fill({ color: 0x1a1a1a, alpha: 0.5 });
      button.stroke({ color: 0x3a3a3a, width: 2 });
      icon.visible = false;
      lockIcon.visible = true;
      nameText.style.fill = '#666666';
      if (tierText) tierText.visible = false;
    } else {
      // Unlocked appearance
      button.fill({ color: 0x2c2c2c });
      button.stroke({ color: 0x4a4a4a, width: 2 });
      icon.visible = true;
      lockIcon.visible = false;
      nameText.style.fill = '#ffffff';

      // TLDR: Show tier stars if tool has multiple tiers
      if (tierText && this.toolSystem) {
        const hasMultipleTiers = this.toolSystem.hasMultipleTiers(tool);
        if (hasMultipleTiers) {
          const currentTier = this.toolSystem.getToolTier(tool);
          tierText.text = TIER_STARS[currentTier];
          tierText.visible = true;
        } else {
          tierText.visible = false;
        }
      }
    }
  }

  private selectTool(tool: ToolType): void {
    // Don't select locked tools
    if (!this.unlockedTools.has(tool)) {
      return;
    }

    // Deselect previous tool
    if (this.selectedTool) {
      const prevButton = this.toolButtons.get(this.selectedTool);
      if (prevButton) {
        this.updateButtonAppearance(this.selectedTool);
      }
    }

    // Select new tool (or deselect if clicking same tool)
    if (this.selectedTool === tool) {
      this.selectedTool = null;
    } else {
      this.selectedTool = tool;
      const button = this.toolButtons.get(tool);
      if (button) {
        button.clear();
        button.rect(0, 0, 80, 80);
        button.fill({ color: 0x4a9eff });
        button.stroke({ color: 0x2d7acc, width: 3 });
      }
    }

    // TLDR: Persist selection in ToolSystem
    if (this.toolSystem) {
      this.toolSystem.setSelectedTool(this.selectedTool);
    }

    if (this.onToolSelect) {
      this.onToolSelect(this.selectedTool);
    }
  }

  /**
   * TLDR: Unlock a tool and play highlight animation
   */
  unlockTool(tool: ToolType): void {
    if (this.unlockedTools.has(tool)) {
      return; // Already unlocked
    }

    this.unlockedTools.add(tool);
    this.updateButtonAppearance(tool);
    this.playUnlockAnimation(tool);
  }

  /**
   * TLDR: Update tier display for a tool (called after tier upgrade)
   */
  updateToolTier(tool: ToolType, tier: ToolTier): void {
    const tierText = this.toolTierTexts.get(tool);
    if (tierText) {
      tierText.text = TIER_STARS[tier];
      tierText.visible = true;
    }
    this.playUpgradeAnimation(tool);
  }

  /**
   * TLDR: Play highlight animation on newly unlocked tool
   */
  private playUnlockAnimation(tool: ToolType): void {
    const button = this.toolButtons.get(tool);
    if (!button) return;

    // Simple pulse animation (3 pulses)
    let pulseCount = 0;
    const pulseInterval = 300; // milliseconds
    const maxPulses = 6;

    const pulseTimer = setInterval(() => {
      pulseCount++;
      
      if (pulseCount % 2 === 0) {
        // Bright state
        button.clear();
        button.rect(0, 0, 80, 80);
        button.fill({ color: 0x4caf50 });
        button.stroke({ color: 0x66bb6a, width: 3 });
      } else {
        // Normal state
        this.updateButtonAppearance(tool);
      }

      if (pulseCount >= maxPulses) {
        clearInterval(pulseTimer);
        this.updateButtonAppearance(tool);
      }
    }, pulseInterval);
  }

  setSelectedTool(tool: ToolType | null): void {
    if (tool && tool !== this.selectedTool) {
      this.selectTool(tool);
    } else if (!tool && this.selectedTool) {
      this.selectTool(this.selectedTool); // Toggle off
    }
  }

  getSelectedTool(): ToolType | null {
    return this.selectedTool;
  }

  setOnToolSelect(callback: (tool: ToolType | null) => void): void {
    this.onToolSelect = callback;
  }

  /** TLDR: Refresh unlocked state from ToolSystem (call after loading save) */
  refreshFromToolSystem(): void {
    if (!this.toolSystem) return;

    for (const tool of ALL_TOOLS) {
      const wasUnlocked = this.unlockedTools.has(tool.type);
      const isNowUnlocked = this.toolSystem.isToolUnlocked(tool.type);
      if (!wasUnlocked && isNowUnlocked) {
        this.unlockedTools.add(tool.type);
      }
      this.updateButtonAppearance(tool.type);
    }

    // TLDR: Restore persisted tool selection
    const savedTool = this.toolSystem.getSelectedTool();
    if (savedTool && this.unlockedTools.has(savedTool)) {
      this.selectTool(savedTool);
    }
  }

  /**
   * TLDR: Play upgrade animation when tool tier increases
   */
  private playUpgradeAnimation(tool: ToolType): void {
    const button = this.toolButtons.get(tool);
    if (!button) return;

    let pulseCount = 0;
    const pulseInterval = 250;
    const maxPulses = 4;

    const pulseTimer = setInterval(() => {
      pulseCount++;
      if (pulseCount % 2 === 0) {
        button.clear();
        button.rect(0, 0, 80, 80);
        button.fill({ color: 0xffd700 });
        button.stroke({ color: 0xffeb3b, width: 3 });
      } else {
        this.updateButtonAppearance(tool);
      }
      if (pulseCount >= maxPulses) {
        clearInterval(pulseTimer);
        this.updateButtonAppearance(tool);
      }
    }, pulseInterval);
  }

  position(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    this.container.destroy({ children: true });
    this.toolButtons.clear();
    this.toolTexts.clear();
    this.toolIcons.clear();
    this.toolLockIcons.clear();
    this.toolTierTexts.clear();
    this.toolHintTexts.clear();
    this.unlockedTools.clear();
  }
}
