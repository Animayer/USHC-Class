export type Mode = "hub" | "prove" | "line" | "results";

export type RouteState = {
  mode: Mode;
};

export const DEFAULT_ROUTE: RouteState = { mode: "hub" };

const MODES: readonly Mode[] = ["hub", "prove", "line", "results"];

function isMode(value: string | null): value is Mode {
  return value !== null && (MODES as readonly string[]).includes(value);
}

export function parseSearch(search: string): RouteState {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const rawMode = params.get("mode");
  return { mode: isMode(rawMode) ? rawMode : DEFAULT_ROUTE.mode };
}

export function serializeSearch(state: RouteState): string {
  const params = new URLSearchParams();
  params.set("mode", state.mode);
  return `?${params.toString()}`;
}

export function writeSearch(state: RouteState): void {
  const next = serializeSearch(state);
  const url = `${window.location.pathname}${next}${window.location.hash}`;
  window.history.replaceState(state, "", url);
}
