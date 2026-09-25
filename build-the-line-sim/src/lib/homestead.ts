import { TIMELINE } from "./timeline";

export const CLAIM_ACRES = 160;
export const SEASON_YEARS = [1870, 1871, 1872, 1873, 1874] as const;
export const PROVE_UP_YEAR = 1875;
export const GRASSHOPPER_YEAR = 1874;
export const ACRES_BROKEN_PER_YEAR = 30;
export const STARTING_CASH = 180;
export const LIVING_COST = 70;
export const HOUSE_COST = 40;
export const LOAN_AMOUNT = 100;
export const LOAN_INTEREST_RATE = 0.12;
export const FREIGHT_DOLLARS_PER_BUSHEL_MILE = 0.02;
export const CROP_PRICE = { wheat: 1, corn: 0.4 } as const;
export const SEED_COST = { wheat: 25, corn: 18 } as const;
export const FENCE_COST = { none: 0, sod: 30, barbed: 70 } as const;
export const CATTLE_LOSS = { none: 0.35, sod: 0.1, barbed: 0 } as const;
export const GRASSHOPPER_YIELD_FACTOR = 0.2;

export const DISTANCE_CHOICES = [
  { miles: 8, label: "8 miles from the rail", note: "A short haul. Freight takes a bite, not the whole crop." },
  { miles: 30, label: "30 miles from the rail", note: "A full wagon day. Distance starts to decide the year." },
  { miles: 70, label: "70 miles from the rail", note: "Far out on the Plains. Freight can cost more than the crop brings." },
] as const;

export type DistanceMiles = (typeof DISTANCE_CHOICES)[number]["miles"];
export type Crop = "wheat" | "corn";
export type FenceChoice = "none" | "sod" | "barbed";
export type Weather = "rainfall" | "drought";

export type YearChoice = {
  crop: Crop;
  fence: FenceChoice;
  borrow: boolean;
};

export type YearLog = {
  year: number;
  crop: Crop;
  fence: FenceChoice;
  borrow: boolean;
  weather: Weather;
  grasshoppers: boolean;
  bushels: number;
  revenue: number;
  freight: number;
  costs: number;
  interestCharged: number;
  cashAfter: number;
  debtAfter: number;
};

export type HomesteadState = {
  distanceMiles: DistanceMiles;
  yearIndex: number;
  cash: number;
  debt: number;
  acresCultivated: number;
  hasHouse: boolean;
  abandoned: boolean;
  provedUp: boolean;
  log: YearLog[];
};

export function roundMoney(n: number): number {
  return Math.round(n);
}

/** Whole dollars for $1 and up. Prices under $1 keep cents, so corn is $0.40, not $0. */
export function formatPrice(dollars: number): string {
  const sign = dollars < 0 ? "-" : "";
  const amount = Math.abs(dollars);
  if (amount < 1) return `${sign}$${amount.toFixed(2)}`;
  return `${sign}$${Math.round(amount).toLocaleString("en-US")}`;
}

export function freightCost(distanceMiles: number, bushels: number): number {
  if (distanceMiles < 0 || bushels < 0) {
    throw new Error("distance and bushels must be non-negative");
  }
  return roundMoney(distanceMiles * bushels * FREIGHT_DOLLARS_PER_BUSHEL_MILE);
}

export function fenceChoices(year: number): FenceChoice[] {
  if (year >= TIMELINE.gliddenBarbedWire) return ["none", "sod", "barbed"];
  return ["none", "sod"];
}

export function baseBushelsPerAcre(crop: Crop, weather: Weather): number {
  if (crop === "wheat") return weather === "rainfall" ? 12 : 3;
  return weather === "rainfall" ? 25 : 1;
}

export function cropOutcome(input: {
  crop: Crop;
  weather: Weather;
  year: number;
  fence: FenceChoice;
}): { bushels: number; grasshoppers: boolean } {
  let bushels = baseBushelsPerAcre(input.crop, input.weather) * ACRES_BROKEN_PER_YEAR;
  const grasshoppers = input.year === GRASSHOPPER_YEAR;
  if (grasshoppers) bushels *= GRASSHOPPER_YIELD_FACTOR;
  bushels *= 1 - CATTLE_LOSS[input.fence];
  return { bushels: roundMoney(bushels), grasshoppers };
}

export function accrueDebt(debt: number, newLoan: number): { debt: number; interestCharged: number } {
  const principal = debt + newLoan;
  const next = roundMoney(principal * (1 + LOAN_INTEREST_RATE));
  return { debt: next, interestCharged: next - principal };
}

export function createHomestead(distanceMiles: DistanceMiles): HomesteadState {
  return {
    distanceMiles,
    yearIndex: 0,
    cash: STARTING_CASH,
    debt: 0,
    acresCultivated: 0,
    hasHouse: false,
    abandoned: false,
    provedUp: false,
    log: [],
  };
}

export function resolveYear(state: HomesteadState, choice: YearChoice, weather: Weather): HomesteadState {
  if (state.abandoned || state.provedUp) {
    throw new Error("claim is already closed");
  }
  const year = SEASON_YEARS[state.yearIndex];
  if (year === undefined) throw new Error("no season left to plant");
  if (!fenceChoices(year).includes(choice.fence)) {
    throw new Error("that fence is not available this year");
  }

  const houseCost = state.hasHouse ? 0 : HOUSE_COST;
  const planted = cropOutcome({ crop: choice.crop, weather, year, fence: choice.fence });
  const revenue = roundMoney(planted.bushels * CROP_PRICE[choice.crop]);
  const freight = freightCost(state.distanceMiles, planted.bushels);
  const costs =
    LIVING_COST + SEED_COST[choice.crop] + FENCE_COST[choice.fence] + houseCost;
  const loan = choice.borrow ? LOAN_AMOUNT : 0;
  const interest = accrueDebt(state.debt, loan);
  const cash = state.cash + loan + revenue - freight - costs;
  const acresCultivated = Math.min(CLAIM_ACRES, state.acresCultivated + ACRES_BROKEN_PER_YEAR);
  const broke = cash < 0;

  const log: YearLog = {
    year,
    crop: choice.crop,
    fence: choice.fence,
    borrow: choice.borrow,
    weather,
    grasshoppers: planted.grasshoppers,
    bushels: planted.bushels,
    revenue,
    freight,
    costs,
    interestCharged: interest.interestCharged,
    cashAfter: cash,
    debtAfter: interest.debt,
  };

  return {
    ...state,
    yearIndex: state.yearIndex + 1,
    cash,
    debt: interest.debt,
    acresCultivated,
    hasHouse: true,
    abandoned: broke,
    provedUp: false,
    log: [...state.log, log],
  };
}

export function residencyComplete(state: HomesteadState): boolean {
  return state.log.length === SEASON_YEARS.length && !state.abandoned;
}

export function improvementsMet(state: HomesteadState): boolean {
  return state.hasHouse && state.acresCultivated >= ACRES_BROKEN_PER_YEAR;
}

export function canProveUp(state: HomesteadState): boolean {
  return residencyComplete(state) && improvementsMet(state);
}

export function proveUp(state: HomesteadState): HomesteadState {
  if (!canProveUp(state)) throw new Error("prove-up requires five years on the claim and improvements");
  return { ...state, provedUp: true };
}

export function abandonClaim(state: HomesteadState): HomesteadState {
  if (state.provedUp) throw new Error("patent already issued");
  return { ...state, abandoned: true };
}

export type HomesteadDebrief = {
  outcome: string;
  paragraphs: string[];
};

export function homesteadDebrief(state: HomesteadState): HomesteadDebrief {
  const outcome = state.provedUp
    ? `You proved up in ${PROVE_UP_YEAR}. The patent is yours. Debt still follows you home if you borrowed.`
    : "You left the claim. Five years of residency is the rule, and a broken year can end the try early.";

  return {
    outcome,
    paragraphs: [
      `The Homestead Act (${TIMELINE.homesteadAct}) offered ${CLAIM_ACRES} acres if you lived on the claim and improved it for five years. Residence plus a house and broken sod — not a cash purchase — is what “prove up” means. You could commute the claim sooner by paying $1.25 an acre. Most families in this sim are trying to last the five years.`,
      `West of the 100th meridian the Plains are arid. A ${CLAIM_ACRES}-acre farm was sized for wetter country farther east. Drought cuts the yield. The grasshopper year of ${GRASSHOPPER_YEAR} (Rocky Mountain locusts) can take what drought spared. In 1909 the Enlarged Homestead Act offered 320 acres on some of that dry land — later, and still a hard bargain.`,
      `Freight scales with miles to the rail. The same bushels pay a small haul at 8 miles and can wipe the crop at 70. Borrowing adds cash this season and interest every season after. The railroad and the store sit between a good crop and a proved-up claim.`,
    ],
  };
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function drawWeather(seed: number, count = SEASON_YEARS.length): Weather[] {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, () => (rand() < 0.5 ? "rainfall" : "drought"));
}
