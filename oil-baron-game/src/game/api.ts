import type Phaser from "phaser";
import type { GameState } from "../logic/types";

export interface OilApi {
  game: Phaser.Game | null;
  phase: () => string;
  pending: GameState | null;
  startSoloShort: () => void;
  startSoloFull: () => void;
  openTeams: () => void;
  startTeams: () => void;
  act: () => void;
  playAgain: () => void;
}

export const oilApi: OilApi = {
  game: null,
  phase: () => "boot",
  pending: null,
  startSoloShort: () => undefined,
  startSoloFull: () => undefined,
  openTeams: () => undefined,
  startTeams: () => undefined,
  act: () => undefined,
  playAgain: () => undefined,
};

declare global {
  interface Window {
    __OILBARON__?: OilApi;
  }
}
