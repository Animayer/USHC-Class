import Phaser from "phaser";
import { oilApi } from "../game/api";
import { buildTextures } from "../game/textures";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  create(): void {
    buildTextures(this);
    oilApi.phase = () => "boot";
    this.scene.start("title");
  }
}
