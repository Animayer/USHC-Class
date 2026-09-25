import type Phaser from "phaser";

export interface OilApi {
  game: Phaser.Game | null;
  phase: () => string;
  startSoloShort: () => void;
}

export const oilApi: OilApi = {
  game: null,
  phase: () => "boot",
  startSoloShort: () => undefined,
};

declare global {
  interface Window {
    __OILBARON__?: OilApi;
  }
}
