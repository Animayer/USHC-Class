import Phaser from "phaser";
import { oilApi } from "./game/api";
import { BootScene } from "./scenes/BootScene";
import { EndScene } from "./scenes/EndScene";
import { PlayScene } from "./scenes/PlayScene";
import { TitleScene } from "./scenes/TitleScene";

const game = new Phaser.Game({
  type: Phaser.CANVAS,
  parent: "game",
  width: 1280,
  height: 800,
  backgroundColor: "#141a22",
  banner: false,
  audio: { noAudio: true },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 800,
  },
  render: {
    antialias: false,
    roundPixels: true,
  },
  scene: [BootScene, TitleScene, PlayScene, EndScene],
});

oilApi.game = game;
window.__OILBARON__ = oilApi;
