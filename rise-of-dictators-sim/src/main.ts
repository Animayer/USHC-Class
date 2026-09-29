import "@fontsource/oswald/500.css";
import "@fontsource/oswald/600.css";
import "@fontsource/oswald/700.css";
import "@fontsource/source-serif-4/400.css";
import "@fontsource/source-serif-4/600.css";
import "@fontsource/source-serif-4/400-italic.css";
import Phaser from "phaser";
import { riseApi } from "./game/api";
import { BootScene } from "./scenes/BootScene";
import { EndScene } from "./scenes/EndScene";
import { IntroScene } from "./scenes/IntroScene";
import { PlayScene } from "./scenes/PlayScene";
import { SpreadScene } from "./scenes/SpreadScene";
import { TitleScene } from "./scenes/TitleScene";

const game = new Phaser.Game({
  type: Phaser.CANVAS,
  parent: "game",
  width: 1920,
  height: 1080,
  backgroundColor: "#12110e",
  banner: false,
  audio: { noAudio: true },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1920,
    height: 1080,
  },
  render: {
    antialias: true,
    roundPixels: false,
  },
  scene: [BootScene, TitleScene, IntroScene, PlayScene, SpreadScene, EndScene],
});

riseApi.game = game;
window.__RISE__ = riseApi;
