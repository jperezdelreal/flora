// TLDR: Standalone achievements scene — browse badges, track progress from the main menu

import { Container, Graphics, Text } from 'pixi.js';
import type { Scene, SceneContext } from '../core';
import { SCENES, COLORS } from '../config';
import { AchievementSystem } from '../systems/AchievementSystem';
import { AchievementGallery } from '../ui/AchievementGallery';
import {
  ACHIEVEMENT_CATEGORIES,
  CATEGORY_LABELS,
  getAchievementsByCategory,
} from '../config/achievements';
import type { AchievementCategory } from '../config/achievements';
import { ParticleSystem } from '../systems';
import { announce } from '../utils/accessibility';
import { MenuScene } from './MenuScene';

const HEADER_HEIGHT = 50;
const PROGRESS_SECTION_HEIGHT = 60;
const CONTENT_TOP = HEADER_HEIGHT + PROGRESS_SECTION_HEIGHT;

const CATEGORY_COLORS: Record<AchievementCategory, number> = {
  harvest: 0x4caf50,
  survival: 0x2196f3,
  synergy: 0xff9800,
  exploration: 0x9c27b0,
  mastery: 0xffd700,
};

/**
 * TLDR: Standalone achievements scene — browse badges, track progress from the main menu
 */
export class AchievementsScene implements Scene {
  readonly name = 'achievements';

  private container = new Container();
  private bgLayer = new Container();
  private particleLayer = new Container();
  private contentLayer = new Container();

  private particleSystem: ParticleSystem;
  private achievementSystem: AchievementSystem;
  private gallery: AchievementGallery | null = null;

  private ctx: SceneContext | null = null;
  private screenWidth = 800;
  private screenHeight = 600;
  private elapsed = 0;
  private fireflyCooldown = 0;
  private navigatingBack = false;

  // Event listeners
  private boundOnKeyDown!: (e: KeyboardEvent) => void;
  private boundOnResize!: () => void;

  constructor(achievementSystem: AchievementSystem) {
    this.achievementSystem = achievementSystem;
    this.particleSystem = new ParticleSystem();
  }

  async init(ctx: SceneContext): Promise<void> {
    this.ctx = ctx;
    const { app } = ctx;
    const stage = app.stage.children[0] as Container;
    stage.addChild(this.container);

    this.screenWidth = app.screen.width;
    this.screenHeight = app.screen.height;
    this.elapsed = 0;
    this.fireflyCooldown = 0;
    this.navigatingBack = false;

    // TLDR: Layer hierarchy — bg, particles, content
    this.container.addChild(this.bgLayer);
    this.container.addChild(this.particleLayer);
    this.particleLayer.addChild(this.particleSystem.getContainer());
    this.container.addChild(this.contentLayer);

    this.buildBackground();
    this.buildHeader();
    this.buildProgressSection();
    this.buildGallery();
    this.buildBackButton();

    // TLDR: Keyboard and resize listeners
    this.boundOnKeyDown = (e: KeyboardEvent) => this.handleKeyDown(e);
    window.addEventListener('keydown', this.boundOnKeyDown);

    this.boundOnResize = () => {
      if (this.ctx) {
        this.screenWidth = this.ctx.app.screen.width;
        this.screenHeight = this.ctx.app.screen.height;
      }
    };
    window.addEventListener('resize', this.boundOnResize);

    announce(
      'Achievements gallery opened. Browse your achievements and track progress. Use arrow keys to scroll, Escape to go back.',
    );
  }

  // ── Background (matches MenuScene/EncyclopediaScene aesthetic) ─────

  private buildBackground(): void {
    const w = this.screenWidth;
    const h = this.screenHeight;

    const bg = new Graphics();
    bg.rect(0, 0, w, h);
    bg.fill({ color: COLORS.DARK_GREEN });
    this.bgLayer.addChild(bg);

    // TLDR: Rolling hills silhouette
    const hills = new Graphics();
    hills.moveTo(0, h * 0.75);
    hills.quadraticCurveTo(w * 0.2, h * 0.6, w * 0.35, h * 0.7);
    hills.quadraticCurveTo(w * 0.55, h * 0.8, w * 0.7, h * 0.65);
    hills.quadraticCurveTo(w * 0.9, h * 0.55, w, h * 0.68);
    hills.lineTo(w, h);
    hills.lineTo(0, h);
    hills.closePath();
    hills.fill({ color: 0x1e4d1a, alpha: 0.6 });
    this.bgLayer.addChild(hills);

    const fgHills = new Graphics();
    fgHills.moveTo(0, h * 0.85);
    fgHills.quadraticCurveTo(w * 0.3, h * 0.75, w * 0.5, h * 0.82);
    fgHills.quadraticCurveTo(w * 0.75, h * 0.88, w, h * 0.8);
    fgHills.lineTo(w, h);
    fgHills.lineTo(0, h);
    fgHills.closePath();
    fgHills.fill({ color: 0x163d13, alpha: 0.5 });
    this.bgLayer.addChild(fgHills);

    // TLDR: Decorative flower dots
    for (let i = 0; i < 14; i++) {
      const flower = new Graphics();
      const fx = Math.random() * w;
      const fy = h * 0.75 + Math.random() * h * 0.2;
      const flowerColors = [0xffb7c5, 0xffd700, 0xff6b6b, 0x87ceeb, 0xdda0dd];
      const color = flowerColors[Math.floor(Math.random() * flowerColors.length)];
      flower.circle(fx, fy, 2 + Math.random() * 2);
      flower.fill({ color, alpha: 0.3 + Math.random() * 0.3 });
      this.bgLayer.addChild(flower);
    }
  }

  // ── Header ────────────────────────────────────────────────────────

  private buildHeader(): void {
    const cx = this.screenWidth / 2;

    const headerBg = new Graphics();
    headerBg.rect(0, 0, this.screenWidth, HEADER_HEIGHT);
    headerBg.fill({ color: 0x1a1a1a, alpha: 0.85 });
    this.contentLayer.addChild(headerBg);

    const title = new Text({
      text: '🏆 Achievements',
      style: {
        fontFamily: 'Arial',
        fontSize: 26,
        fill: '#daa520',
        fontWeight: 'bold',
      },
    });
    title.anchor.set(0.5, 0.5);
    title.x = cx;
    title.y = HEADER_HEIGHT / 2;
    this.contentLayer.addChild(title);

    // TLDR: Total completion stats
    const progress = this.achievementSystem.getProgress();
    const pct = progress.total > 0 ? Math.round((progress.unlocked / progress.total) * 100) : 0;
    const statsText = new Text({
      text: `${progress.unlocked} / ${progress.total} (${pct}%)`,
      style: {
        fontFamily: 'Arial',
        fontSize: 13,
        fill: '#aaaaaa',
      },
    });
    statsText.anchor.set(1, 0.5);
    statsText.x = this.screenWidth - 16;
    statsText.y = HEADER_HEIGHT / 2;
    this.contentLayer.addChild(statsText);
  }

  // ── Category progress bars ────────────────────────────────────────

  private buildProgressSection(): void {
    const sectionBg = new Graphics();
    sectionBg.rect(0, HEADER_HEIGHT, this.screenWidth, PROGRESS_SECTION_HEIGHT);
    sectionBg.fill({ color: 0x1a1a1a, alpha: 0.6 });
    this.contentLayer.addChild(sectionBg);

    const barWidth = 80;
    const barHeight = 8;
    const categories = ACHIEVEMENT_CATEGORIES;
    const itemWidth = 145;
    const totalWidth = categories.length * itemWidth;
    const startX = (this.screenWidth - totalWidth) / 2;

    categories.forEach((category, i) => {
      const x = startX + i * itemWidth;
      const y = HEADER_HEIGHT + 10;

      // TLDR: Category label with icon
      const label = new Text({
        text: CATEGORY_LABELS[category],
        style: {
          fontFamily: 'Arial',
          fontSize: 11,
          fill: '#cccccc',
          fontWeight: 'bold',
        },
      });
      label.x = x;
      label.y = y;
      label.accessible = true;
      label.accessibleTitle = `${CATEGORY_LABELS[category]} achievements progress`;
      this.contentLayer.addChild(label);

      // TLDR: Progress bar background
      const bgBar = new Graphics();
      bgBar.roundRect(x, y + 20, barWidth, barHeight, 3);
      bgBar.fill({ color: 0x333333, alpha: 0.8 });
      this.contentLayer.addChild(bgBar);

      // TLDR: Progress bar fill
      const categoryAchievements = getAchievementsByCategory(category);
      const unlocked = categoryAchievements.filter((a) =>
        this.achievementSystem.isUnlocked(a.id),
      ).length;
      const total = categoryAchievements.length;
      const fillWidth = total > 0 ? (unlocked / total) * barWidth : 0;

      if (fillWidth > 0) {
        const fillBar = new Graphics();
        fillBar.roundRect(x, y + 20, Math.max(fillWidth, 4), barHeight, 3);
        fillBar.fill({ color: CATEGORY_COLORS[category] });
        this.contentLayer.addChild(fillBar);
      }

      // TLDR: Count text
      const countText = new Text({
        text: `${unlocked}/${total}`,
        style: {
          fontFamily: 'Arial',
          fontSize: 10,
          fill: '#888888',
        },
      });
      countText.x = x + barWidth + 4;
      countText.y = y + 18;
      this.contentLayer.addChild(countText);
    });
  }

  // ── Gallery (reuses existing AchievementGallery component) ────────

  private buildGallery(): void {
    this.gallery = new AchievementGallery();
    const states = this.achievementSystem.getAllStates();
    this.gallery.setEntries(states);

    // TLDR: Position gallery centered below progress section
    const galleryX = Math.max(0, (this.screenWidth - 800) / 2);
    this.gallery.setPosition(galleryX, CONTENT_TOP);
    this.gallery.show();
    this.contentLayer.addChild(this.gallery.getContainer());
  }

  // ── Back button ───────────────────────────────────────────────────

  private buildBackButton(): void {
    const btnWidth = 130;
    const btnHeight = 36;
    const btnX = 14;
    const btnY = this.screenHeight - btnHeight - 10;

    const backBg = new Graphics();
    backBg.roundRect(btnX, btnY, btnWidth, btnHeight, 8);
    backBg.fill({ color: 0x2a2a2a, alpha: 0.9 });
    backBg.stroke({ color: 0x4a4a4a, width: 2 });
    backBg.eventMode = 'static';
    backBg.cursor = 'pointer';
    backBg.accessible = true;
    backBg.accessibleTitle = 'Back to main menu';

    const backText = new Text({
      text: '← Back',
      style: {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: '#c8e6c9',
        fontWeight: 'bold',
      },
    });
    backText.anchor.set(0.5, 0.5);
    backText.x = btnX + btnWidth / 2;
    backText.y = btnY + btnHeight / 2;

    backBg.on('pointerover', () => {
      backBg.clear();
      backBg.roundRect(btnX, btnY, btnWidth, btnHeight, 8);
      backBg.fill({ color: 0x4caf50 });
      backBg.stroke({ color: 0x66bb6a, width: 2 });
    });
    backBg.on('pointerout', () => {
      backBg.clear();
      backBg.roundRect(btnX, btnY, btnWidth, btnHeight, 8);
      backBg.fill({ color: 0x2a2a2a, alpha: 0.9 });
      backBg.stroke({ color: 0x4a4a4a, width: 2 });
    });
    backBg.on('pointerdown', () => this.goBack());

    this.contentLayer.addChild(backBg);
    this.contentLayer.addChild(backText);

    // TLDR: Keyboard hint
    const hint = new Text({
      text: 'Esc to go back · Arrow keys to scroll',
      style: { fontFamily: 'Arial', fontSize: 11, fill: '#666666' },
    });
    hint.anchor.set(0.5, 0.5);
    hint.x = this.screenWidth / 2;
    hint.y = this.screenHeight - 14;
    this.contentLayer.addChild(hint);
  }

  // ── Navigation ────────────────────────────────────────────────────

  private goBack(): void {
    if (!this.ctx || this.navigatingBack) return;
    this.navigatingBack = true;
    announce('Returning to menu.');
    // TLDR: Tell MenuScene to skip title and show main menu directly
    MenuScene.skipTitle = true;
    this.ctx.sceneManager.transitionTo(SCENES.MENU, { type: 'fade' }).catch(console.error);
  }

  // ── Keyboard handling ─────────────────────────────────────────────

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.code === 'Escape' || e.code === 'Backspace') {
      e.preventDefault();
      this.goBack();
    }
  }

  // ── Firefly particles (consistent with MenuScene/EncyclopediaScene) ──

  private updateFireflies(dt: number): void {
    this.fireflyCooldown -= dt;
    if (this.fireflyCooldown <= 0) {
      this.fireflyCooldown = 0.8 + Math.random() * 1.5;
      this.particleSystem.burst({
        x: Math.random() * this.screenWidth,
        y: this.screenHeight * 0.5 + Math.random() * this.screenHeight * 0.4,
        count: 1,
        speed: 8 + Math.random() * 12,
        lifetime: 2.5 + Math.random() * 2,
        colors: [0xfff9c4, 0xffe082, 0xc8e6c9, 0xb9f6ca],
        size: 2 + Math.random() * 2,
        gravity: -15 - Math.random() * 10,
        fadeOut: true,
        shrink: false,
      });
    }
  }

  // ── Scene lifecycle ───────────────────────────────────────────────

  update(dt: number, _ctx: SceneContext): void {
    // TLDR: Auto-navigate back if gallery was closed via its × button
    if (this.gallery && !this.gallery.isVisible() && !this.navigatingBack) {
      this.goBack();
      return;
    }
    this.elapsed += dt;
    this.particleSystem.update(dt);
    this.updateFireflies(dt);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.boundOnKeyDown);
    window.removeEventListener('resize', this.boundOnResize);
    this.particleSystem.destroy();
    if (this.gallery) {
      this.gallery.destroy();
      this.gallery = null;
    }
    this.container.destroy({ children: true });
    this.container = new Container();
    this.bgLayer = new Container();
    this.particleLayer = new Container();
    this.contentLayer = new Container();
    this.ctx = null;
  }
}
