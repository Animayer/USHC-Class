import Phaser from "phaser";
import { AudioBus } from "../audio/bus";
import { oilApi } from "../game/api";
import { OilMap } from "../game/mapView";
import { GOLD, INK, MUTED, PANEL, textStyle } from "../game/palette";
import { createGame } from "../logic/engine";
import { readSave } from "../logic/save";
import type { RoundLength } from "../logic/types";

export class TitleScene extends Phaser.Scene {
  private audio = new AudioBus();
  private rounds: RoundLength = 6;
  private timer = false;
  private names = ["Team 1", "Team 2", "Team 3", "Team 4"];
  private teamCount = 2;
  private setupOpen = false;
  private helpOpen = false;
  private map: OilMap | null = null;

  constructor() {
    super("title");
  }

  create(): void {
    oilApi.phase = () => (this.helpOpen ? "help" : this.setupOpen ? "setup" : "title");
    oilApi.startSoloShort = () => this.begin("solo");
    this.add.rectangle(640, 400, 1280, 800, 0x1a2430);
    const preview = createGame({ mode: "solo", names: ["You"], rounds: 6, seed: 1 });
    this.map = new OilMap(this, 500, 200);
    this.map.root.setScale(0.95);
    this.map.show(preview.teams[0]);

    this.add.text(48, 36, "OIL BARON", textStyle(64, GOLD, true));
    this.add.text(52, 108, "Build It or Buy It?", textStyle(28, INK, true));
    this.add.text(52, 150, "Cleveland refinery, 1870–1890", textStyle(18, MUTED));
    this.add.text(52, 178, "Battery Creek · USHC · Captains of Industry · Mayer", textStyle(15, MUTED));

    this.button(52, 230, 220, 52, "Solo", () => this.begin("solo"));
    this.button(290, 230, 220, 52, "Teams", () => this.openTeams());
    const saved = readSave(safeStorage());
    if (saved) this.button(528, 230, 220, 52, "Continue", () => this.scene.start("play", { state: saved }));
    this.button(52, 300, 180, 44, "How to play", () => this.showHelp());
    this.button(250, 300, 150, 44, "Credits", () => this.showCredits());
    this.muteButton();

    this.add.text(52, 370, "Blue cards please customers.\nAmber cards ask for favors.", { ...textStyle(18, INK), lineSpacing: 6 });
  }

  update(time: number, delta: number): void {
    this.map?.update(time, delta);
  }

  private begin(mode: "solo" | "teams"): void {
    this.audio.unlock();
    this.audio.play("click");
    const names = mode === "solo" ? ["You"] : this.names.slice(0, this.teamCount);
    const state = createGame({
      mode,
      names,
      rounds: this.rounds,
      timerEnabled: mode === "teams" ? this.timer : false,
    });
    this.scene.start("play", { state });
  }

  private openTeams(): void {
    this.audio.unlock();
    this.setupOpen = true;
    oilApi.phase = () => "setup";
    const panel = this.add.container(0, 0);
    const dim = this.add.rectangle(640, 400, 1280, 800, 0x000000, 0.55).setInteractive();
    const card = this.add.rectangle(640, 400, 720, 460, PANEL).setStrokeStyle(3, 0xf0c14a);
    panel.add([dim, card]);
    const title = this.add.text(340, 200, "Team hot-seat", textStyle(28, GOLD, true));
    panel.add(title);
    const count = this.add.text(340, 250, "", textStyle(18, INK));
    panel.add(count);
    const refresh = () => {
      count.setText(`${this.teamCount} teams · ${this.rounds === 6 ? "Short (6 rounds)" : "Full (10 rounds)"} · Timer ${this.timer ? "on" : "off"}`);
    };
    refresh();
    this.names.slice(0, 4).forEach((name, index) => {
      const label = this.add.text(360, 300 + index * 36, name, textStyle(20, INK, true));
      panel.add(label);
      label.setInteractive({ useHandCursor: true });
      label.on("pointerup", () => {
        const next = window.prompt("Team name", this.names[index]);
        if (next && next.trim()) {
          this.names[index] = next.trim().slice(0, 22);
          label.setText(this.names[index]);
        }
      });
    });
    this.button(360, 560, 140, 42, "Teams −", () => {
      this.teamCount = Math.max(2, this.teamCount - 1);
      refresh();
    }, panel);
    this.button(510, 560, 140, 42, "Teams +", () => {
      this.teamCount = Math.min(4, this.teamCount + 1);
      refresh();
    }, panel);
    this.button(360, 610, 140, 42, "6 / 10", () => {
      this.rounds = this.rounds === 6 ? 10 : 6;
      refresh();
    }, panel);
    this.button(510, 610, 140, 42, "Timer", () => {
      this.timer = !this.timer;
      refresh();
    }, panel);
    this.button(680, 560, 160, 42, "Start", () => this.begin("teams"), panel);
    this.button(680, 610, 160, 42, "Back", () => {
      panel.destroy();
      this.setupOpen = false;
      oilApi.phase = () => "title";
    }, panel);
    this.add.text(360, 660, "Click a team name to rename it.", textStyle(14, MUTED)).setDepth(2);
  }

  private showHelp(): void {
    this.helpOpen = true;
    const lines = [
      "You run a Cleveland refinery from 1870 to 1890.",
      "Each round, play ONE card.",
      "Blue / efficiency: better stills, byproducts, barrels, pipelines.",
      "Those cards cut the price of kerosene for customers.",
      "Amber / privilege: secret rebates, drawbacks, buyouts, the trust.",
      "Those cards grab market share and raise political heat.",
      "Rivals act. History deals event cards (panic, Tidewater, Sherman).",
      "Teams share the projector. Each team has its own refinery.",
      "The end is two scores, not one winner:",
      "Customer Value and Political Privilege.",
      "Question: did you get rich by pleasing customers or politicians?",
      "Keys: 1 2 3 play a card, Enter confirm, M mute, T teacher, Space continue.",
    ];
    this.modal("How to play", lines.join("\n"), () => {
      this.helpOpen = false;
    });
  }

  private showCredits(): void {
    this.modal(
      "Credits",
      [
        "Original game for Battery Creek US History.",
        "Pixel art drawn in the game. No outside art files.",
        "Sound is original synthesis (square and triangle waves). No samples.",
        "History follows the G4 Captains of Industry lesson:",
        "Standard Oil 1870, South Improvement Company 1872,",
        "kerosene about 26¢ to about 8¢ (approximate), ~90% by ~1880,",
        "trust 1882, Interstate Commerce Act 1887,",
        "Sherman Act 1890 (Senate 51–1, House 242–0),",
        "Tarbell 1902–1904 as an epilogue, not as a round.",
      ].join("\n"),
      () => undefined,
    );
  }

  private modal(title: string, body: string, onClose: () => void): void {
    const root = this.add.container(0, 0).setDepth(5);
    root.add(this.add.rectangle(640, 400, 1280, 800, 0x000000, 0.6).setInteractive());
    root.add(this.add.rectangle(640, 400, 860, 520, PANEL).setStrokeStyle(3, 0xf0c14a));
    root.add(this.add.text(250, 180, title, textStyle(28, GOLD, true)));
    root.add(this.add.text(250, 230, body, { ...textStyle(18, INK), wordWrap: { width: 760 }, lineSpacing: 6 }));
    this.button(560, 640, 160, 44, "Close", () => {
      root.destroy();
      onClose();
    }, root);
  }

  private muteButton(): void {
    const label = this.add.text(1100, 28, this.audio.isMuted ? "Sound off" : "Sound on", textStyle(16, INK, true));
    const box = this.add.rectangle(1168, 40, 150, 36, 0x2a3344).setStrokeStyle(2, 0xf0c14a).setInteractive({ useHandCursor: true });
    label.setPosition(1104, 28);
    box.on("pointerup", () => {
      const muted = this.audio.toggle();
      label.setText(muted ? "Sound off" : "Sound on");
    });
  }

  private button(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    onClick: () => void,
    parent?: Phaser.GameObjects.Container,
  ): void {
    const box = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0x2a3344).setStrokeStyle(2, 0xf0c14a).setInteractive({ useHandCursor: true });
    const text = this.add.text(x + w / 2, y + h / 2, label, textStyle(18, INK, true)).setOrigin(0.5);
    box.on("pointerup", () => {
      this.audio.unlock();
      this.audio.play("click");
      onClick();
    });
    parent?.add([box, text]);
  }
}

function safeStorage(): Storage | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}
