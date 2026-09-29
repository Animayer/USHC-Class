import type { TeamState } from "./types";

export interface BoardEntry {
  name: string;
  insight: number;
  mode: string;
  when: string;
}

export function rankTeams(teams: Pick<TeamState, "name" | "insight">[]): Pick<TeamState, "name" | "insight">[] {
  return [...teams].sort((a, b) => b.insight - a.insight || a.name.localeCompare(b.name));
}

export function addBoard(previous: BoardEntry[], entry: BoardEntry, limit = 8): BoardEntry[] {
  const next = [...previous, entry].sort((a, b) => b.insight - a.insight || a.name.localeCompare(b.name));
  return next.slice(0, limit);
}

export const BADGE_LABELS: Record<string, string> = {
  "warning-signs": "Saw the warning signs",
  "named-pact": "Named the pact",
  turning: "Turning point",
  "read-the-treaty": "Read the treaty",
  "fact-from-slogan": "Told fact from slogan",
  "read-the-record": "Read the record",
  chronicle: "Finished the chronicle",
  "what-if": "Asked about a branch",
  "steady-reading": "Steady reading",
  "stopping-point": "Asked what could have stopped him",
  "closed-chronicle": "Closed the spread",
};

export function badgeLabel(id: string): string {
  return BADGE_LABELS[id] ?? id;
}
