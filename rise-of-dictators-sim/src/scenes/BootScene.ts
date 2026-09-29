import Phaser from "phaser";
import { riseApi } from "../game/api";
import { paintPortraits } from "../game/portraits";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  create(): void {
    paintPortraits(this);
    riseApi.phase = () => "boot";
    riseApi.ready = () => false;
    const params = new URLSearchParams(window.location.search);
    const shot = params.get("shot");
    const year = Number(params.get("year") || "1933");
    let started = false;
    const go = () => {
      if (started) return;
      if (!this.scene.isActive("boot")) return;
      started = true;
      if (shot === "spread") this.scene.start("spread", { year, shot: true });
      else if (shot === "quiz") this.scene.start("end", { quiz: true, shot: true });
      else if (shot && shot !== "title") this.scene.start("play", { shot });
      else this.scene.start("title");
    };
    void document.fonts.ready.then(go);
    this.time.delayedCall(1200, () => {
      if (riseApi.phase() === "boot") go();
    });
  }
}
