import Phaser from "phaser";
import { AudioBus } from "../audio/bus";
import { riseApi } from "../game/api";
import { CREAM, COL, display, FACTION, GOLD, LEGEND, MUTED, serif } from "../game/palette";
import { portraitKey } from "../game/portraits";
import { button, die, framedPanel, paperPanel } from "../game/ui";
import { WarMap, worldTerritories } from "../game/warMap";
import { autoAdvance, createGame, currentCards, currentEra, dismiss, playCard, answerQuestion, skipToDebrief, solemnNow, toggleNotes, visibleSnapshot } from "../logic/engine";
import { addBoard, type BoardEntry } from "../logic/scoring";
import { ROLES } from "../logic/roles";
import { TERRITORIES } from "../logic/territories";
import type { CardDef, GameState } from "../logic/types";

const BOARD_KEY = "rise-dictators-board";
const TUTORIAL_KEY = "rise-dictators-tutorial";

export class PlayScene extends Phaser.Scene {
  private audio = new AudioBus();
  private state!: GameState;
  private map!: WarMap;
  private yearText!: Phaser.GameObjects.Text;
  private eraText!: Phaser.GameObjects.Text;
  private notesText!: Phaser.GameObjects.Text;
  private built: Phaser.GameObjects.GameObject[] = [];
  private notePage = 0;
  private tutorial = false;
  private savedBoard = false;
  private teacherOpen = false;
  private shot = "";
  private lastSound = "";
  private held = new Map<string, string>();
  private diceTimer: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super("play");
  }

  create(data: { state?: GameState; shot?: string }): void {
    this.shot = data.shot ?? "";
    this.savedBoard = false;
    this.teacherOpen = false;
    this.notePage = 0;
    this.tutorial = false;
    riseApi.instant = Boolean(this.shot);
    this.state = this.stateForShot(data.state);
    this.add.rectangle(960, 540, 1920, 1080, COL.bg);
    this.add.rectangle(0, 0, 1920, 64, 0x1a1612).setOrigin(0, 0);
    this.add.text(24, 32, "RISE OF DICTATORS", display(22, GOLD)).setOrigin(0, 0.5);
    this.yearText = this.add.text(430, 32, "", display(32, CREAM)).setOrigin(0, 0.5);
    this.eraText = this.add.text(620, 32, "", display(22, MUTED)).setOrigin(0, 0.5);
    const notes = button(this, 1280, 10, 150, 44, "Notes", () => this.flipNotes(), "quiet");
    this.notesText = notes.label;
    const sound = button(this, 1444, 10, 160, 44, this.audio.isMuted ? "Sound off" : "Sound on", () => {
      const muted = this.audio.toggle();
      sound.setLabel(muted ? "Sound off" : "Sound on");
    }, "quiet");
    button(this, 1620, 10, 270, 44, "Teacher", () => this.toggleTeacher(), "quiet");

    this.map = new WarMap(this, 24, 76, 1872, 520, 1200, 450, worldTerritories(TERRITORIES));
    let legendX = 36;
    for (const faction of LEGEND) {
      const style = FACTION[faction];
      const g = this.add.graphics();
      g.fillStyle(style.fill, 1);
      g.fillRoundedRect(legendX, 608, 16, 16, 3);
      const label = this.add.text(legendX + 22, 616, style.label, display(15, CREAM)).setOrigin(0, 0.5);
      legendX += label.width + 48;
    }

    this.input.keyboard?.on("keydown", this.onKey, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    riseApi.act = () => this.act();
    if (!this.shot && !this.seenTutorial()) this.tutorial = true;
    this.refresh();
    riseApi.ready = () => true;
  }

  shutdown(): void {
    this.diceTimer?.remove();
    this.input.keyboard?.off("keydown", this.onKey, this);
  }

  update(time: number): void {
    this.map?.update(time);
  }

  private stateForShot(passed?: GameState): GameState {
    if (passed) return passed;
    const base = createGame({
      mode: "teams",
      names: ["Allies", "Analysts", "Axis Desk"],
      length: "full",
      seed: 7,
    });
    if (this.shot === "headline") return base;
    if (this.shot === "map") {
      let state = base;
      for (let guard = 0; guard < 80 && !(currentEra(state).id === "war" && state.phase === "decide"); guard += 1) {
        state = autoAdvance(state);
      }
      return state;
    }
    if (this.shot === "battle") {
      let state = base;
      for (let guard = 0; guard < 120 && state.phase !== "battle"; guard += 1) state = autoAdvance(state);
      return state;
    }
    return createGame({ mode: "solo", names: ["You"], length: "quick", seed: 3 });
  }

  private seenTutorial(): boolean {
    try {
      return localStorage.getItem(TUTORIAL_KEY) === "1";
    } catch {
      return true;
    }
  }

  private onKey = (event: KeyboardEvent): void => {
    if (event.key === "m" || event.key === "M") this.audio.toggle();
    if (event.key === "t" || event.key === "T") this.toggleTeacher();
    if (event.key === "n" || event.key === "N") this.flipNotes();
    if (event.key === "Escape") this.teacherOpen = false;
    if (event.key === "Enter" || event.key === " ") {
      this.act();
      return;
    }
    if (event.key === "1" || event.key === "2") {
      if (this.state.phase === "decide") {
        const cards = currentCards(this.state);
        const card = cards[Number(event.key) - 1];
        if (card) this.choose(card);
      }
    }
  };

  private act(): void {
    if (this.tutorial) {
      this.tutorial = false;
      try {
        localStorage.setItem(TUTORIAL_KEY, "1");
      } catch {
        /* ignore */
      }
      this.refresh();
      return;
    }
    if (this.teacherOpen) {
      this.teacherOpen = false;
      this.refresh();
      return;
    }
    if (this.state.phase === "debrief") {
      this.scene.start("end", { state: this.state });
      return;
    }
    if (this.state.phase === "decide") {
      const card = currentCards(this.state).find((item) => item.insight) ?? currentCards(this.state)[0];
      this.choose(card);
      return;
    }
    if (this.state.phase === "question") {
      this.pick(currentEra(this.state).question.answer);
      return;
    }
    if (this.state.phase === "note") {
      const pages = currentEra(this.state).pages;
      if (this.notePage < pages.length - 1) {
        this.notePage += 1;
        this.refresh();
        return;
      }
      this.notePage = 0;
    }
    const before = this.state.phase;
    this.state = dismiss(this.state);
    if (this.state.phase === "battle" && before !== "battle" && !riseApi.instant) {
      this.cameras.main.shake(180, 0.004);
      this.audio.play("dice");
    }
    if (before === "headline" && this.state.phase === "decide") this.audio.play("era");
    if (this.state.phase === "debrief") this.remember();
    this.refresh();
  }

  private choose(card: CardDef): void {
    this.audio.unlock();
    this.audio.play(card.insight ? "correct" : "wrong");
    if (card.insight) this.burst(1400, 860);
    this.state = playCard(this.state, card.id);
    this.refresh();
  }

  private burst(x: number, y: number): void {
    if (riseApi.instant) return;
    for (let index = 0; index < 12; index += 1) {
      const mote = this.add.rectangle(x, y, 7, 7, index % 2 === 0 ? 0xd4b15a : 0xf3ead7);
      this.tweens.add({
        targets: mote,
        x: x + (Math.random() - 0.5) * 220,
        y: y - 30 - Math.random() * 140,
        alpha: 0,
        duration: 520,
        onComplete: () => mote.destroy(),
      });
    }
  }

  private pick(choice: number): void {
    this.audio.unlock();
    const correct = choice === currentEra(this.state).question.answer;
    this.audio.play(correct ? "correct" : "wrong");
    this.state = answerQuestion(this.state, choice);
    if (this.state.phase === "battle" && !riseApi.instant) this.cameras.main.shake(160, 0.003);
    this.refresh();
  }

  private flipNotes(): void {
    this.state = toggleNotes(this.state);
    this.refresh();
  }

  private toggleTeacher(): void {
    this.teacherOpen = !this.teacherOpen;
    this.refresh();
  }

  private refresh(): void {
    const era = currentEra(this.state);
    if (this.state.phase !== "headline" && this.state.phase !== "solemn") this.lastSound = "";
    if (this.yearText.text !== era.ticker) {
      this.yearText.setText(era.ticker);
      if (!riseApi.instant && this.yearText.text.length > 0) {
        this.tweens.add({ targets: this.yearText, scale: 1.12, duration: 140, yoyo: true });
      }
    }
    this.eraText.setText(`${era.name}   ·   ${era.startYear}–${era.endYear}`);
    this.notesText.setText(this.state.notesOn ? "Notes on" : "Notes off");
    const snapshot = visibleSnapshot(this.state);
    const changed: string[] = [];
    for (const [id, hold] of Object.entries(snapshot)) {
      const previous = this.held.get(id);
      if (previous && previous !== hold.faction) changed.push(id);
      this.held.set(id, hold.faction);
    }
    this.map.showHolds(snapshot);
    if (changed.length > 0 && !riseApi.instant) this.map.flash(changed);
    if (this.state.phase === "battle" && era.battle) this.map.highlight([era.battle.fromId, era.battle.toId]);
    for (const obj of this.built) obj.destroy();
    this.built = [];
    const covering =
      this.state.phase === "headline" ||
      this.state.phase === "solemn" ||
      this.state.phase === "battle" ||
      this.tutorial ||
      this.teacherOpen;
    if (!covering) this.drawDock();
    // The tutorial sits alone on top; the headline or record panel waits underneath it.
    if (this.state.phase === "headline" && !this.tutorial) this.drawHeadline();
    if (this.state.phase === "solemn" && !this.tutorial) this.drawSolemn();
    if (this.state.phase === "battle" && !this.tutorial) this.drawBattle();
    if (this.teacherOpen) this.drawTeacher();
    if (this.tutorial) this.drawTutorial();
    riseApi.phase = () => (this.tutorial ? "tutorial" : this.teacherOpen ? "teacher" : this.state.phase);
    if (this.state.phase === "debrief") this.remember();
  }

  private track<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.built.push(obj);
    return obj;
  }

  private sealModal(start: number): void {
    for (let index = start; index < this.built.length; index += 1) {
      const obj = this.built[index] as Phaser.GameObjects.GameObject & { setDepth?: (value: number) => void };
      obj.setDepth?.(46);
    }
  }

  private drawDock(): void {
    const y = 640;
    this.track(framedPanel(this, 20, y, 900, 420));
    this.track(this.add.text(44, y + 16, "CAUSE  →  EFFECT", display(18, GOLD)));
    const lines = this.state.log.slice(-4);
    lines.forEach((line, index) => {
      this.track(this.add.text(44, y + 52 + index * 88, line.year, display(16, GOLD)));
      this.track(this.add.text(120, y + 48 + index * 88, line.text, { ...serif(18, CREAM), wordWrap: { width: 760 } }));
    });

    this.track(framedPanel(this, 940, y, 960, 420));
    const team = this.state.teams[this.state.activeTeam];
    const role = ROLES[team.role];
    this.track(this.add.text(968, y + 16, team.name.toUpperCase(), display(28, team.color)));
    this.track(this.add.text(968, y + 52, `${role.name}  ·  Insight ${team.insight}`, display(18, MUTED)));
    this.track(this.add.text(968, y + 78, role.objective, { ...serif(18, CREAM), wordWrap: { width: 900 } }));
    const scores = this.state.teams.map((item) => `${item.name} ${item.insight}`).join("    ");
    this.track(this.add.text(968, y + 112, scores, display(16, MUTED)));

    if (this.state.phase === "decide") this.drawCards(y);
    else if (this.state.phase === "verdict" && this.state.verdict) this.drawVerdict(y);
    else if (this.state.phase === "question" || this.state.phase === "explain") this.drawQuestion(y);
    else if (this.state.phase === "note") this.drawNote(y);
    else if (this.state.phase === "debrief") this.drawDebriefPrompt(y);
    else this.track(this.add.text(968, y + 180, "The headline is the turn. Read it, then continue.", serif(22, CREAM)));
  }

  private drawCards(y: number): void {
    const cards = currentCards(this.state);
    cards.forEach((card, index) => {
      const x = 968 + index * 450;
      this.cardFace(x, y + 150, 430, 230, card, () => this.choose(card));
    });
  }

  private cardFace(x: number, y: number, w: number, h: number, card: CardDef, onClick: () => void): void {
    const root = this.add.container(x, y);
    const g = this.add.graphics();
    const draw = (hot: boolean) => {
      g.clear();
      g.fillStyle(hot ? 0x3a2e22 : 0x241c14, 1);
      g.fillRoundedRect(0, 0, w, h, 10);
      g.lineStyle(2, COL.gold, 1);
      g.strokeRoundedRect(1, 1, w - 2, h - 2, 10);
    };
    draw(false);
    const kind = this.add.text(16, 12, card.kind.toUpperCase(), display(14, GOLD));
    const title = this.add.text(16, 36, card.title, display(24, CREAM));
    const body = this.add.text(16, 78, card.claim, { ...serif(18, CREAM), wordWrap: { width: w - 32 } });
    root.add([g, kind, title, body]);
    root.setSize(w, h);
    root.setInteractive(new Phaser.Geom.Rectangle(w / 2, h / 2, w, h), Phaser.Geom.Rectangle.Contains);
    if (root.input) root.input.cursor = "pointer";
    root.on("pointerover", () => draw(true));
    root.on("pointerout", () => draw(false));
    root.on("pointerup", onClick);
    this.track(root);
  }

  private drawVerdict(y: number): void {
    const verdict = this.state.verdict;
    if (!verdict) return;
    this.track(this.add.text(968, y + 160, verdict.insight ? "ON THE RECORD" : "INCOMPLETE", display(22, verdict.insight ? GOLD : "#d08a72")));
    this.track(this.add.text(968, y + 200, verdict.title, display(28, CREAM)));
    this.track(this.add.text(968, y + 246, verdict.text, { ...serif(22, CREAM), wordWrap: { width: 880 } }));
    const next = button(this, 968, y + 360, 240, 56, "Continue", () => this.act());
    this.track(next.root);
  }

  private drawQuestion(y: number): void {
    const era = currentEra(this.state);
    this.track(this.add.text(968, y + 146, era.question.prompt, { ...serif(22, CREAM), wordWrap: { width: 900 } }));
    if (this.state.phase === "explain" && this.state.answer) {
      const answer = this.state.answer;
      this.track(this.add.text(968, y + 230, answer.correct ? "Yes. That matches the record." : "Not that one. Here is the record.", display(22, GOLD)));
      this.track(this.add.text(968, y + 268, answer.explain, { ...serif(20, CREAM), wordWrap: { width: 880 } }));
      const next = button(this, 968, y + 360, 240, 56, "Continue", () => this.act());
      this.track(next.root);
      return;
    }
    era.question.choices.forEach((choice, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const made = button(this, 968 + col * 460, y + 230 + row * 86, 440, 78, choice, () => this.pick(index), "paper", 18);
      this.track(made.root);
    });
  }

  private drawNote(y: number): void {
    const era = currentEra(this.state);
    const page = era.pages[this.notePage] ?? era.pages[0];
    this.track(this.add.text(968, y + 150, "HISTORY NOTES", display(18, GOLD)));
    this.track(this.add.text(968, y + 182, page, { ...serif(20, CREAM), wordWrap: { width: 880 } }));
    this.track(this.add.text(968, y + 340, `Source: ${era.source}`, serif(16, MUTED)));
    const label = this.notePage < era.pages.length - 1 ? "Next page" : "Recorded";
    const next = button(this, 968, y + 360, 240, 56, label, () => this.act());
    this.track(next.root);
  }

  private drawDebriefPrompt(y: number): void {
    this.track(this.add.text(968, y + 170, "The chronicle is complete.", display(32, CREAM)));
    this.track(this.add.text(968, y + 220, "The debrief names the human cost, then the exit quiz asks ten questions.", {
      ...serif(22, CREAM),
      wordWrap: { width: 860 },
    }));
    const next = button(this, 968, y + 320, 320, 64, "Open the debrief", () => this.act());
    this.track(next.root);
  }

  private drawHeadline(): void {
    const mark = this.built.length;
    const era = currentEra(this.state);
    const dim = this.add.rectangle(960, 540, 1920, 1080, 0x000000, 0.72).setInteractive();
    const paper = paperPanel(this, 390, 150, 1140, 700);
    const mast = this.add.text(960, 190, "THE BATTERY CREEK GAZETTE", display(22, "#1a120c")).setOrigin(0.5);
    const date = this.add.text(960, 230, era.dateline.toUpperCase(), display(18, "#8e3a34")).setOrigin(0.5);
    const headline = this.add.text(960, 360, era.headline, {
      ...display(54, "#1a120c"),
      align: "center",
      wordWrap: { width: 980 },
    }).setOrigin(0.5);
    const deck = this.add.text(470, 470, era.deck, { ...serif(26, "#1a120c", true), wordWrap: { width: 760 } });
    const source = this.add.text(470, 640, era.source, { ...serif(16, "#5c5146"), wordWrap: { width: 760 } });
    const next = button(this, 470, 740, 280, 64, "Continue", () => {
      this.audio.unlock();
      this.audio.play("paper");
      this.act();
    }, "paper");
    this.track(dim);
    this.track(paper);
    this.track(mast);
    this.track(date);
    this.track(headline);
    this.track(deck);
    this.track(source);
    this.track(next.root);
    if (this.textures.exists(portraitKey(era.portrait))) {
      const portrait = this.add.image(1360, 560, portraitKey(era.portrait)).setDisplaySize(140, 172);
      this.track(portrait);
    }
    if (this.lastSound !== "headline") {
      this.lastSound = "headline";
      if (!riseApi.instant) this.audio.play("paper");
    }
    this.sealModal(mark);
  }

  private drawSolemn(): void {
    const mark = this.built.length;
    const solemn = solemnNow(this.state);
    if (!solemn) return;
    if (this.lastSound !== "solemn") {
      this.lastSound = "solemn";
      if (!riseApi.instant) this.audio.play("solemn");
    }
    const dim = this.add.rectangle(960, 540, 1920, 1080, 0x000000, 0.72).setInteractive();
    const panel = framedPanel(this, 360, 100, 1200, 860);
    const title = this.add.text(420, 130, solemn.title, { ...serif(34, CREAM), wordWrap: { width: 1080 } });
    let cursor = 210;
    for (const paragraph of solemn.paragraphs) {
      const text = this.add.text(420, cursor, paragraph, { ...serif(22, CREAM), wordWrap: { width: 1080 }, lineSpacing: 6 });
      this.track(text);
      cursor += text.height + 22;
    }
    const source = this.add.text(420, Math.min(cursor + 8, 820), `Source: ${solemn.source}`, serif(18, GOLD));
    const next = button(this, 420, 880, 420, 60, "I have read this record", () => this.act());
    this.track(dim);
    this.track(panel);
    this.track(title);
    this.track(source);
    this.track(next.root);
    this.sealModal(mark);
  }

  private drawBattle(): void {
    const mark = this.built.length;
    const era = currentEra(this.state);
    const battle = era.battle;
    const roll = this.state.battle;
    if (!battle || !roll) return;
    const dim = this.add.rectangle(960, 540, 1920, 1080, 0x000000, 0.78).setInteractive().setDepth(40);
    const panel = framedPanel(this, 420, 140, 1080, 760);
    const title = this.add.text(960, 190, battle.title.toUpperCase(), display(40, GOLD)).setOrigin(0.5);
    const date = this.add.text(960, 240, battle.date, serif(22, CREAM)).setOrigin(0.5);
    const left = this.add.text(560, 300, battle.attacker, display(24, CREAM));
    const right = this.add.text(1100, 300, battle.defender, display(24, CREAM));
    this.track(dim);
    this.track(panel);
    this.track(title);
    this.track(date);
    this.track(left);
    this.track(right);
    const diceLayer = this.add.container(0, 0).setDepth(30);
    this.track(diceLayer);
    const paintDice = (attack: [number, number], defense: [number, number]) => {
      diceLayer.removeAll(true);
      attack.forEach((value, index) => diceLayer.add(die(this, 560 + index * 90, 360, value)));
      defense.forEach((value, index) => diceLayer.add(die(this, 1100 + index * 90, 360, value)));
    };
    this.diceTimer?.remove();
    if (riseApi.instant) {
      paintDice(roll.attackerDice, roll.defenderDice);
    } else {
      let ticks = 0;
      paintDice([1, 1], [1, 1]);
      this.diceTimer = this.time.addEvent({
        delay: 80,
        repeat: 7,
        callback: () => {
          if (!diceLayer.active) return;
          ticks += 1;
          if (ticks < 8) {
            const face = () => (1 + Math.floor(Math.random() * 6)) as 1 | 2 | 3 | 4 | 5 | 6;
            paintDice([face(), face()], [face(), face()]);
            return;
          }
          paintDice(roll.attackerDice, roll.defenderDice);
        },
      });
    }
    const diceLine =
      roll.diceWinner === "tie"
        ? "The dice tied."
        : `The dice favor the ${roll.diceWinner}.`;
    const historyLine =
      battle.historical === "attacker"
        ? `Historical result: ${battle.attacker} gained ground.`
        : `Historical result: ${battle.defender} held.`;
    this.track(this.add.text(480, 480, diceLine, display(22, CREAM)));
    this.track(this.add.text(480, 520, historyLine, display(22, GOLD)));
    this.track(this.add.text(480, 570, battle.summary, { ...serif(22, CREAM), wordWrap: { width: 960 } }));
    this.track(this.add.text(480, 680, "The dice illustrate risk. This map follows the historical result. It is not a prize.", serif(18, MUTED)));
    const next = button(this, 480, 800, 240, 60, "Continue", () => {
      this.audio.play("dice");
      this.act();
    });
    this.track(next.root);
    this.sealModal(mark);
  }

  private drawTutorial(): void {
    const mark = this.built.length;
    const dim = this.add.rectangle(960, 540, 1920, 1080, 0x000000, 0.72).setInteractive();
    const panel = framedPanel(this, 420, 180, 1080, 700);
    const title = this.add.text(480, 220, "BEFORE THE FIRST HEADLINE", display(36, GOLD));
    const body = this.add.text(480, 300, "Read the date on the paper.\n\nPlay one card. The stronger card names a real cause.\n\nAnswer the check. Insight is the score. Land is the lesson.\n\nWhen a quiet panel appears, stop and read it. It is not a move.", {
      ...serif(28, CREAM),
      lineSpacing: 8,
      wordWrap: { width: 960 },
    });
    const next = button(this, 480, 760, 280, 64, "Begin", () => this.act());
    this.track(dim);
    this.track(panel);
    this.track(title);
    this.track(body);
    this.track(next.root);
    this.sealModal(mark);
  }

  private drawTeacher(): void {
    const mark = this.built.length;
    const dim = this.add.rectangle(960, 540, 1920, 1080, 0x000000, 0.55).setInteractive();
    const panel = framedPanel(this, 560, 180, 800, 700);
    const title = this.add.text(600, 210, "TEACHER DESK", display(36, GOLD));
    this.track(dim);
    this.track(panel);
    this.track(title);
    const actions: [string, () => void][] = [
      [this.state.notesOn ? "Hide history notes" : "Show history notes", () => this.flipNotes()],
      ["Reset this game", () => this.scene.start("title")],
      ["Skip to the debrief", () => {
        this.state = skipToDebrief(this.state);
        this.teacherOpen = false;
        this.remember();
        this.refresh();
      }],
      ["Open the exit quiz", () => this.scene.start("end", { state: this.state, quiz: true })],
      ["Clear the class board", () => {
        try {
          localStorage.removeItem(BOARD_KEY);
        } catch {
          /* ignore */
        }
      }],
      ["Close", () => {
        this.teacherOpen = false;
        this.refresh();
      }],
    ];
    actions.forEach((action, index) => {
      const made = button(this, 620, 280 + index * 80, 680, 64, action[0], action[1], index === actions.length - 1 ? "quiet" : "gold");
      this.track(made.root);
    });
    this.sealModal(mark);
  }

  private remember(): void {
    if (this.savedBoard) return;
    this.savedBoard = true;
    try {
      const previous = JSON.parse(localStorage.getItem(BOARD_KEY) || "[]") as BoardEntry[];
      let next = Array.isArray(previous) ? previous : [];
      for (const team of this.state.teams) {
        next = addBoard(next, {
          name: team.name,
          insight: team.insight,
          mode: this.state.length === "quick" ? "Quick round" : "Full chronicle",
          when: new Date().toISOString().slice(0, 10),
        });
      }
      localStorage.setItem(BOARD_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }
}
