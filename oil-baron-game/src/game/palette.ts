export const INK = "#f4efe4";
export const MUTED = "#c8c0b0";
export const GOLD = "#f0c14a";
export const BLUE = "#7ec8e3";
export const EFF = "#0072b2";
export const PRIV = "#e69f00";
export const PANEL = 0x1c2430;
export const PANEL_EDGE = 0xf0c14a;

export function textStyle(
  size: number,
  color = INK,
  bold = false,
): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: "system-ui, Segoe UI, Roboto, sans-serif",
    fontSize: `${size}px`,
    color,
    fontStyle: bold ? "bold" : "normal",
  };
}
