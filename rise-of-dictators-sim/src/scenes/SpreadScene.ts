import Phaser from "phaser";
import { AudioBus } from "../audio/bus";
import { riseApi } from "../game/api";
import { CREAM, COL, display, GOLD, MUTED, serif } from "../game/palette";
import { button, chip, framedPanel, meterBar } from "../game/ui";
import { WarMap } from "../game/warMap";
import { answerSpread, chooseSpreadDecision, continueSpread, createSpread, currentSpreadStep, jumpSpreadYear, meterFor, REFLECTION_CLOSE, REFLECTIONS, setReflection } from "../logic/spread";
import type { Length, SpreadState } from "../logic/types";

export class SpreadScene extends Phaser.Scene {
  private audio = new AudioBus();
  private state!: SpreadState;
  private map!: WarMap;
  private built: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super("spread");
  }

  create(data: { length?: Length; year?: number; shot?: boolean }): void {
    const length = data.length ?? "full";
    this.state = createSpread(length);
    if (data.year) this.state = jumpSpreadYear(this.state, data.year);
    riseApi.instant = Boolean(data.shot);
    this.add.rectangle(960, 540, 1920, 1080, COL.bg);
    this.add.text(28, 28, "HITLER’S SPREAD", display(28, GOLD));
    this.add.text(360, 34, "A teaching map. The gauge is not a score.", serif(22, MUTED));
    const sound = button(this, 1500, 16, 170, 44, this.audio.isMuted ? "Sound off" : "Sound on", () => {
      sound.setLabel(this.audio.toggle() ? "Sound off" : "Sound on");
    }, "quiet");
    button(this, 1688, 16, 200, 44, "Title", () => this.scene.start("title"), "quiet");
    this.map = new WarMap(this, 16, 72, 1048, 860, "spread");
    const legend: [number, string][] = [
      [0x8e3a34, "Nazi rule"],
      [0x6e3a48, "Invaded"],
      [0x6a6b38, "Axis partner"],
      [0x2c5d86, "Allied"],
      [0xc6b48c, "Neutral"],
      [0x3d6e62, "Freed"],
      [0x7a3050, "Soviet"],
      [0x8a7a62, "1945 occupation"],
    ];
    legend.forEach((item, index) => {
      const col = index % 4;
      const row = Math.floor(index / 4);
      chip(this, 28 + col * 260, 944 + row * 42, item[0], item[1]);
    });
    riseApi.act = () => this.act();
    riseApi.phase = () => (this.state.phase === "play" ? "spread" : this.state.phase === "done" ? "spread-done" : "spread");
    this.refresh();
    riseApi.ready = () => true;
  }

  private act(): void {
    const step = currentSpreadStep(this.state);
    if (this.state.phase === "play") {
      if (!this.state.decisionId) {
        const historical = step.decisions.find((item) => item.historical) ?? step.decisions[0];
        this.state = chooseSpreadDecision(this.state, historical.id);
        this.refresh();
        return;
      }
      this.state = answerSpread(this.state, step.check.answer);
      this.refresh();
      return;
    }
    if (this.state.phase === "feedback") {
      this.state = continueSpread(this.state);
      this.refresh();
      return;
    }
    if (this.state.phase === "reflect") {
      for (const item of REFLECTIONS) {
        if (!this.state.reflect[item.id]) this.state = setReflection(this.state, item.id, item.answer);
      }
      this.state = continueSpread(this.state);
      this.refresh();
      return;
    }
    if (this.state.phase === "done") this.scene.start("end", { quiz: true });
  }

  private refresh(): void {
    for (const obj of this.built) obj.destroy();
    this.built = [];
    if (this.state.phase === "reflect" || this.state.phase === "done") {
      this.drawReflect();
      riseApi.phase = () => (this.state.phase === "done" ? "spread-done" : "reflect");
      return;
    }
    const step = currentSpreadStep(this.state);
    this.map.showTones(step.tones);
    const meter = meterFor(step.tones);
    this.track(framedPanel(this, 1080, 72, 816, 992));
    const year = this.track(this.add.text(1108, 88, step.yearLabel, display(52, CREAM)));
    const title = this.track(this.add.text(1108, year.y + year.height + 2, step.title, { ...display(30, GOLD), wordWrap: { width: 760 } }));
    let cursor = title.y + title.height + 8;
    this.track(this.add.text(1108, cursor, `Nazi-ruled reach on this map: ${meter}`, display(24, CREAM)));
    cursor += 34;
    this.track(meterBar(this, 1108, cursor, 760, 26, meter));
    cursor += 38;
    this.track(this.add.text(1108, cursor, "Olive is an Axis partner and is not added. Insight is the score.", { ...serif(24, MUTED), wordWrap: { width: 760 } }));
    cursor += 36;
    this.track(this.add.text(1108, cursor, `Insight ${this.state.insight}    Streak ${this.state.streak}`, display(24, GOLD)));
    cursor += 36;
    const fact = this.track(this.add.text(1108, cursor, step.fact, { ...serif(24, CREAM), wordWrap: { width: 760 }, lineSpacing: 2 }));
    cursor += fact.height + 8;
    const source = this.track(this.add.text(1108, cursor, step.source, { ...serif(22, MUTED), wordWrap: { width: 760 } }));
    cursor = source.y + source.height + 12;

    if (this.state.phase === "feedback") {
      this.track(this.add.text(1108, cursor, "The record", display(26, GOLD)));
      this.track(this.add.text(1108, cursor + 38, this.state.feedback, { ...serif(24, CREAM), wordWrap: { width: 760 } }));
      const next = button(this, 1108, 980, 300, 60, "Next year", () => this.act(), "gold", 24);
      this.track(next.root);
    } else {
      const prompt = this.track(this.add.text(1108, cursor, step.decisionPrompt, { ...serif(24, CREAM), wordWrap: { width: 760 } }));
      let row = prompt.y + prompt.height + 10;
      step.decisions.forEach((item) => {
        const made = button(this, 1108, row, 760, 58, item.label, () => {
          this.audio.unlock();
          this.audio.play("click");
          this.state = chooseSpreadDecision(this.state, item.id);
          this.refresh();
        }, this.state.decisionId === item.id ? "gold" : "quiet", 24);
        this.track(made.root);
        row += 66;
      });
      const check = this.track(this.add.text(1108, row + 6, step.check.prompt, { ...serif(24, GOLD), wordWrap: { width: 760 } }));
      const choiceY = Math.min(check.y + check.height + 10, 980);
      const choice = button(this, 1108, choiceY, 460, 58, this.state.decisionId ? "Answer the check" : "Choose a reading first", () => this.openCheck(), this.state.decisionId ? "paper" : "quiet", 24);
      this.track(choice.root);
    }
    riseApi.phase = () => "spread";
  }

  private openCheck(): void {
    if (!this.state.decisionId || this.state.phase !== "play") return;
    const step = currentSpreadStep(this.state);
    const dim = this.add.rectangle(960, 540, 1920, 1080, 0x000000, 0.72).setInteractive();
    const panel = framedPanel(this, 360, 160, 1200, 760);
    const title = this.add.text(420, 200, "CHECK", display(28, GOLD));
    const prompt = this.add.text(420, 250, step.check.prompt, { ...serif(28, CREAM), wordWrap: { width: 1080 } });
    this.track(dim);
    this.track(panel);
    this.track(title);
    this.track(prompt);
    step.check.choices.forEach((choice, index) => {
      const made = button(this, 420, 380 + index * 90, 1080, 76, choice, () => {
        this.audio.unlock();
        this.state = answerSpread(this.state, index);
        this.audio.play(this.state.choice === step.check.answer ? "correct" : "wrong");
        this.refresh();
      }, "paper");
      this.track(made.root);
    });
  }

  private drawReflect(): void {
    this.track(framedPanel(this, 180, 70, 1560, 940));
    this.track(this.add.text(230, 100, "WHAT COULD HAVE STOPPED HIM?", display(40, GOLD)));
    this.track(this.add.text(230, 160, "Sort each claim. This is not a fantasy in which the class wins the war.", {
      ...serif(22, CREAM),
      wordWrap: { width: 1400 },
    }));
    if (this.state.phase === "done") {
      REFLECTIONS.forEach((item, index) => {
        const y = 230 + index * 130;
        this.track(this.add.text(230, y, item.text, { ...serif(20, CREAM), wordWrap: { width: 1400 } }));
        this.track(this.add.text(230, y + 56, item.reveal, { ...serif(18, GOLD), wordWrap: { width: 1400 } }));
      });
      this.track(this.add.text(230, 780, REFLECTION_CLOSE, { ...serif(20, CREAM), wordWrap: { width: 1400 } }));
      this.track(this.add.text(230, 860, `Insight ${this.state.insight}`, display(28, GOLD)));
      const quiz = button(this, 230, 920, 280, 60, "Exit quiz", () => this.scene.start("end", { quiz: true }));
      const title = button(this, 530, 920, 200, 60, "Title", () => this.scene.start("title"), "quiet");
      this.track(quiz.root);
      this.track(title.root);
      return;
    }
    REFLECTIONS.forEach((item, index) => {
      const y = 240 + index * 150;
      this.track(this.add.text(230, y, item.text, { ...serif(22, CREAM), wordWrap: { width: 1100 } }));
      const serious = button(this, 1360, y, 280, 52, "A real chance", () => {
        this.state = setReflection(this.state, item.id, "serious");
        this.refresh();
      }, this.state.reflect[item.id] === "serious" ? "gold" : "quiet");
      const hard = button(this, 1360, y + 60, 280, 52, "Not that simple", () => {
        this.state = setReflection(this.state, item.id, "complicated");
        this.refresh();
      }, this.state.reflect[item.id] === "complicated" ? "gold" : "quiet");
      this.track(serious.root);
      this.track(hard.root);
    });
    const ready = REFLECTIONS.every((item) => this.state.reflect[item.id]);
    const done = button(this, 230, 900, 360, 64, ready ? "Show the historian’s note" : "Choose all four", () => {
      if (!ready) return;
      this.state = continueSpread(this.state);
      this.refresh();
    });
    this.track(done.root);
  }

  update(time: number): void {
    this.map?.update(time);
  }

  private track<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.built.push(obj);
    return obj;
  }
}
