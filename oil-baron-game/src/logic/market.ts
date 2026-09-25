import { clamp } from "./scoring";
import type { RivalState, TeamState } from "./types";

export function living(team: TeamState): RivalState[] {
  return team.rivals.filter((rival) => rival.alive && rival.share > 0);
}

export function withRivals(team: TeamState, rivals: RivalState[]): TeamState {
  return { ...team, rivals };
}

export function patchRival(team: TeamState, id: string, patch: Partial<RivalState>): TeamState {
  return {
    ...team,
    rivals: team.rivals.map((rival) => (rival.id === id ? { ...rival, ...patch } : rival)),
  };
}

/** Move whole percentage points from one holder to another. Shares stay integers. */
export function transferShare(team: TeamState, from: string, to: string, amount: number): TeamState {
  let left = Math.max(0, Math.round(amount));
  if (left === 0 || from === to) return team;
  const rivals = team.rivals.map((rival) => ({ ...rival }));
  let player = team.share;

  const read = (id: string) => (id === "player" ? player : rivals.find((rival) => rival.id === id)?.share ?? 0);
  const write = (id: string, value: number) => {
    if (id === "player") player = value;
    else {
      const rival = rivals.find((item) => item.id === id);
      if (rival) rival.share = value;
    }
  };

  const available = read(from);
  left = Math.min(left, available);
  if (from === "player") left = Math.min(left, Math.max(0, player - 4));
  write(from, read(from) - left);
  write(to, read(to) + left);
  return { ...team, share: player, rivals };
}

export function givePlayerFromRivals(team: TeamState, amount: number): TeamState {
  let need = Math.max(0, Math.round(amount));
  if (need === 0) return team;
  const rivals = team.rivals.map((rival) => ({ ...rival }));
  const donors = rivals.filter((rival) => rival.alive && rival.share > 0);
  const total = donors.reduce((sum, rival) => sum + rival.share, 0);
  if (total <= 0) return team;
  need = Math.min(need, total);
  let taken = 0;
  donors.forEach((rival, index) => {
    let cut = index === donors.length - 1 ? need - taken : Math.round((need * rival.share) / total);
    cut = Math.min(rival.share, Math.max(0, cut), need - taken);
    rival.share -= cut;
    taken += cut;
  });
  let guard = 0;
  while (taken < need && guard++ < 30) {
    const donor = donors.find((rival) => rival.share > 0);
    if (!donor) break;
    donor.share -= 1;
    taken += 1;
  }
  return { ...team, share: team.share + taken, rivals };
}

export function giveRivalsFromPlayer(team: TeamState, amount: number): TeamState {
  let need = Math.max(0, Math.round(amount));
  need = Math.min(need, Math.max(0, team.share - 4));
  if (need === 0) return team;
  const donors = team.rivals.filter((rival) => rival.alive);
  if (donors.length === 0) return team;
  const rivals = team.rivals.map((rival) => ({ ...rival }));
  const alive = rivals.filter((rival) => rival.alive);
  let given = 0;
  alive.forEach((rival, index) => {
    let cut = index === alive.length - 1 ? need - given : Math.round(need / alive.length);
    cut = Math.max(0, Math.min(cut, need - given));
    rival.share += cut;
    given += cut;
  });
  return { ...team, share: team.share - given, rivals };
}

export function killRival(team: TeamState, id: string): TeamState {
  const rival = team.rivals.find((item) => item.id === id);
  if (!rival || !rival.alive) return team;
  const gained = rival.share;
  const rivals = team.rivals.map((item) =>
    item.id === id ? { ...item, share: 0, health: 0, alive: false } : item,
  );
  return { ...team, share: team.share + gained, rivals, buyouts: team.buyouts + 1 };
}

export function retune(team: TeamState, patch: Partial<TeamState>): TeamState {
  const next = { ...team, ...patch };
  next.price = clamp(Math.round(next.price), 6, 32);
  next.cost = clamp(Math.round(next.cost), 6, 24);
  next.opinion = clamp(Math.round(next.opinion), 0, 100);
  next.heat = clamp(Math.round(next.heat), 0, 100);
  next.quality = clamp(Math.round(next.quality), 0, 12);
  next.share = Math.round(next.share);
  return next;
}
