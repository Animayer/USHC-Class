import Phaser from "phaser";
import { AudioBus } from "../audio/bus";
import { riseApi } from "../game/api";
import { CREAM, COL, display, GOLD, INK, MUTED, serif } from "../game/palette";
import { button, framedPanel, paperPanel } from "../game/ui";
import { DEBRIEF_PROMPTS, HUMAN_COST } from "../logic/debrief";
import { advanceQuiz, createQuiz, pickQuiz, QUIZ } from "../logic/quiz";
import { badgeLabel, type BoardEntry } from "../logic/scoring";
import type { GameState, QuizState } from "../logic/types";

const BOARD_KEY = "rise-dictators-board";

export class EndScene extends Phaser.Scene {
  private audio = new AudioBus();
  private gameState: GameState | null = null;
  private quiz: QuizState = createQuiz();
  private view: "record" | "quiz" = "quiz";
  private built: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super("end");
  }

  create(data: { state?: GameState; quiz?: boolean; shot?: boolean }): void {
    this.gameState = data.state ?? null;
    this.quiz = createQuiz();
    this.view = data.quiz || data.shot || !data.state ? "quiz" : "record";
    riseApi.instant = Boolean(data.shot);
    this.add.rectangle(960, 540, 1920, 1080, COL.bg);
    this.add.rectangle(0, 0, 1920, 64, 0x1a1612).setOrigin(0, 0);
    this.add.text(24, 32, "RISE OF DICTATORS", display(22, GOLD)).setOrigin(0, 0.5);
    const sound = button(this, 1500, 10, 170, 44, this.audio.isMuted ? "Sound off" : "Sound on", () => {
      sound.setLabel(this.audio.toggle() ? "Sound off" : "Sound on");
    }, "quiet");
    button(this, 1688, 10, 200, 44, "Title", () => this.scene.start("title"), "quiet");
    riseApi.act = () => this.act();
    this.draw();
    riseApi.ready = () => true;
  }

  private act(): void {
    if (this.view === "record") {
      this.view = "quiz";
      this.audio.play("paper");
      this.draw();
      return;
    }
    if (this.quiz.done) {
      this.scene.start("title");
      return;
    }
    const question = QUIZ[this.quiz.index];
    if (!this.quiz.showExplain && question) {
      this.audio.unlock();
      this.quiz = pickQuiz(this.quiz, question.answer);
      this.audio.play("correct");
      this.draw();
      return;
    }
    this.quiz = advanceQuiz(this.quiz);
    this.draw();
  }

  private draw(): void {
    for (const obj of this.built) obj.destroy();
    this.built = [];
    if (this.view === "record" && this.gameState) {
      this.drawRecord();
      riseApi.phase = () => "record";
      return;
    }
    if (this.quiz.done) {
      this.drawResults();
      riseApi.phase = () => "quizdone";
      return;
    }
    this.drawQuestion();
    riseApi.phase = () => (this.quiz.showExplain ? "quiz-explain" : "quiz");
  }

  private drawRecord(): void {
    const state = this.gameState;
    if (!state) return;
    this.track(paperPanel(this, 36, 88, 980, 960));
    this.track(this.add.text(72, 118, "THE BATTERY CREEK GAZETTE", display(18, INK)));
    this.track(this.add.text(72, 148, "THE HUMAN COST", display(42, INK)));
    let cursor = 210;
    for (const paragraph of HUMAN_COST) {
      const text = this.add.text(72, cursor, paragraph, { ...serif(22, INK), wordWrap: { width: 900 }, lineSpacing: 4 });
      this.track(text);
      cursor += text.height + 22;
    }
    this.track(this.add.text(72, Math.min(cursor + 8, 860), "Sources: United States Holocaust Memorial Museum; Applebaum, Red Famine; Tokyo tribunal.", {
      ...serif(16, "#5c5146"),
      wordWrap: { width: 900 },
    }));
    const next = button(this, 72, 940, 360, 64, "Begin the exit quiz", () => this.act(), "paper");
    this.track(next.root);

    this.track(framedPanel(this, 1040, 88, 844, 960));
    this.track(this.add.text(1072, 112, "WHAT THE CLASS CARRIES OUT", display(22, GOLD)));
    const ranked = [...state.teams].sort((a, b) => b.insight - a.insight || a.name.localeCompare(b.name));
    this.track(this.add.text(1072, 156, ranked.map((team) => `${team.name}  ${team.insight}`).join("     "), display(22, CREAM)));

    this.track(this.add.text(1072, 210, "BADGES", display(16, GOLD)));
    const badges = state.badges.length > 0 ? state.badges.map((id) => badgeLabel(id)).join("   ·   ") : "None earned on this pass.";
    this.track(this.add.text(1072, 238, badges, { ...serif(18, CREAM), wordWrap: { width: 780 } }));

    this.track(this.add.text(1072, 330, "WHAT-IF, NOT A NEW MAP", display(16, GOLD)));
    const whatIf = state.whatIfs.length > 0 ? state.whatIfs.join(" ") : "No what-if card was played. The map stayed on the historical record.";
    this.track(this.add.text(1072, 358, whatIf, { ...serif(18, CREAM), wordWrap: { width: 780 } }));

    this.track(this.add.text(1072, 500, "CLASS BOARD", display(16, GOLD)));
    const board = readBoard();
    if (board.length === 0) {
      this.track(this.add.text(1072, 528, "No saved scores yet. A finished chronicle posts understanding points here.", {
        ...serif(18, MUTED),
        wordWrap: { width: 780 },
      }));
    } else {
      board.slice(0, 5).forEach((entry, index) => {
        this.track(this.add.text(1072, 528 + index * 32, `${index + 1}.  ${entry.name}   ${entry.insight}   ${entry.mode}`, display(18, CREAM)));
      });
    }

    this.track(this.add.text(1072, 710, "TALK ABOUT", display(16, GOLD)));
    DEBRIEF_PROMPTS.forEach((prompt, index) => {
      this.track(this.add.text(1072, 740 + index * 52, `${index + 1}.  ${prompt}`, { ...serif(16, CREAM), wordWrap: { width: 780 } }));
    });
  }

  private drawQuestion(): void {
    const question = QUIZ[this.quiz.index];
    if (!question) return;
    this.track(paperPanel(this, 220, 96, 1480, 920));
    this.track(this.add.text(960, 128, "THE BATTERY CREEK GAZETTE", display(18, INK)).setOrigin(0.5));
    this.track(this.add.text(960, 162, "EXIT QUIZ", display(18, "#8e3a34")).setOrigin(0.5));
    this.track(this.add.text(270, 200, `Question ${this.quiz.index + 1} of ${QUIZ.length}`, display(28, INK)));
    this.track(this.add.text(1280, 206, `Correct so far: ${this.quiz.correctCount}`, display(22, "#5c5146")).setOrigin(1, 0));
    this.track(this.add.text(270, 250, question.prompt, { ...serif(30, INK), wordWrap: { width: 1380 } }));

    if (this.quiz.showExplain) {
      const correct = this.quiz.picked === question.answer;
      this.track(this.add.text(270, 400, correct ? "That matches the record." : "Not that one. Here is the record.", display(28, "#8e3a34")));
      this.track(this.add.text(270, 460, question.explain, { ...serif(24, INK), wordWrap: { width: 1380 }, lineSpacing: 6 }));
      const next = button(
        this,
        270,
        900,
        320,
        64,
        this.quiz.index === QUIZ.length - 1 ? "See the result" : "Next question",
        () => this.act(),
        "paper",
      );
      this.track(next.root);
      return;
    }

    question.choices.forEach((choice, index) => {
      const made = button(this, 270, 430 + index * 112, 1380, 100, choice, () => {
        this.audio.unlock();
        const before = this.quiz.correctCount;
        this.quiz = pickQuiz(this.quiz, index);
        this.audio.play(this.quiz.correctCount > before ? "correct" : "wrong");
        this.draw();
      }, "paper", 22);
      this.track(made.root);
    });
  }

  private drawResults(): void {
    this.track(framedPanel(this, 260, 120, 1400, 840));
    this.track(this.add.text(960, 180, "QUIZ RESULT", display(22, GOLD)).setOrigin(0.5));
    this.track(this.add.text(960, 250, `${this.quiz.correctCount} of ${QUIZ.length}`, display(72, CREAM)).setOrigin(0.5));
    this.track(this.add.text(960, 330, "The number is understanding. It is not land, and it is not a rank in the war.", {
      ...serif(22, MUTED),
      align: "center",
      wordWrap: { width: 1100 },
    }).setOrigin(0.5, 0));

    const misses = QUIZ.map((question, index) => ({ question, pick: this.quiz.picks[index] ?? -1 })).filter(
      (item) => item.pick !== item.question.answer,
    );
    if (misses.length === 0) {
      this.track(this.add.text(340, 420, "Every answer matched the record. Read the human-cost page once more before you leave.", {
        ...serif(24, CREAM),
        wordWrap: { width: 1240 },
      }));
    } else {
      this.track(this.add.text(340, 400, "Review these before the bell.", display(22, GOLD)));
      misses.slice(0, 4).forEach((item, index) => {
        this.track(this.add.text(340, 450 + index * 88, item.question.prompt, { ...serif(20, CREAM), wordWrap: { width: 1240 } }));
        this.track(this.add.text(340, 484 + index * 88, item.question.explain, { ...serif(16, MUTED), wordWrap: { width: 1240 } }));
      });
    }
    const again = button(this, 340, 860, 280, 64, "Title", () => this.scene.start("title"));
    const retry = button(this, 640, 860, 280, 64, "Retake the quiz", () => {
      this.quiz = createQuiz();
      this.view = "quiz";
      this.draw();
    }, "quiet");
    this.track(again.root);
    this.track(retry.root);
  }

  private track<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.built.push(obj);
    return obj;
  }
}

function readBoard(): BoardEntry[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(BOARD_KEY) || "[]") as BoardEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
