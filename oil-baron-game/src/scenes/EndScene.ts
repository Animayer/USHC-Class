import Phaser from "phaser";
import { oilApi } from "../game/api";
import { GOLD, INK, MUTED, PANEL, textStyle } from "../game/palette";
import { LENS_CRITIC, LENS_MARKET, badges, scoreTeam, verdict } from "../logic/scoring";
import { clearSave, resultSlip } from "../logic/save";
import type { GameState } from "../logic/types";

export class EndScene extends Phaser.Scene {
  private state!: GameState;
  private focus = 0;

  constructor() {
    super("end");
  }

  init(data: { state?: GameState }): void {
    if (!data.state) {
      this.scene.start("title");
      return;
    }
    this.state = data.state;
  }

  create(): void {
    if (!this.state) return;
    oilApi.phase = () => "done";
    this.add.rectangle(640, 400, 1280, 800, 0x141a22);
    this.add.text(40, 24, "The ledger closes", textStyle(36, GOLD, true));
    this.add.text(40, 70, "Two scores. The class question sits between them.", textStyle(16, MUTED));

    this.state.teams.forEach((team, index) => {
      const scores = scoreTeam(team);
      const x = 40 + (index % 2) * 620;
      const y = 110 + Math.floor(index / 2) * 150;
      this.add.rectangle(x + 290, y + 60, 580, 140, PANEL).setStrokeStyle(2, 0xf0c14a);
      this.add.text(x, y, team.name, textStyle(22, team.color, true));
      this.add.text(x, y + 32, `Customer Value  ${scores.customer}`, textStyle(20, INK, true));
      this.add.text(x + 280, y + 32, `Political Privilege  ${scores.privilege}`, textStyle(20, INK, true));
      this.add.text(x, y + 64, `Share ${team.share}%   Kerosene ${team.price}¢   (1870 was about 26¢)`, textStyle(15, MUTED));
      this.add.text(x, y + 90, badges(team).join("  ·  ") || "No badge", textStyle(15, GOLD));
    });

    const primary = this.state.teams[this.focus];
    const scores = scoreTeam(primary);
    const word = verdict(scores.customer, scores.privilege);
    const rows = Math.ceil(this.state.teams.length / 2);
    const top = 100 + rows * 150;
    this.add.text(40, top, word.title, textStyle(22, GOLD, true));
    this.add.text(40, top + 32, word.text, { ...textStyle(16, INK), wordWrap: { width: 1200 }, lineSpacing: 3 });
    this.add.text(40, top + 90, LENS_MARKET, { ...textStyle(14, MUTED), wordWrap: { width: 1200 }, lineSpacing: 2 });
    this.add.text(40, top + 148, LENS_CRITIC, { ...textStyle(14, MUTED), wordWrap: { width: 1200 }, lineSpacing: 2 });
    this.add.text(
      40,
      top + 214,
      "DBQ Q11: Which strategy won you the most market share? Was it fair to customers? Use one historical fact.",
      { ...textStyle(16, INK, true), wordWrap: { width: 1200 } },
    );

    const buttonY = Math.min(740, top + 250);
    this.button(40, buttonY, 200, 44, "Copy slip", () => this.copy());
    this.button(260, buttonY, 200, 44, "Print slip", () => this.print());
    this.button(480, buttonY, 200, 44, "Play again", () => {
      clearSave(safeStorage());
      this.scene.start("title");
    });
    if (this.state.teams.length > 1) {
      this.button(700, buttonY, 220, 44, "Next team slip", () => {
        this.focus = (this.focus + 1) % this.state.teams.length;
        this.scene.restart({ state: this.state });
      });
    }
  }

  private slip(): string {
    return resultSlip(this.state, this.focus);
  }

  private copy(): void {
    const text = this.slip();
    const done = () => this.flash("Copied.");
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(text).then(done).catch(() => this.fallbackCopy(text));
      return;
    }
    this.fallbackCopy(text);
  }

  private fallbackCopy(text: string): void {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
    this.flash("Copied.");
  }

  private print(): void {
    const popup = window.open("", "oil-baron-slip", "width=720,height=800");
    if (!popup) {
      this.flash("Allow pop-ups to print, or use Copy slip.");
      return;
    }
    const safe = this.slip().replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char] ?? char);
    popup.document.write(`<pre style="font:16px/1.45 system-ui,sans-serif;white-space:pre-wrap">${safe}</pre>`);
    popup.document.close();
    popup.focus();
    popup.print();
  }

  private flash(message: string): void {
    const note = this.add.text(960, 742, message, textStyle(16, GOLD, true));
    this.time.delayedCall(1600, () => note.destroy());
  }

  private button(x: number, y: number, w: number, h: number, label: string, onClick: () => void): void {
    const box = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0x2a3344).setStrokeStyle(2, 0xf0c14a).setInteractive({ useHandCursor: true });
    this.add.text(x + w / 2, y + h / 2, label, textStyle(16, INK, true)).setOrigin(0.5);
    box.on("pointerup", onClick);
  }
}

function safeStorage(): Storage | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}
