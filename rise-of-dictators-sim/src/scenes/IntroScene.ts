import Phaser from "phaser";
import { riseApi } from "../game/api";
import { CREAM, COL, display, GOLD, serif } from "../game/palette";
import { button } from "../game/ui";
import type { GameState } from "../logic/types";

const CARDS = [
  { kicker: "BATTERY CREEK NEWSREEL", line: "1922. A king makes a bargain in Rome." },
  { kicker: "THE RECORD", line: "1923. A copied march fails in a Munich beer hall." },
  { kicker: "THE RECORD", line: "1933. A president hands over the chancellorship. There is no majority." },
  { kicker: "YOUR JOB", line: "The map will change. Your points will not come from the land." },
  { kicker: "A RULE", line: "Famine, massacre, and the Holocaust are a record. They are never a move." },
];

export class IntroScene extends Phaser.Scene {
  private index = 0;
  private state: GameState | null = null;

  constructor() {
    super("intro");
  }

  create(data: { state?: GameState }): void {
    this.index = 0;
    this.state = data.state ?? null;
    riseApi.phase = () => "intro";
    riseApi.ready = () => true;
    riseApi.act = () => this.advance();
    this.draw();
  }

  private draw(): void {
    this.children.removeAll(true);
    this.add.rectangle(960, 540, 1920, 1080, 0x07080a);
    const g = this.add.graphics();
    g.fillStyle(0x14120e, 1);
    for (let i = 0; i < 14; i += 1) {
      g.fillCircle(28, 70 + i * 72, 14);
      g.fillCircle(1892, 70 + i * 72, 14);
    }
    const card = CARDS[this.index];
    this.add.text(960, 280, card.kicker, display(22, GOLD)).setOrigin(0.5);
    this.add.rectangle(760, 320, 400, 3, COL.gold);
    this.add.text(960, 480, card.line, {
      ...serif(40, CREAM),
      align: "center",
      wordWrap: { width: 1200 },
    }).setOrigin(0.5);
    this.add.text(960, 860, `${this.index + 1}  /  ${CARDS.length}`, display(20, "#cbbfa6")).setOrigin(0.5);
    button(this, 780, 940, 360, 64, this.index === CARDS.length - 1 ? "Open the map" : "Next", () => this.advance());
  }

  private advance(): void {
    if (this.index < CARDS.length - 1) {
      this.index += 1;
      this.draw();
      return;
    }
    this.scene.start("play", { state: this.state ?? undefined });
  }
}
