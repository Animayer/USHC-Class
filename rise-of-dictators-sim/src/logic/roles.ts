import type { RoleId } from "./types";

export interface RoleInfo {
  id: RoleId;
  name: string;
  objective: string;
  blurb: string;
}

export const ROLES: Record<RoleId, RoleInfo> = {
  allies: {
    id: "allies",
    name: "Allied Desk",
    objective: "Name what the democracies did, and what delay cost.",
    blurb: "Chamberlain, Churchill, and Roosevelt. You are not here to cheer a side. You are here to time their choices.",
  },
  soviet: {
    id: "soviet",
    name: "Soviet Desk",
    objective: "Explain how Stalin built power, and the human cost of that power.",
    blurb: "Security is not a blank check. Famine, the purge, the pact, and the Eastern Front all belong on this desk.",
  },
  axis: {
    id: "axis",
    name: "Axis Desk",
    objective: "Put the rises in order, and name the conditions each man used.",
    blurb: "Mussolini, Hitler, and Tojo. Land on the map is the record. It is not your score.",
  },
  analyst: {
    id: "analyst",
    name: "Citizen Analyst",
    objective: "Tell a slogan from a fact, and say who lost the right to refuse.",
    blurb: "You read the headlines the way a careful citizen should: date, source, and what the law just allowed.",
  },
  chinaSpain: {
    id: "chinaSpain",
    name: "China and Spain Desk",
    objective: "Keep the civil wars and the China front on the map, through 1975.",
    blurb: "Franco, Chiang Kai-shek, and Mao Zedong. Different wars. None of them is a footnote.",
  },
};

export const ROLE_ORDER: RoleId[] = ["allies", "analyst", "axis", "soviet", "chinaSpain"];

export const TEAM_COLORS = ["#e0b15a", "#7eb8b0", "#e0c3a0", "#d08a72", "#b7c0e0"];

export function rolesForCount(count: number): RoleId[] {
  const n = Math.max(1, Math.min(ROLE_ORDER.length, count));
  if (n === 1) return ["analyst"];
  return ROLE_ORDER.slice(0, n);
}
