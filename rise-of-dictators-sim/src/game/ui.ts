import Phaser from "phaser";
import { CREAM, COL, display, GOLD } from "./palette";

export function framedPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  fill = COL.panel,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.28);
  g.fillRoundedRect(x + 5, y + 7, w, h, 10);
  g.fillStyle(fill, 1);
  g.fillRoundedRect(x, y, w, h, 10);
  g.lineStyle(2, COL.gold, 1);
  g.strokeRoundedRect(x + 1, y + 1, w - 2, h - 2, 10);
  return g;
}

export function paperPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.35);
  g.fillRoundedRect(x + 8, y + 10, w, h, 4);
  g.fillStyle(COL.paper, 1);
  g.fillRoundedRect(x, y, w, h, 4);
  g.lineStyle(2, 0x2a2118, 1);
  g.strokeRoundedRect(x, y, w, h, 4);
  g.lineStyle(1, 0x8d3a34, 1);
  g.lineBetween(x + 18, y + 58, x + w - 18, y + 58);
  g.lineBetween(x + 18, y + 62, x + w - 18, y + 62);
  return g;
}

export interface ButtonHandle {
  root: Phaser.GameObjects.Container;
  label: Phaser.GameObjects.Text;
  setLabel: (value: string) => void;
}

export function button(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  onClick: () => void,
  tone: "gold" | "paper" | "quiet" = "gold",
  size = 22,
): ButtonHandle {
  const root = scene.add.container(x, y);
  const g = scene.add.graphics();
  const fill = tone === "paper" ? COL.paper : tone === "quiet" ? 0x2a2420 : 0x2a2218;
  const hover = tone === "paper" ? 0xf3e6c8 : 0x3d3226;
  const textColor = tone === "paper" ? INK_HEX : CREAM;
  const draw = (hot: boolean) => {
    g.clear();
    g.fillStyle(hot ? hover : fill, 1);
    g.fillRoundedRect(0, 0, w, h, 8);
    g.lineStyle(2, tone === "quiet" ? 0x8d7b58 : COL.gold, 1);
    g.strokeRoundedRect(1, 1, w - 2, h - 2, 8);
  };
  draw(false);
  const text = scene.add
    .text(w / 2, h / 2, label, {
      ...display(size, textColor),
      align: "center",
      wordWrap: { width: w - 28 },
    })
    .setOrigin(0.5);
  root.add([g, text]);
  root.setSize(w, h);
  // Containers offset a hit area by half their size, so the rectangle starts at the centre.
  root.setInteractive(new Phaser.Geom.Rectangle(w / 2, h / 2, w, h), Phaser.Geom.Rectangle.Contains);
  if (root.input) root.input.cursor = "pointer";
  root.on("pointerover", () => draw(true));
  root.on("pointerout", () => draw(false));
  root.on("pointerup", () => onClick());
  return {
    root,
    label: text,
    setLabel: (value: string) => text.setText(value),
  };
}

const INK_HEX = "#1a120c";

export function chip(
  scene: Phaser.Scene,
  x: number,
  y: number,
  fill: number,
  label: string,
): Phaser.GameObjects.Container {
  const root = scene.add.container(x, y);
  const g = scene.add.graphics();
  g.fillStyle(fill, 1);
  g.fillRoundedRect(0, 0, 18, 18, 3);
  g.lineStyle(1, 0x1a120c, 0.6);
  g.strokeRoundedRect(0, 0, 18, 18, 3);
  const text = scene.add.text(24, 9, label, display(16, CREAM)).setOrigin(0, 0.5);
  root.add([g, text]);
  return root;
}

export function die(
  scene: Phaser.Scene,
  x: number,
  y: number,
  value: number,
  size = 72,
): Phaser.GameObjects.Container {
  const root = scene.add.container(x, y);
  const g = scene.add.graphics();
  g.fillStyle(0xf4efe4, 1);
  g.fillRoundedRect(0, 0, size, size, 10);
  g.lineStyle(3, 0x1a120c, 1);
  g.strokeRoundedRect(1, 1, size - 2, size - 2, 10);
  root.add(g);
  const spots: Record<number, [number, number][]> = {
    1: [[0.5, 0.5]],
    2: [[0.28, 0.28], [0.72, 0.72]],
    3: [[0.28, 0.28], [0.5, 0.5], [0.72, 0.72]],
    4: [[0.28, 0.28], [0.72, 0.28], [0.28, 0.72], [0.72, 0.72]],
    5: [[0.28, 0.28], [0.72, 0.28], [0.5, 0.5], [0.28, 0.72], [0.72, 0.72]],
    6: [[0.28, 0.24], [0.72, 0.24], [0.28, 0.5], [0.72, 0.5], [0.28, 0.76], [0.72, 0.76]],
  };
  const pip = Math.max(8, Math.round(size * 0.12));
  for (const [px, py] of spots[value] ?? spots[1]) {
    const dot = scene.add.graphics();
    dot.fillStyle(0x1a120c, 1);
    dot.fillCircle(px * size, py * size, pip);
    root.add(dot);
  }
  return root;
}

export function meterBar(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  percent: number,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.fillStyle(0x2a2420, 1);
  g.fillRoundedRect(x, y, w, h, 6);
  g.lineStyle(2, COL.gold, 1);
  g.strokeRoundedRect(x, y, w, h, 6);
  const inner = Math.max(0, Math.min(w - 8, ((w - 8) * percent) / 100));
  if (inner > 0) {
    g.fillStyle(COL.rust, 1);
    g.fillRoundedRect(x + 4, y + 4, inner, h - 8, 4);
  }
  return g;
}

export { GOLD };
