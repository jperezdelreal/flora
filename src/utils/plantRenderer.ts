/**
 * TLDR: Shared plant shape rendering utilities for Encyclopedia cards.
 * Renders mature plant sprites at smaller scale for card thumbnails.
 */

import { Graphics } from 'pixi.js';
import { PlantVisualDef } from '../config/plantVisuals';

/** TLDR: Draw a plant shape on given Graphics object */
export function drawPlantShape(
  gfx: Graphics,
  visualDef: PlantVisualDef,
  x: number,
  y: number,
  size: number,
): void {
  const shape = visualDef.matureShape;
  const baseColor = visualDef.baseColor;
  const accentColor = visualDef.accentColor;
  const detailColor = visualDef.detailColor ?? baseColor;

  switch (shape) {
    case 'circle':
      gfx.circle(x, y, size);
      gfx.fill({ color: baseColor });
      gfx.circle(x, y, size * 0.6);
      gfx.fill({ color: accentColor, alpha: 0.5 });
      break;

    case 'oval':
      gfx.ellipse(x, y, size * 0.8, size * 1.2);
      gfx.fill({ color: baseColor });
      gfx.ellipse(x, y - size * 0.2, size * 0.5, size * 0.7);
      gfx.fill({ color: accentColor, alpha: 0.6 });
      break;

    case 'tall':
      gfx.ellipse(x, y, size * 0.5, size * 1.4);
      gfx.fill({ color: baseColor });
      // TLDR: Fronds
      for (let i = 0; i < 3; i++) {
        gfx.ellipse(x + (i - 1) * size * 0.4, y - size * 0.5, size * 0.3, size * 0.6);
        gfx.fill({ color: accentColor, alpha: 0.7 });
      }
      break;

    case 'wide':
      gfx.ellipse(x, y, size * 1.3, size * 0.7);
      gfx.fill({ color: baseColor });
      // TLDR: Layers
      gfx.ellipse(x, y + size * 0.1, size * 1.0, size * 0.5);
      gfx.fill({ color: accentColor, alpha: 0.6 });
      break;

    case 'star':
      // TLDR: Venus flytrap-like star shape
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const x1 = x + Math.cos(angle) * size * 0.8;
        const y1 = y + Math.sin(angle) * size * 0.8;
        gfx.circle(x1, y1, size * 0.4);
        gfx.fill({ color: baseColor });
      }
      gfx.circle(x, y, size * 0.4);
      gfx.fill({ color: accentColor });
      break;

    case 'bush':
      // TLDR: Cluster of circles
      const positions = [
        { x: 0, y: 0 },
        { x: -size * 0.4, y: -size * 0.3 },
        { x: size * 0.4, y: -size * 0.3 },
        { x: -size * 0.3, y: size * 0.4 },
        { x: size * 0.3, y: size * 0.4 },
      ];
      positions.forEach(pos => {
        gfx.circle(x + pos.x, y + pos.y, size * 0.45);
        gfx.fill({ color: baseColor });
      });
      gfx.circle(x, y, size * 0.3);
      gfx.fill({ color: accentColor, alpha: 0.7 });
      break;

    case 'flower':
      // TLDR: Petals around center
      const petals = 6;
      for (let i = 0; i < petals; i++) {
        const angle = (i / petals) * Math.PI * 2;
        const px = x + Math.cos(angle) * size * 0.6;
        const py = y + Math.sin(angle) * size * 0.6;
        gfx.ellipse(px, py, size * 0.35, size * 0.5);
        gfx.fill({ color: baseColor });
      }
      gfx.circle(x, y, size * 0.35);
      gfx.fill({ color: detailColor });
      break;

    case 'root':
      // TLDR: Carrot/radish shape
      gfx.ellipse(x, y + size * 0.2, size * 0.6, size * 1.0);
      gfx.fill({ color: baseColor });
      // TLDR: Greens on top
      gfx.ellipse(x - size * 0.3, y - size * 0.5, size * 0.25, size * 0.4);
      gfx.fill({ color: accentColor });
      gfx.ellipse(x, y - size * 0.6, size * 0.25, size * 0.5);
      gfx.fill({ color: accentColor });
      gfx.ellipse(x + size * 0.3, y - size * 0.5, size * 0.25, size * 0.4);
      gfx.fill({ color: accentColor });
      break;
  }
}
