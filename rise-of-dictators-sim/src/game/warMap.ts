import Phaser from "phaser";
import { FACTION, TONE } from "./palette";
import type { Snapshot, SpreadTone } from "../logic/types";
import type { SpreadTerritory, TerritoryDef } from "../logic/types";

interface Tile {
  id: string;
  name: string;
  full: string;
  x: number;
  y: number;
  w: number;
  h: number;
  shape: "rect" | "round";
  g: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  badge: Phaser.GameObjects.Text;
  fill: number;
  ink: string;
}

const TONE_LETTER: Record<SpreadTone, string> = {
  weimar: "W",
  nazi: "N",
  pressure: "C",
  invaded: "V",
  axis: "A",
  allied: "D",
  soviet: "S",
  neutral: "·",
  liberated: "L",
  occupiedEnd: "O",
  falling: "F",
};

export class WarMap {
  readonly root: Phaser.GameObjects.Container;
  private scene: Phaser.Scene;
  private tiles: Tile[] = [];
  private tip: Phaser.GameObjects.Text;
  private pulse = 1;
  private lit = new Set<string>();

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    viewW: number,
    viewH: number,
    designW: number,
    designH: number,
    territories: { id: string; name: string; full: string; x: number; y: number; w: number; h: number; shape: "rect" | "round" }[],
  ) {
    this.scene = scene;
    this.root = scene.add.container(x, y);
    const ocean = scene.add.graphics();
    ocean.fillStyle(0x102838, 1);
    ocean.fillRoundedRect(0, 0, viewW, viewH, 14);
    ocean.fillStyle(0x163044, 1);
    ocean.fillRoundedRect(10, 10, viewW - 20, viewH - 20, 10);
    ocean.lineStyle(3, 0xd4b15a, 0.95);
    ocean.strokeRoundedRect(8, 8, viewW - 16, viewH - 16, 12);
    for (let i = 1; i < 6; i += 1) {
      ocean.lineStyle(1, 0xd4b15a, 0.08);
      ocean.lineBetween(20, 20 + ((viewH - 40) * i) / 6, viewW - 20, 20 + ((viewH - 40) * i) / 6);
    }
    this.root.add(ocean);

    const u = Math.min((viewW - 36) / designW, (viewH - 36) / designH);
    const boardW = designW * u;
    const boardH = designH * u;
    const ox = (viewW - boardW) / 2;
    const oy = (viewH - boardH) / 2;

    const sea = scene.add.text(28, viewH / 2, "ATLANTIC", {
      fontFamily: "Oswald, sans-serif",
      fontSize: "14px",
      color: "#7f93a3",
    });
    const sea2 = scene.add.text(viewW - 36, viewH / 2, "PACIFIC", {
      fontFamily: "Oswald, sans-serif",
      fontSize: "14px",
      color: "#7f93a3",
    }).setOrigin(1, 0.5);
    sea.setAngle(-90);
    this.root.add([sea, sea2]);

    for (const territory of territories) {
      const px = ox + territory.x * u;
      const py = oy + territory.y * u;
      const pw = Math.max(8, territory.w * u - 3);
      const ph = Math.max(8, territory.h * u - 3);
      const g = scene.add.graphics();
      const font = pw < 70 ? 12 : pw < 110 ? 15 : 18;
      const label = scene.add
        .text(px + pw / 2, py + ph / 2 + 4, territory.name, {
          fontFamily: "Oswald, sans-serif",
          fontSize: `${font}px`,
          color: "#1a120c",
          align: "center",
          wordWrap: { width: pw - 8 },
        })
        .setOrigin(0.5);
      const badge = scene.add
        .text(px + pw - 4, py + 2, "", {
          fontFamily: "Oswald, sans-serif",
          fontSize: "11px",
          color: "#f3ead7",
        })
        .setOrigin(1, 0);
      g.setInteractive(new Phaser.Geom.Rectangle(px, py, pw, ph), Phaser.Geom.Rectangle.Contains);
      if (g.input) g.input.cursor = "pointer";
      const tile: Tile = {
        id: territory.id,
        name: territory.name,
        full: territory.full,
        x: px,
        y: py,
        w: pw,
        h: ph,
        shape: territory.shape,
        g,
        label,
        badge,
        fill: 0xc6b48c,
        ink: "#1a120c",
      };
      g.on("pointerover", () => this.showTip(tile));
      g.on("pointerout", () => this.tip.setVisible(false));
      this.tiles.push(tile);
      this.root.add([g, label, badge]);
    }

    this.tip = scene.add
      .text(16, viewH - 36, "", {
        fontFamily: '"Source Serif 4", Georgia, serif',
        fontSize: "16px",
        color: "#1a120c",
        backgroundColor: "#e7d7b8",
        padding: { x: 8, y: 4 },
        wordWrap: { width: viewW - 40 },
      })
      .setVisible(false)
      .setDepth(5);
    this.root.add(this.tip);
    this.root.setDepth(1);
  }

  showHolds(snapshot: Snapshot, captions: Record<string, string> = {}): void {
    this.lit.clear();
    for (const tile of this.tiles) {
      const hold = snapshot[tile.id];
      if (!hold) continue;
      this.paint(tile, FACTION[hold.faction].fill, FACTION[hold.faction].ink, FACTION[hold.faction].letter);
      tile.full = captions[tile.id] ?? `${tile.name}. ${hold.caption}`;
    }
  }

  showTones(tones: Record<string, SpreadTone>, captions: Record<string, string> = {}): void {
    this.lit.clear();
    for (const tile of this.tiles) {
      const tone = tones[tile.id] ?? "neutral";
      const style = TONE[tone];
      this.paint(tile, style.fill, style.ink, TONE_LETTER[tone]);
      tile.full = captions[tile.id] ?? `${tile.name}. ${style.label}`;
    }
  }

  private paint(tile: Tile, fill: number, ink: string, letter: string): void {
    tile.fill = fill;
    tile.ink = ink;
    tile.g.clear();
    tile.g.fillStyle(0x0e1214, 0.35);
    if (tile.shape === "round") tile.g.fillRoundedRect(tile.x + 2, tile.y + 3, tile.w, tile.h, 12);
    else tile.g.fillRect(tile.x + 2, tile.y + 3, tile.w, tile.h);
    tile.g.fillStyle(fill, 1);
    tile.g.lineStyle(2, 0x1a120c, 0.85);
    if (tile.shape === "round") {
      tile.g.fillRoundedRect(tile.x, tile.y, tile.w, tile.h, 12);
      tile.g.strokeRoundedRect(tile.x, tile.y, tile.w, tile.h, 12);
    } else {
      tile.g.fillRect(tile.x, tile.y, tile.w, tile.h);
      tile.g.strokeRect(tile.x, tile.y, tile.w, tile.h);
    }
    tile.label.setColor(ink);
    tile.badge.setText(letter);
    tile.badge.setColor(ink);
    if (this.lit.has(tile.id)) {
      tile.g.lineStyle(3, 0xf3ead7, 0.35 + this.pulse * 0.65);
      if (tile.shape === "round") tile.g.strokeRoundedRect(tile.x - 2, tile.y - 2, tile.w + 4, tile.h + 4, 14);
      else tile.g.strokeRect(tile.x - 2, tile.y - 2, tile.w + 4, tile.h + 4);
    }
  }

  private showTip(tile: Tile): void {
    this.tip.setText(tile.full);
    this.tip.setVisible(true);
    this.tip.setPosition(16, Math.max(12, tile.y - 8));
  }

  update(time: number): void {
    this.pulse = 0.45 + Math.sin(time / 420) * 0.55;
    if (this.lit.size === 0) return;
    for (const tile of this.tiles) {
      if (!this.lit.has(tile.id)) continue;
      this.paint(tile, tile.fill, tile.ink, tile.badge.text);
    }
  }

  highlight(ids: string[]): void {
    this.lit = new Set(ids);
    for (const tile of this.tiles) {
      if (!this.lit.has(tile.id)) continue;
      this.paint(tile, tile.fill, tile.ink, tile.badge.text);
    }
  }

  flash(ids: string[]): void {
    for (const tile of this.tiles) {
      if (!ids.includes(tile.id)) continue;
      this.scene.tweens.killTweensOf(tile.g);
      tile.g.setAlpha(0.4);
      this.scene.tweens.add({ targets: tile.g, alpha: 1, duration: 420, ease: "Cubic.easeOut" });
    }
  }
}

export function worldTerritories(list: TerritoryDef[]) {
  return list.map((territory) => ({
    id: territory.id,
    name: territory.name,
    full: territory.full,
    x: territory.x,
    y: territory.y,
    w: territory.w,
    h: territory.h,
    shape: territory.shape,
  }));
}

export function spreadTerritories(list: SpreadTerritory[]) {
  return list.map((territory) => ({
    id: territory.id,
    name: territory.name,
    full: territory.name,
    x: territory.x,
    y: territory.y,
    w: territory.w,
    h: territory.h,
    shape: territory.shape,
  }));
}
