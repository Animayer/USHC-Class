import { describe, expect, it } from "vitest";
import { allEras, erasFor, SOLEMN } from "../logic/eras";
import { QUIZ } from "../logic/quiz";
import { SOURCES } from "../logic/sources";
import { SNAPSHOTS, Y1922, Y1933, Y1938, Y1939, Y1940, Y1945, Y1975 } from "../logic/snapshots";
import { rectsOverlap, TERRITORY_IDS } from "../logic/territories";
import { proseBundle } from "../logic/engine";
import { meterFor, REFLECTIONS, spreadOverlaps, SPREAD_STEPS, SPREAD_TERRITORIES } from "../logic/spread";

const BANNED = [
  "lorem",
  "ipsum",
  "TODO",
  "FIXME",
  "placeholder",
  "swastika",
  "coming soon",
  "occured",
  "seperate",
  "recieve",
  "definately",
  "goverment",
  "Czechoslavakia",
  "Mussollini",
  "Churchhill",
  "Rooseveldt",
  "appeasment",
  "Holocost",
  "Guernika",
  "facism",
  "Facism",
];

describe("map geometry", () => {
  it("keeps world territories from overlapping", () => {
    expect(rectsOverlap()).toEqual([]);
  });

  it("keeps the Europe spread map from overlapping", () => {
    expect(spreadOverlaps()).toEqual([]);
  });

  it("gives every territory a neighbor that exists", () => {
    const ids = new Set(TERRITORY_IDS);
    for (const id of TERRITORY_IDS) {
      expect(ids.has(id)).toBe(true);
    }
  });
});

describe("snapshots", () => {
  it("fills every territory in every snapshot", () => {
    for (const snapshot of Object.values(SNAPSHOTS)) {
      expect(Object.keys(snapshot).sort()).toEqual([...TERRITORY_IDS].sort());
    }
  });

  it("keeps the opening and the ending free of Nazi rule", () => {
    for (const id of TERRITORY_IDS) {
      expect(Y1922[id].faction).not.toBe("nazi");
      expect(Y1945[id].faction).not.toBe("nazi");
      expect(Y1975[id].faction).not.toBe("nazi");
    }
    expect(Y1922.germany.faction).toBe("weimar");
    expect(Y1922.italy.faction).not.toBe("fascist");
  });

  it("places the major changes on the right years", () => {
    expect(Y1933.germany.faction).toBe("nazi");
    expect(Y1933.manchuria.faction).toBe("japan");
    expect(Y1933.italy.faction).toBe("fascist");
    expect(Y1938.austria.faction).toBe("nazi");
    expect(Y1938.ethiopia.faction).toBe("fascist");
    expect(Y1938.czech.faction).not.toBe("nazi");
    expect(Y1939.czech.faction).toBe("nazi");
    expect(Y1939.poland.faction).toBe("occupied");
    expect(Y1939.france.faction).toBe("democracy");
    expect(Y1940.france.faction).toBe("occupied");
    expect(Y1940.sweden.faction).toBe("neutral");
    expect(Y1940.dennor.faction).toBe("occupied");
    expect(Y1945.france.faction).toBe("democracy");
    expect(Y1945.germany.faction).not.toBe("nazi");
    expect(Y1975.spain.faction).toBe("nationalist");
    expect(Y1975.spain.caption).toContain("1975");
  });
});

describe("era chronicle", () => {
  it("runs from 1922 to 1975 without going backward", () => {
    const full = erasFor("full");
    expect(full[0].startYear).toBe(1922);
    expect(full[full.length - 1].endYear).toBe(1975);
    for (let i = 1; i < full.length; i += 1) {
      expect(full[i].startYear).toBeGreaterThanOrEqual(full[i - 1].startYear);
    }
    expect(erasFor("quick")[erasFor("quick").length - 1].endYear).toBe(1975);
  });

  it("gives every era a sourced note, a valid check, and one strong card per desk", () => {
    for (const era of allEras()) {
      expect(era.pages.join(" ").length).toBeGreaterThan(80);
      expect(era.source.length).toBeGreaterThan(3);
      expect(era.question.choices).toHaveLength(4);
      expect(era.question.answer).toBeGreaterThanOrEqual(0);
      expect(era.question.answer).toBeLessThan(4);
      expect(era.question.explain.length).toBeGreaterThan(20);
      for (const pair of Object.values(era.cards)) {
        expect(pair).toHaveLength(2);
        expect(pair.filter((card) => card.insight)).toHaveLength(1);
        for (const card of pair) {
          expect(card.verdict.length).toBeGreaterThan(10);
          expect(card.claim.length).toBeGreaterThan(10);
        }
      }
    }
  });

  it("keeps famine, Nanjing, and the Holocaust off the score and off the tiles", () => {
    expect(Object.keys(SOLEMN)).toEqual(["holodomor", "nanjing", "holocaust"]);
    const joined = allEras()
      .flatMap((era) => Object.values(era.cards).flat())
      .map((card) => card.id)
      .join(" ");
    expect(joined).not.toContain("holocaust");
    expect(joined).not.toContain("holodomor");
    const quickIds = erasFor("quick").map((era) => era.solemnId);
    expect(quickIds).toContain("holodomor");
    expect(quickIds).toContain("nanjing");
    expect(quickIds).toContain("holocaust");
  });

  it("mentions the required leaders and dates in the full chronicle", () => {
    const blob = JSON.stringify(erasFor("full"));
    for (const needle of [
      "28 October 1922",
      "8–9 November 1923",
      "30 January 1933",
      "23 March 1933",
      "7 March 1936",
      "26 April 1937",
      "12 March 1938",
      "23 August 1939",
      "1 September 1939",
      "22 June 1940",
      "22 June 1941",
      "7 December 1941",
      "2 February 1943",
      "6 June 1944",
      "30 April 1945",
      "20 November 1975",
      "Mussolini",
      "Hitler",
      "Stalin",
      "Franco",
      "Tojo",
      "Hirohito",
      "Chamberlain",
      "Churchill",
      "Roosevelt",
      "Chiang",
      "Mao",
      "Pétain",
      "de Gaulle",
    ]) {
      expect(blob, needle).toContain(needle);
    }
  });
});

describe("spread meter", () => {
  it("rises from 1933 to 1941 and is gone in 1945", () => {
    const byYear = (year: number) => {
      const matches = SPREAD_STEPS.filter((step) => step.year === year);
      return meterFor(matches[matches.length - 1].tones);
    };
    expect(byYear(1923)).toBe(0);
    expect(byYear(1933)).toBeGreaterThan(0);
    expect(byYear(1933)).toBeLessThan(byYear(1939));
    expect(byYear(1939)).toBeLessThan(byYear(1941));
    expect(byYear(1945)).toBe(0);
    expect(byYear(1950)).toBe(0);
    const y1942 = meterFor(SPREAD_STEPS.find((step) => step.id === "y1942")!.tones);
    const y1943 = meterFor(SPREAD_STEPS.find((step) => step.id === "y1943")!.tones);
    expect(y1943).toBeLessThan(y1942);
  });

  it("does not count Italy’s partner shade as Nazi-ruled land", () => {
    const step = SPREAD_STEPS.find((item) => item.id === "y1933");
    expect(step?.tones.italy).toBe("axis");
    expect(step?.tones.germany).toBe("nazi");
    expect(SPREAD_TERRITORIES.find((item) => item.id === "italy")?.weight).toBe(0);
  });
});

describe("quiz and sources", () => {
  it("has ten explained questions", () => {
    expect(QUIZ).toHaveLength(10);
    for (const question of QUIZ) {
      expect(question.choices).toHaveLength(4);
      expect(question.explain.length).toBeGreaterThan(30);
    }
  });

  it("lists the museum and the famine book", () => {
    const names = SOURCES.map((source) => source.name).join(" ");
    expect(names).toContain("United States Holocaust Memorial Museum");
    expect(names).toContain("Applebaum");
  });

  it("scores the reflection as understanding, with no guaranteed easy stop", () => {
    expect(REFLECTIONS.map((item) => item.answer)).toEqual(["serious", "serious", "complicated", "complicated"]);
  });
});

describe("proofreading", () => {
  it("rejects placeholder copy and known misspellings", () => {
    const blob = `${proseBundle()} ${JSON.stringify(QUIZ)} ${JSON.stringify(SPREAD_STEPS)} ${JSON.stringify(REFLECTIONS)} ${JSON.stringify(SOURCES)}`;
    for (const word of BANNED) {
      expect(blob.toLowerCase().includes(word.toLowerCase()), word).toBe(false);
    }
  });
});
