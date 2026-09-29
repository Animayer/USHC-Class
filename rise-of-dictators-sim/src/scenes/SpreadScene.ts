import Phaser from "phaser";
import { AudioBus } from "../audio/bus";
import { riseApi } from "../game/api";
import { CREAM, COL, display, GOLD, MUTED, serif } from "../game/palette";
import { button, framedPanel, meterBar } from "../game/ui";
import { spreadTerritories, WarMap } from "../game/warMap";
import { answerSpread, chooseSpreadDecision, continueSpread, createSpread, currentSpreadStep, jumpSpreadYear, meterFor, REFLECTION_CLOSE, REFLECTIONS, setReflection } from "../logic/spread";
import { SPREAD_TERRITORIES } from "../logic/spread";
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
    this.add.text(360, 32, "A teaching map. The gauge is not a score.", serif(18, MUTED));
    const sound = button(this, 1500, 16, 170, 44, this.audio.isMuted ? "Sound off" : "Sound on", () => {
      sound.setLabel(this.audio.toggle() ? "Sound off" : "Sound on");
    }, "quiet");
    button(this, 1688, 16, 200, 44, "Title", () => this.scene.start("title"), "quiet");
    this.map = new WarMap(this, 20, 80, 1040, 960, 980, 560, spreadTerritories(SPREAD_TERRITORIES));
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
    this.track(framedPanel(this, 1080, 80, 812, 960));
    const year = this.track(this.add.text(1112, 100, step.yearLabel, display(56, CREAM)));
    const title = this.track(this.add.text(1112, year.y + year.height + 4, step.title, { ...display(26, GOLD), wordWrap: { width: 740 } }));
    let cursor = title.y + title.height + 12;
    this.track(this.add.text(1112, cursor, `Nazi-ruled reach on this map: ${meter}`, display(20, CREAM)));
    cursor += 32;
    this.track(meterBar(this, 1112, cursor, 740, 24, meter));
    cursor += 36;
    this.track(this.add.text(1112, cursor, "Olive is an Axis partner and is not added. Insight is the score.", serif(16, MUTED)));
    cursor += 28;
    this.track(this.add.text(1112, cursor, `Insight ${this.state.insight}    Streak ${this.state.streak}`, display(20, GOLD)));
    cursor += 36;
    const fact = this.track(this.add.text(1112, cursor, step.fact, { ...serif(18, CREAM), wordWrap: { width: 740 }, lineSpacing: 2 }));
    cursor += fact.height + 10;
    const source = this.track(this.add.text(1112, cursor, step.source, { ...serif(15, MUTED), wordWrap: { width: 740 } }));
    cursor = Math.max(source.y + source.height + 16, 640);

    if (this.state.phase === "feedback") {
      this.track(this.add.text(1112, cursor, "The record", display(22, GOLD)));
      this.track(this.add.text(1112, cursor + 36, this.state.feedback, { ...serif(20, CREAM), wordWrap: { width: 740 } }));
      const next = button(this, 1112, 960, 280, 56, "Next year", () => this.act());
      this.track(next.root);
    } else {
      const prompt = this.track(this.add.text(1112, cursor, step.decisionPrompt, { ...serif(18, CREAM), wordWrap: { width: 740 } }));
      let row = prompt.y + prompt.height + 12;
      step.decisions.forEach((item) => {
        const made = button(this, 1112, row, 740, 52, item.label, () => {
          this.audio.unlock();
          this.audio.play("click");
          this.state = chooseSpreadDecision(this.state, item.id);
          this.refresh();
        }, this.state.decisionId === item.id ? "gold" : "quiet", 20);
        this.track(made.root);
        row += 60;
      });
      const check = this.track(this.add.text(1112, Math.min(row + 8, 900), step.check.prompt, { ...serif(18, GOLD), wordWrap: { width: 740 } }));
      const choiceY = Math.min(check.y + check.height + 12, 968);
      const choice = button(this, 1112, choiceY, 400, 52, this.state.decisionId ? "Answer the check" : "Choose a reading first", () => this.openCheck(), this.state.decisionId ? "paper" : "quiet", 20);
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
