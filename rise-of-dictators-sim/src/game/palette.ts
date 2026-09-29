import type { Faction, SpreadTone } from "../logic/types";

export const CREAM = "#f3ead7";
export const MUTED = "#cbbfa6";
export const GOLD = "#d4b15a";
export const INK = "#1a120c";
export const RUST = "#8e3a34";

export const COL = {
  bg: 0x12110e,
  ocean: 0x163044,
  oceanDeep: 0x102838,
  paper: 0xe7d7b8,
  paperDark: 0xd3c19a,
  panel: 0x1c1814,
  panelHover: 0x34291f,
  ink: 0x1a120c,
  gold: 0xd4b15a,
  rust: 0x8e3a34,
};

export interface FactionStyle {
  label: string;
  letter: string;
  fill: number;
  ink: string;
}

export const FACTION: Record<Faction, FactionStyle> = {
  democracy: { label: "Democracy", letter: "D", fill: 0x2c5d86, ink: CREAM },
  weimar: { label: "Weimar", letter: "W", fill: 0x6e7f5c, ink: INK },
  fascist: { label: "Fascist Italy", letter: "I", fill: 0x6a6b38, ink: CREAM },
  nazi: { label: "Nazi rule", letter: "N", fill: 0x8e3a34, ink: CREAM },
  japan: { label: "Imperial Japan", letter: "J", fill: 0xb06a2c, ink: INK },
  soviet: { label: "Soviet Union", letter: "S", fill: 0x7a3050, ink: CREAM },
  nationalist: { label: "Nationalist Spain", letter: "F", fill: 0x6b4e36, ink: CREAM },
  china: { label: "China", letter: "C", fill: 0x2f6b5c, ink: CREAM },
  occupied: { label: "Occupied", letter: "O", fill: 0xa15c40, ink: CREAM },
  neutral: { label: "Neutral", letter: "·", fill: 0xc6b48c, ink: INK },
  contested: { label: "At war", letter: "!", fill: 0xb08a3c, ink: INK },
  colonial: { label: "Empire / mandate", letter: "E", fill: 0x4f7c86, ink: CREAM },
};

export const TONE: Record<SpreadTone, { fill: number; ink: string; label: string }> = {
  weimar: { fill: 0x6e7f5c, ink: INK, label: "Republic" },
  nazi: { fill: 0x8e3a34, ink: CREAM, label: "Nazi rule" },
  pressure: { fill: 0xa86b3a, ink: INK, label: "Ceded, not yet swallowed" },
  invaded: { fill: 0x6e3a48, ink: CREAM, label: "Invaded, not conquered" },
  axis: { fill: 0x6a6b38, ink: CREAM, label: "Axis partner" },
  allied: { fill: 0x2c5d86, ink: CREAM, label: "Allied / democracy" },
  soviet: { fill: 0x7a3050, ink: CREAM, label: "Soviet Union" },
  neutral: { fill: 0xc6b48c, ink: INK, label: "Neutral" },
  liberated: { fill: 0x3d6e62, ink: CREAM, label: "Freed from Nazi rule" },
  occupiedEnd: { fill: 0x8a7a62, ink: INK, label: "Allied occupation, 1945" },
  falling: { fill: 0x8a6a3a, ink: INK, label: "Fascist government falling" },
};

export const LEGEND: Faction[] = ["democracy", "nazi", "fascist", "japan", "soviet", "nationalist", "occupied", "neutral"];

export function display(size: number, color = CREAM, bold = false): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: "Oswald, sans-serif",
    fontSize: `${size}px`,
    color,
    fontStyle: bold ? "bold" : "normal",
  };
}

export function serif(size: number, color = CREAM, italic = false): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: '"Source Serif 4", Georgia, serif',
    fontSize: `${size}px`,
    color,
    fontStyle: italic ? "italic" : "normal",
  };
}
