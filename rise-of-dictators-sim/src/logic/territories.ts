import type { TerritoryDef } from "./types";

/** Design pixels on a 1200×440 board. The view scales geometry, not type. */
function R(
  id: string,
  name: string,
  full: string,
  region: string,
  x: number,
  y: number,
  w: number,
  h: number,
  neighbors: string[],
  shape: "rect" | "round" = "rect",
): TerritoryDef {
  return { id, name, full, region, x, y, w, h, neighbors, shape };
}

export const TERRITORIES: TerritoryDef[] = [
  R("canada", "Canada", "Canada", "Americas", 16, 16, 168, 78, ["usa"], "rect"),
  R("usa", "United States", "United States", "Americas", 16, 100, 184, 108, ["canada", "latin", "philippines"], "rect"),
  R("latin", "Latin America", "Latin America", "Americas", 36, 214, 140, 200, ["usa"], "rect"),

  R("britain", "Britain", "United Kingdom", "Europe", 250, 20, 86, 78, ["france", "low", "dennor"], "round"),
  R("dennor", "Denmark & Norway", "Denmark and Norway", "Europe", 344, 16, 96, 56, ["britain", "sweden", "germany"], "rect"),
  R("sweden", "Sweden", "Sweden", "Europe", 446, 16, 64, 56, ["dennor"], "rect"),
  R("france", "France", "France", "Europe", 236, 108, 112, 96, ["britain", "spain", "low", "italy", "germany"], "rect"),
  R("low", "Low Countries", "Belgium, the Netherlands, and Luxembourg", "Europe", 354, 80, 72, 50, ["britain", "france", "germany"], "rect"),
  R("germany", "Germany", "Germany", "Europe", 432, 78, 108, 92, ["dennor", "low", "france", "poland", "austria", "czech"], "rect"),
  R("poland", "Poland", "Poland", "Europe", 546, 48, 100, 100, ["germany", "czech", "wsoviet"], "rect"),
  R("austria", "Austria", "Austria", "Europe", 432, 176, 72, 48, ["germany", "italy", "czech"], "rect"),
  R("czech", "Czechoslovakia", "Czechoslovakia", "Europe", 546, 154, 96, 52, ["germany", "poland", "austria"], "rect"),
  R("spain", "Spain", "Spain", "Europe", 214, 212, 124, 96, ["france"], "rect"),
  R("italy", "Italy", "Italy", "Europe", 354, 176, 74, 120, ["france", "austria", "balkans"], "rect"),
  R("balkans", "Balkans", "Balkans, including Greece and Yugoslavia", "Europe", 510, 214, 130, 100, ["italy", "turkey"], "rect"),

  R("wsoviet", "Soviet West", "Western Soviet Union", "Soviet Union", 660, 16, 168, 148, ["poland", "siberia", "turkey"], "rect"),
  R("siberia", "Siberia", "Siberia", "Soviet Union", 836, 12, 220, 84, ["wsoviet", "manchuria"], "rect"),

  R("turkey", "Turkey", "Turkey", "Middle East", 660, 172, 140, 78, ["balkans", "wsoviet", "mideast"], "rect"),
  R("mideast", "Middle East", "Middle East mandates and states", "Middle East", 660, 256, 160, 90, ["turkey", "egypt"], "rect"),

  R("nafrica", "North Africa", "North Africa", "Mediterranean and Africa", 214, 320, 200, 52, ["spain", "egypt", "wafrica"], "rect"),
  R("egypt", "Egypt", "Egypt", "Mediterranean and Africa", 420, 320, 150, 52, ["nafrica", "mideast", "ethiopia"], "rect"),
  R("wafrica", "West Africa", "West and Central Africa", "Africa", 200, 378, 160, 54, ["nafrica", "safrica"], "rect"),
  R("ethiopia", "Ethiopia", "Ethiopia", "Africa", 366, 378, 110, 54, ["egypt", "safrica"], "rect"),
  R("safrica", "Southern Africa", "Southern Africa", "Africa", 482, 378, 130, 54, ["wafrica", "ethiopia"], "rect"),

  R("manchuria", "Manchuria", "Manchuria", "East Asia", 836, 104, 222, 66, ["siberia", "nchina", "korea"], "rect"),
  R("nchina", "North China", "Northern China", "East Asia", 820, 176, 230, 70, ["manchuria", "schina"], "rect"),
  R("schina", "South China", "Southern China", "East Asia", 820, 252, 190, 78, ["nchina", "seasia"], "rect"),
  R("korea", "Korea", "Korea", "East Asia", 1064, 108, 42, 78, ["manchuria", "japan"], "rect"),
  R("japan", "Japan", "Japan", "East Asia", 1112, 80, 72, 140, ["korea", "pacific"], "round"),
  R("seasia", "SE Asia", "Southeast Asia", "Pacific", 1020, 252, 90, 98, ["schina", "philippines"], "rect"),
  R("philippines", "Philippines", "Philippines", "Pacific", 1116, 228, 68, 78, ["seasia", "japan", "usa"], "round"),
  R("pacific", "Pacific Islands", "Pacific islands", "Pacific", 1024, 356, 150, 36, ["japan", "australia"], "round"),
  R("australia", "Australia", "Australia", "Pacific", 1000, 396, 184, 36, ["pacific"], "round"),
];

export const TERRITORY_IDS = TERRITORIES.map((territory) => territory.id);

export function territoryById(id: string): TerritoryDef {
  const found = TERRITORIES.find((territory) => territory.id === id);
  if (!found) throw new Error(`Unknown territory ${id}`);
  return found;
}

export function rectsOverlap(): string[] {
  const hits: string[] = [];
  for (let i = 0; i < TERRITORIES.length; i += 1) {
    for (let j = i + 1; j < TERRITORIES.length; j += 1) {
      const a = TERRITORIES[i];
      const b = TERRITORIES[j];
      const separated = a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
      if (!separated) hits.push(`${a.id} overlaps ${b.id}`);
    }
  }
  return hits;
}
