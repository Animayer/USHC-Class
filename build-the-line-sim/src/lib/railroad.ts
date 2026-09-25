import { TIMELINE } from "./timeline";

export const BOND_DOLLARS_PER_MILE = {
  flat: 16_000,
  foothills: 32_000,
  mountains: 48_000,
} as const;

export type Terrain = keyof typeof BOND_DOLLARS_PER_MILE;

export const ACRES_PER_SECTION = 640;
export const LAND_GRANT_SECTIONS_PER_MILE = {
  1862: 10,
  1864: 20,
} as const;

export const INSIDER_PROFIT_SHARE = 0.2;
export const SCANDAL_RISK_IF_INSIDER = 0.72;

export type LinePath = "pacific" | "hill";
export type Pace = "fast" | "careful";
export type GradeChoice = "low-grade" | "steep";

export type PacificSeason = {
  year: number;
  terrain: Terrain;
  place: string;
};

export const PACIFIC_SEASONS: readonly PacificSeason[] = [
  { year: 1866, terrain: "flat", place: "Platte valley" },
  { year: 1867, terrain: "foothills", place: "high plains toward the Black Hills approach" },
  { year: 1868, terrain: "mountains", place: "Wyoming grade" },
  { year: 1869, terrain: "mountains", place: "the push toward Promontory" },
];

export type HillSeason = {
  year: number;
  place: string;
};

export const HILL_SEASONS: readonly HillSeason[] = [
  { year: 1880, place: "Dakota extension" },
  { year: 1887, place: "Montana" },
  { year: 1890, place: "toward the Cascades" },
  { year: 1893, place: "Puget Sound" },
];

export type NativeLandEvent = {
  id: string;
  year: number;
  title: string;
  body: string;
};

export const NATIVE_LAND_EVENTS: Record<LinePath, readonly NativeLandEvent[]> = {
  pacific: [
    {
      id: "treaties",
      year: 1866,
      title: "Treaties already on the map",
      body: "The grade crosses hunting grounds the United States had promised to Plains nations. A treaty line on paper does not stop the rails, the wagon roads, or the towns that follow. The crew is not billed for that break. Your company books will not show it either.",
    },
    {
      id: "plains-wars",
      year: 1867,
      title: "Army protection on the grade",
      body: "The Plains Wars are underway. Surveyors and grading crews work with army escorts and posts along the line. Soldiers are part of how the track advances. This is not a bonus and not a fine in the sim. It is the human cost beside the right of way.",
    },
    {
      id: "fort-laramie",
      year: 1868,
      title: "A treaty, and a railroad that stays",
      body: "The Fort Laramie treaty of 1868 sets aside the Great Sioux Reservation and closes the Bozeman Trail. The Union Pacific is a different cut: it stays in the ground and brings hunters, troops, and towns. A promise signed in 1868 and a rail laid through the Plains are not the same thing.",
    },
    {
      id: "bison-reservations",
      year: 1869,
      title: "Bison, then reservations",
      body: "After the trains run, market hunters ship bison hides east. The herds that fed Lakota, Cheyenne, Comanche, and other Plains nations collapse over the next decade. Families are pushed onto reservations while land grants and homestead claims fill the range around them. Nothing on this card changes your cash, your miles, or your track quality.",
    },
  ],
  hill: [
    {
      id: "treaties",
      year: 1880,
      title: "No subsidy, same taken country",
      body: "Hill’s extension runs through Dakota homelands already cut down by treaty and by order. The Great Northern does not take a Pacific Railway Act land grant. It still crosses country taken by broken agreements. Traffic income does not measure that.",
    },
    {
      id: "plains-wars",
      year: 1887,
      title: "After the campaigns",
      body: "Army campaigns and reservations have already confined Blackfeet, Crow, and other nations to smaller reserves. In the 1860s and 1870s the army protected survey and grading crews during the Plains Wars. By this decade the reservation map is the fact on the ground the grade follows.",
    },
    {
      id: "bison",
      year: 1890,
      title: "The herds are gone",
      body: "The bison economy is gone. Hide hunters, the railroads that hauled the hides, and a policy that welcomed the slaughter did that work. Families who lived by the hunt are on reservations, often waiting on rations that do not come. This record stays on the screen. It does not add or subtract dollars.",
    },
    {
      id: "reservations",
      year: 1893,
      title: "The frontier line, and who was already here",
      body: "The line reaches Puget Sound the year after the 1890 census is read to say the frontier line is gone. “Gone” meant a settler map looked full. It did not mean the nations here had consented, or that the price paid was fair. Finish the company books if you want. Do not call that the whole story.",
    },
  ],
};

export type Books = {
  miles: number;
  quality: number;
  subsidyCash: number;
  trafficIncome: number;
  insiderProfit: number;
  landGrantAcres: number;
  maintenance: number;
};

export function emptyBooks(): Books {
  return {
    miles: 0,
    quality: 80,
    subsidyCash: 0,
    trafficIncome: 0,
    insiderProfit: 0,
    landGrantAcres: 0,
    maintenance: 0,
  };
}

export function landGrantAcresPerMile(actYear: 1862 | 1864): number {
  return LAND_GRANT_SECTIONS_PER_MILE[actYear] * ACRES_PER_SECTION;
}

export function subsidyForMiles(terrain: Terrain, miles: number): number {
  if (miles < 0) throw new Error("miles must be non-negative");
  return miles * BOND_DOLLARS_PER_MILE[terrain];
}

export function insiderProfit(subsidyCash: number, tookInsider: boolean): number {
  if (!tookInsider) return 0;
  return Math.round(subsidyCash * INSIDER_PROFIT_SHARE);
}

export function scandalRisk(tookInsider: boolean): number {
  return tookInsider ? SCANDAL_RISK_IF_INSIDER : 0;
}

export function scandalExposed(tookInsider: boolean, roll: number): boolean {
  return roll < scandalRisk(tookInsider);
}

export function pacePlan(pace: Pace): { miles: number; qualityDelta: number } {
  if (pace === "fast") return { miles: 90, qualityDelta: -18 };
  return { miles: 45, qualityDelta: 4 };
}

export function gradePlan(choice: GradeChoice): {
  miles: number;
  qualityDelta: number;
  trafficIncome: number;
  operatingCost: number;
} {
  if (choice === "low-grade") {
    return { miles: 40, qualityDelta: 3, trafficIncome: 420_000, operatingCost: 90_000 };
  }
  return { miles: 62, qualityDelta: -10, trafficIncome: 230_000, operatingCost: 170_000 };
}

export function rebuildCost(miles: number, quality: number): number {
  const wear = Math.max(0, 100 - quality);
  return Math.round(miles * wear * 80);
}

export function applyPacificSeason(books: Books, terrain: Terrain, pace: Pace, tookInsider: boolean): Books {
  const plan = pacePlan(pace);
  const subsidyCash = subsidyForMiles(terrain, plan.miles);
  const quality = clampQuality(books.quality + plan.qualityDelta);
  return {
    ...books,
    miles: books.miles + plan.miles,
    quality,
    subsidyCash: books.subsidyCash + subsidyCash,
    insiderProfit: books.insiderProfit + insiderProfit(subsidyCash, tookInsider),
    landGrantAcres: books.landGrantAcres + plan.miles * landGrantAcresPerMile(1864),
  };
}

export function applyHillSeason(books: Books, choice: GradeChoice): Books {
  const plan = gradePlan(choice);
  const quality = clampQuality(books.quality + plan.qualityDelta);
  return {
    ...books,
    miles: books.miles + plan.miles,
    quality,
    trafficIncome: books.trafficIncome + plan.trafficIncome - plan.operatingCost,
    subsidyCash: books.subsidyCash,
    landGrantAcres: books.landGrantAcres,
  };
}

/** Native land events are a record. They do not move the company books. */
export function applyNativeLandEvent<T extends Books>(books: T): T {
  return books;
}

export function closeRailroad(books: Books): Books {
  return { ...books, maintenance: rebuildCost(books.miles, books.quality) };
}

function clampQuality(n: number): number {
  return Math.max(0, Math.min(100, n));
}

export type RailroadState = {
  path: LinePath;
  tookInsider: boolean | null;
  seasonIndex: number;
  recordAck: number;
  books: Books;
  scandalRoll: number;
  exposed: boolean | null;
  done: boolean;
  seenEventIds: string[];
};

export function createRailroad(path: LinePath, scandalRoll: number): RailroadState {
  return {
    path,
    tookInsider: path === "hill" ? false : null,
    seasonIndex: 0,
    recordAck: -1,
    books: emptyBooks(),
    scandalRoll,
    exposed: null,
    done: false,
    seenEventIds: [],
  };
}

export function acknowledgeRecord(state: RailroadState): RailroadState {
  const events = NATIVE_LAND_EVENTS[state.path];
  const event = events[state.seasonIndex];
  if (!event || state.done) return state;
  const books = applyNativeLandEvent(state.books);
  return {
    ...state,
    books,
    recordAck: state.seasonIndex,
    seenEventIds: state.seenEventIds.includes(event.id)
      ? state.seenEventIds
      : [...state.seenEventIds, event.id],
  };
}

export function playPacificSeason(state: RailroadState, pace: Pace): RailroadState {
  if (state.path !== "pacific" || state.tookInsider === null) {
    throw new Error("choose the construction contract before building");
  }
  const season = PACIFIC_SEASONS[state.seasonIndex];
  if (!season || state.done) throw new Error("no Pacific season left");
  if (state.recordAck !== state.seasonIndex) throw new Error("read the land record first");
  const books = applyPacificSeason(state.books, season.terrain, pace, state.tookInsider);
  const nextIndex = state.seasonIndex + 1;
  const finished = nextIndex >= PACIFIC_SEASONS.length;
  const closed = finished ? closeRailroad(books) : books;
  const exposed = finished ? scandalExposed(state.tookInsider, state.scandalRoll) : null;
  return {
    ...state,
    seasonIndex: nextIndex,
    books: closed,
    exposed,
    done: finished,
  };
}

export function playHillSeason(state: RailroadState, choice: GradeChoice): RailroadState {
  if (state.path !== "hill") throw new Error("this is not the Great Northern");
  const season = HILL_SEASONS[state.seasonIndex];
  if (!season || state.done) throw new Error("no Great Northern season left");
  if (state.recordAck !== state.seasonIndex) throw new Error("read the land record first");
  const books = applyHillSeason(state.books, choice);
  const nextIndex = state.seasonIndex + 1;
  const finished = nextIndex >= HILL_SEASONS.length;
  return {
    ...state,
    seasonIndex: nextIndex,
    books: finished ? closeRailroad(books) : books,
    exposed: finished ? false : null,
    done: finished,
  };
}

export function setInsiderContract(state: RailroadState, tookInsider: boolean): RailroadState {
  if (state.path !== "pacific") throw new Error("Hill takes no insider subsidy contract");
  return { ...state, tookInsider };
}

export type RailroadDebrief = {
  headline: string;
  paragraphs: string[];
};

export function railroadDebrief(state: RailroadState): RailroadDebrief {
  const insiderLine = state.tookInsider
    ? `You took the insider construction contract. Profit on the build went up, and scandal risk went to ${Math.round(scandalRisk(true) * 100)}%. Credit Mobilier, the real insider company, was exposed in ${TIMELINE.creditMobilierExposed}.`
    : `You refused the insider contract. Credit Mobilier, the historical construction company owned by Union Pacific insiders, was still exposed in ${TIMELINE.creditMobilierExposed}. Crony profit was a cost of the subsidy system, whether or not your own books took it.`;

  const pathLine =
    state.path === "pacific"
      ? `The Pacific Railway Act (${TIMELINE.pacificRailwayAct}) paid bonds of $16,000, $32,000, or $48,000 per mile and gave a land grant that Congress doubled in ${TIMELINE.landGrantDoubled}. Per-mile pay rewards speed: more miles this season, more subsidy this season. Shoddy track shows up later as rebuild and maintenance. Promontory Summit was ${TIMELINE.promontorySummit}.`
      : `James J. Hill’s Great Northern took no Pacific Railway Act subsidy. Income came from traffic, so grades mattered: a steep shortcut lays more miles now and costs more to run. The line reached the Pacific in ${TIMELINE.greatNorthernCompleted}, slower than Promontory and built to last.`;

  return {
    headline: state.path === "pacific" ? "Pacific Railway Act contract" : "Great Northern, without the subsidy",
    paragraphs: [
      pathLine,
      insiderLine,
      `The case for a subsidy is real: in the 1860s there was no traffic yet across empty territory, the wartime Union wanted a rail to bind California, and the engineering risk was enormous. The market case is also real: Hill built without that federal subsidy, and Credit Mobilier shows what cronyism can do with a public contract. Both belong in the answer.`,
      `The Native land record you read — treaties broken, the Plains Wars and army protection of survey and grading crews, bison destruction, reservations — is not a score. The 1890 census said the frontier line was gone. That sentence described settlement. It did not settle what the lines cost the nations already living there.`,
    ],
  };
}
