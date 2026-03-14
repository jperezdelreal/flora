// TLDR: Top-10 leaderboard display for daily challenge seeds

import { Container, Graphics, Text } from 'pixi.js';
import type { LeaderboardEntry } from '../systems/DailyChallengeSystem';
import type { ModifierId } from '../config/modifiers';
import { MODIFIERS } from '../config/modifiers';

/**
 * Leaderboard renders a top-10 score list for a specific seed.
 * Used in the DaySummary / ScoreSummary overlay after a run.
 */
export class Leaderboard {
  private container: Container;
  private entriesContainer: Container;
  private titleText: Text;

  constructor() {
    this.container = new Container();

    // TLDR: Panel background
    const panel = new Graphics();
    panel.roundRect(0, 0, 320, 380, 12);
    panel.fill({ color: 0x111111, alpha: 0.94 });
    panel.stroke({ color: 0x4caf50, width: 2 });
    this.container.addChild(panel);

    // TLDR: Title
    this.titleText = new Text({
      text: '🏆 Leaderboard',
      style: {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: '#ffd700',
        fontWeight: 'bold',
        align: 'center',
      },
    });
    this.titleText.anchor.set(0.5, 0);
    this.titleText.x = 160;
    this.titleText.y = 12;
    this.container.addChild(this.titleText);

    this.entriesContainer = new Container();
    this.entriesContainer.y = 48;
    this.container.addChild(this.entriesContainer);
  }

  /** TLDR: Populate leaderboard with entries and optionally highlight a score */
  show(entries: LeaderboardEntry[], highlightScore?: number): void {
    this.entriesContainer.removeChildren();

    if (entries.length === 0) {
      const empty = new Text({
        text: 'No scores yet.\nBe the first!',
        style: {
          fontFamily: 'Arial',
          fontSize: 14,
          fill: '#888888',
          align: 'center',
        },
      });
      empty.anchor.set(0.5, 0);
      empty.x = 160;
      empty.y = 20;
      this.entriesContainer.addChild(empty);
      return;
    }

    const top = entries.slice(0, 10);
    for (let i = 0; i < top.length; i++) {
      const entry = top[i];
      const y = i * 30;
      const isHighlighted = highlightScore !== undefined && entry.score === highlightScore;

      // TLDR: Rank medal for top 3
      const rankPrefix = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;

      // TLDR: Modifier emojis
      const modEmojis = entry.modifiers
        .map((id: ModifierId) => MODIFIERS[id]?.emoji ?? '')
        .join('');

      const date = new Date(entry.date);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;

      const row = new Text({
        text: `${rankPrefix} ${entry.score}  ${modEmojis}`,
        style: {
          fontFamily: 'Arial',
          fontSize: 14,
          fill: isHighlighted ? '#ffd700' : i < 3 ? '#ffffff' : '#cccccc',
          fontWeight: isHighlighted ? 'bold' : 'normal',
        },
      });
      row.x = 16;
      row.y = y;
      this.entriesContainer.addChild(row);

      const dateText = new Text({
        text: dateStr,
        style: {
          fontFamily: 'Arial',
          fontSize: 11,
          fill: '#666666',
        },
      });
      dateText.x = 270;
      dateText.y = y + 2;
      this.entriesContainer.addChild(dateText);
    }
  }

  /** TLDR: Set a custom title (e.g. "Daily Leaderboard — 2026-03-15") */
  setTitle(title: string): void {
    this.titleText.text = title;
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
