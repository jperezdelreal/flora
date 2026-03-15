import { Container, Graphics, Text } from 'pixi.js';
import { ToolType } from '../entities/Player';
import { ALL_TOOLS, CORE_TOOLS, ADVANCED_TOOLS, PROGRESSIVE_TOOL_BY_TYPE, TIER_STARS, ToolTier, type ToolConfig } from '../config/tools';
import { ANIMATION } from '../config/animations';
import { UI_COLORS } from '../config';
import type { ToolSystem } from '../systems/ToolSystem';

export class ToolBar {
  private container: Container;
  private coreContainer: Container;
  private advancedContainer: Container;
  private expandButton: Graphics;
  private expandText: Text;
  private toolButtons: Map<ToolType, Graphics> = new Map();
  private toolTexts: Map<ToolType, Text> = new Map();
  private toolIcons: Map<ToolType, Text> = new Map();
  private toolLockIcons: Map<ToolType, Text> = new Map();
  private toolTierTexts: Map<ToolType, Text> = new Map();
  private toolHintTexts: Map<ToolType, Text> = new Map();
  private toolShortcutTexts: Map<ToolType, Text> = new Map();
  private toolButtonContainers: Map<ToolType, Container> = new Map();
  private selectedTool: ToolType | null = null;
  private unlockedTools: Set<ToolType> = new Set();
  private onToolSelect?: (tool: ToolType | null) => void;
  private toolSystem?: ToolSystem;
  private advancedExpanded = false;

  constructor(toolSystem?: ToolSystem) {
    this.container = new Container();
    this.coreContainer = new Container();
    this.advancedContainer = new Container();
    this.toolSystem = toolSystem;
    if (toolSystem) {
      for (const tool of ALL_TOOLS) {
        if (toolSystem.isToolUnlocked(tool.type)) this.unlockedTools.add(tool.type);
      }
    } else {
      CORE_TOOLS.forEach((tool: ToolConfig) => this.unlockedTools.add(tool.type));
    }
    this.expandButton = new Graphics();
    this.expandText = new Text({ text: '\u25b8 More', style: { fontSize: 11, fill: UI_COLORS.TEXT_HINT, fontWeight: 'bold', align: 'center' } });
    this.initializeToolBar();
  }

  private initializeToolBar(): void {
    const bw = 80, bh = 80, pad = 10;
    const keys: Record<string, string> = { [ToolType.SEED]: '1', [ToolType.WATER]: '2', [ToolType.HARVEST]: '3', [ToolType.REMOVE_PEST]: '4', [ToolType.REMOVE_WEED]: '5', [ToolType.COMPOST]: '6', [ToolType.PEST_SPRAY]: '7', [ToolType.SOIL_TESTER]: '8', [ToolType.TRELLIS]: '9' };
    CORE_TOOLS.forEach((t: ToolConfig, i: number) => this.createToolButton(t, i * (bw + pad), keys, this.coreContainer));
    this.container.addChild(this.coreContainer);
    const ebw = 36, ebx = CORE_TOOLS.length * (bw + pad);
    this.expandButton.roundRect(0, 0, ebw, bh, 8);
    this.expandButton.fill({ color: UI_COLORS.PANEL_BG, alpha: 0.85 });
    this.expandButton.stroke({ color: UI_COLORS.TOOLBAR_SEPARATOR, width: 1.5 });
    this.expandButton.eventMode = 'static'; this.expandButton.cursor = 'pointer'; this.expandButton.x = ebx;
    this.expandText.anchor.set(0.5); this.expandText.x = ebx + ebw / 2; this.expandText.y = bh / 2;
    this.expandButton.on('pointerdown', () => this.toggleAdvanced());
    this.expandButton.on('pointerover', () => { this.expandButton.clear(); this.expandButton.roundRect(0, 0, ebw, bh, 8); this.expandButton.fill({ color: UI_COLORS.BUTTON_HOVER_BG, alpha: 0.9 }); this.expandButton.stroke({ color: UI_COLORS.BUTTON_HOVER_BORDER, width: 1.5 }); });
    this.expandButton.on('pointerout', () => { this.expandButton.clear(); this.expandButton.roundRect(0, 0, ebw, bh, 8); this.expandButton.fill({ color: UI_COLORS.PANEL_BG, alpha: 0.85 }); this.expandButton.stroke({ color: UI_COLORS.TOOLBAR_SEPARATOR, width: 1.5 }); });
    this.container.addChild(this.expandButton); this.container.addChild(this.expandText);
    this.advancedContainer.x = ebx + ebw + pad;
    ADVANCED_TOOLS.forEach((t: ToolConfig, i: number) => this.createToolButton(t, i * (bw + pad), keys, this.advancedContainer));
    this.advancedContainer.visible = false;
    this.container.addChild(this.advancedContainer);
    for (const t of ALL_TOOLS) this.updateButtonAppearance(t.type);
  }

  private createToolButton(tool: ToolConfig, x: number, sk: Record<string, string>, parent: Container): void {
    const bw = 80, bh = 80, bc = new Container();
    const btn = new Graphics(); btn.roundRect(0, 0, bw, bh, 8); btn.fill({ color: UI_COLORS.BUTTON_BG }); btn.stroke({ color: UI_COLORS.BUTTON_BORDER, width: 2 }); btn.eventMode = 'static'; btn.cursor = 'pointer';
    btn.on('pointerdown', () => { if (this.unlockedTools.has(tool.type)) { bc.scale.set(ANIMATION.BUTTON_CLICK_SCALE); setTimeout(() => bc.scale.set(1), ANIMATION.BUTTON_BOUNCE_DURATION * 1000); this.selectTool(tool.type); } });
    btn.on('pointerover', () => { if (this.unlockedTools.has(tool.type)) { bc.scale.set(ANIMATION.BUTTON_HOVER_SCALE); btn.clear(); btn.roundRect(0, 0, bw, bh, 8); btn.fill({ color: UI_COLORS.BUTTON_HOVER_BG }); btn.stroke({ color: UI_COLORS.BUTTON_HOVER_BORDER, width: 2 }); } const h = this.toolHintTexts.get(tool.type); if (h && !this.unlockedTools.has(tool.type)) h.visible = true; });
    btn.on('pointerout', () => { bc.scale.set(1); if (this.selectedTool !== tool.type) this.updateButtonAppearance(tool.type); const h = this.toolHintTexts.get(tool.type); if (h) h.visible = false; });
    bc.addChild(btn); this.toolButtons.set(tool.type, btn);
    const ic = new Text({ text: tool.icon, style: { fontSize: 36, align: 'center' } }); ic.anchor.set(0.5); ic.x = bw / 2; ic.y = bh / 2 - 16; bc.addChild(ic); this.toolIcons.set(tool.type, ic);
    const lk = new Text({ text: '\ud83d\udd12', style: { fontSize: 28, align: 'center' } }); lk.anchor.set(0.5); lk.x = bw / 2; lk.y = bh / 2 - 14; lk.visible = false; bc.addChild(lk); this.toolLockIcons.set(tool.type, lk);
    const tt = new Text({ text: '', style: { fontSize: 10, fill: UI_COLORS.TEXT_TIER_STAR, align: 'right' } }); tt.anchor.set(1, 0); tt.x = bw - 4; tt.y = 2; tt.visible = false; bc.addChild(tt); this.toolTierTexts.set(tool.type, tt);
    const nt = new Text({ text: tool.displayName, style: { fontSize: 10, fill: UI_COLORS.TEXT_PRIMARY, align: 'center' } }); nt.anchor.set(0.5); nt.x = bw / 2; nt.y = bh - 12; bc.addChild(nt); this.toolTexts.set(tool.type, nt);
    const pc = PROGRESSIVE_TOOL_BY_TYPE[tool.type]; const hs = pc?.unlockHint ?? '';
    const ht = new Text({ text: hs, style: { fontSize: 10, fill: UI_COLORS.TEXT_HINT, align: 'center', wordWrap: true, wordWrapWidth: 100 } }); ht.anchor.set(0.5, 1); ht.x = bw / 2; ht.y = -4; ht.visible = false; bc.addChild(ht); this.toolHintTexts.set(tool.type, ht);
    const key = sk[tool.type] ?? '';
    if (key) {
      const sbg = new Graphics(); sbg.roundRect(0, 0, 16, 16, 3); sbg.fill({ color: UI_COLORS.PANEL_BG, alpha: 0.85 }); sbg.stroke({ color: UI_COLORS.BUTTON_BORDER, width: 1 }); sbg.x = 2; sbg.y = 2; bc.addChild(sbg);
      const st = new Text({ text: key, style: { fontSize: 10, fill: UI_COLORS.TEXT_HINT, fontWeight: 'bold', align: 'center' } }); st.anchor.set(0.5); st.x = 10; st.y = 10; bc.addChild(st); this.toolShortcutTexts.set(tool.type, st);
    }
    bc.x = x; this.toolButtonContainers.set(tool.type, bc); parent.addChild(bc);
  }

  private toggleAdvanced(): void { this.advancedExpanded = !this.advancedExpanded; this.advancedContainer.visible = this.advancedExpanded; this.expandText.text = this.advancedExpanded ? '\u25c2 Less' : '\u25b8 More'; }

  private updateButtonAppearance(tool: ToolType): void {
    const btn = this.toolButtons.get(tool), ic = this.toolIcons.get(tool), lk = this.toolLockIcons.get(tool), nm = this.toolTexts.get(tool), tr = this.toolTierTexts.get(tool);
    if (!btn || !ic || !lk || !nm) return;
    const locked = !this.unlockedTools.has(tool); btn.clear(); btn.roundRect(0, 0, 80, 80, 8);
    if (locked) { btn.fill({ color: UI_COLORS.BUTTON_LOCKED_BG, alpha: 0.5 }); btn.stroke({ color: UI_COLORS.BUTTON_LOCKED_BORDER, width: 2 }); ic.visible = false; lk.visible = true; nm.style.fill = UI_COLORS.TEXT_DISABLED; if (tr) tr.visible = false; }
    else { btn.fill({ color: UI_COLORS.BUTTON_BG }); btn.stroke({ color: UI_COLORS.BUTTON_BORDER, width: 2 }); ic.visible = true; lk.visible = false; nm.style.fill = UI_COLORS.TEXT_PRIMARY; if (tr && this.toolSystem) { if (this.toolSystem.hasMultipleTiers(tool)) { tr.text = TIER_STARS[this.toolSystem.getToolTier(tool)]; tr.visible = true; } else { tr.visible = false; } } }
  }

  private selectTool(tool: ToolType): void {
    if (!this.unlockedTools.has(tool)) return;
    if (this.selectedTool) this.updateButtonAppearance(this.selectedTool);
    if (this.selectedTool === tool) { this.selectedTool = null; } else {
      this.selectedTool = tool; const btn = this.toolButtons.get(tool);
      if (btn) { btn.clear(); btn.roundRect(0, 0, 80, 80, 8); btn.fill({ color: UI_COLORS.BUTTON_SELECTED_BG }); btn.stroke({ color: UI_COLORS.BUTTON_SELECTED_BORDER, width: 3 }); }
    }
    if (this.toolSystem) this.toolSystem.setSelectedTool(this.selectedTool);
    if (this.onToolSelect) this.onToolSelect(this.selectedTool);
  }

  unlockTool(tool: ToolType): void {
    if (this.unlockedTools.has(tool)) return;
    this.unlockedTools.add(tool); this.updateButtonAppearance(tool); this.playUnlockAnimation(tool);
    if (ADVANCED_TOOLS.some((t: ToolConfig) => t.type === tool) && !this.advancedExpanded) this.toggleAdvanced();
  }

  updateToolTier(tool: ToolType, tier: ToolTier): void { const t = this.toolTierTexts.get(tool); if (t) { t.text = TIER_STARS[tier]; t.visible = true; } this.playUpgradeAnimation(tool); }

  private playUnlockAnimation(tool: ToolType): void {
    const btn = this.toolButtons.get(tool); if (!btn) return; let c = 0;
    const timer = setInterval(() => { c++; if (c % 2 === 0) { btn.clear(); btn.roundRect(0, 0, 80, 80, 8); btn.fill({ color: UI_COLORS.BUTTON_UNLOCK_HIGHLIGHT }); btn.stroke({ color: UI_COLORS.BUTTON_UNLOCK_BORDER, width: 3 }); } else { this.updateButtonAppearance(tool); } if (c >= 6) { clearInterval(timer); this.updateButtonAppearance(tool); } }, 300);
  }

  setSelectedTool(tool: ToolType | null): void { if (tool && tool !== this.selectedTool) this.selectTool(tool); else if (!tool && this.selectedTool) this.selectTool(this.selectedTool); }
  getSelectedTool(): ToolType | null { return this.selectedTool; }
  setOnToolSelect(cb: (tool: ToolType | null) => void): void { this.onToolSelect = cb; }

  refreshFromToolSystem(): void {
    if (!this.toolSystem) return;
    for (const t of ALL_TOOLS) { if (!this.unlockedTools.has(t.type) && this.toolSystem.isToolUnlocked(t.type)) this.unlockedTools.add(t.type); this.updateButtonAppearance(t.type); }
    if (ADVANCED_TOOLS.some((t: ToolConfig) => this.unlockedTools.has(t.type)) && !this.advancedExpanded) this.toggleAdvanced();
    const saved = this.toolSystem.getSelectedTool(); if (saved && this.unlockedTools.has(saved)) this.selectTool(saved);
  }

  private playUpgradeAnimation(tool: ToolType): void {
    const btn = this.toolButtons.get(tool); if (!btn) return; let c = 0;
    const timer = setInterval(() => { c++; if (c % 2 === 0) { btn.clear(); btn.roundRect(0, 0, 80, 80, 8); btn.fill({ color: UI_COLORS.BUTTON_UPGRADE_HIGHLIGHT }); btn.stroke({ color: UI_COLORS.BUTTON_UPGRADE_BORDER, width: 3 }); } else { this.updateButtonAppearance(tool); } if (c >= 4) { clearInterval(timer); this.updateButtonAppearance(tool); } }, 250);
  }

  position(x: number, y: number): void { this.container.x = x; this.container.y = y; }
  getContainer(): Container { return this.container; }
  destroy(): void { this.container.destroy({ children: true }); this.toolButtons.clear(); this.toolTexts.clear(); this.toolIcons.clear(); this.toolLockIcons.clear(); this.toolTierTexts.clear(); this.toolHintTexts.clear(); this.toolShortcutTexts.clear(); this.toolButtonContainers.clear(); this.unlockedTools.clear(); }
}
