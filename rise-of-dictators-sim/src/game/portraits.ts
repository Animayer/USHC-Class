import Phaser from "phaser";

export interface PortraitSpec {
  id: string;
  name: string;
  skin: string;
  hair: string;
  hairStyle: "bald" | "side" | "crop" | "full" | "gray-sides";
  mustache: "none" | "small" | "brush" | "thin" | "walrus";
  glasses: boolean;
  collar: "suit" | "tunic" | "military" | "bow";
  cap: boolean;
  face: "square" | "long" | "round";
  brow: number;
}

export const PORTRAITS: PortraitSpec[] = [
  { id: "mussolini", name: "Mussolini", skin: "#d7a47a", hair: "#1a1a1a", hairStyle: "bald", mustache: "none", glasses: false, collar: "military", cap: false, face: "square", brow: 3 },
  { id: "hitler", name: "Hitler", skin: "#d2b294", hair: "#161616", hairStyle: "side", mustache: "small", glasses: false, collar: "suit", cap: false, face: "square", brow: 2 },
  { id: "stalin", name: "Stalin", skin: "#c89878", hair: "#1a1a1a", hairStyle: "full", mustache: "brush", glasses: false, collar: "tunic", cap: false, face: "square", brow: 4 },
  { id: "franco", name: "Franco", skin: "#c8a484", hair: "#3a342e", hairStyle: "crop", mustache: "thin", glasses: false, collar: "military", cap: true, face: "long", brow: 2 },
  { id: "tojo", name: "Tojo", skin: "#c89870", hair: "#1c1c1c", hairStyle: "crop", mustache: "small", glasses: true, collar: "military", cap: true, face: "round", brow: 2 },
  { id: "churchill", name: "Churchill", skin: "#e0c0a0", hair: "#8a8680", hairStyle: "gray-sides", mustache: "none", glasses: false, collar: "bow", cap: false, face: "round", brow: 3 },
  { id: "fdr", name: "F.D.R.", skin: "#d8b898", hair: "#6e6a64", hairStyle: "side", mustache: "none", glasses: true, collar: "suit", cap: false, face: "long", brow: 1 },
  { id: "chamberlain", name: "Chamberlain", skin: "#d8c0a8", hair: "#9a9590", hairStyle: "side", mustache: "thin", glasses: false, collar: "suit", cap: false, face: "long", brow: 1 },
  { id: "chiang", name: "Chiang", skin: "#c89068", hair: "#1a1a1a", hairStyle: "crop", mustache: "thin", glasses: false, collar: "tunic", cap: false, face: "square", brow: 2 },
  { id: "mao", name: "Mao", skin: "#c88860", hair: "#1a1a1a", hairStyle: "full", mustache: "none", glasses: false, collar: "tunic", cap: false, face: "round", brow: 2 },
  { id: "petain", name: "Pétain", skin: "#d8c4a8", hair: "#b0aaa4", hairStyle: "crop", mustache: "walrus", glasses: false, collar: "military", cap: true, face: "long", brow: 2 },
  { id: "hirohito", name: "Hirohito", skin: "#d0a888", hair: "#2a2a2a", hairStyle: "crop", mustache: "small", glasses: true, collar: "military", cap: false, face: "long", brow: 1 },
  { id: "degaulle", name: "de Gaulle", skin: "#d0b090", hair: "#2c2c2c", hairStyle: "side", mustache: "thin", glasses: false, collar: "military", cap: true, face: "long", brow: 2 },
];

export function portraitKey(id: string): string {
  return `portrait-${id}`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function paintPortraits(scene: Phaser.Scene): void {
  for (const spec of PORTRAITS) {
    const canvas = document.createElement("canvas");
    canvas.width = 96;
    canvas.height = 118;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    drawPortrait(ctx, spec);
    if (scene.textures.exists(portraitKey(spec.id))) scene.textures.remove(portraitKey(spec.id));
    scene.textures.addCanvas(portraitKey(spec.id), canvas);
  }
}

function drawPortrait(ctx: CanvasRenderingContext2D, spec: PortraitSpec): void {
  ctx.clearRect(0, 0, 96, 118);
  ctx.fillStyle = "#1a1612";
  ctx.fillRect(0, 0, 96, 118);
  ctx.strokeStyle = "#d4b15a";
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, 92, 114);

  const cloth = spec.collar === "suit" || spec.collar === "bow" ? "#243044" : spec.collar === "tunic" ? "#3e4a32" : "#3a4034";
  ctx.fillStyle = cloth;
  ctx.beginPath();
  ctx.moveTo(16, 118);
  ctx.lineTo(28, 78);
  ctx.lineTo(68, 78);
  ctx.lineTo(80, 118);
  ctx.fill();

  const width = spec.face === "long" ? 28 : spec.face === "round" ? 34 : 32;
  const headH = spec.face === "long" ? 40 : spec.face === "round" ? 36 : 34;
  const hx = 48 - width / 2;
  const hy = spec.face === "long" ? 28 : 32;
  ctx.fillStyle = spec.skin;
  roundRect(ctx, hx, hy, width, headH, spec.face === "round" ? 16 : 10);
  ctx.fill();

  ctx.fillStyle = spec.skin;
  ctx.fillRect(44, hy + headH - 4, 8, 12);

  ctx.fillStyle = spec.hair;
  if (spec.hairStyle === "bald") {
    ctx.fillRect(hx + 2, hy - 2, width - 4, 6);
  } else if (spec.hairStyle === "gray-sides") {
    ctx.fillRect(hx - 1, hy + 6, 8, 16);
    ctx.fillRect(hx + width - 7, hy + 6, 8, 16);
  } else if (spec.hairStyle === "side") {
    ctx.fillRect(hx, hy - 4, width, 12);
    ctx.fillRect(hx + width - 10, hy + 6, 10, 8);
  } else if (spec.hairStyle === "full") {
    ctx.fillRect(hx - 2, hy - 6, width + 4, 16);
    ctx.fillRect(hx - 2, hy + 8, 6, 12);
    ctx.fillRect(hx + width - 4, hy + 8, 6, 12);
  } else {
    ctx.fillRect(hx + 1, hy - 3, width - 2, 10);
  }

  ctx.fillStyle = "#1a120c";
  ctx.fillRect(hx + 6, hy + 14, width - 12, spec.brow);

  const eyeY = hy + 18;
  ctx.fillStyle = "#f4efe4";
  ctx.fillRect(hx + 7, eyeY, 6, 4);
  ctx.fillRect(hx + width - 13, eyeY, 6, 4);
  ctx.fillStyle = "#1a120c";
  ctx.fillRect(hx + 9, eyeY + 1, 3, 3);
  ctx.fillRect(hx + width - 11, eyeY + 1, 3, 3);

  if (spec.glasses) {
    ctx.strokeStyle = "#d5dde6";
    ctx.lineWidth = 2;
    ctx.strokeRect(hx + 5, eyeY - 2, 10, 8);
    ctx.strokeRect(hx + width - 15, eyeY - 2, 10, 8);
    ctx.beginPath();
    ctx.moveTo(hx + 15, eyeY + 2);
    ctx.lineTo(hx + width - 15, eyeY + 2);
    ctx.stroke();
  }

  ctx.fillStyle = "#c48a6a";
  ctx.fillRect(46, hy + 24, 4, spec.face === "long" ? 10 : 7);

  ctx.strokeStyle = "#6a4030";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(42, hy + headH - 10);
  ctx.lineTo(54, hy + headH - 10);
  ctx.stroke();

  ctx.fillStyle = "#1a120c";
  if (spec.mustache === "small") ctx.fillRect(42, hy + headH - 14, 12, 4);
  if (spec.mustache === "thin") ctx.fillRect(40, hy + headH - 13, 16, 3);
  if (spec.mustache === "brush") ctx.fillRect(38, hy + headH - 16, 20, 7);
  if (spec.mustache === "walrus") {
    ctx.fillStyle = "#c8c2ba";
    ctx.fillRect(36, hy + headH - 16, 24, 8);
  }

  if (spec.collar === "bow") {
    ctx.fillStyle = "#f3ead7";
    ctx.fillRect(44, 84, 8, 10);
    ctx.fillStyle = "#8e3a34";
    ctx.beginPath();
    ctx.moveTo(48, 90);
    ctx.lineTo(38, 84);
    ctx.lineTo(38, 96);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(48, 90);
    ctx.lineTo(58, 84);
    ctx.lineTo(58, 96);
    ctx.fill();
  } else if (spec.collar === "suit") {
    ctx.fillStyle = "#f3ead7";
    ctx.beginPath();
    ctx.moveTo(44, 80);
    ctx.lineTo(48, 96);
    ctx.lineTo(52, 80);
    ctx.fill();
    ctx.fillStyle = "#8e3a34";
    ctx.fillRect(46, 88, 4, 12);
  } else {
    ctx.fillStyle = "#d4b15a";
    ctx.fillRect(46, 86, 4, 4);
    ctx.strokeStyle = "#d4b15a";
    ctx.lineWidth = 2;
    ctx.strokeRect(34, 80, 28, 16);
  }

  if (spec.cap) {
    ctx.fillStyle = cloth;
    ctx.fillRect(hx - 2, hy - 8, width + 4, 10);
    ctx.fillRect(hx - 8, hy - 1, width + 16, 5);
    ctx.fillStyle = "#d4b15a";
    ctx.fillRect(hx + width / 2 - 4, hy - 6, 8, 5);
  }
}
