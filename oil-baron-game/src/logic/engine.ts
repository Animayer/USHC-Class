import { availableCards, cardById } from "./cards";
import { applyYearEvent, tarbellEpilogue } from "./events";
import { givePlayerFromRivals, killRival, patchRival, retune, transferShare } from "./market";
import { pickIndex } from "./rng";
import { badges } from "./scoring";
import type { CardDef, GameState, Mode, RivalState, RoundLength, TeamState } from "./types";

export const FULL_YEARS = [1870, 1872, 1874, 1876, 1878, 1880, 1882, 1884, 1886, 1890];
export const SHORT_YEARS = [1870, 1872, 1874, 1882, 1886, 1890];
export const START_PRICE = 26;

const TEAM_COLORS = ["#0072b2", "#e69f00", "#009e73", "#cc79a7"];

export function yearsFor(rounds: RoundLength): number[] {
  return rounds === 6 ? [...SHORT_YEARS] : [...FULL_YEARS];
}

function rivalRoster(): RivalState[] {
  return [
    {
      id: "payne",
      name: "Payne & Clark",
      short: "Payne",
      personality: "merchant",
      blurb: "Cleveland refiners. Proud, and for sale if the squeeze gets bad.",
      share: 26,
      health: 68,
      alive: true,
    },
    {
      id: "lakeshore",
      name: "Lakeshore Works",
      short: "Lakeshore",
      personality: "privilege",
      blurb: "Sits on the rail line and expects a favor.",
      share: 22,
      health: 62,
      alive: true,
    },
    {
      id: "mahoning",
      name: "Mahoning Stills",
      short: "Mahoning",
      personality: "efficiency",
      blurb: "Youngstown refiners who watch every cent of cost.",
      share: 18,
      health: 74,
      alive: true,
    },
    {
      id: "oilcreek",
      name: "Oil Creek Combine",
      short: "Oil Creek",
      personality: "stubborn",
      blurb: "Pennsylvania independents. They will not sell quietly.",
      share: 20,
      health: 86,
      alive: true,
    },
  ];
}

function blankTeam(id: string, name: string, color: string): TeamState {
  return {
    id,
    name,
    color,
    share: 14,
    cost: 16,
    opinion: 58,
    heat: 8,
    quality: 1,
    price: START_PRICE,
    priceHistory: [{ year: 1870, price: START_PRICE }],
    rivals: rivalRoster(),
    played: [],
    hand: [],
    buyouts: 0,
    trustFormed: false,
    rebatesIllegal: false,
    tidewater: false,
    pipelineOwned: false,
    barrelsOwned: false,
    trustBuster: false,
    efficiencyBuilds: 0,
    privilegeMoves: 0,
    notes: ["1870. The lamps are lit. Cleveland is crowded with stills."],
  };
}

export function createGame(options: {
  mode: Mode;
  names: string[];
  rounds: RoundLength;
  timerEnabled?: boolean;
  seed?: number;
}): GameState {
  const names = options.names.map((name) => name.trim()).filter(Boolean);
  const count = options.mode === "solo" ? 1 : Math.max(2, Math.min(4, names.length || 2));
  const teams = Array.from({ length: count }, (_, index) =>
    blankTeam(
      `team-${index + 1}`,
      options.mode === "solo" ? names[0] || "You" : names[index] || `Team ${index + 1}`,
      TEAM_COLORS[index] ?? "#0072b2",
    ),
  );
  const seed = options.seed ?? Math.floor(Math.random() * 1_000_000_000);
  let state: GameState = {
    version: 1,
    seed,
    rng: seed >>> 0,
    mode: options.mode,
    roundLength: options.rounds,
    years: yearsFor(options.rounds),
    roundIndex: 0,
    phase: "choose",
    activeTeam: 0,
    teams,
    timerEnabled: options.timerEnabled ?? false,
    timerSeconds: 90,
    event: null,
    banner: "",
  };
  state = deal(state, 0);
  state.banner = `${state.teams[0].name}: ${state.years[0]}. Play one card.`;
  return state;
}

export function currentYear(state: GameState): number {
  return state.years[state.roundIndex] ?? state.years[state.years.length - 1] ?? 1890;
}

export function activeTeam(state: GameState): TeamState {
  return state.teams[state.activeTeam] ?? state.teams[0];
}

function replaceTeam(state: GameState, index: number, team: TeamState): GameState {
  const teams = state.teams.map((item, itemIndex) => (itemIndex === index ? team : item));
  return { ...state, teams };
}

function deal(state: GameState, teamIndex: number): GameState {
  const year = currentYear(state);
  let team = state.teams[teamIndex];
  let rng = state.rng;
  const pool = availableCards(team, year);
  const efficiency = pool.filter((card) => card.kind === "efficiency");
  const privilege = pool.filter((card) => card.kind === "privilege");
  const chosen: CardDef[] = [];

  const take = (list: CardDef[]) => {
    if (list.length === 0) return;
    const rolled = pickIndex(rng, list.length);
    rng = rolled.rng;
    const card = list[rolled.index];
    if (!chosen.some((item) => item.id === card.id)) chosen.push(card);
  };

  take(efficiency);
  take(privilege);
  let rest = pool.filter((card) => !chosen.some((item) => item.id === card.id));
  while (chosen.length < 3 && rest.length > 0) {
    const rolled = pickIndex(rng, rest.length);
    rng = rolled.rng;
    chosen.push(rest[rolled.index]);
    rest = rest.filter((card) => card.id !== chosen[chosen.length - 1].id);
  }

  const hand = chosen.map((card) => card.id);
  for (let index = hand.length - 1; index > 0; index -= 1) {
    const rolled = pickIndex(rng, index + 1);
    rng = rolled.rng;
    const swap = hand[index];
    hand[index] = hand[rolled.index];
    hand[rolled.index] = swap;
  }

  team = { ...team, hand };
  return { ...replaceTeam(state, teamIndex, team), rng };
}

function rebateShare(team: TeamState, card: CardDef): number {
  let share = card.share;
  if (card.id === "rebates" || card.id === "drawbacks") {
    if (team.rebatesIllegal) share = Math.round(share * 0.35);
    else if (team.tidewater) share = Math.round(share * 0.7);
  }
  return share;
}

function applyBuyout(team: TeamState): { team: TeamState; note: string } {
  const candidates = team.rivals.filter((rival) => rival.alive);
  const willing = candidates
    .filter((rival) => rival.personality !== "stubborn" || rival.health <= 45 || team.trustFormed || team.share >= 45)
    .sort((a, b) => a.health - b.health);
  const target = willing[0];
  if (!target) {
    const bruised = givePlayerFromRivals(team, 2);
    return {
      team: retune(bruised, { opinion: team.opinion - 4, heat: team.heat + 6 }),
      note: "Oil Creek slammed the door. You still pulled a little trade their way.",
    };
  }
  let next = killRival(team, target.id);
  next = retune(next, { opinion: team.opinion - 5, heat: team.heat + 8, price: team.price - 1 });
  return { team: next, note: `${target.name} sold. The sign on the gate says SOLD.` };
}

function applySqueeze(team: TeamState): { team: TeamState; note: string } {
  const target = team.rivals
    .filter((rival) => rival.alive)
    .sort((a, b) => b.share - a.share)[0];
  if (!target) {
    return { team, note: "There is nobody left to squeeze." };
  }
  const health = Math.max(0, target.health - 24);
  let next = patchRival(team, target.id, { health });
  if (health <= 0) {
    next = killRival(next, target.id);
    next = retune(next, { opinion: team.opinion - 6, heat: team.heat + 11 });
    return { team: next, note: `${target.name} folded under the freight squeeze.` };
  }
  next = transferShare(next, target.id, "player", Math.min(4, target.share));
  next = retune(next, { opinion: team.opinion - 6, heat: team.heat + 11 });
  return { team: next, note: `${target.short} lost cars on the siding and a slice of the market.` };
}

function rivalsAct(team: TeamState): { team: TeamState; notes: string[] } {
  let next = team;
  const notes: string[] = [];
  for (const rival of [...next.rivals]) {
    const current = next.rivals.find((item) => item.id === rival.id);
    if (!current?.alive) continue;
    if (current.personality === "efficiency") {
      next = patchRival(next, current.id, { health: Math.min(100, current.health + 5) });
      if (next.share > 12) {
        next = transferShare(next, "player", current.id, 1);
        notes.push(`${current.short} cuts costs and takes a customer.`);
      }
    } else if (current.personality === "privilege") {
      next = patchRival(next, current.id, { health: Math.min(100, current.health + 1) });
      if (next.share > 10) {
        next = transferShare(next, "player", current.id, 2);
        next = retune(next, { heat: next.heat + 2 });
        notes.push(`${current.short} leans on a freight agent.`);
      }
    } else if (current.personality === "stubborn") {
      next = patchRival(next, current.id, { health: Math.min(100, current.health + 6) });
      const lakeshore = next.rivals.find((item) => item.id === "lakeshore" && item.alive && item.share > 0);
      if (lakeshore) {
        next = transferShare(next, "lakeshore", current.id, 1);
        notes.push("Oil Creek refuses a deal and picks off Lakeshore trade.");
      }
    } else if (current.health < 45) {
      next = transferShare(next, current.id, "player", 2);
      notes.push(`${current.short} is quietly looking for a buyer.`);
    } else if (next.share > 18) {
      next = transferShare(next, "player", current.id, 1);
      notes.push(`${current.short} matches your price on the Cleveland docks.`);
    }
  }
  if (next.share < 4) {
    const donor = [...next.rivals].filter((rival) => rival.alive && rival.share > 0).sort((a, b) => b.share - a.share)[0];
    if (donor) next = transferShare(next, donor.id, "player", 4 - next.share);
  }
  return { team: next, notes };
}

export function playCard(state: GameState, cardId: string): GameState {
  if (state.phase !== "choose") return state;
  const index = state.activeTeam;
  let team = state.teams[index];
  if (!team.hand.includes(cardId)) return state;
  const card = cardById(cardId);
  const year = currentYear(state);
  const notes: string[] = [];

  if (card.buyout) {
    const bought = applyBuyout(team);
    team = bought.team;
    notes.push(bought.note);
  } else if (card.squeeze) {
    const squeezed = applySqueeze(team);
    team = squeezed.team;
    notes.push(squeezed.note);
  } else {
    const share = rebateShare(team, card);
    team = givePlayerFromRivals(team, share);
    const illegal = (card.id === "rebates" || card.id === "drawbacks") && team.rebatesIllegal;
    team = retune(team, {
      price: team.price + card.price,
      cost: team.cost + card.cost,
      opinion: team.opinion + card.opinion,
      heat: team.heat + card.heat + (illegal ? 6 : 0),
      quality: team.quality + card.quality,
    });
    if (illegal) notes.push("The rebate is illegal now. It barely moves the market and it raises the heat.");
    else notes.push(card.summary);
  }

  team = {
    ...team,
    pipelineOwned: team.pipelineOwned || card.id === "pipeline",
    barrelsOwned: team.barrelsOwned || card.id === "barrels",
    trustFormed: team.trustFormed || card.id === "trust",
    efficiencyBuilds: team.efficiencyBuilds + (card.kind === "efficiency" ? 1 : 0),
    privilegeMoves: team.privilegeMoves + (card.kind === "privilege" ? 1 : 0),
    played: [...team.played, { id: card.id, name: card.name, kind: card.kind, year }],
    hand: [],
  };

  const rivalTurn = rivalsAct(team);
  team = rivalTurn.team;
  notes.push(...rivalTurn.notes);

  const previousYear = state.roundIndex > 0 ? state.years[state.roundIndex - 1] : null;
  const eventResult = applyYearEvent(team, year, previousYear);
  team = eventResult.team;
  team = {
    ...team,
    priceHistory: [...team.priceHistory.filter((point) => point.year !== year), { year, price: team.price }],
    notes: [...notes, eventResult.event.title].slice(-8),
  };

  return {
    ...replaceTeam(state, index, team),
    phase: "event",
    event: eventResult.event,
    banner: notes[0] ?? card.name,
  };
}

export function acknowledge(state: GameState): GameState {
  if (state.phase === "epilogue") {
    const teams = state.teams.map((team) => ({ ...team, notes: [...team.notes, ...badges(team)].slice(-8) }));
    return { ...state, teams, phase: "done", event: state.event, banner: "The ledger is closed." };
  }
  if (state.phase !== "event") return state;

  const lastTeam = state.activeTeam >= state.teams.length - 1;
  const lastRound = state.roundIndex >= state.years.length - 1;
  if (!lastTeam) {
    let next: GameState = { ...state, activeTeam: state.activeTeam + 1, phase: "choose", event: null };
    next = deal(next, next.activeTeam);
    const team = next.teams[next.activeTeam];
    next.banner = `${team.name}: ${currentYear(next)}. Play one card.`;
    return next;
  }
  if (!lastRound) {
    let next: GameState = { ...state, activeTeam: 0, roundIndex: state.roundIndex + 1, phase: "choose", event: null };
    next = deal(next, 0);
    next.banner = `${next.teams[0].name}: ${currentYear(next)}. Play one card.`;
    return next;
  }
  return {
    ...state,
    phase: "epilogue",
    event: tarbellEpilogue(),
    banner: "History's verdict arrives after the period.",
  };
}

export function skipToEnd(state: GameState): GameState {
  let next = state;
  let guard = 0;
  while (next.phase !== "done" && guard++ < 100) {
    if (next.phase === "choose") {
      const team = next.teams[next.activeTeam];
      const hand = team.hand.map((id) => cardById(id));
      const efficiency = team.played.filter((card) => card.kind === "efficiency").length;
      const privilege = team.played.filter((card) => card.kind === "privilege").length;
      const want = privilege > efficiency ? "privilege" : "efficiency";
      const pick = hand.find((card) => card.kind === want) ?? hand[0];
      if (!pick) return { ...next, phase: "done" };
      next = playCard(next, pick.id);
    } else {
      next = acknowledge(next);
    }
  }
  return next;
}

export function autoPlay(state: GameState, strategy: "efficiency" | "privilege"): GameState {
  let next = state;
  let guard = 0;
  while (next.phase !== "done" && guard++ < 100) {
    if (next.phase === "choose") {
      const hand = next.teams[next.activeTeam].hand.map((id) => cardById(id));
      const pick = hand.find((card) => card.kind === strategy) ?? hand[0];
      if (!pick) break;
      next = playCard(next, pick.id);
    } else {
      next = acknowledge(next);
    }
  }
  return next;
}
