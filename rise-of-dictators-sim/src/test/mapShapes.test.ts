import { describe, expect, it } from "vitest";
import { SPREAD_BOARD, WORLD_BOARD } from "../game/mapShapes";
import { SPREAD_TERRITORIES } from "../logic/spread";
import { TERRITORY_IDS } from "../logic/territories";

describe("map shapes", () => {
  it("covers every world territory with a visible outline", () => {
    const ids = WORLD_BOARD.shapes.map((shape) => shape.id).sort();
    expect(ids).toEqual([...TERRITORY_IDS].sort());
    for (const shape of WORLD_BOARD.shapes) {
      expect(shape.rings.length).toBeGreaterThan(0);
      expect(shape.rings[0].length).toBeGreaterThanOrEqual(6);
    }
  });

  it("covers every Hitler's Spread territory", () => {
    const ids = SPREAD_BOARD.shapes.map((shape) => shape.id).sort();
    expect(ids).toEqual(SPREAD_TERRITORIES.map((territory) => territory.id).sort());
  });

  it("keeps anchors on the chart", () => {
    for (const board of [WORLD_BOARD, SPREAD_BOARD]) {
      for (const shape of board.shapes) {
        expect(shape.anchor[0]).toBeGreaterThan(-40);
        expect(shape.anchor[0]).toBeLessThan(board.w + 40);
        expect(shape.anchor[1]).toBeGreaterThan(-40);
        expect(shape.anchor[1]).toBeLessThan(board.h + 40);
      }
    }
  });
});
