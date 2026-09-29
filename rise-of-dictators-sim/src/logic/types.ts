export type Faction =
  | "democracy"
  | "weimar"
  | "fascist"
  | "nazi"
  | "japan"
  | "soviet"
  | "nationalist"
  | "china"
  | "occupied"
  | "neutral"
  | "contested"
  | "colonial";

export type RoleId = "allies" | "soviet" | "axis" | "analyst" | "chinaSpain";

export type CardKind = "event" | "propaganda" | "treaty" | "alliance" | "response";

export type Length = "quick" | "full";

export type Mode = "solo" | "teams";

export type Phase = "solemn" | "headline" | "decide" | "verdict" | "question" | "explain" | "battle" | "note" | "debrief";

export interface Hold {
  faction: Faction;
  caption: string;
  armies: number;
}

export type Snapshot = Record<string, Hold>;

export interface TerritoryDef {
  id: string;
  name: string;
  full: string;
  region: string;
  x: number;
  y: number;
  w: number;
  h: number;
  shape: "rect" | "round";
  neighbors: string[];
}

export interface CardDef {
  id: string;
  kind: CardKind;
  title: string;
  claim: string;
  verdict: string;
  insight: boolean;
  whatIf: boolean;
}

export interface Question {
  prompt: string;
  choices: string[];
  answer: number;
  explain: string;
}

export interface BattleDef {
  id: string;
  title: string;
  date: string;
  attacker: string;
  defender: string;
  historical: "attacker" | "defender";
  summary: string;
  fromId: string;
  toId: string;
}

export interface SolemnDef {
  id: string;
  title: string;
  paragraphs: string[];
  source: string;
}

export interface EraDef {
  id: string;
  startYear: number;
  endYear: number;
  ticker: string;
  name: string;
  headline: string;
  dateline: string;
  deck: string;
  pages: string[];
  source: string;
  cause: string;
  effect: string;
  snapshot: Snapshot;
  battle?: BattleDef;
  solemnId?: string;
  question: Question;
  cards: Record<RoleId, [CardDef, CardDef]>;
  asides: { title: string; text: string }[];
  badge?: string;
  portrait: string;
}

export interface LogLine {
  year: string;
  text: string;
}

export interface TeamState {
  id: string;
  name: string;
  role: RoleId;
  color: string;
  insight: number;
  streak: number;
  bestStreak: number;
}

export interface BattleRoll {
  attackerDice: [number, number];
  defenderDice: [number, number];
  attackerTotal: number;
  defenderTotal: number;
  diceWinner: "attacker" | "defender" | "tie";
  historical: "attacker" | "defender";
}

export interface GameState {
  version: 1;
  seed: number;
  rng: number;
  mode: Mode;
  length: Length;
  notesOn: boolean;
  teams: TeamState[];
  eraIndex: number;
  activeTeam: number;
  actorPos: number;
  phase: Phase;
  log: LogLine[];
  seenSolemn: string[];
  verdict: { title: string; text: string; insight: boolean } | null;
  answer: { choice: number; correct: boolean; explain: string } | null;
  battle: BattleRoll | null;
  whatIfs: string[];
  badges: string[];
  aside: string;
}

export type SpreadTone =
  | "weimar"
  | "nazi"
  | "pressure"
  | "invaded"
  | "axis"
  | "allied"
  | "soviet"
  | "neutral"
  | "liberated"
  | "occupiedEnd"
  | "falling";

export interface SpreadTerritory {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  shape: "rect" | "round";
  weight: number;
}

export interface SpreadStep {
  id: string;
  year: number;
  yearLabel: string;
  title: string;
  phaseKind: "rise" | "expansion" | "reversal" | "aftermath";
  tones: Record<string, SpreadTone>;
  fact: string;
  source: string;
  decisionPrompt: string;
  decisions: { id: string; label: string; historical: boolean; note: string }[];
  check: Question;
}

export interface SpreadState {
  version: 1;
  length: Length;
  stepIndex: number;
  phase: "play" | "feedback" | "reflect" | "done";
  decisionId: string | null;
  answered: boolean;
  choice: number | null;
  feedback: string;
  insight: number;
  streak: number;
  bestStreak: number;
  decisions: string[];
  reflect: Record<string, "serious" | "complicated" | null>;
  reflectScored: boolean;
  badges: string[];
}

export interface QuizState {
  index: number;
  picked: number | null;
  correctCount: number;
  showExplain: boolean;
  done: boolean;
  picks: number[];
}
