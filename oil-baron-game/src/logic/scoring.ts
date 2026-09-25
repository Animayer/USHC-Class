import type { TeamState } from "./types";

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function shareSum(team: TeamState): number {
  return team.share + team.rivals.reduce((sum, rival) => sum + rival.share, 0);
}

export interface Scores {
  customer: number;
  privilege: number;
}

export function scoreTeam(team: TeamState): Scores {
  const played = team.played.length;
  const efficiency = team.played.filter((card) => card.kind === "efficiency").length;
  const privilegePlays = team.played.filter((card) => card.kind === "privilege").length;
  const priceDrop = clamp((26 - team.price) / (26 - 8), 0, 1);
  const efficiencyRatio = played ? efficiency / played : 0;
  const privilegeRatio = played ? privilegePlays / played : 0;
  const quality = clamp(team.quality / 10, 0, 1);
  const customer = Math.round(
    clamp(100 * (0.5 * priceDrop + 0.22 * efficiencyRatio + 0.14 * quality + 0.14 * (team.opinion / 100)), 0, 100),
  );
  const privilege = Math.round(
    clamp(
      100 * (0.42 * privilegeRatio + 0.28 * (team.heat / 100) + 0.18 * clamp(team.buyouts / 3, 0, 1) + 0.12 * (team.trustFormed ? 1 : 0)),
      0,
      100,
    ),
  );
  return { customer, privilege };
}

export function badges(team: TeamState): string[] {
  const scores = scoreTeam(team);
  const earned: string[] = [];
  if (scores.customer >= 60) earned.push("Market Entrepreneur");
  if (scores.privilege >= 60) earned.push("Political Entrepreneur");
  if (team.trustBuster) earned.push("Trust Buster Target");
  if (team.buyouts >= 2) earned.push("Cleveland Massacre");
  if (team.price <= 10) earned.push("Lamp Lighter");
  if (team.played.some((card) => card.id === "byproducts")) earned.push("Byproduct Works");
  return earned;
}

export function opinionLabel(opinion: number): string {
  if (opinion >= 75) return "Trusted";
  if (opinion >= 55) return "Fair";
  if (opinion >= 40) return "Mixed";
  if (opinion >= 25) return "Wary";
  return "Hostile";
}

export function heatLabel(heat: number): string {
  if (heat >= 75) return "Boiling";
  if (heat >= 50) return "Hot";
  if (heat >= 25) return "Warm";
  return "Cool";
}

export function verdict(customer: number, privilege: number): { title: string; text: string } {
  if (customer - privilege >= 12) {
    return {
      title: "You mostly pleased customers",
      text: "Cheaper kerosene did the work. A market entrepreneur, in Burton Folsom's sense, gets rich because buyers prefer the product. That is the case for the Captain of Industry label.",
    };
  }
  if (privilege - customer >= 12) {
    return {
      title: "You mostly used privilege",
      text: "Rebates, pressure, and favors moved more share than the stills did. Folsom would call that a political entrepreneur. Tarbell would say the race was not started fair.",
    };
  }
  return {
    title: "Both stories fit your ledger",
    text: "Prices moved and so did secret advantages. Folsom and Tarbell agree that special privilege is unfair. They disagree about which half of a fortune like this one it explains. That disagreement is DBQ question 11.",
  };
}

export const LENS_MARKET =
  "Free-market lens (Folsom): political entrepreneurs have “sought and received help from the state.” Market entrepreneurs have “succeeded without it.” Milton Friedman and Thomas Sowell make the same split: you profit when customers choose you, or you profit when government blocks the other seller.";

export const LENS_CRITIC =
  "Critics' lens (Tarbell and Lloyd): Ida Tarbell wrote that Standard's advantage was “special privileges obtained by persistent secret effort,” and that Rockefeller had “played with loaded dice.” Henry Demarest Lloyd attacked concentrated power itself. Falling lamp prices, they argued, arrived with crushed rivals.";

export const HISTORICAL_PRICE = [
  { year: 1870, price: 26 },
  { year: 1885, price: 8 },
] as const;
