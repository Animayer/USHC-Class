import Phaser from "phaser";
import { SPREAD_BOARD, WORLD_BOARD, type MapBoard } from "./mapShapes";
import { FACTION, TONE } from "./palette";
import { SPREAD_TERRITORIES } from "../logic/spread";
import { TERRITORIES } from "../logic/territories";
import type { Snapshot, SpreadTone } from "../logic/types";

interface Paint {
  fill: number;
  ink: string;
  letter: string;
}

interface Placed {
  id: string;
  name: string;
  full: string;
  rings: number[][];
  anchorX: number;
  anchorY: number;
  label: Phaser.GameObjects.Text;
  marker: Phaser.GameObjects.Container;
  markerText: Phaser.GameObjects.Text;
  markerDisc: Phaser.GameObjects.Graphics;
  leader: Phaser.GameObjects.Graphics;
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

const WORLD_NAME = new Map(TERRITORIES.map((territory) => [territory.id, territory.name]));
const SPREAD_NAME = new Map(SPREAD_TERRITORIES.map((territory) => [territory.id, territory.name]));

let textureSerial = 0;

export class WarMap {
  readonly root: Phaser.GameObjects.Container;
  private scene: Phaser.Scene;
  private board: MapBoard;
  private mode: "world" | "spread";
  private viewW: number;
  private viewH: number;
  private scale = 1;
  private originX = 0;
  private originY = 0;
  private placed: Placed[] = [];
  private decorRings: number[][][] = [];
  private lakeRings: number[][] = [];
  private decorLabels: Phaser.GameObjects.Text[] = [];
  private canvas: HTMLCanvasElement;
  private textureKey: string;
  private image: Phaser.GameObjects.Image;
  private hoverGfx: Phaser.GameObjects.Graphics;
  private pulseGfx: Phaser.GameObjects.Graphics;
  private tip: Phaser.GameObjects.Text;
  private pulse = 1;
  private lit = new Set<string>();
  private hoverId = "";
  private captions: Record<string, string> = {};

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    viewW: number,
    viewH: number,
    mode: "world" | "spread",
  ) {
    this.scene = scene;
    this.mode = mode;
    this.viewW = viewW;
    this.viewH = viewH;
    this.board = mode === "world" ? WORLD_BOARD : SPREAD_BOARD;
    this.root = scene.add.container(x, y);
    this.scale = Math.min(viewW / this.board.w, viewH / this.board.h);
    this.originX = (viewW - this.board.w * this.scale) / 2;
    this.originY = (viewH - this.board.h * this.scale) / 2;

    this.textureKey = `war-map-${textureSerial}`;
    textureSerial += 1;
    const texture = scene.textures.createCanvas(this.textureKey, Math.ceil(viewW), Math.ceil(viewH));
    const source = texture?.getSourceImage() as HTMLCanvasElement;
    this.canvas = source;
    this.image = scene.add.image(0, 0, this.textureKey).setOrigin(0, 0);
    this.hoverGfx = scene.add.graphics();
    this.pulseGfx = scene.add.graphics();
    this.root.add([this.image, this.hoverGfx, this.pulseGfx]);

    const names = mode === "world" ? WORLD_NAME : SPREAD_NAME;
    for (const shape of this.board.shapes) {
      const rings = shape.rings.map((ring) => this.scaleRing(ring)).filter((ring) => ring.length >= 6);
      if (rings.length === 0) continue;
      const anchor = this.toView(shape.anchor[0], shape.anchor[1]);
      const name = names.get(shape.id) ?? shape.id;
      const placed = this.makePlaced(shape.id, name, rings, anchor.x, anchor.y);
      this.placed.push(placed);
      this.root.add([placed.leader, placed.marker, placed.label]);
    }
    this.decorRings = this.board.decor.map((shape) => shape.rings.map((ring) => this.scaleRing(ring)));
    this.lakeRings = this.board.lakes.map((ring) => this.scaleRing(ring));
    this.decorLabels = this.board.decor.map((shape) => {
      const point = this.toView(shape.anchor[0], shape.anchor[1]);
      const text = scene.add
        .text(point.x, point.y, shape.id.replace("decor:", ""), {
          fontFamily: "Oswald, sans-serif",
          fontSize: this.mode === "spread" ? "16px" : this.viewW > 1100 ? "15px" : "13px",
          color: "#1a120c",
          stroke: "#f3ead7",
          strokeThickness: 3,
        })
        .setOrigin(0.5);
      this.root.add(text);
      return text;
    });
    this.layoutLabels();

    const zone = scene.add.zone(viewW / 2, viewH / 2, viewW, viewH).setOrigin(0.5);
    zone.setInteractive({ useHandCursor: false });
    zone.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      const localX = pointer.x - x;
      const localY = pointer.y - y;
      const hit = this.hitTest(localX, localY);
      zone.input!.cursor = hit ? "pointer" : "default";
      if (hit === this.hoverId) return;
      this.hoverId = hit;
      this.drawHover();
      if (!hit) {
        this.tip.setVisible(false);
        return;
      }
      const tile = this.placed.find((item) => item.id === hit);
      if (!tile) return;
      this.tip.setText(this.captions[hit] ?? tile.full);
      this.tip.setVisible(true);
      const tipW = Math.min(this.tip.width, viewW - 24);
      const tipX = Math.max(12, Math.min(localX + 16, viewW - tipW - 12));
      const tipY = Math.max(12, Math.min(localY - this.tip.height - 16, viewH - this.tip.height - 12));
      this.tip.setPosition(tipX, tipY);
    });
    zone.on("pointerout", () => {
      this.hoverId = "";
      this.drawHover();
      this.tip.setVisible(false);
    });
    this.root.add(zone);

    this.tip = scene.add
      .text(16, 16, "", {
        fontFamily: '"Source Serif 4", Georgia, serif',
        fontSize: "24px",
        color: "#1a120c",
        backgroundColor: "#e7d7b8",
        padding: { x: 10, y: 6 },
        wordWrap: { width: Math.min(520, viewW - 32) },
      })
      .setVisible(false)
      .setDepth(8);
    this.root.add(this.tip);

    this.redraw(new Map());
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (scene.textures.exists(this.textureKey)) scene.textures.remove(this.textureKey);
    });
  }

  showHolds(snapshot: Snapshot, captions: Record<string, string> = {}): void {
    this.captions = captions;
    const paints = new Map<string, Paint>();
    for (const tile of this.placed) {
      const hold = snapshot[tile.id];
      if (!hold) continue;
      const style = FACTION[hold.faction];
      paints.set(tile.id, { fill: style.fill, ink: style.ink, letter: style.letter });
      tile.full = captions[tile.id] ?? `${tile.name}. ${hold.caption}`;
    }
    this.lit.clear();
    this.redraw(paints);
  }

  showTones(tones: Record<string, SpreadTone>, captions: Record<string, string> = {}): void {
    this.captions = captions;
    const paints = new Map<string, Paint>();
    for (const tile of this.placed) {
      const tone = tones[tile.id] ?? "neutral";
      const style = TONE[tone];
      paints.set(tile.id, { fill: style.fill, ink: style.ink, letter: TONE_LETTER[tone] });
      tile.full = captions[tile.id] ?? `${tile.name}. ${style.label}`;
    }
    this.lit.clear();
    this.redraw(paints);
  }

  update(time: number): void {
    this.pulse = 0.45 + Math.sin(time / 420) * 0.55;
    if (this.lit.size === 0) return;
    this.drawPulse();
  }

  highlight(ids: string[]): void {
    this.lit = new Set(ids);
    this.drawPulse();
  }

  flash(ids: string[]): void {
    const targets = this.placed.filter((tile) => ids.includes(tile.id));
    for (const tile of targets) {
      this.scene.tweens.killTweensOf(tile.marker);
      tile.marker.setAlpha(0.35);
      this.scene.tweens.add({ targets: tile.marker, alpha: 1, duration: 420, ease: "Cubic.easeOut" });
      this.scene.tweens.killTweensOf(tile.label);
      tile.label.setAlpha(0.35);
      this.scene.tweens.add({ targets: tile.label, alpha: 1, duration: 420, ease: "Cubic.easeOut" });
    }
    const flash = this.scene.add.graphics();
    flash.fillStyle(0xf3ead7, 0.45);
    for (const tile of targets) this.fillRings(flash, tile.rings);
    this.root.add(flash);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 520,
      ease: "Cubic.easeOut",
      onComplete: () => flash.destroy(),
    });
  }

  private redraw(paints: Map<string, Paint>): void {
    for (const tile of this.placed) {
      const paint = paints.get(tile.id) ?? { fill: 0xc6b48c, ink: "#1a120c", letter: "·" };
      tile.fill = paint.fill;
      tile.ink = paint.ink;
      tile.markerText.setText(paint.letter);
      tile.markerText.setColor(paint.ink);
      this.paintDisc(tile.markerDisc, paint.fill, paint.ink);
    }
    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;
    const width = this.canvas.width;
    const height = this.canvas.height;
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    roundRect(ctx, 1, 1, width - 2, height - 2, 16);
    ctx.clip();
    const sea = ctx.createLinearGradient(0, 0, 0, height);
    sea.addColorStop(0, "#16384a");
    sea.addColorStop(0.55, "#102838");
    sea.addColorStop(1, "#0c1c28");
    ctx.fillStyle = sea;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(212,177,90,0.13)";
    ctx.lineWidth = 1;
    for (let y = 28; y < height; y += 46) {
      ctx.beginPath();
      ctx.moveTo(18, y);
      ctx.lineTo(width - 18, y);
      ctx.stroke();
    }
    for (let x = 36; x < width; x += 70) {
      ctx.beginPath();
      ctx.moveTo(x, 18);
      ctx.lineTo(x, height - 18);
      ctx.stroke();
    }
    for (const rings of this.decorRings) {
      this.paintLand(ctx, rings, "#c6b48c", "decor");
    }
    for (const tile of this.placed) {
      this.paintLand(ctx, tile.rings, hex(tile.fill), tile.id);
    }
    ctx.fillStyle = "#123246";
    for (const ring of this.lakeRings) {
      traceRing(ctx, ring);
      ctx.fill();
    }
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(26,18,12,0.88)";
    ctx.lineWidth = 1.6;
    for (const rings of this.decorRings) {
      for (const ring of rings) {
        traceRing(ctx, ring);
        ctx.stroke();
      }
    }
    for (const tile of this.placed) {
      for (const ring of tile.rings) {
        traceRing(ctx, ring);
        ctx.stroke();
      }
    }
    ctx.strokeStyle = "rgba(243,234,215,0.28)";
    ctx.lineWidth = 1;
    for (const tile of this.placed) {
      for (const ring of tile.rings) {
        traceRing(ctx, ring);
        ctx.stroke();
      }
    }
    this.paintCompass(ctx, this.mode === "world" ? 86 : 70, height - 86);
    this.paintCartouche(ctx);
    ctx.restore();
    ctx.strokeStyle = "#d4b15a";
    ctx.lineWidth = 3;
    roundRect(ctx, 2, 2, width - 4, height - 4, 16);
    ctx.stroke();
    ctx.strokeStyle = "rgba(243,234,215,0.35)";
    ctx.lineWidth = 1;
    roundRect(ctx, 7, 7, width - 14, height - 14, 13);
    ctx.stroke();
    const texture = this.scene.textures.get(this.textureKey);
    if (texture.key !== "__MISSING") (texture as Phaser.Textures.CanvasTexture).refresh();
    this.drawHover();
    this.drawPulse();
  }

  private paintLand(ctx: CanvasRenderingContext2D, rings: number[][], fill: string, seedKey: string): void {
    ctx.beginPath();
    for (const ring of rings) addRing(ctx, ring);
    ctx.fillStyle = fill;
    ctx.fill("evenodd");
    ctx.save();
    ctx.clip("evenodd");
    const box = bounds(rings);
    ctx.strokeStyle = "rgba(26,18,12,0.14)";
    ctx.lineWidth = 1;
    const span = box.maxX - box.minX + box.maxY - box.minY;
    for (let offset = box.minX - span; offset < box.maxX + 8; offset += 8) {
      ctx.beginPath();
      ctx.moveTo(offset, box.minY - 4);
      ctx.lineTo(offset + (box.maxY - box.minY) + 8, box.maxY + 4);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(243,234,215,0.045)";
    let seed = hash(seedKey);
    const specks = Math.min(80, Math.max(6, Math.round((box.maxX - box.minX) * (box.maxY - box.minY) / 900)));
    for (let i = 0; i < specks; i += 1) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const sx = box.minX + (seed % 1000) / 1000 * (box.maxX - box.minX);
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const sy = box.minY + (seed % 1000) / 1000 * (box.maxY - box.minY);
      ctx.fillRect(sx, sy, 1.4, 1.4);
    }
    ctx.restore();
  }

  private paintCompass(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = "rgba(212,177,90,0.85)";
    ctx.fillStyle = "rgba(18,28,36,0.55)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(6, 0);
    ctx.lineTo(0, 20);
    ctx.lineTo(-6, 0);
    ctx.closePath();
    ctx.fillStyle = "#d4b15a";
    ctx.fill();
    ctx.fillStyle = "#f3ead7";
    ctx.font = "700 12px Oswald, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("N", 0, -30);
    ctx.restore();
  }

  private paintCartouche(ctx: CanvasRenderingContext2D): void {
    const title = this.mode === "world" ? "THEATRE OF THE DICTATORS" : "EUROPE, YEAR BY YEAR";
    const sub = this.mode === "world" ? "1922  –  1975" : "A teaching map. Not a score.";
    ctx.font = "600 15px Oswald, sans-serif";
    const width = Math.max(ctx.measureText(title).width, 220) + 36;
    const x = this.mode === "world" ? 24 : 22;
    const y = 18;
    ctx.fillStyle = "rgba(18,16,12,0.72)";
    roundRect(ctx, x, y, width, 48, 6);
    ctx.fill();
    ctx.strokeStyle = "rgba(212,177,90,0.9)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "#d4b15a";
    ctx.textAlign = "left";
    ctx.fillText(title, x + 14, y + 20);
    ctx.fillStyle = "#f3ead7";
    ctx.font = "400 13px \"Source Serif 4\", Georgia, serif";
    ctx.fillText(sub, x + 14, y + 38);
  }

  private makePlaced(id: string, name: string, rings: number[][], anchorX: number, anchorY: number): Placed {
    const box = bounds(rings);
    const large = box.maxX - box.minX > 110 && box.maxY - box.minY > 64;
    const font = this.mode === "spread" ? (large ? 20 : 17) : this.viewW > 1100 ? (large ? 20 : 16) : large ? 16 : 14;
    const label = this.scene.add
      .text(anchorX, anchorY, name, {
        fontFamily: "Oswald, sans-serif",
        fontSize: `${font}px`,
        color: "#f3ead7",
        align: "center",
        stroke: "#1a120c",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    const marker = this.scene.add.container(anchorX, anchorY);
    const markerDisc = this.scene.add.graphics();
    const markerText = this.scene.add
      .text(0, 0, "·", {
        fontFamily: "Oswald, sans-serif",
        fontSize: "13px",
        color: "#1a120c",
      })
      .setOrigin(0.5);
    marker.add([markerDisc, markerText]);
    const leader = this.scene.add.graphics();
    return {
      id,
      name,
      full: name,
      rings,
      anchorX,
      anchorY,
      label,
      marker,
      markerText,
      markerDisc,
      leader,
      fill: 0xc6b48c,
      ink: "#1a120c",
    };
  }

  private layoutLabels(): void {
    const compassX = this.mode === "world" ? 86 : 70;
    const occupied: { x: number; y: number; w: number; h: number }[] = [
      { x: 16, y: 10, w: 330, h: 64 },
      { x: compassX - 40, y: this.viewH - 132, w: 80, h: 96 },
    ];
    const rank = (id: string): number => LABEL_RANK[id] ?? 40;
    const ordered = [...this.placed].sort((a, b) => {
      const areaA = areaOf(a.rings);
      const areaB = areaOf(b.rings);
      if (areaA > 14000 || areaB > 14000) return areaB - areaA;
      return rank(a.id) - rank(b.id);
    });
    for (const tile of ordered) this.seatLabel(tile, occupied);
    for (const tile of this.placed) this.seatMarker(tile, occupied);
    for (const tile of this.placed) {
      this.root.bringToTop(tile.leader);
    }
    for (const tile of this.placed) this.root.bringToTop(tile.marker);
    for (const tile of this.placed) this.root.bringToTop(tile.label);
    for (const text of this.decorLabels) {
      const box = { x: text.x - text.width / 2 - 2, y: text.y - text.height / 2 - 2, w: text.width + 4, h: text.height + 4 };
      const outside = text.x < 8 || text.y < 8 || text.x > this.viewW - 8 || text.y > this.viewH - 8;
      const onForeign = this.placed.some((tile) => pointInRings(text.x, text.y, tile.rings));
      const crowded = occupied.some((item) => intersects(box, item, 8));
      text.setVisible(!outside && !onForeign && !crowded);
      if (text.visible) occupied.push(box);
    }
  }

  private seatLabel(tile: Placed, occupied: { x: number; y: number; w: number; h: number }[]): void {
    tile.leader.clear();
    const attempts = [tile.name, COMPACT[tile.id] ?? "", wrapName(tile.name)].filter((value, index, all) => value && all.indexOf(value) === index);
    for (const text of attempts) {
      tile.label.setText(text);
      const spot = this.findOpenSpot(tile, occupied);
      if (!spot) continue;
      tile.label.setVisible(true);
      tile.label.setPosition(spot.x + spot.w / 2, spot.y + spot.h / 2);
      occupied.push(spot);
      const outside = !pointInRings(tile.label.x, tile.label.y, tile.rings);
      const dx = tile.label.x - tile.anchorX;
      const dy = tile.label.y - tile.anchorY;
      if (outside && dx * dx + dy * dy > 42 * 42) {
        tile.leader.lineStyle(1.15, 0xf3ead7, 0.75);
        tile.leader.lineBetween(tile.anchorX, tile.anchorY, tile.label.x, tile.label.y);
      }
      return;
    }
    tile.label.setText(tile.name);
    tile.label.setVisible(false);
  }

  private findOpenSpot(
    tile: Placed,
    occupied: { x: number; y: number; w: number; h: number }[],
  ): { x: number; y: number; w: number; h: number } | null {
    const labelW = tile.label.width + 6;
    const labelH = tile.label.height + 4;
    const directions = [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
      [-0.7, -0.7],
      [0.7, -0.7],
      [-0.7, 0.7],
      [0.7, 0.7],
    ];
    const raw: [number, number, number][] = [[tile.anchorX - labelW / 2, tile.anchorY - labelH / 2, 0]];
    for (const dist of [18, 32, 48, 66, 86]) {
      for (const [dx, dy] of directions) {
        raw.push([tile.anchorX + dx * dist - labelW / 2, tile.anchorY + dy * dist - labelH / 2, dist]);
      }
    }
    let best: { spot: { x: number; y: number; w: number; h: number }; score: number } | null = null;
    for (const [rawX, rawY, dist] of raw) {
      const spot = {
        x: clamp(rawX, 8, this.viewW - labelW - 8),
        y: clamp(rawY, 8, this.viewH - labelH - 8),
        w: labelW,
        h: labelH,
      };
      if (Math.hypot(spot.x - rawX, spot.y - rawY) > 6) continue;
      if (occupied.some((item) => intersects(spot, item, 4))) continue;
      const cx = spot.x + labelW / 2;
      const cy = spot.y + labelH / 2;
      if (this.placed.some((other) => other.id !== tile.id && pointInRings(cx, cy, other.rings))) continue;
      const inside = pointInRings(cx, cy, tile.rings);
      if (!inside && dist > 78) continue;
      const score = (inside ? 0 : 24) + dist;
      if (!best || score < best.score) best = { spot, score };
    }
    return best?.spot ?? null;
  }

  private seatMarker(tile: Placed, occupied: { x: number; y: number; w: number; h: number }[]): void {
    const poster = this.mode === "world" && this.viewW < 1100;
    if (poster && !tile.label.visible && areaOf(tile.rings) < 3200) {
      tile.marker.setVisible(false);
      return;
    }
    tile.marker.setVisible(true);
    const offsets: [number, number][] = [
      [0, 0],
      [0, 18],
      [0, -18],
      [18, 0],
      [-18, 0],
      [14, 14],
      [-14, 14],
      [14, -14],
      [-14, -14],
    ];
    for (const [dx, dy] of offsets) {
      const x = tile.anchorX + dx;
      const y = tile.anchorY + dy;
      const box = { x: x - 11, y: y - 11, w: 22, h: 22 };
      if (x < 12 || y < 12 || x > this.viewW - 12 || y > this.viewH - 12) continue;
      if (occupied.some((item) => intersects(box, item, 1))) continue;
      tile.marker.setPosition(x, y);
      occupied.push(box);
      return;
    }
    if (tile.label.visible) {
      tile.marker.setVisible(false);
      return;
    }
    tile.marker.setPosition(tile.anchorX, tile.anchorY);
  }

  private paintDisc(gfx: Phaser.GameObjects.Graphics, fill: number, ink: string): void {
    gfx.clear();
    gfx.fillStyle(fill, 1);
    gfx.fillCircle(0, 0, 9);
    gfx.lineStyle(1.5, ink === "#1a120c" ? 0x1a120c : 0xf3ead7, 0.9);
    gfx.strokeCircle(0, 0, 9);
  }

  private drawHover(): void {
    this.hoverGfx.clear();
    const tile = this.placed.find((item) => item.id === this.hoverId);
    if (!tile) return;
    this.hoverGfx.lineStyle(3, 0xf3ead7, 0.95);
    this.strokeRings(this.hoverGfx, tile.rings);
  }

  private drawPulse(): void {
    this.pulseGfx.clear();
    if (this.lit.size === 0) return;
    this.pulseGfx.lineStyle(4, 0xf3ead7, 0.35 + this.pulse * 0.6);
    for (const tile of this.placed) {
      if (!this.lit.has(tile.id)) continue;
      this.strokeRings(this.pulseGfx, tile.rings);
    }
  }

  private fillRings(gfx: Phaser.GameObjects.Graphics, rings: number[][]): void {
    for (const ring of rings) {
      if (ring.length < 6) continue;
      gfx.fillPoints(toPoints(ring), true);
    }
  }

  private strokeRings(gfx: Phaser.GameObjects.Graphics, rings: number[][]): void {
    for (const ring of rings) {
      if (ring.length < 6) continue;
      gfx.strokePoints(toPoints(ring), true);
    }
  }

  private hitTest(x: number, y: number): string {
    let found = "";
    let best = Number.POSITIVE_INFINITY;
    for (const tile of this.placed) {
      if (!pointInRings(x, y, tile.rings)) continue;
      const size = areaOf(tile.rings);
      if (size < best) {
        best = size;
        found = tile.id;
      }
    }
    return found;
  }

  private scaleRing(ring: number[]): number[] {
    const out: number[] = [];
    for (let i = 0; i < ring.length; i += 2) {
      out.push(this.originX + ring[i] * this.scale, this.originY + ring[i + 1] * this.scale);
    }
    return out;
  }

  private toView(x: number, y: number): { x: number; y: number } {
    return { x: this.originX + x * this.scale, y: this.originY + y * this.scale };
  }
}

function toPoints(ring: number[]): Phaser.Geom.Point[] {
  const points: Phaser.Geom.Point[] = [];
  for (let i = 0; i < ring.length; i += 2) points.push(new Phaser.Geom.Point(ring[i], ring[i + 1]));
  return points;
}

function addRing(ctx: CanvasRenderingContext2D, ring: number[]): void {
  ctx.moveTo(ring[0], ring[1]);
  for (let i = 2; i < ring.length; i += 2) ctx.lineTo(ring[i], ring[i + 1]);
  ctx.closePath();
}

function traceRing(ctx: CanvasRenderingContext2D, ring: number[]): void {
  ctx.beginPath();
  addRing(ctx, ring);
}

function pointInRings(x: number, y: number, rings: number[][]): boolean {
  let inside = false;
  for (const ring of rings) {
    if (pointInRing(x, y, ring)) inside = !inside;
  }
  return inside;
}

function pointInRing(x: number, y: number, ring: number[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
    const xi = ring[i];
    const yi = ring[i + 1];
    const xj = ring[j];
    const yj = ring[j + 1];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 0.00001) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function bounds(rings: number[][]): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const ring of rings) {
    for (let i = 0; i < ring.length; i += 2) {
      minX = Math.min(minX, ring[i]);
      maxX = Math.max(maxX, ring[i]);
      minY = Math.min(minY, ring[i + 1]);
      maxY = Math.max(maxY, ring[i + 1]);
    }
  }
  return { minX, minY, maxX, maxY };
}

function areaOf(rings: number[][]): number {
  let area = 0;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
      area += ring[j] * ring[i + 1] - ring[i] * ring[j + 1];
    }
  }
  return Math.abs(area / 2);
}

function intersects(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
  pad: number,
): boolean {
  return a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
}

const COMPACT: Record<string, string> = {
  czech: "Czecho-\nslovakia",
  dennor: "Denmark\n& Norway",
  low: "Low\nCountries",
  pacific: "Pacific\nIslands",
  nafrica: "North\nAfrica",
  mideast: "Middle\nEast",
  wsoviet: "Soviet\nWest",
};

const LABEL_RANK: Record<string, number> = {
  germany: 1,
  britain: 2,
  france: 3,
  poland: 4,
  italy: 11,
  spain: 6,
  czech: 7,
  austria: 8,
  low: 9,
  ussr: 10,
  wsoviet: 10,
  balkans: 5,
  greece: 12,
  dennor: 13,
  denmark: 14,
  norway: 15,
  sweden: 16,
  nafrica: 17,
  japan: 18,
};

function wrapName(name: string): string {
  const space = name.indexOf(" ");
  if (space < 0 || name.includes("\n")) return name;
  const mid = name.length / 2;
  let best = space;
  let cursor = space;
  while (cursor >= 0) {
    if (Math.abs(cursor - mid) < Math.abs(best - mid)) best = cursor;
    cursor = name.indexOf(" ", cursor + 1);
  }
  return `${name.slice(0, best)}\n${name.slice(best + 1)}`;
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return (min + max) / 2;
  return Math.max(min, Math.min(max, value));
}

function hash(value: string): number {
  let out = 2166136261;
  for (let i = 0; i < value.length; i += 1) out = Math.imul(out ^ value.charCodeAt(i), 16777619);
  return out >>> 0;
}

function hex(color: number): string {
  return `#${color.toString(16).padStart(6, "0")}`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function worldTerritories(): { id: string }[] {
  return WORLD_BOARD.shapes.map((shape) => ({ id: shape.id }));
}

export function spreadTerritories(): { id: string }[] {
  return SPREAD_BOARD.shapes.map((shape) => ({ id: shape.id }));
}
