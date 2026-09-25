import { textStyle } from "./palette";
import type { TeamState } from "../logic/types";

const RIVAL_TEX: Record<string, string> = {
  payne: "rival-brick",
  lakeshore: "rival-warehouse",
  mahoning: "rival-tanks",
  oilcreek: "rival-derrick",
};

const RIVAL_POS: Record<string, { x: number; y: number }> = {
  payne: { x: 300, y: 230 },
  lakeshore: { x: 250, y: 150 },
  mahoning: { x: 430, y: 340 },
  oilcreek: { x: 620, y: 230 },
};

interface SmokeBit {
  sprite: Phaser.GameObjects.Image;
  vy: number;
  life: number;
}

export class OilMap {
  readonly root: Phaser.GameObjects.Container;
  private player: Phaser.GameObjects.Image;
  private rivals = new Map<string, Phaser.GameObjects.Image>();
  private train: Phaser.GameObjects.Image;
  private smokes: SmokeBit[] = [];
  private pipe: Phaser.GameObjects.Graphics;
  private trainX = 30;
  private frame = 0;
  private paused = false;
  private playerLevel = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.root = scene.add.container(x, y);
    const land = scene.add.image(0, 0, "land").setOrigin(0, 0);
    this.root.add(land);

    const label = (lx: number, ly: number, words: string) => {
      const text = scene.add.text(lx, ly, words, textStyle(13, "#f4efe4", true)).setShadow(1, 1, "#141a22", 2);
      this.root.add(text);
    };
    label(16, 12, "LAKE ERIE");
    label(70, 196, "CLEVELAND");
    label(560, 160, "OIL CREEK");
    label(430, 390, "YOUNGSTOWN");
    label(300, 292, "RAILROAD");

    this.player = scene.add.image(150, 210, "refinery-0").setOrigin(0, 0);
    this.root.add(this.player);
    const you = scene.add.text(148, 274, "YOUR REFINERY", textStyle(12, "#7ec8e3", true));
    this.root.add(you);

    for (const [id, pos] of Object.entries(RIVAL_POS)) {
      const sprite = scene.add.image(pos.x, pos.y, RIVAL_TEX[id]).setOrigin(0, 0);
      this.rivals.set(id, sprite);
      this.root.add(sprite);
    }

    this.pipe = scene.add.graphics();
    this.root.add(this.pipe);
    this.train = scene.add.image(30, 300, "train-0").setOrigin(0, 0);
    this.root.add(this.train);

    for (let i = 0; i < 8; i += 1) {
      const sprite = scene.add.image(0, 0, "smoke").setVisible(false);
      this.root.add(sprite);
      this.smokes.push({ sprite, vy: 0.15 + i * 0.02, life: 0 });
    }
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  show(team: TeamState): void {
    const level = Math.min(4, team.efficiencyBuilds + (team.share >= 45 ? 1 : 0));
    this.playerLevel = level;
    this.player.setTexture(`refinery-${level}`);
    for (const rival of team.rivals) {
      const sprite = this.rivals.get(rival.id);
      if (!sprite) continue;
      sprite.setTexture(rival.alive ? RIVAL_TEX[rival.id] : "sold");
      sprite.setAlpha(rival.alive ? 0.55 + (rival.health / 100) * 0.45 : 0.85);
    }
    this.pipe.clear();
    if (team.pipelineOwned) {
      this.pipe.lineStyle(4, 0x6b8f4e, 1);
      this.pipe.beginPath();
      this.pipe.moveTo(200, 240);
      this.pipe.lineTo(520, 250);
      this.pipe.lineTo(640, 230);
      this.pipe.strokePath();
    }
  }

  update(_time: number, delta: number): void {
    if (!this.paused) {
      this.trainX += delta * 0.04;
      if (this.trainX > 720) this.trainX = -20;
      this.frame += delta;
      this.train.setPosition(this.trainX, 300);
      this.train.setTexture(Math.floor(this.frame / 180) % 2 === 0 ? "train-0" : "train-1");
    }
    const stacks = this.playerLevel >= 1 ? 2 : 1;
    this.smokes.forEach((bit, index) => {
      if (bit.life <= 0) {
        const stackX = 150 + (index % stacks) * 28 + 16;
        bit.sprite.setPosition(stackX, 210);
        bit.sprite.setVisible(true);
        bit.sprite.setAlpha(0.7);
        bit.life = 1;
        return;
      }
      bit.life -= delta / 1800;
      bit.sprite.y -= bit.vy * (delta / 16);
      bit.sprite.setAlpha(Math.max(0, bit.life));
    });
  }
}
