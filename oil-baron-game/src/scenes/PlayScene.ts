import Phaser from "phaser";
import { AudioBus } from "../audio/bus";
import { oilApi } from "../game/api";
import { OilMap } from "../game/mapView";
import { BLUE, GOLD, INK, MUTED, PANEL, textStyle } from "../game/palette";
import { cardById } from "../logic/cards";
import { acknowledge, activeTeam, currentYear, playCard, skipToEnd } from "../logic/engine";
import { heatLabel, HISTORICAL_PRICE, opinionLabel, scoreTeam } from "../logic/scoring";
import { clearSave, writeSave } from "../logic/save";
import type { GameState, TeamState } from "../logic/types";

interface Slot {
  root: Phaser.GameObjects.Container;
  title: Phaser.GameObjects.Text;
  body: Phaser.GameObjects.Text;
  kind: Phaser.GameObjects.Text;
  frame: Phaser.GameObjects.Rectangle;
}

export class PlayScene extends Phaser.Scene {
  private state!: GameState;
  private audio = new AudioBus();
  private map!: OilMap;
  private slots: Slot[] = [];
  private selected = 0;
  private eventRoot!: Phaser.GameObjects.Container;
  private teacherRoot!: Phaser.GameObjects.Container;
  private pauseRoot!: Phaser.GameObjects.Container;
  private hud = new Map<string, Phaser.GameObjects.Text>();
  private pie!: Phaser.GameObjects.Graphics;
  private chart!: Phaser.GameObjects.Graphics;
  private meters!: Phaser.GameObjects.Graphics;
  private timerLeft = 90;
  private timerAcc = 0;
  private paused = false;
  private keysBound = false;

  constructor() {
    super("play");
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
    oilApi.phase = () => this.state.phase;
    oilApi.startSoloShort = () => undefined;
    this.add.rectangle(640, 400, 1280, 800, 0x1a2430);
    this.map = new OilMap(this, 12, 64);
    this.pie = this.add.graphics();
    this.chart = this.add.graphics();
    this.meters = this.add.graphics();
    this.buildHud();
    this.buildCards();
    this.buildEvent();
    this.buildTeacher();
    this.buildPause();
    this.bindKeys();
    this.audio.unlock();
    this.refresh();
    this.persist();
  }

  update(time: number, delta: number): void {
    if (!this.state || this.paused) return;
    this.map.update(time, delta);
    if (this.state.timerEnabled && this.state.phase === "choose" && !this.teacherRoot.visible) {
      this.timerAcc += delta;
      if (this.timerAcc >= 1000) {
        this.timerAcc = 0;
        this.timerLeft -= 1;
        this.hud.get("timer")?.setText(String(this.timerLeft));
        if (this.timerLeft <= 0) this.confirmPlay();
      }
    }
  }

  private buildHud(): void {
    this.add.rectangle(640, 28, 1280, 56, 0x1c2430);
    this.hud.set("year", this.add.text(16, 8, "", textStyle(26, GOLD, true)));
    this.hud.set("banner", this.add.text(230, 16, "", { ...textStyle(16, INK), wordWrap: { width: 620 } }));
    const sound = this.add.text(918, 16, this.audio.isMuted ? "Sound off" : "Sound on", textStyle(16, INK, true));
    this.hud.set("sound", sound);
    this.button(900, 8, 150, 36, "", () => {
      const muted = this.audio.toggle();
      sound.setText(muted ? "Sound off" : "Sound on");
    });
    sound.setDepth(2);
    this.button(1060, 8, 100, 36, "Teacher", () => this.toggleTeacher());
    this.button(1172, 8, 90, 36, "Pause", () => this.setPaused(true));

    this.add.rectangle(1024, 292, 480, 440, PANEL).setStrokeStyle(2, 0x3d4a5c);
    this.add.text(800, 78, "Market share", textStyle(16, GOLD, true));
    this.add.text(800, 250, "Kerosene ¢/gal", textStyle(16, GOLD, true));
    this.hud.set("price", this.add.text(980, 250, "", textStyle(16, INK, true)));
    this.hud.set("opinion", this.add.text(800, 400, "", textStyle(14, INK)));
    this.hud.set("heat", this.add.text(1020, 400, "", textStyle(14, INK)));
    this.hud.set("rivals", this.add.text(800, 448, "", { ...textStyle(14, MUTED), lineSpacing: 4 }));
    this.hud.set("timer", this.add.text(800, 70, "", textStyle(14, BLUE)));
    this.add.text(16, 512, "Play one card", textStyle(18, GOLD, true));
    this.hud.set("hint", this.add.text(180, 516, "1–3 select · Enter plays · Blue cuts the lamp bill · Amber asks for a favor", textStyle(14, MUTED)));
  }

  private buildCards(): void {
    for (let index = 0; index < 3; index += 1) {
      const x = 24 + index * 416;
      const root = this.add.container(x, 548);
      const frame = this.add.rectangle(196, 110, 392, 210, 0x243044).setStrokeStyle(4, 0x0072b2);
      const kind = this.add.text(16, 12, "", textStyle(14, GOLD, true));
      const title = this.add.text(16, 40, "", textStyle(22, INK, true));
      const body = this.add.text(16, 78, "", { ...textStyle(16, INK), wordWrap: { width: 360 }, lineSpacing: 4 });
      frame.setInteractive({ useHandCursor: true });
      frame.on("pointerup", () => {
        if (this.selected === index) this.confirmPlay();
        else {
          this.selected = index;
          this.audio.play("click");
          this.paintCards();
        }
      });
      root.add([frame, kind, title, body]);
      this.slots.push({ root, title, body, kind, frame });
    }
  }

  private buildEvent(): void {
    this.eventRoot = this.add.container(0, 0).setDepth(8).setVisible(false);
    this.eventRoot.add(this.add.rectangle(640, 400, 1280, 800, 0x000000, 0.62).setInteractive());
    this.eventRoot.add(this.add.rectangle(640, 390, 920, 520, 0xf4efe4).setStrokeStyle(6, 0xf0c14a));
    this.hud.set("eventYear", this.add.text(220, 170, "", textStyle(16, "#8a5a00", true)));
    this.hud.set("eventTitle", this.add.text(220, 198, "", { ...textStyle(30, "#1a140c", true), wordWrap: { width: 820 } }));
    this.hud.set("eventBody", this.add.text(220, 280, "", { ...textStyle(20, "#1a140c"), wordWrap: { width: 820 }, lineSpacing: 6 }));
    this.hud.set("eventFact", this.add.text(220, 480, "", { ...textStyle(16, "#3d3428"), wordWrap: { width: 820 }, lineSpacing: 4 }));
    this.eventRoot.add([
      this.hud.get("eventYear")!,
      this.hud.get("eventTitle")!,
      this.hud.get("eventBody")!,
      this.hud.get("eventFact")!,
    ]);
    this.button(500, 580, 280, 52, "Continue", () => this.continueEvent(), this.eventRoot);
  }

  private buildTeacher(): void {
    this.teacherRoot = this.add.container(0, 0).setDepth(9).setVisible(false);
    this.teacherRoot.add(this.add.rectangle(640, 400, 1280, 800, 0x000000, 0.45).setInteractive());
    this.teacherRoot.add(this.add.rectangle(980, 280, 420, 360, PANEL).setStrokeStyle(3, 0xf0c14a));
    const title = this.add.text(800, 130, "Teacher", textStyle(24, GOLD, true));
    this.teacherRoot.add(title);
    this.button(800, 190, 280, 44, "Resume", () => this.toggleTeacher(false), this.teacherRoot);
    this.button(800, 246, 280, 44, "Skip to the end", () => this.skip(), this.teacherRoot);
    this.button(800, 302, 280, 44, "Restart", () => this.restart(), this.teacherRoot);
    this.button(800, 358, 280, 44, "Close", () => this.toggleTeacher(false), this.teacherRoot);
  }

  private buildPause(): void {
    this.pauseRoot = this.add.container(0, 0).setDepth(10).setVisible(false);
    this.pauseRoot.add(this.add.rectangle(640, 400, 1280, 800, 0x000000, 0.55).setInteractive());
    this.pauseRoot.add(this.add.text(520, 340, "Paused", textStyle(48, GOLD, true)));
    this.button(540, 430, 200, 52, "Resume", () => this.setPaused(false), this.pauseRoot);
  }

  private bindKeys(): void {
    if (this.keysBound) return;
    this.keysBound = true;
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      if (!this.state) return;
      if (event.key === "m" || event.key === "M") {
        const muted = this.audio.toggle();
        this.hud.get("sound")?.setText(muted ? "Off" : "On");
      }
      if (event.key === "p" || event.key === "P" || event.key === "Escape") this.setPaused(!this.paused);
      if (event.key === "t" || event.key === "T") this.toggleTeacher();
      if (this.paused || this.teacherRoot.visible) return;
      if (this.state.phase === "choose") {
        if (event.key === "1") this.selected = 0;
        if (event.key === "2") this.selected = 1;
        if (event.key === "3") this.selected = 2;
        if (event.key === "1" || event.key === "2" || event.key === "3") this.paintCards();
        if (event.key === "Enter") this.confirmPlay();
      }
      if ((event.key === " " || event.key === "Enter") && (this.state.phase === "event" || this.state.phase === "epilogue")) {
        this.continueEvent();
      }
    });
  }

  private confirmPlay(): void {
    if (this.state.phase !== "choose") return;
    const id = activeTeam(this.state).hand[this.selected] ?? activeTeam(this.state).hand[0];
    if (!id) return;
    const card = cardById(id);
    this.state = playCard(this.state, id);
    this.audio.play(card.kind === "privilege" ? "bad" : "card");
    if (card.buyout || card.squeeze || this.state.event?.severity === "major") {
      this.cameras.main.shake(180, 0.003);
      if (card.buyout) this.audio.play("buyout");
    }
    this.timerLeft = this.state.timerSeconds;
    this.refresh();
    this.persist();
  }

  private continueEvent(): void {
    if (this.state.phase !== "event" && this.state.phase !== "epilogue") return;
    const wasEpilogue = this.state.phase === "epilogue";
    this.state = acknowledge(this.state);
    this.audio.play(wasEpilogue ? "end" : "event");
    this.selected = 0;
    this.timerLeft = this.state.timerSeconds;
    if (this.state.phase === "done") {
      this.persist();
      this.scene.start("end", { state: this.state });
      return;
    }
    this.refresh();
    this.persist();
  }

  private skip(): void {
    this.state = skipToEnd(this.state);
    this.teacherRoot.setVisible(false);
    this.persist();
    this.scene.start("end", { state: this.state });
  }

  private restart(): void {
    clearSave(safeStorage());
    this.scene.start("title");
  }

  private setPaused(paused: boolean): void {
    this.paused = paused;
    this.pauseRoot.setVisible(paused);
    this.map.setPaused(paused);
  }

  private toggleTeacher(force?: boolean): void {
    const show = force ?? !this.teacherRoot.visible;
    this.teacherRoot.setVisible(show);
  }

  private refresh(): void {
    const team = activeTeam(this.state);
    const year = currentYear(this.state);
    this.hud.get("year")?.setText(String(year));
    this.hud.get("banner")?.setText(`${team.name} · round ${this.state.roundIndex + 1}/${this.state.years.length} · ${this.state.banner}`);
    this.hud.get("timer")?.setText(this.state.timerEnabled ? `Timer ${this.timerLeft}s` : "");
    this.map.show(team);
    this.map.setPaused(this.state.phase !== "choose" || this.paused);
    this.paintSide(team);
    this.paintCards();
    const showing = this.state.phase === "event" || this.state.phase === "epilogue";
    this.eventRoot.setVisible(showing);
    if (showing && this.state.event) {
      this.hud.get("eventYear")?.setText(this.state.event.yearLabel);
      this.hud.get("eventTitle")?.setText(this.state.event.title);
      this.hud.get("eventBody")?.setText(this.state.event.body);
      this.hud.get("eventFact")?.setText(this.state.event.fact);
    }
    oilApi.phase = () => this.state.phase;
  }

  private paintSide(team: TeamState): void {
    this.pie.clear();
    const slices = [
      { share: team.share, color: 0x0072b2 },
      ...team.rivals.map((rival) => ({
        share: rival.share,
        color: rival.id === "payne" ? 0xe69f00 : rival.id === "lakeshore" ? 0xcc79a7 : rival.id === "mahoning" ? 0x009e73 : 0x56b4e9,
      })),
    ];
    let angle = -Math.PI / 2;
    for (const slice of slices) {
      const sweep = (slice.share / 100) * Math.PI * 2;
      this.pie.fillStyle(slice.color, 1);
      this.pie.slice(900, 180, 62, angle, angle + sweep, false);
      this.pie.fillPath();
      angle += sweep;
    }
    this.pie.lineStyle(2, 0xf4efe4, 1);
    this.pie.strokeCircle(900, 180, 62);

    this.chart.clear();
    this.chart.lineStyle(2, 0x5c5346, 1);
    this.chart.strokeRect(800, 280, 440, 100);
    const years = this.state.years;
    const xAt = (year: number) => {
      const span = years[years.length - 1] - years[0];
      return 810 + ((year - years[0]) / span) * 410;
    };
    const yAt = (price: number) => 290 + ((26 - price) / 20) * 80;
    this.chart.lineStyle(2, 0x8a8070, 1);
    this.chart.beginPath();
    this.chart.moveTo(xAt(HISTORICAL_PRICE[0].year), yAt(HISTORICAL_PRICE[0].price));
    this.chart.lineTo(xAt(Math.min(1885, years[years.length - 1])), yAt(8));
    this.chart.strokePath();
    this.chart.lineStyle(3, 0x7ec8e3, 1);
    team.priceHistory.forEach((point, index) => {
      const x = xAt(point.year);
      const y = yAt(point.price);
      if (index === 0) this.chart.beginPath();
      if (index === 0) this.chart.moveTo(x, y);
      else this.chart.lineTo(x, y);
    });
    this.chart.strokePath();

    const scores = scoreTeam(team);
    this.hud.get("price")?.setText(`${team.price}¢  ·  value ${scores.customer}  privilege ${scores.privilege}`);
    this.meters.clear();
    this.bar(800, 430, team.opinion, 0x0072b2);
    this.bar(1020, 430, team.heat, 0xe69f00);
    this.hud.get("opinion")?.setText(`Public opinion ${team.opinion} ${opinionLabel(team.opinion)}`);
    this.hud.get("heat")?.setText(`Political heat ${team.heat} ${heatLabel(team.heat)}`);
    this.hud.get("rivals")?.setText(
      team.rivals
        .map((rival) => `${rival.short} ${rival.alive ? `${rival.share}%  health ${rival.health}` : "SOLD"}`)
        .join("\n"),
    );
  }

  private bar(x: number, y: number, value: number, color: number): void {
    this.meters.fillStyle(0x141a22, 1);
    this.meters.fillRect(x, y, 180, 12);
    this.meters.fillStyle(color, 1);
    this.meters.fillRect(x, y, Math.max(0, Math.min(180, value * 1.8)), 12);
  }

  private paintCards(): void {
    const team = activeTeam(this.state);
    const choosing = this.state.phase === "choose";
    this.slots.forEach((slot, index) => {
      const id = team.hand[index];
      slot.root.setVisible(choosing && Boolean(id));
      if (!id) return;
      const card = cardById(id);
      const selected = index === this.selected;
      slot.kind.setText(card.kind === "efficiency" ? "EFFICIENCY" : "PRIVILEGE");
      slot.kind.setColor(card.kind === "efficiency" ? "#7ec8e3" : "#f0c14a");
      slot.title.setText(card.name);
      slot.body.setText(`${card.summary}\n${card.history}`);
      slot.frame.setFillStyle(card.kind === "efficiency" ? 0x16324a : 0x3a2e14);
      slot.frame.setStrokeStyle(selected ? 6 : 4, card.kind === "efficiency" ? 0x7ec8e3 : 0xf0c14a);
      slot.root.setY(selected ? 536 : 548);
      slot.root.setScale(1, 1);
    });
  }

  private persist(): void {
    writeSave(safeStorage(), this.state);
  }

  private button(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    onClick: () => void,
    parent?: Phaser.GameObjects.Container,
  ): Phaser.GameObjects.Rectangle {
    const box = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0x2a3344).setStrokeStyle(2, 0xf0c14a).setInteractive({ useHandCursor: true });
    const text = this.add.text(x + w / 2, y + h / 2, label, textStyle(16, INK, true)).setOrigin(0.5);
    box.on("pointerup", () => {
      this.audio.play("click");
      onClick();
    });
    parent?.add([box, text]);
    return box;
  }
}

function safeStorage(): Storage | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}
