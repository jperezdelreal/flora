import { Container, Graphics, Text } from 'pixi.js';
import type { Scene, SceneContext } from '../core';
import { GAME, SCENES, COLORS } from '../config';
import { audioManager, ParticleSystem, AnimationSystem, Easing, SaveManager } from '../systems';

type MenuState = 'title' | 'main' | 'settings' | 'credits';
type VolumeChannel = 'master' | 'sfx' | 'ambient' | 'music';

interface MenuItem {
  label: string;
  action: string;
  enabled: boolean;
}

interface SliderState {
  channel: VolumeChannel;
  label: string;
  value: number;
  bar: Graphics;
  fill: Graphics;
  handle: Graphics;
  valueText: Text;
  trackX: number;
  trackWidth: number;
  trackY: number;
}

/**
 * TLDR: Title screen + main menu + settings — cozy first impression
 */
export class MenuScene implements Scene {
  readonly name = 'menu';
  /** TLDR: When true, init() skips title screen and shows main menu directly */
  static skipTitle = false;
  private container = new Container();
  private particleSystem: ParticleSystem;
  private animationSystem: AnimationSystem;
  private saveManager: SaveManager;

  private titleLayer = new Container();
  private mainMenuLayer = new Container();
  private settingsLayer = new Container();
  private creditsLayer = new Container();
  private bgLayer = new Container();
  private particleLayer = new Container();

  private state: MenuState = 'title';
  private menuItems: MenuItem[] = [];
  private selectedIndex = 0;
  private menuItemGraphics: { bg: Graphics; text: Text; enabled: boolean }[] = [];

  private sliders: SliderState[] = [];
  private settingsItems: { label: string; action: string }[] = [];
  private settingsSelectedIndex = 0;
  private settingsItemGraphics: { bg: Graphics; text: Text }[] = [];
  private colorblindMode = false;
  private colorblindToggle: { bg: Graphics; text: Text } | null = null;

  private logoText: Text | null = null;
  private logoGlow: Graphics | null = null;
  private studioCredit: Text | null = null;
  private titlePrompt: Text | null = null;
  private elapsed = 0;
  private titleFadeComplete = false;
  private fireflyCooldown = 0;

  private boundOnKeyDown!: (e: KeyboardEvent) => void;
  private ctx: SceneContext | null = null;

  private draggingSlider: SliderState | null = null;
  private boundOnPointerMove!: (e: PointerEvent) => void;
  private boundOnPointerUp!: () => void;
  private boundOnResize!: () => void;
  private screenWidth = 800;
  private screenHeight = 600;

  constructor(saveManager: SaveManager) {
    this.saveManager = saveManager;
    this.particleSystem = new ParticleSystem();
    this.animationSystem = new AnimationSystem();
  }

  async init(ctx: SceneContext): Promise<void> {
    this.ctx = ctx;
    const { app } = ctx;
    const stage = app.stage.children[0] as Container;
    stage.addChild(this.container);
    this.screenWidth = app.screen.width;
    this.screenHeight = app.screen.height;

    // TLDR: Load persisted settings
    const savedSettings = this.saveManager.loadSettings();
    if (savedSettings) {
      this.colorblindMode = savedSettings.colorblindMode;
    }

    this.container.addChild(this.bgLayer);
    this.container.addChild(this.particleLayer);
    this.particleLayer.addChild(this.particleSystem.getContainer());
    this.container.addChild(this.titleLayer);
    this.container.addChild(this.mainMenuLayer);
    this.container.addChild(this.settingsLayer);
    this.container.addChild(this.creditsLayer);

    this.buildBackground();
    this.buildTitleScreen();
    this.buildMainMenu();
    this.buildSettingsPanel();
    this.buildCreditsPage();

    // TLDR: Skip title screen when returning from sub-scenes (e.g. Encyclopedia)
    if (MenuScene.skipTitle) {
      MenuScene.skipTitle = false;
      this.titleFadeComplete = true;
      this.showState('main');
    } else {
      this.showState('title');
    }

    this.boundOnKeyDown = (e: KeyboardEvent) => this.handleKeyDown(e);
    window.addEventListener('keydown', this.boundOnKeyDown);
    this.boundOnPointerMove = (e: PointerEvent) => this.handlePointerMove(e);
    this.boundOnPointerUp = () => this.handlePointerUp();
    window.addEventListener('pointermove', this.boundOnPointerMove);
    window.addEventListener('pointerup', this.boundOnPointerUp);
    this.boundOnResize = () => {
      if (this.ctx) {
        this.screenWidth = this.ctx.app.screen.width;
        this.screenHeight = this.ctx.app.screen.height;
      }
    };
    window.addEventListener('resize', this.boundOnResize);
    this.elapsed = 0;
    this.titleFadeComplete = false;
    this.fireflyCooldown = 0;

    // TLDR: Start ambient audio loop for menu atmosphere
    audioManager.startAmbient();
  }

  private buildBackground(): void {
    const bg = new Graphics();
    bg.rect(0, 0, this.screenWidth, this.screenHeight);
    bg.fill({ color: COLORS.DARK_GREEN });
    this.bgLayer.addChild(bg);

    const hills = new Graphics();
    const w = this.screenWidth;
    const h = this.screenHeight;
    hills.moveTo(0, h * 0.7);
    hills.quadraticCurveTo(w * 0.15, h * 0.55, w * 0.3, h * 0.65);
    hills.quadraticCurveTo(w * 0.5, h * 0.75, w * 0.65, h * 0.6);
    hills.quadraticCurveTo(w * 0.85, h * 0.5, w, h * 0.62);
    hills.lineTo(w, h);
    hills.lineTo(0, h);
    hills.closePath();
    hills.fill({ color: 0x1e4d1a, alpha: 0.6 });
    this.bgLayer.addChild(hills);

    const fgHills = new Graphics();
    fgHills.moveTo(0, h * 0.82);
    fgHills.quadraticCurveTo(w * 0.25, h * 0.72, w * 0.45, h * 0.78);
    fgHills.quadraticCurveTo(w * 0.7, h * 0.85, w, h * 0.76);
    fgHills.lineTo(w, h);
    fgHills.lineTo(0, h);
    fgHills.closePath();
    fgHills.fill({ color: 0x163d13, alpha: 0.5 });
    this.bgLayer.addChild(fgHills);

    // TLDR: Decorative flower dots on hills
    for (let i = 0; i < 18; i++) {
      const flower = new Graphics();
      const fx = Math.random() * w;
      const fy = h * 0.7 + Math.random() * h * 0.25;
      const flowerColors = [0xffb7c5, 0xffd700, 0xff6b6b, 0x87ceeb, 0xdda0dd];
      const color = flowerColors[Math.floor(Math.random() * flowerColors.length)];
      flower.circle(fx, fy, 2 + Math.random() * 2);
      flower.fill({ color, alpha: 0.4 + Math.random() * 0.3 });
      this.bgLayer.addChild(flower);
    }
  }

  private buildTitleScreen(): void {
    const cx = this.screenWidth / 2;
    const cy = this.screenHeight / 2;

    this.logoGlow = new Graphics();
    this.logoGlow.circle(cx, cy - 80, 100);
    this.logoGlow.fill({ color: 0x88d498, alpha: 0.15 });
    this.titleLayer.addChild(this.logoGlow);

    this.logoText = new Text({ text: `🌿 ${GAME.TITLE.toUpperCase()}`, style: { fontFamily: 'Arial', fontSize: 64, fill: '#88d498', fontWeight: 'bold', align: 'center', dropShadow: { color: '#2d5a27', blur: 8, distance: 0 } } });
    this.logoText.anchor.set(0.5);
    this.logoText.x = cx;
    this.logoText.y = cy - 80;
    this.logoText.alpha = 0;
    this.titleLayer.addChild(this.logoText);

    const tagline = new Text({ text: 'A cozy gardening roguelite', style: { fontFamily: 'Arial', fontSize: 20, fill: '#c8e6c9', align: 'center' } });
    tagline.anchor.set(0.5);
    tagline.x = cx;
    tagline.y = cy - 20;
    tagline.alpha = 0;
    this.titleLayer.addChild(tagline);
    this.animationSystem.tween(tagline as unknown as Record<string, unknown>, { alpha: 1 }, 1.2, { easing: Easing.easeOut });

    this.studioCredit = new Text({ text: 'First Frame Studios', style: { fontFamily: 'Arial', fontSize: 14, fill: '#66bb6a', align: 'center' } });
    this.studioCredit.anchor.set(0.5);
    this.studioCredit.x = cx;
    this.studioCredit.y = this.screenHeight - 30;
    this.studioCredit.alpha = 0;
    this.titleLayer.addChild(this.studioCredit);

    this.titlePrompt = new Text({ text: 'Press any key to continue', style: { fontFamily: 'Arial', fontSize: 18, fill: '#88d498', align: 'center' } });
    this.titlePrompt.anchor.set(0.5);
    this.titlePrompt.x = cx;
    this.titlePrompt.y = cy + 60;
    this.titlePrompt.alpha = 0;
    this.titleLayer.addChild(this.titlePrompt);
  }

  private buildMainMenu(): void {
    const cx = this.screenWidth / 2;

    const miniLogo = new Text({ text: `🌿 ${GAME.TITLE.toUpperCase()}`, style: { fontFamily: 'Arial', fontSize: 42, fill: '#88d498', fontWeight: 'bold', align: 'center', dropShadow: { color: '#2d5a27', blur: 6, distance: 0 } } });
    miniLogo.anchor.set(0.5);
    miniLogo.x = cx;
    miniLogo.y = 60;
    this.mainMenuLayer.addChild(miniLogo);

    const hasSave = this.saveManager.loadGarden() !== null;
    this.menuItems = [
      { label: '🌱  New Run', action: 'newRun', enabled: true },
      { label: '🔄  Continue', action: 'continue', enabled: hasSave },
      { label: '📖  Encyclopedia', action: 'encyclopedia', enabled: true },
      { label: '🏆  Achievements', action: 'achievements', enabled: true },
      { label: '⚙️  Settings', action: 'settings', enabled: true },
    ];

    this.menuItemGraphics = [];
    const startY = 150;
    const itemHeight = 58;

    for (let i = 0; i < this.menuItems.length; i++) {
      const item = this.menuItems[i];
      const y = startY + i * itemHeight;
      const bg = new Graphics();
      bg.roundRect(cx - 150, y, 300, 46, 10);
      bg.fill({ color: 0x1a1a1a, alpha: 0.85 });
      bg.stroke({ color: 0x3e7a38, width: 2 });
      bg.eventMode = 'static';
      bg.cursor = item.enabled ? 'pointer' : 'default';
      this.mainMenuLayer.addChild(bg);

      const text = new Text({ text: item.label, style: { fontFamily: 'Arial', fontSize: 22, fill: item.enabled ? '#ffffff' : '#666666', fontWeight: 'bold', align: 'center' } });
      text.anchor.set(0.5);
      text.x = cx;
      text.y = y + 23;
      this.mainMenuLayer.addChild(text);

      if (item.enabled) {
        bg.on('pointerover', () => { this.selectedIndex = i; this.highlightMenuItem(i); });
        bg.on('pointerdown', () => { this.activateMenuItem(i); });
      }
      this.menuItemGraphics.push({ bg, text, enabled: item.enabled });
    }

    const navHint = new Text({ text: '↑↓ Navigate  •  Enter Select  •  Esc Back', style: { fontFamily: 'Arial', fontSize: 13, fill: '#4a7a4a', align: 'center' } });
    navHint.anchor.set(0.5);
    navHint.x = cx;
    navHint.y = this.screenHeight - 30;
    this.mainMenuLayer.addChild(navHint);

    const version = new Text({ text: 'Flora', style: { fontFamily: 'Courier New, monospace', fontSize: 11, fill: '#3a5a3a', align: 'center' } });
    version.anchor.set(0.5);
    version.x = cx;
    version.y = this.screenHeight - 12;
    this.mainMenuLayer.addChild(version);

    // TLDR: Initialize focus to first enabled item
    this.resetMenuFocus();
  }

  private buildSettingsPanel(): void {
    const cx = this.screenWidth / 2;

    const panel = new Graphics();
    panel.roundRect(cx - 220, 40, 440, this.screenHeight - 80, 16);
    panel.fill({ color: 0x111111, alpha: 0.92 });
    panel.stroke({ color: 0x4caf50, width: 2 });
    this.settingsLayer.addChild(panel);

    const title = new Text({ text: '⚙️  Settings', style: { fontFamily: 'Arial', fontSize: 32, fill: '#c8e6c9', fontWeight: 'bold', align: 'center' } });
    title.anchor.set(0.5);
    title.x = cx;
    title.y = 70;
    this.settingsLayer.addChild(title);

    const volumes = audioManager.getVolumes();
    const channels: { channel: VolumeChannel; label: string }[] = [
      { channel: 'master', label: 'Master Volume' },
      { channel: 'music', label: 'Music' },
      { channel: 'sfx', label: 'Sound Effects' },
      { channel: 'ambient', label: 'Ambient' },
    ];

    this.sliders = [];
    let sliderY = 120;
    for (const { channel, label } of channels) {
      sliderY = this.createSlider(cx, sliderY, channel, label, volumes[channel]);
      sliderY += 15;
    }

    // TLDR: Colorblind mode toggle
    sliderY += 10;
    const cbLabel = new Text({ text: 'Colorblind Mode', style: { fontFamily: 'Arial', fontSize: 16, fill: '#c8e6c9', align: 'left' } });
    cbLabel.x = cx - 180;
    cbLabel.y = sliderY;
    this.settingsLayer.addChild(cbLabel);

    const toggleBg = new Graphics();
    const toggleText = new Text({ text: this.colorblindMode ? '✅ ON' : '❌ OFF', style: { fontFamily: 'Arial', fontSize: 16, fill: this.colorblindMode ? '#88d498' : '#888888', fontWeight: 'bold', align: 'center' } });
    toggleBg.roundRect(cx + 80, sliderY - 4, 100, 30, 6);
    toggleBg.fill({ color: this.colorblindMode ? 0x2d5a27 : 0x2a2a2a });
    toggleBg.stroke({ color: 0x4a4a4a, width: 1 });
    toggleBg.eventMode = 'static';
    toggleBg.cursor = 'pointer';
    this.settingsLayer.addChild(toggleBg);
    toggleText.anchor.set(0.5);
    toggleText.x = cx + 130;
    toggleText.y = sliderY + 11;
    this.settingsLayer.addChild(toggleText);
    this.colorblindToggle = { bg: toggleBg, text: toggleText };
    toggleBg.on('pointerdown', () => { this.toggleColorblind(); });

    sliderY += 60;
    this.settingsItems = [
      { label: '📜  Credits', action: 'credits' },
      { label: '🔙  Back', action: 'back' },
    ];
    this.settingsItemGraphics = [];

    for (let i = 0; i < this.settingsItems.length; i++) {
      const item = this.settingsItems[i];
      const y = sliderY + i * 52;
      const bg = new Graphics();
      bg.roundRect(cx - 130, y, 260, 40, 8);
      bg.fill({ color: 0x2a2a2a });
      bg.stroke({ color: 0x4a4a4a, width: 2 });
      bg.eventMode = 'static';
      bg.cursor = 'pointer';
      this.settingsLayer.addChild(bg);
      const text = new Text({ text: item.label, style: { fontFamily: 'Arial', fontSize: 18, fill: '#ffffff', fontWeight: 'bold', align: 'center' } });
      text.anchor.set(0.5);
      text.x = cx;
      text.y = y + 20;
      this.settingsLayer.addChild(text);
      bg.on('pointerover', () => { this.settingsSelectedIndex = i; this.highlightSettingsItem(i); });
      bg.on('pointerdown', () => { this.activateSettingsItem(i); });
      this.settingsItemGraphics.push({ bg, text });
    }
    this.settingsSelectedIndex = 0;
  }

  private createSlider(cx: number, y: number, channel: VolumeChannel, label: string, value: number): number {
    const labelText = new Text({ text: label, style: { fontFamily: 'Arial', fontSize: 16, fill: '#c8e6c9', align: 'left' } });
    labelText.x = cx - 180;
    labelText.y = y;
    this.settingsLayer.addChild(labelText);
    y += 26;

    const trackX = cx - 160;
    const trackWidth = 260;
    const bar = new Graphics();
    bar.roundRect(trackX, y, trackWidth, 8, 4);
    bar.fill({ color: 0x333333 });
    this.settingsLayer.addChild(bar);

    const fillWidth = trackWidth * value;
    const fill = new Graphics();
    fill.roundRect(trackX, y, Math.max(fillWidth, 2), 8, 4);
    fill.fill({ color: COLORS.ACCENT_GREEN });
    this.settingsLayer.addChild(fill);

    const handle = new Graphics();
    handle.circle(0, 0, 10);
    handle.fill({ color: COLORS.LIGHT_GREEN });
    handle.stroke({ color: 0xffffff, width: 2 });
    handle.x = trackX + fillWidth;
    handle.y = y + 4;
    handle.eventMode = 'static';
    handle.cursor = 'pointer';
    this.settingsLayer.addChild(handle);

    const valueText = new Text({ text: `${Math.round(value * 100)}%`, style: { fontFamily: 'Arial', fontSize: 14, fill: '#88d498', align: 'left' } });
    valueText.x = cx + 120;
    valueText.y = y - 4;
    this.settingsLayer.addChild(valueText);

    const slider: SliderState = { channel, label, value, bar, fill, handle, valueText, trackX, trackWidth, trackY: y };
    handle.on('pointerdown', () => { this.draggingSlider = slider; });
    bar.eventMode = 'static';
    bar.cursor = 'pointer';
    bar.on('pointerdown', (e) => { const localX = e.global.x - trackX; this.updateSliderValue(slider, Math.max(0, Math.min(1, localX / trackWidth))); });
    this.sliders.push(slider);
    return y + 24;
  }

  private updateSliderValue(slider: SliderState, value: number): void {
    slider.value = value;
    const fillWidth = slider.trackWidth * value;
    slider.fill.clear();
    slider.fill.roundRect(slider.trackX, slider.trackY, Math.max(fillWidth, 2), 8, 4);
    slider.fill.fill({ color: COLORS.ACCENT_GREEN });
    slider.handle.x = slider.trackX + fillWidth;
    slider.valueText.text = `${Math.round(value * 100)}%`;

    switch (slider.channel) {
      case 'master': audioManager.setMasterVolume(value); break;
      case 'sfx': audioManager.setSFXVolume(value); break;
      case 'ambient': audioManager.setAmbientVolume(value); break;
      case 'music': audioManager.setMusicVolume(value); break;
    }
  }

  private toggleColorblind(): void {
    this.colorblindMode = !this.colorblindMode;
    if (this.colorblindToggle) {
      this.colorblindToggle.text.text = this.colorblindMode ? '✅ ON' : '❌ OFF';
      this.colorblindToggle.text.style.fill = this.colorblindMode ? '#88d498' : '#888888';
      this.colorblindToggle.bg.clear();
      this.colorblindToggle.bg.roundRect(this.screenWidth / 2 + 80, 0, 100, 30, 6);
      this.colorblindToggle.bg.fill({ color: this.colorblindMode ? 0x2d5a27 : 0x2a2a2a });
      this.colorblindToggle.bg.stroke({ color: 0x4a4a4a, width: 1 });
    }
    this.saveManager.saveSettings({ colorblindMode: this.colorblindMode });
  }

  private buildCreditsPage(): void {
    const cx = this.screenWidth / 2;
    const panel = new Graphics();
    panel.roundRect(cx - 200, 60, 400, this.screenHeight - 120, 16);
    panel.fill({ color: 0x111111, alpha: 0.92 });
    panel.stroke({ color: 0x4caf50, width: 2 });
    this.creditsLayer.addChild(panel);

    const title = new Text({ text: '📜  Credits', style: { fontFamily: 'Arial', fontSize: 32, fill: '#c8e6c9', fontWeight: 'bold', align: 'center' } });
    title.anchor.set(0.5);
    title.x = cx;
    title.y = 90;
    this.creditsLayer.addChild(title);

    const creditsContent = [
      { heading: 'FLORA', sub: 'A cozy gardening roguelite' },
      { heading: 'Studio', sub: 'First Frame Studios' },
      { heading: 'Engine', sub: 'PixiJS v8 + TypeScript' },
      { heading: 'Audio', sub: 'Procedural Web Audio API' },
      { heading: 'Design Philosophy', sub: 'Cozy First, Complex Second' },
    ];

    let cy = 140;
    for (const { heading, sub } of creditsContent) {
      const h = new Text({ text: heading, style: { fontFamily: 'Arial', fontSize: 18, fill: '#88d498', fontWeight: 'bold', align: 'center' } });
      h.anchor.set(0.5); h.x = cx; h.y = cy;
      this.creditsLayer.addChild(h);
      const s = new Text({ text: sub, style: { fontFamily: 'Arial', fontSize: 15, fill: '#a0c8a0', align: 'center' } });
      s.anchor.set(0.5); s.x = cx; s.y = cy + 24;
      this.creditsLayer.addChild(s);
      cy += 65;
    }

    const thanks = new Text({ text: '🌿 Thank you for playing! 🌿', style: { fontFamily: 'Arial', fontSize: 16, fill: '#c8e6c9', align: 'center' } });
    thanks.anchor.set(0.5); thanks.x = cx; thanks.y = cy + 20;
    this.creditsLayer.addChild(thanks);

    const backBg = new Graphics();
    backBg.roundRect(cx - 80, this.screenHeight - 100, 160, 40, 8);
    backBg.fill({ color: 0x2a2a2a });
    backBg.stroke({ color: 0x4a4a4a, width: 2 });
    backBg.eventMode = 'static';
    backBg.cursor = 'pointer';
    this.creditsLayer.addChild(backBg);
    const backText = new Text({ text: '🔙  Back', style: { fontFamily: 'Arial', fontSize: 18, fill: '#ffffff', fontWeight: 'bold', align: 'center' } });
    backText.anchor.set(0.5); backText.x = cx; backText.y = this.screenHeight - 80;
    this.creditsLayer.addChild(backText);
    backBg.on('pointerover', () => { backBg.clear(); backBg.roundRect(cx - 80, this.screenHeight - 100, 160, 40, 8); backBg.fill({ color: 0x4caf50 }); backBg.stroke({ color: 0x66bb6a, width: 2 }); });
    backBg.on('pointerout', () => { backBg.clear(); backBg.roundRect(cx - 80, this.screenHeight - 100, 160, 40, 8); backBg.fill({ color: 0x2a2a2a }); backBg.stroke({ color: 0x4a4a4a, width: 2 }); });
    backBg.on('pointerdown', () => { this.showState('settings'); });
  }

  private showState(state: MenuState): void {
    this.state = state;
    this.titleLayer.visible = state === 'title';
    this.mainMenuLayer.visible = state === 'main';
    this.settingsLayer.visible = state === 'settings';
    this.creditsLayer.visible = state === 'credits';
    if (state === 'main') { this.resetMenuFocus(); }
    if (state === 'settings') { this.settingsSelectedIndex = 0; this.highlightSettingsItem(0); }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    switch (this.state) {
      case 'title': this.handleTitleKey(e); break;
      case 'main': this.handleMainMenuKey(e); break;
      case 'settings': this.handleSettingsKey(e); break;
      case 'credits': this.handleCreditsKey(e); break;
    }
  }

  private handleTitleKey(_e: KeyboardEvent): void {
    if (this.titleFadeComplete) this.showState('main');
  }

  private handleMainMenuKey(e: KeyboardEvent): void {
    switch (e.code) {
      case 'ArrowUp': e.preventDefault(); this.navigateMenu(-1); break;
      case 'ArrowDown': e.preventDefault(); this.navigateMenu(1); break;
      case 'Tab': e.preventDefault(); this.navigateMenu(e.shiftKey ? -1 : 1); break;
      case 'Enter': case 'Space': e.preventDefault(); this.activateMenuItem(this.selectedIndex); break;
    }
  }

  private handleSettingsKey(e: KeyboardEvent): void {
    switch (e.code) {
      case 'Escape': e.preventDefault(); this.showState('main'); break;
      case 'ArrowUp': e.preventDefault(); this.navigateSettingsItems(-1); break;
      case 'ArrowDown': e.preventDefault(); this.navigateSettingsItems(1); break;
      case 'Tab': e.preventDefault(); this.navigateSettingsItems(e.shiftKey ? -1 : 1); break;
      case 'ArrowLeft': e.preventDefault(); this.adjustSelectedSlider(-0.05); break;
      case 'ArrowRight': e.preventDefault(); this.adjustSelectedSlider(0.05); break;
      case 'Enter': case 'Space': e.preventDefault(); this.activateSettingsItem(this.settingsSelectedIndex); break;
    }
  }

  private handleCreditsKey(e: KeyboardEvent): void {
    if (e.code === 'Escape' || e.code === 'Enter' || e.code === 'Backspace') {
      e.preventDefault();
      this.showState('settings');
    }
  }

  // TLDR: Reset menu focus to first enabled item (ensures keyboard/visual sync)
  private resetMenuFocus(): void {
    const firstEnabledIndex = this.menuItems.findIndex(item => item.enabled);
    const targetIndex = firstEnabledIndex >= 0 ? firstEnabledIndex : 0;
    this.selectedIndex = targetIndex;
    this.highlightMenuItem(targetIndex);
  }

  private navigateMenu(direction: number): void {
    let next = this.selectedIndex;
    const len = this.menuItems.length;
    for (let attempt = 0; attempt < len; attempt++) {
      next = (next + direction + len) % len;
      if (this.menuItems[next].enabled) break;
    }
    this.selectedIndex = next;
    this.highlightMenuItem(next);
  }

  private highlightMenuItem(index: number): void {
    for (let i = 0; i < this.menuItemGraphics.length; i++) {
      const { bg, text, enabled } = this.menuItemGraphics[i];
      const selected = i === index;
      const cx = this.screenWidth / 2;
      const y = 150 + i * 58;
      bg.clear();
      bg.roundRect(cx - 150, y, 300, 46, 10);
      if (selected && enabled) {
        bg.fill({ color: 0x3e7a38, alpha: 0.9 });
        bg.stroke({ color: 0x88d498, width: 3 });
        text.style.fill = '#ffffff';
      } else {
        bg.fill({ color: 0x1a1a1a, alpha: 0.85 });
        bg.stroke({ color: 0x3e7a38, width: 2 });
        text.style.fill = enabled ? '#cccccc' : '#666666';
      }
    }
  }

  private activateMenuItem(index: number): void {
    const item = this.menuItems[index];
    if (!item || !item.enabled || !this.ctx) return;
    switch (item.action) {
      case 'newRun': this.ctx.sceneManager.transitionTo(SCENES.SEED_SELECTION, { type: 'crossfade' }).catch(console.error); break;
      case 'continue': this.ctx.sceneManager.transitionTo(SCENES.GARDEN, { type: 'fade' }).catch(console.error); break;
      case 'encyclopedia': this.ctx.sceneManager.transitionTo(SCENES.ENCYCLOPEDIA, { type: 'crossfade' }).catch(console.error); break;
      case 'achievements': this.ctx.sceneManager.transitionTo(SCENES.ACHIEVEMENTS, { type: 'crossfade' }).catch(console.error); break;
      case 'settings': this.showState('settings'); break;
    }
  }

  private navigateSettingsItems(direction: number): void {
    const totalItems = this.sliders.length + 1 + this.settingsItems.length;
    this.settingsSelectedIndex = (this.settingsSelectedIndex + direction + totalItems) % totalItems;
    this.highlightSettingsItem(this.settingsSelectedIndex);
  }

  private highlightSettingsItem(index: number): void {
    const sliderCount = this.sliders.length;
    const cx = this.screenWidth / 2;
    for (let i = 0; i < this.sliders.length; i++) {
      const slider = this.sliders[i];
      slider.handle.clear();
      slider.handle.circle(0, 0, index === i ? 12 : 10);
      slider.handle.fill({ color: index === i ? 0xffffff : COLORS.LIGHT_GREEN });
      slider.handle.stroke({ color: index === i ? COLORS.ACCENT_GREEN : 0xffffff, width: 2 });
    }
    if (this.colorblindToggle) {
      const isToggleSelected = index === sliderCount;
      this.colorblindToggle.bg.clear();
      this.colorblindToggle.bg.roundRect(cx + 80, 0, 100, 30, 6);
      this.colorblindToggle.bg.fill({ color: isToggleSelected ? 0x4caf50 : (this.colorblindMode ? 0x2d5a27 : 0x2a2a2a) });
      this.colorblindToggle.bg.stroke({ color: isToggleSelected ? 0x88d498 : 0x4a4a4a, width: isToggleSelected ? 2 : 1 });
    }
    const buttonStartIndex = sliderCount + 1;
    for (let i = 0; i < this.settingsItemGraphics.length; i++) {
      const { bg, text } = this.settingsItemGraphics[i];
      const selected = index === buttonStartIndex + i;
      const btnY = this.getSettingsButtonY(i);
      bg.clear();
      bg.roundRect(cx - 130, btnY, 260, 40, 8);
      if (selected) { bg.fill({ color: 0x4caf50 }); bg.stroke({ color: 0x66bb6a, width: 2 }); text.style.fill = '#ffffff'; }
      else { bg.fill({ color: 0x2a2a2a }); bg.stroke({ color: 0x4a4a4a, width: 2 }); text.style.fill = '#cccccc'; }
      text.text = this.settingsItems[i].label;
    }
  }

  private getSettingsButtonY(buttonIndex: number): number {
    const baseY = 120 + this.sliders.length * (24 + 26 + 15) + 10 + 30 + 60;
    return baseY + buttonIndex * 52;
  }

  private adjustSelectedSlider(delta: number): void {
    if (this.settingsSelectedIndex < this.sliders.length) {
      const slider = this.sliders[this.settingsSelectedIndex];
      this.updateSliderValue(slider, Math.max(0, Math.min(1, slider.value + delta)));
    }
  }

  private activateSettingsItem(index: number): void {
    const sliderCount = this.sliders.length;
    if (index === sliderCount) { this.toggleColorblind(); return; }
    const buttonIndex = index - sliderCount - 1;
    if (buttonIndex >= 0 && buttonIndex < this.settingsItems.length) {
      switch (this.settingsItems[buttonIndex].action) {
        case 'credits': this.showState('credits'); break;
        case 'back': this.showState('main'); break;
      }
    }
  }

  private handlePointerMove(e: PointerEvent): void {
    if (!this.draggingSlider) return;
    const slider = this.draggingSlider;
    const localX = e.clientX - slider.trackX;
    this.updateSliderValue(slider, Math.max(0, Math.min(1, localX / slider.trackWidth)));
  }

  private handlePointerUp(): void { this.draggingSlider = null; }

  update(dt: number, _ctx: SceneContext): void {
    const dtSeconds = dt;
    this.elapsed += dtSeconds;
    this.animationSystem.update(dt);
    this.particleSystem.update(dt);
    if (this.state === 'title') this.updateTitleAnimations();
    this.updateFireflies(dtSeconds);
    if (this.logoGlow && (this.state === 'title' || this.state === 'main')) {
      const pulse = Math.sin(this.elapsed * 1.5) * 0.5 + 0.5;
      this.logoGlow.alpha = 0.08 + pulse * 0.12;
    }
  }

  private updateTitleAnimations(): void {
    if (this.logoText && this.elapsed < 1.5) this.logoText.alpha = Math.min(this.elapsed / 1.5, 1);
    else if (this.logoText) this.logoText.alpha = 1;
    if (this.studioCredit) {
      if (this.elapsed > 1.0 && this.elapsed < 2.5) this.studioCredit.alpha = Math.min((this.elapsed - 1.0) / 1.5, 1);
      else if (this.elapsed >= 2.5) this.studioCredit.alpha = 1;
    }
    if (this.titlePrompt && this.elapsed > 2.5) {
      this.titleFadeComplete = true;
      const promptAge = this.elapsed - 2.5;
      this.titlePrompt.alpha = Math.min(promptAge / 0.8, 1) * (Math.sin(promptAge * 2) * 0.2 + 0.8);
    }
  }

  private updateFireflies(dt: number): void {
    this.fireflyCooldown -= dt;
    if (this.fireflyCooldown <= 0) {
      this.fireflyCooldown = 0.8 + Math.random() * 1.5;
      this.particleSystem.burst({
        x: Math.random() * this.screenWidth,
        y: this.screenHeight * 0.5 + Math.random() * this.screenHeight * 0.4,
        count: 1, speed: 8 + Math.random() * 12, lifetime: 2.5 + Math.random() * 2,
        colors: [0xfff9c4, 0xffe082, 0xc8e6c9, 0xb9f6ca],
        size: 2 + Math.random() * 2, gravity: -15 - Math.random() * 10,
        fadeOut: true, shrink: false,
      });
    }
  }

  destroy(): void {
    // TLDR: Stop ambient audio when leaving menu
    audioManager.stopAmbient();

    window.removeEventListener('keydown', this.boundOnKeyDown);
    window.removeEventListener('pointermove', this.boundOnPointerMove);
    window.removeEventListener('pointerup', this.boundOnPointerUp);
    window.removeEventListener('resize', this.boundOnResize);
    this.particleSystem.destroy();
    this.animationSystem.destroy();
    this.container.destroy({ children: true });
    this.container = new Container();
    this.menuItemGraphics = [];
    this.settingsItemGraphics = [];
    this.sliders = [];
    this.colorblindToggle = null;
    this.logoText = null;
    this.logoGlow = null;
    this.studioCredit = null;
    this.titlePrompt = null;
    this.ctx = null;
  }
}