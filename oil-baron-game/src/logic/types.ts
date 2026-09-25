export type CardKind = "efficiency" | "privilege";
export type Personality = "merchant" | "privilege" | "efficiency" | "stubborn";
export type RoundLength = 6 | 10;
export type Mode = "solo" | "teams";
export type Phase = "choose" | "event" | "epilogue" | "done";
export type Severity = "info" | "major";

export interface CardDef {
  id: string;
  name: string;
  kind: CardKind;
  summary: string;
  history: string;
  minYear?: number;
  once?: boolean;
  cost: number;
  price: number;
  share: number;
  opinion: number;
  heat: number;
  quality: number;
  buyout?: boolean;
  squeeze?: boolean;
}

export interface RivalState {
  id: string;
  name: string;
  short: string;
  personality: Personality;
  blurb: string;
  share: number;
  health: number;
  alive: boolean;
}

export interface PlayedCard {
  id: string;
  name: string;
  kind: CardKind;
  year: number;
}

export interface EventView {
  id: string;
  title: string;
  yearLabel: string;
  body: string;
  fact: string;
  severity: Severity;
}

export interface TeamState {
  id: string;
  name: string;
  color: string;
  share: number;
  cost: number;
  opinion: number;
  heat: number;
  quality: number;
  price: number;
  priceHistory: { year: number; price: number }[];
  rivals: RivalState[];
  played: PlayedCard[];
  hand: string[];
  buyouts: number;
  trustFormed: boolean;
  rebatesIllegal: boolean;
  tidewater: boolean;
  pipelineOwned: boolean;
  barrelsOwned: boolean;
  trustBuster: boolean;
  efficiencyBuilds: number;
  privilegeMoves: number;
  notes: string[];
}

export interface GameState {
  version: 1;
  seed: number;
  rng: number;
  mode: Mode;
  roundLength: RoundLength;
  years: number[];
  roundIndex: number;
  phase: Phase;
  activeTeam: number;
  teams: TeamState[];
  timerEnabled: boolean;
  timerSeconds: number;
  event: EventView | null;
  banner: string;
}
