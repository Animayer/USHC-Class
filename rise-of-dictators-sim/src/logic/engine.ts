import { allEras, erasFor, SOLEMN } from "./eras";
import { nextRand, roll2d6 } from "./rng";
import { rolesForCount, TEAM_COLORS } from "./roles";
import { Y1922 } from "./snapshots";
import type { CardDef, EraDef, GameState, Length, LogLine, Mode, Snapshot, TeamState } from "./types";

export interface NewGameOptions {
  mode: Mode;
  names: string[];
  length: Length;
  seed?: number;
  notesOn?: boolean;
}

const RECORD_IDS = ["holodomor", "nanjing", "holocaust"];

function grant(state: GameState, id: string): GameState {
  if (state.badges.includes(id)) return state;
  return { ...state, badges: [...state.badges, id] };
}

function withTeam(state: GameState, index: number, edit: (team: TeamState) => TeamState): GameState {
  return {
    ...state,
    teams: state.teams.map((team, i) => (i === index ? edit(team) : team)),
  };
}

export function eraActors(state: GameState): number[] {
  if (state.teams.length <= 1 || state.length === "quick") {
    return [state.eraIndex % state.teams.length];
  }
  return state.teams.map((_, index) => index);
}

export function currentEra(state: GameState): EraDef {
  const eras = erasFor(state.length);
  return eras[Math.min(state.eraIndex, eras.length - 1)];
}

export function currentCards(state: GameState): [CardDef, CardDef] {
  const team = state.teams[state.activeTeam];
  return currentEra(state).cards[team.role];
}

export function visibleSnapshot(state: GameState): Snapshot {
  const eras = erasFor(state.length);
  const early = state.phase === "solemn" || state.phase === "headline";
  if (state.phase === "debrief") return eras[eras.length - 1].snapshot;
  if (early && state.eraIndex === 0) return Y1922;
  if (early) return eras[state.eraIndex - 1].snapshot;
  return eras[state.eraIndex].snapshot;
}

function pickAside(state: GameState, era: EraDef): { text: string; rng: number } {
  const rolled = nextRand(state.rng);
  const index = Math.min(era.asides.length - 1, Math.floor(rolled.value * era.asides.length));
  return { text: `${era.asides[index].title}: ${era.asides[index].text}`, rng: rolled.rng };
}

function openEra(state: GameState): GameState {
  const era = erasFor(state.length)[state.eraIndex];
  const aside = pickAside(state, era);
  const actors = eraActors({ ...state, rng: aside.rng });
  const solemn = era.solemnId && !state.seenSolemn.includes(era.solemnId) ? "solemn" : "headline";
  return {
    ...state,
    rng: aside.rng,
    phase: solemn,
    actorPos: 0,
    activeTeam: actors[0] ?? 0,
    verdict: null,
    answer: null,
    battle: null,
    aside: aside.text,
  };
}

export function createGame(options: NewGameOptions): GameState {
  const length = options.length;
  const mode = options.mode;
  const names = (mode === "solo" ? [options.names[0] || "You"] : options.names).map((name) => name.trim()).filter(Boolean);
  const safeNames = names.length > 0 ? names.slice(0, 5) : ["You"];
  const roles = mode === "solo" ? rolesForCount(1) : rolesForCount(safeNames.length);
  const teams: TeamState[] = safeNames.slice(0, roles.length).map((name, index) => ({
    id: `team-${index + 1}`,
    name: name.slice(0, 22),
    role: roles[index],
    color: TEAM_COLORS[index] ?? TEAM_COLORS[0],
    insight: 0,
    streak: 0,
    bestStreak: 0,
  }));
  const seed = options.seed ?? 1;
  const draft: GameState = {
    version: 1,
    seed,
    rng: seed >>> 0,
    mode,
    length,
    notesOn: options.notesOn !== false,
    teams,
    eraIndex: 0,
    activeTeam: 0,
    actorPos: 0,
    phase: "headline",
    log: [
      {
        year: "1922",
        text: "The peace is still raw, and several states are fragile. That is the opening condition, not an excuse.",
      },
    ],
    seenSolemn: [],
    verdict: null,
    answer: null,
    battle: null,
    whatIfs: [],
    badges: [],
    aside: "",
  };
  return openEra(draft);
}

function finishEra(state: GameState): GameState {
  const era = currentEra(state);
  const log: LogLine[] = [
    ...state.log,
    { year: era.ticker, text: `${era.cause} → ${era.effect}` },
    { year: era.ticker, text: state.aside },
  ];
  const eras = erasFor(state.length);
  if (state.eraIndex >= eras.length - 1) {
    const done = grant({ ...state, log, phase: "debrief" }, "chronicle");
    return done;
  }
  return openEra({ ...state, log, eraIndex: state.eraIndex + 1 });
}

function afterQuestion(state: GameState): GameState {
  const era = currentEra(state);
  if (era.battle) {
    const attack = roll2d6(state.rng);
    const defense = roll2d6(attack.rng);
    const diceWinner =
      attack.total === defense.total ? "tie" : attack.total > defense.total ? "attacker" : "defender";
    return {
      ...state,
      rng: defense.rng,
      phase: "battle",
      battle: {
        attackerDice: attack.dice,
        defenderDice: defense.dice,
        attackerTotal: attack.total,
        defenderTotal: defense.total,
        diceWinner,
        historical: era.battle.historical,
      },
    };
  }
  if (state.notesOn) return { ...state, phase: "note" };
  return finishEra(state);
}

export function dismiss(state: GameState): GameState {
  if (state.phase === "solemn") {
    const id = currentEra(state).solemnId;
    let next: GameState = { ...state, phase: "headline" };
    if (id && !next.seenSolemn.includes(id)) next = { ...next, seenSolemn: [...next.seenSolemn, id] };
    if (RECORD_IDS.every((record) => next.seenSolemn.includes(record))) next = grant(next, "read-the-record");
    return next;
  }
  if (state.phase === "headline") return { ...state, phase: "decide" };
  if (state.phase === "verdict") {
    const actors = eraActors(state);
    const nextPos = state.actorPos + 1;
    if (nextPos < actors.length) {
      return { ...state, actorPos: nextPos, activeTeam: actors[nextPos], phase: "decide", verdict: null };
    }
    return {
      ...state,
      phase: "question",
      verdict: null,
      activeTeam: state.eraIndex % state.teams.length,
    };
  }
  if (state.phase === "explain") return afterQuestion(state);
  if (state.phase === "battle") {
    if (state.notesOn) return { ...state, phase: "note" };
    return finishEra(state);
  }
  if (state.phase === "note") return finishEra(state);
  return state;
}

export function playCard(state: GameState, cardId: string): GameState {
  if (state.phase !== "decide") return state;
  const cards = currentCards(state);
  const card = cards.find((item) => item.id === cardId);
  if (!card) return state;
  const era = currentEra(state);
  let next = state;
  if (card.insight) {
    next = withTeam(next, next.activeTeam, (team) => ({ ...team, insight: team.insight + 2 }));
  }
  if (card.insight && card.kind === "treaty") next = grant(next, "read-the-treaty");
  if (card.insight && card.kind === "propaganda") next = grant(next, "fact-from-slogan");
  if (card.insight && card.id.includes("pact")) next = grant(next, "named-pact");
  const log = [...next.log];
  const team = next.teams[next.activeTeam];
  log.push({
    year: era.ticker,
    text: card.insight
      ? `${team.name} read “${card.title}.” It matches the record.`
      : `${team.name} read “${card.title}.” The stronger card was the other one.`,
  });
  const whatIfs = [...next.whatIfs];
  if (card.whatIf) {
    whatIfs.push(card.verdict);
    log.push({ year: era.ticker, text: `What-if, not a change to the map: ${card.verdict}` });
    next = grant(next, "what-if");
  }
  return {
    ...next,
    log,
    whatIfs,
    phase: "verdict",
    verdict: { title: card.title, text: card.verdict, insight: card.insight },
  };
}

export function answerQuestion(state: GameState, choice: number): GameState {
  if (state.phase !== "question") return state;
  const question = currentEra(state).question;
  if (choice < 0 || choice >= question.choices.length) return state;
  const correct = choice === question.answer;
  const teamIndex = state.activeTeam;
  let next = withTeam(state, teamIndex, (team) => {
    const streak = correct ? team.streak + 1 : 0;
    const bonus = correct && streak >= 2 ? 1 : 0;
    return {
      ...team,
      streak,
      bestStreak: Math.max(team.bestStreak, streak),
      insight: team.insight + (correct ? 3 + bonus : 0),
    };
  });
  if (correct && currentEra(state).badge) next = grant(next, currentEra(state).badge as string);
  return {
    ...next,
    phase: "explain",
    answer: { choice, correct, explain: question.explain },
  };
}

export function toggleNotes(state: GameState): GameState {
  return { ...state, notesOn: !state.notesOn };
}

export function autoAdvance(state: GameState): GameState {
  if (state.phase === "debrief") return state;
  if (state.phase === "decide") {
    const cards = currentCards(state);
    const pick = cards.find((card) => card.insight) ?? cards[0];
    return playCard(state, pick.id);
  }
  if (state.phase === "question") return answerQuestion(state, currentEra(state).question.answer);
  return dismiss(state);
}

export function skipToDebrief(state: GameState): GameState {
  let next = state;
  for (let guard = 0; guard < 400 && next.phase !== "debrief"; guard += 1) {
    next = autoAdvance(next);
  }
  return next;
}

export function solemnNow(state: GameState) {
  const id = currentEra(state).solemnId;
  if (!id || state.phase !== "solemn") return null;
  return SOLEMN[id] ?? null;
}

export function proseBundle(): string {
  return JSON.stringify({ eras: allEras(), solemn: SOLEMN });
}
