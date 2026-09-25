import type { DistanceMiles, HomesteadState, YearLog } from "./homestead";
import { DISTANCE_CHOICES } from "./homestead";
import type { Books, LinePath, RailroadState } from "./railroad";

export const STORAGE_KEY = "bchs-ushc-build-the-line-v1";

export type Reflections = {
  q1: string;
  q2: string;
  q3: string;
};

export type CompletedLines = {
  pacific: RailroadState | null;
  hill: RailroadState | null;
};

export type Progress = {
  homestead: HomesteadState | null;
  weather: ("rainfall" | "drought")[];
  weatherSeed: number | null;
  railroad: RailroadState | null;
  completedLines: CompletedLines;
  reflections: Reflections;
};

export const EMPTY_REFLECTIONS: Reflections = { q1: "", q2: "", q3: "" };

export const EMPTY_LINES: CompletedLines = { pacific: null, hill: null };

export const EMPTY_PROGRESS: Progress = {
  homestead: null,
  weather: [],
  weatherSeed: null,
  railroad: null,
  completedLines: { ...EMPTY_LINES },
  reflections: { ...EMPTY_REFLECTIONS },
};

const DISTANCES = new Set<number>(DISTANCE_CHOICES.map((item) => item.miles));

function isDistance(value: unknown): value is DistanceMiles {
  return typeof value === "number" && DISTANCES.has(value);
}

function isYearLog(value: unknown): value is YearLog {
  if (!value || typeof value !== "object") return false;
  const row = value as YearLog;
  return typeof row.year === "number" && typeof row.cashAfter === "number" && typeof row.freight === "number";
}

export function sanitizeHomestead(raw: unknown): HomesteadState | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as HomesteadState;
  if (!isDistance(row.distanceMiles)) return null;
  if (typeof row.cash !== "number" || typeof row.debt !== "number") return null;
  if (!Array.isArray(row.log) || !row.log.every(isYearLog)) return null;
  return {
    distanceMiles: row.distanceMiles,
    yearIndex: typeof row.yearIndex === "number" ? row.yearIndex : 0,
    cash: row.cash,
    debt: row.debt,
    acresCultivated: typeof row.acresCultivated === "number" ? row.acresCultivated : 0,
    hasHouse: row.hasHouse === true,
    abandoned: row.abandoned === true,
    provedUp: row.provedUp === true,
    log: row.log,
  };
}

function isBooks(value: unknown): value is Books {
  if (!value || typeof value !== "object") return false;
  const row = value as Books;
  return (
    typeof row.miles === "number" &&
    typeof row.quality === "number" &&
    typeof row.subsidyCash === "number" &&
    typeof row.trafficIncome === "number" &&
    typeof row.insiderProfit === "number" &&
    typeof row.maintenance === "number"
  );
}

export function sanitizeRailroad(raw: unknown): RailroadState | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as RailroadState;
  if (row.path !== "pacific" && row.path !== "hill") return null;
  if (!isBooks(row.books)) return null;
  const path: LinePath = row.path;
  return {
    path,
    tookInsider: row.tookInsider === true ? true : row.tookInsider === false ? false : null,
    seasonIndex: typeof row.seasonIndex === "number" ? row.seasonIndex : 0,
    recordAck: typeof row.recordAck === "number" ? row.recordAck : -1,
    books: {
      ...row.books,
      landGrantAcres: typeof row.books.landGrantAcres === "number" ? row.books.landGrantAcres : 0,
    },
    scandalRoll: typeof row.scandalRoll === "number" ? row.scandalRoll : 0.5,
    exposed: row.exposed === true ? true : row.exposed === false ? false : null,
    done: row.done === true,
    seenEventIds: Array.isArray(row.seenEventIds)
      ? row.seenEventIds.filter((id): id is string => typeof id === "string")
      : [],
  };
}

export function sanitizeProgress(raw: unknown): Progress {
  if (!raw || typeof raw !== "object") return { ...EMPTY_PROGRESS, reflections: { ...EMPTY_REFLECTIONS } };
  const row = raw as Partial<Progress>;
  const reflections = row.reflections ?? EMPTY_REFLECTIONS;
  const weather = Array.isArray(row.weather)
    ? row.weather.filter((item): item is "rainfall" | "drought" => item === "rainfall" || item === "drought")
    : [];
  const railroad = sanitizeRailroad(row.railroad);
  const rawLines = row.completedLines;
  const completedLines: CompletedLines = {
    pacific: sanitizeRailroad(rawLines?.pacific),
    hill: sanitizeRailroad(rawLines?.hill),
  };
  if (railroad?.done && !completedLines[railroad.path]) {
    completedLines[railroad.path] = railroad;
  }
  return {
    homestead: sanitizeHomestead(row.homestead),
    weather,
    weatherSeed: typeof row.weatherSeed === "number" ? row.weatherSeed : null,
    railroad,
    completedLines,
    reflections: {
      q1: typeof reflections.q1 === "string" ? reflections.q1 : "",
      q2: typeof reflections.q2 === "string" ? reflections.q2 : "",
      q3: typeof reflections.q3 === "string" ? reflections.q3 : "",
    },
  };
}

export function loadProgress(): Progress {
  if (typeof localStorage === "undefined") {
    return { ...EMPTY_PROGRESS, reflections: { ...EMPTY_REFLECTIONS } };
  }
  try {
    return sanitizeProgress(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null"));
  } catch {
    return { ...EMPTY_PROGRESS, reflections: { ...EMPTY_REFLECTIONS } };
  }
}

export function saveProgress(progress: Progress): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

/** Finished Round 2 paths, Pacific first, then Great Northern. An in-progress game is not included. */
export function finishedRailroads(progress: Progress): RailroadState[] {
  const lines: RailroadState[] = [];
  if (progress.completedLines.pacific?.done) lines.push(progress.completedLines.pacific);
  if (progress.completedLines.hill?.done) lines.push(progress.completedLines.hill);
  const active = progress.railroad;
  if (active?.done && !lines.some((item) => item.path === active.path)) lines.push(active);
  return lines;
}

export function resetStoredProgress(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
