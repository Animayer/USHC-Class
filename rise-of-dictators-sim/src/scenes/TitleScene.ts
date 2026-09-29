import Phaser from "phaser";
import { AudioBus } from "../audio/bus";
import { riseApi } from "../game/api";
import { CREAM, COL, display, GOLD, MUTED, serif } from "../game/palette";
import { PORTRAITS, portraitKey } from "../game/portraits";
import { button, framedPanel } from "../game/ui";
import { WarMap, worldTerritories } from "../game/warMap";
import { createGame } from "../logic/engine";
import type { Length } from "../logic/types";
import { Y1940 } from "../logic/snapshots";
import { TERRITORIES } from "../logic/territories";
import { SOURCES } from "../logic/sources";

const NAMES = ["Allies", "Analysts", "Axis Desk", "Soviet Desk", "China & Spain"];

export class TitleScene extends Phaser.Scene {
  private audio = new AudioBus();
  private map: WarMap | null = null;
  private teamCount = 3;
  private length: Length = "full";
  private names = [...NAMES];
  private editing = -1;

  constructor() {
    super("title");
  }

  create(): void {
    this.editing = -1;
    this.map = null;
    riseApi.phase = () => "title";
    riseApi.ready = () => true;
    riseApi.startQuick = () => this.begin("solo", "quick");
    riseApi.startFull = () => this.begin("solo", "full");
    riseApi.startTeams = () => this.begin("teams", this.length);
    riseApi.startSpread = () => this.scene.start("spread", { length: "full" });
    riseApi.openQuiz = () => this.scene.start("end", { quiz: true });
    riseApi.act = () => this.begin("solo", "quick");

    this.add.rectangle(960, 540, 1920, 1080, COL.bg);
    this.add.rectangle(900, 540, 4, 860, COL.gold, 0.7);

    this.add.text(64, 48, "BATTERY CREEK HIGH SCHOOL  ·  US HISTORY", display(20, GOLD));
    this.add.text(60, 92, "RISE OF", display(42, CREAM));
    this.add.text(56, 140, "DICTATORS", display(104, CREAM));
    this.add.rectangle(64, 268, 420, 4, COL.gold);
    this.add.text(64, 288, "A war-map chronicle, 1922–1975", serif(28, CREAM, true));
    this.add.text(64, 336, "Mayer  ·  The score is what you understand.", display(20, MUTED));

    button(this, 64, 420, 280, 64, "Full chronicle", () => this.begin("solo", "full"));
    button(this, 360, 420, 280, 64, "Quick round", () => this.begin("solo", "quick"));
    button(this, 64, 500, 280, 64, "Hitler’s Spread", () => {
      this.audio.unlock();
      this.scene.start("spread", { length: "full" });
    });
    button(this, 360, 500, 280, 64, "Projector teams", () => this.openTeams());
    button(this, 64, 580, 180, 56, "How to play", () => this.openHelp(), "quiet");
    button(this, 260, 580, 180, 56, "Exit quiz", () => this.scene.start("end", { quiz: true }), "quiet");
    button(this, 456, 580, 180, 56, "Credits", () => this.openCredits(), "quiet");

    this.add.text(64, 670, "Land changes color.\nInsight changes the score.\nAtrocities are a record, never a move.", {
      ...serif(22, CREAM),
      lineSpacing: 8,
    });

    const mute = button(this, 1680, 28, 200, 48, this.audio.isMuted ? "Sound off" : "Sound on", () => {
      const muted = this.audio.toggle();
      mute.setLabel(muted ? "Sound off" : "Sound on");
    }, "quiet");

    framedPanel(this, 940, 70, 940, 780);
    this.map = new WarMap(this, 956, 86, 908, 620, 1200, 450, worldTerritories(TERRITORIES));
    this.map.showHolds(Y1940);
    this.map.highlight(["germany", "france", "poland"]);
    this.add.text(980, 710, "THEATRE MAP  ·  1940  ·  NOT A SCOREBOARD", display(16, GOLD));

    PORTRAITS.slice(0, 8).forEach((portrait, index) => {
      const x = 80 + index * 230;
      if (this.textures.exists(portraitKey(portrait.id))) {
        this.add.image(x, 980, portraitKey(portrait.id)).setDisplaySize(72, 88);
      }
      this.add.text(x + 48, 990, portrait.name, display(18, CREAM)).setOrigin(0, 0.5);
    });

    this.input.keyboard?.on("keydown-M", () => {
      const muted = this.audio.toggle();
      mute.setLabel(muted ? "Sound off" : "Sound on");
    });
  }

  update(time: number): void {
    this.map?.update(time);
  }

  private begin(mode: "solo" | "teams", length: Length): void {
    this.audio.unlock();
    this.audio.play("click");
    const names = mode === "solo" ? ["You"] : this.names.slice(0, this.teamCount);
    const state = createGame({ mode, names, length, seed: Date.now() % 100000 });
    if (length === "full") {
      this.scene.start("intro", { state });
      return;
    }
    this.scene.start("play", { state });
  }

  private openTeams(): void {
    this.audio.unlock();
    const layer = this.add.container(0, 0);
    const dim = this.add.rectangle(960, 540, 1920, 1080, 0x000000, 0.62).setInteractive();
    layer.add(dim);
    layer.add(framedPanel(this, 520, 160, 880, 760));
    layer.add(this.add.text(560, 190, "PROJECTOR TEAMS", display(36, GOLD)));
    layer.add(this.add.text(560, 242, "Two to five desks. Pass the screen. One map.", serif(20, CREAM)));
    const summary = this.add.text(560, 290, "", display(22, CREAM));
    layer.add(summary);
    const nameTexts: Phaser.GameObjects.Text[] = [];
    const redraw = () => {
      summary.setText(`${this.teamCount} teams  ·  ${this.length === "full" ? "Full chronicle" : "Quick round"}`);
      nameTexts.forEach((text, index) => {
        text.setText(index < this.teamCount ? this.names[index] : "");
        text.setAlpha(index < this.teamCount ? 1 : 0.25);
      });
    };
    for (let index = 0; index < 5; index += 1) {
      const text = this.add.text(580, 350 + index * 48, this.names[index], display(26, CREAM));
      text.setInteractive({ useHandCursor: true });
      text.on("pointerup", () => {
        this.editing = index;
      });
      nameTexts.push(text);
      layer.add(text);
    }
    redraw();
    const fewer = button(this, 560, 620, 160, 52, "Fewer", () => {
      this.teamCount = Math.max(2, this.teamCount - 1);
      redraw();
    });
    const more = button(this, 740, 620, 160, 52, "More", () => {
      this.teamCount = Math.min(5, this.teamCount + 1);
      redraw();
    });
    const pace = button(this, 920, 620, 220, 52, "Length", () => {
      this.length = this.length === "full" ? "quick" : "full";
      redraw();
    }, "quiet");
    layer.add([fewer.root, more.root, pace.root]);
    const start = button(this, 560, 700, 280, 64, "Start hot-seat", () => {
      layer.destroy(true);
      this.begin("teams", this.length);
    });
    const close = button(this, 860, 700, 180, 64, "Close", () => layer.destroy(true), "quiet");
    layer.add([start.root, close.root]);
    const onKey = (event: KeyboardEvent) => {
      if (this.editing < 0 || !layer.active) return;
      if (event.key === "Backspace") this.names[this.editing] = this.names[this.editing].slice(0, -1);
      else if (event.key === "Enter") this.editing = -1;
      else if (event.key.length === 1 && this.names[this.editing].length < 18) this.names[this.editing] += event.key;
      redraw();
    };
    this.input.keyboard?.on("keydown", onKey);
    layer.once("destroy", () => this.input.keyboard?.off("keydown", onKey));
  }

  private openHelp(): void {
    const layer = this.add.container(0, 0);
    layer.add(this.add.rectangle(960, 540, 1920, 1080, 0x000000, 0.66).setInteractive());
    layer.add(framedPanel(this, 360, 120, 1200, 820));
    layer.add(this.add.text(410, 150, "SIXTY SECONDS", display(40, GOLD)));
    const lines = [
      "1.  Each era opens with a headline. Read the date before you touch a card.",
      "2.  On your turn, play one card. The stronger card names the real cause. The other is a trap.",
      "3.  Answer the check. Insight points are the only score. Dice illustrate a battle. They do not award land.",
      "4.  The quiet record panels, on famine, Nanjing, and the Holocaust, are not moves. Read them. They give no points.",
    ];
    lines.forEach((line, index) => {
      layer.add(this.add.text(410, 240 + index * 110, line, { ...serif(26, CREAM), wordWrap: { width: 1080 }, lineSpacing: 6 }));
    });
    layer.add(this.add.text(410, 700, "Keys: 1 and 2 play cards, Enter continues, M mutes, N toggles notes, T is the teacher desk.", serif(20, MUTED)));
    const close = button(this, 410, 820, 220, 60, "Got it", () => layer.destroy(true));
    layer.add(close.root);
  }

  private openCredits(): void {
    const layer = this.add.container(0, 0);
    layer.add(this.add.rectangle(960, 540, 1920, 1080, 0x000000, 0.66).setInteractive());
    layer.add(framedPanel(this, 420, 80, 1080, 920));
    layer.add(this.add.text(460, 110, "CREDITS AND SOURCES", display(36, GOLD)));
    layer.add(this.add.text(460, 170, "Portraits, map, and sound are original, drawn and synthesized for this class. No national hate symbol is used. Control is shown by color and a plain letter.", {
      ...serif(20, CREAM),
      wordWrap: { width: 980 },
    }));
    SOURCES.forEach((source, index) => {
      const y = 260 + index * 52;
      layer.add(this.add.text(460, y, source.name, display(18, GOLD)));
      layer.add(this.add.text(460, y + 22, source.detail, serif(16, MUTED)));
    });
    const close = button(this, 460, 900, 200, 56, "Close", () => layer.destroy(true));
    layer.add(close.root);
  }
}
