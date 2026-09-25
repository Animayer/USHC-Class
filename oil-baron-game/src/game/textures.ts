function stamp(
  scene: Phaser.Scene,
  name: string,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
): void {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  draw(ctx);
  if (scene.textures.exists(name)) scene.textures.remove(name);
  scene.textures.addCanvas(name, canvas);
  scene.textures.get(name).setFilter(Phaser.Textures.FilterMode.NEAREST);
}

function px(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function refinery(ctx: CanvasRenderingContext2D, level: number) {
  px(ctx, "#00000000", 0, 0, 64, 64);
  px(ctx, "#5c5346", 4, 40, 56, 16);
  px(ctx, "#3d4a44", 8, 28, 16, 16);
  px(ctx, "#0072b2", 10, 18, 12, 12);
  px(ctx, "#d9d3c5", 14, 8, 4, 10);
  if (level >= 1) {
    px(ctx, "#3d4a44", 26, 26, 14, 18);
    px(ctx, "#c4c0b4", 30, 12, 4, 14);
  }
  if (level >= 2) {
    px(ctx, "#8a9aa3", 42, 32, 16, 12);
    px(ctx, "#8a9aa3", 44, 28, 12, 6);
  }
  if (level >= 3) {
    px(ctx, "#c4c0b4", 48, 10, 4, 22);
    px(ctx, "#6b8f4e", 6, 44, 20, 4);
  }
  if (level >= 4) {
    px(ctx, "#0072b2", 4, 22, 8, 18);
    px(ctx, "#e69f00", 20, 36, 6, 6);
  }
  px(ctx, "#7ec8e3", 8, 42, 6, 4);
}

export function buildTextures(scene: Phaser.Scene): void {
  stamp(scene, "land", 760, 440, (ctx) => {
    px(ctx, "#7dae5a", 0, 0, 760, 440);
    px(ctx, "#3d97b8", 0, 0, 760, 112);
    for (let x = 0; x < 760; x += 16) px(ctx, x % 32 === 0 ? "#7ec8e3" : "#2f7f9e", x, 96, 8, 4);
    px(ctx, "#e6c98a", 0, 112, 760, 16);
    px(ctx, "#2f7f9e", 150, 120, 18, 200);
    px(ctx, "#2f7f9e", 160, 300, 40, 16);
    px(ctx, "#2f7f9e", 190, 310, 16, 80);
    for (let x = 70; x < 250; x += 28) {
      px(ctx, "#5c5346", x, 180, 22, 16);
      px(ctx, "#3d3530", x + 4, 172, 8, 8);
    }
    px(ctx, "#4a4038", 0, 318, 760, 8);
    for (let x = 0; x < 760; x += 14) px(ctx, "#2a241e", x, 314, 8, 4);
    px(ctx, "#c4a06a", 520, 150, 200, 160);
    for (let i = 0; i < 6; i += 1) {
      px(ctx, "#3d3530", 540 + i * 28, 190, 6, 28);
      px(ctx, "#2a241e", 536 + i * 28, 184, 14, 6);
    }
    px(ctx, "#7da05a", 20, 150, 10, 16);
    px(ctx, "#7da05a", 400, 250, 10, 16);
    px(ctx, "#5c8f3e", 24, 146, 8, 6);
    px(ctx, "#5c8f3e", 404, 246, 8, 6);
  });

  for (let level = 0; level <= 4; level += 1) {
    stamp(scene, `refinery-${level}`, 64, 64, (ctx) => refinery(ctx, level));
  }

  stamp(scene, "rival-brick", 56, 52, (ctx) => {
    px(ctx, "#8c4a3a", 6, 18, 40, 28);
    px(ctx, "#e6d2b5", 12, 24, 8, 8);
    px(ctx, "#e6d2b5", 28, 24, 8, 8);
    px(ctx, "#5c5346", 4, 42, 46, 6);
    px(ctx, "#3d3530", 22, 6, 6, 14);
  });
  stamp(scene, "rival-warehouse", 64, 40, (ctx) => {
    px(ctx, "#6b5a78", 2, 14, 60, 20);
    px(ctx, "#d9d3c5", 8, 18, 10, 8);
    px(ctx, "#d9d3c5", 24, 18, 10, 8);
    px(ctx, "#d9d3c5", 40, 18, 10, 8);
    px(ctx, "#3d3530", 0, 32, 64, 6);
  });
  stamp(scene, "rival-tanks", 56, 48, (ctx) => {
    px(ctx, "#009e73", 4, 16, 16, 22);
    px(ctx, "#009e73", 24, 10, 18, 28);
    px(ctx, "#0b6e52", 8, 12, 8, 6);
    px(ctx, "#0b6e52", 28, 6, 10, 6);
    px(ctx, "#5c5346", 0, 38, 56, 6);
  });
  stamp(scene, "rival-derrick", 48, 56, (ctx) => {
    px(ctx, "#3d3530", 22, 8, 4, 36);
    px(ctx, "#3d3530", 10, 8, 28, 3);
    px(ctx, "#8d6b45", 8, 40, 32, 8);
    px(ctx, "#2a241e", 16, 20, 16, 2);
    px(ctx, "#2a241e", 16, 30, 16, 2);
  });
  stamp(scene, "sold", 48, 36, (ctx) => {
    px(ctx, "#5c5346", 4, 16, 40, 14);
    px(ctx, "#d55e00", 8, 4, 28, 14);
    px(ctx, "#f4efe4", 12, 8, 20, 4);
  });
  stamp(scene, "train-0", 52, 24, (ctx) => {
    px(ctx, "#2a241e", 0, 8, 18, 10);
    px(ctx, "#d55e00", 4, 4, 8, 6);
    px(ctx, "#c4c0b4", 2, 0, 4, 4);
    px(ctx, "#8d6b45", 20, 8, 14, 10);
    px(ctx, "#0072b2", 36, 8, 14, 10);
    px(ctx, "#1b1b1b", 2, 18, 6, 6);
    px(ctx, "#1b1b1b", 24, 18, 6, 6);
    px(ctx, "#1b1b1b", 40, 18, 6, 6);
  });
  stamp(scene, "train-1", 52, 24, (ctx) => {
    px(ctx, "#2a241e", 0, 8, 18, 10);
    px(ctx, "#d55e00", 4, 4, 8, 6);
    px(ctx, "#e6e6e6", 2, 0, 4, 4);
    px(ctx, "#8d6b45", 20, 8, 14, 10);
    px(ctx, "#0072b2", 36, 8, 14, 10);
    px(ctx, "#1b1b1b", 6, 18, 6, 6);
    px(ctx, "#1b1b1b", 28, 18, 6, 6);
    px(ctx, "#1b1b1b", 44, 18, 6, 6);
  });
  stamp(scene, "smoke", 8, 8, (ctx) => {
    px(ctx, "#d9d3c5", 2, 2, 4, 4);
  });
  stamp(scene, "card-back", 16, 16, (ctx) => {
    px(ctx, "#1c2430", 0, 0, 16, 16);
    px(ctx, "#f0c14a", 2, 2, 12, 12);
    px(ctx, "#1c2430", 4, 4, 8, 8);
  });
}
