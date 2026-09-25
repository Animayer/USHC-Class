import { badges, scoreTeam } from "./scoring";
import type { GameState } from "./types";

export const SAVE_KEY = "oil-baron-game-v1";
export const MUTE_KEY = "oil-baron-mute";

export function serialize(state: GameState): string {
  return JSON.stringify(state);
}

export function deserialize(raw: string): GameState | null {
  try {
    const parsed = JSON.parse(raw) as GameState;
    if (parsed.version !== 1) return null;
    if (!Array.isArray(parsed.years) || parsed.years.length < 1) return null;
    if (!Array.isArray(parsed.teams) || parsed.teams.length < 1) return null;
    if (parsed.phase !== "choose" && parsed.phase !== "event" && parsed.phase !== "epilogue" && parsed.phase !== "done") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function readSave(storage: Pick<Storage, "getItem"> | null): GameState | null {
  if (!storage) return null;
  const raw = storage.getItem(SAVE_KEY);
  if (!raw) return null;
  return deserialize(raw);
}

export function writeSave(storage: Pick<Storage, "setItem"> | null, state: GameState): void {
  storage?.setItem(SAVE_KEY, serialize(state));
}

export function clearSave(storage: Pick<Storage, "removeItem"> | null): void {
  storage?.removeItem(SAVE_KEY);
}

export function resultSlip(state: GameState, teamIndex = 0): string {
  const team = state.teams[teamIndex];
  if (!team) return "";
  const scores = scoreTeam(team);
  const badgeNames = badges(team);
  const lines = [
    "OIL BARON — Result slip",
    "Battery Creek HS · USHC · Captains of Industry · Mayer",
    `Name / team: ${team.name}`,
    `Years: ${state.years[0]}–${state.years[state.years.length - 1]} (${state.years.length} rounds)`,
    `Market share: ${team.share}%`,
    `Kerosene: about 26¢/gal in 1870 → about ${team.price}¢ (your price). Historical approximate: about 8¢ by 1885.`,
    `Customer Value: ${scores.customer} / 100`,
    `Political Privilege: ${scores.privilege} / 100`,
    `Badges: ${badgeNames.length ? badgeNames.join(", ") : "none"}`,
    "",
    "DBQ Q11",
    "Which strategy won you the most market share? Was it fair to customers? Use one historical fact.",
    "Pick Carnegie or Rockefeller. Compare his strategy to one other leader. Decide whether he was mostly a market entrepreneur or a political entrepreneur. Address one piece of evidence on the other side.",
    "",
    "Facts you can use: Standard Oil founded 1870; South Improvement Company rebates, 1872; about 90% of U.S. refining by ~1880; Standard Oil Trust 1882; kerosene about 26¢ to about 8¢ (approximate); Interstate Commerce Act 1887; Sherman Antitrust Act 1890 (Senate 51–1, House 242–0).",
  ];
  return lines.join("\n");
}
