import type Phaser from "phaser";

export interface RiseApi {
  game: Phaser.Game | null;
  ready: () => boolean;
  phase: () => string;
  instant: boolean;
  startQuick: () => void;
  startFull: () => void;
  startTeams: () => void;
  startSpread: () => void;
  openQuiz: () => void;
  act: () => void;
}

export const riseApi: RiseApi = {
  game: null,
  ready: () => false,
  phase: () => "boot",
  instant: false,
  startQuick: () => undefined,
  startFull: () => undefined,
  startTeams: () => undefined,
  startSpread: () => undefined,
  openQuiz: () => undefined,
  act: () => undefined,
};

declare global {
  interface Window {
    __RISE__?: RiseApi;
  }
}
