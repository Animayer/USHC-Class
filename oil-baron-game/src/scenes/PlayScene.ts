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

  private pieShown: number[] = [];
  private pieTarget: number[] = [];
  private bursts: Phaser.GameObjects.Arc[] = [];
  private onKey!: (event: KeyboardEvent) => void;

  init(data: { state?: GameState }): void {
    const state = data.state ?? oilApi.pending;
    if (!state) {
      this.scene.start("title");
      return;
    }
    this.state = state;
    oilApi.pending = null;
  }

  create(): void {
    if (!this.state) return;
    this.slots = [];
    this.hud = new Map();
    this.selected = 0;
    this.paused = false;
    this.timerLeft = this.state.timerSeconds;
    this.timerAcc = 0;
    this.bursts = [];
    this.pieShown = [];
    this.pieTarget = [];
    oilApi.phase = () => this.state.phase;
    oilApi.startSoloShort = () => undefined;
    oilApi.startSoloFull = () => undefined;
    oilApi.act = () => {
      if (!this.state) return;
      if (this.state.phase === "choose") this.confirmPlay();
      else if (this.state.phase === "event" || this.state.phase === "epilogue") this.continueEvent();
    };
    this.add.rectangle(640, 400, 1280, 800, 0x1a2430);
    this.map = new OilMap(this, 8, 48);
    this.map.root.setScale(0.74);
    this.pie = this.add.graphics().setDepth(6);
    this.chart = this.add.graphics().setDepth(6);
    this.meters = this.add.graphics().setDepth(6);
    this.buildHud();
    this.buildCards();
    this.buildEvent();
    this.buildTeacher();
    this.buildPause();
    this.bindKeys();
    this.events.once("shutdown", () => {
      this.input.keyboard?.off("keydown", this.onKey);
      this.keysBound = false;
    });
    this.audio.unlock();
    this.refresh();
    this.persist();
  }

  update(time: number, delta: number): void {
    if (!this.state || this.paused) return;
    this.map.update(time, delta);
    this.animatePie();
    this.bursts = this.bursts.filter((bit) => {
      bit.y -= delta * 0.05;
      bit.alpha -= delta / 700;
      if (bit.alpha <= 0) {
        bit.destroy();
        return false;
      }
      return true;
    });
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

    this.add.rectangle(940, 214, 650, 330, PANEL).setStrokeStyle(2, 0x3d4a5c).setDepth(4);
    this.add.text(630, 56, "Market share", textStyle(16, GOLD, true)).setDepth(7);
    this.add.text(860, 56, "Kerosene ¢/gal", textStyle(16, GOLD, true)).setDepth(7);
    this.hud.set("price", this.add.text(1040, 56, "", textStyle(16, INK, true)).setDepth(7));
    this.hud.set("opinion", this.add.text(630, 250, "", textStyle(14, INK)).setDepth(7));
    this.hud.set("heat", this.add.text(960, 250, "", textStyle(14, INK)).setDepth(7));
    this.hud.set("rivals", this.add.text(630, 292, "", { ...textStyle(14, MUTED), lineSpacing: 3 }).setDepth(7));
    this.hud.set("timer", this.add.text(630, 48, "", textStyle(14, BLUE)).setDepth(7));
    this.add.text(16, 400, "Play one card", textStyle(18, GOLD, true));
    this.hud.set("hint", this.add.text(180, 404, "1–3 select · Enter plays · Blue cuts the lamp bill · Amber asks for a favor", textStyle(14, MUTED)));
  }

  private buildCards(): void {
    for (let index = 0; index < 3; index += 1) {
      const x = 16 + index * 420;
      const root = this.add.container(x, 432);
      const frame = this.add.rectangle(200, 170, 404, 340, 0x243044).setStrokeStyle(4, 0x0072b2);
      const kind = this.add.text(16, 12, "", textStyle(14, GOLD, true));
      const title = this.add.text(16, 36, "", { ...textStyle(20, INK, true), wordWrap: { width: 370 } });
      const body = this.add.text(16, 92, "", { ...textStyle(15, INK), wordWrap: { width: 370 }, lineSpacing: 3 });
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
    this.onKey = (event: KeyboardEvent) => {
      if (!this.state) return;
      if (event.key === "m" || event.key === "M") {
        const muted = this.audio.toggle();
        this.hud.get("sound")?.setText(muted ? "Sound off" : "Sound on");
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
    };
    this.input.keyboard?.on("keydown", this.onKey);
  }

  private confirmPlay(): void {
    if (this.state.phase !== "choose") return;
    const id = activeTeam(this.state).hand[this.selected] ?? activeTeam(this.state).hand[0];
    if (!id) return;
    const card = cardById(id);
    this.state = playCard(this.state, id);
    this.audio.play(card.kind === "privilege" ? "bad" : "card");
    if (card.buyout || card.squeeze || this.state.event?.severity === "major") {
      this.cameras.main.shake(260, 0.006);
      this.burst(640, 360);
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
    const slices = [
      team.share,
      ...team.rivals.map((rival) => rival.share),
    ];
    if (this.pieShown.length !== slices.length) this.pieShown = slices.slice();
    this.pieTarget = slices;
    this.drawPie(this.pieShown);
    this.drawChart(team);

    const scores = scoreTeam(team);
    this.hud.get("price")?.setText(`${team.price}¢  ·  value ${scores.customer}  privilege ${scores.privilege}`);
    this.meters.clear();
    this.bar(630, 274, team.opinion, 0x0072b2);
    this.bar(960, 274, team.heat, 0xe69f00);
    this.hud.get("opinion")?.setText(`Public opinion ${team.opinion} ${opinionLabel(team.opinion)}`);
    this.hud.get("heat")?.setText(`Political heat ${team.heat} ${heatLabel(team.heat)}`);
    this.hud.get("rivals")?.setText(
      team.rivals
        .map((rival) => `${rival.short} ${rival.alive ? `${rival.share}%  health ${rival.health}` : "SOLD"}`)
        .join("\n"),
    );
  }

  private drawPie(shares: number[]): void {
    const colors = [0x0072b2, 0xe69f00, 0xcc79a7, 0x009e73, 0x56b4e9];
    const cx = 720;
    const cy = 160;
    const radius = 58;
    this.pie.clear();
    this.pie.fillStyle(0x141a22, 1);
    this.pie.fillCircle(cx, cy, radius + 4);
    let angle = -Math.PI / 2;
    const total = shares.reduce((sum, share) => sum + share, 0) || 1;
    shares.forEach((share, index) => {
      const sweep = (share / total) * Math.PI * 2;
      const steps = Math.max(1, Math.ceil(sweep / 0.35));
      this.pie.fillStyle(colors[index] ?? 0xffffff, 1);
      for (let step = 0; step < steps; step += 1) {
        const a0 = angle + (sweep * step) / steps;
        const a1 = angle + (sweep * (step + 1)) / steps;
        this.pie.fillTriangle(cx, cy, cx + Math.cos(a0) * radius, cy + Math.sin(a0) * radius, cx + Math.cos(a1) * radius, cy + Math.sin(a1) * radius);
      }
      angle += sweep;
    });
  }

  private animatePie(): void {
    if (this.pieTarget.length === 0) return;
    let moving = false;
    this.pieShown = this.pieShown.map((value, index) => {
      const target = this.pieTarget[index] ?? value;
      const next = value + (target - value) * 0.15;
      if (Math.abs(target - next) > 0.2) moving = true;
      return Math.abs(target - next) <= 0.2 ? target : next;
    });
    if (moving) this.drawPie(this.pieShown);
  }

  private drawChart(team: TeamState): void {
    this.chart.clear();
    this.chart.fillStyle(0x141a22, 1);
    this.chart.fillRect(860, 86, 400, 140);
    const years = this.state.years;
    const span = Math.max(1, years[years.length - 1] - years[0]);
    const xAt = (year: number) => 870 + ((year - years[0]) / span) * 370;
    const yAt = (price: number) => 96 + ((26 - price) / 22) * 110;
    const segment = (x0: number, y0: number, x1: number, y1: number, color: number) => {
      const steps = 12;
      for (let step = 0; step < steps; step += 1) {
        const t0 = step / steps;
        const t1 = (step + 1) / steps;
        this.chart.fillStyle(color, 1);
        this.chart.fillCircle(x0 + (x1 - x0) * t0, y0 + (y1 - y0) * t0, 2);
        this.chart.fillRect(x0 + (x1 - x0) * t0, y0 + (y1 - y0) * t1, Math.max(2, (x1 - x0) / steps), 2);
      }
    };
    segment(xAt(HISTORICAL_PRICE[0].year), yAt(HISTORICAL_PRICE[0].price), xAt(Math.min(1885, years[years.length - 1])), yAt(8), 0x8a8070);
    const points = team.priceHistory;
    points.forEach((point, index) => {
      const x = xAt(point.year);
      const y = yAt(point.price);
      this.chart.fillStyle(0x7ec8e3, 1);
      this.chart.fillCircle(x, y, 4);
      if (index > 0) {
        const prev = points[index - 1];
        segment(xAt(prev.year), yAt(prev.price), x, y, 0x7ec8e3);
      }
    });
  }

  private burst(x: number, y: number): void {
    for (let i = 0; i < 14; i += 1) {
      const bit = this.add.circle(x + (i - 7) * 10, y, 5, i % 2 === 0 ? 0xf0c14a : 0x7ec8e3, 0.9).setDepth(12);
      bit.setData("vx", (i - 7) * 0.4);
      this.bursts.push(bit);
    }
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
      slot.root.setY(selected ? 424 : 432);
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
