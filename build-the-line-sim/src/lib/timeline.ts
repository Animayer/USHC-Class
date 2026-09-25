/** Dates the packet and the sim both rely on. Tests lock these strings. */
export const TIMELINE = {
  homesteadAct: "May 20, 1862",
  pacificRailwayAct: "July 1, 1862",
  landGrantDoubled: 1864,
  promontorySummit: "May 10, 1869",
  creditMobilierExposed: 1872,
  gliddenBarbedWire: 1874,
  greatNorthernCompleted: 1893,
  frontierLineGone: 1890,
} as const;

export const TIMELINE_FACTS = [
  "Homestead Act May 20, 1862",
  "Pacific Railway Act July 1, 1862 (grant doubled 1864)",
  "Promontory Summit May 10, 1869",
  "Credit Mobilier exposed 1872",
  "Glidden barbed wire 1874",
  "Great Northern completed 1893",
  "1890 census declared the frontier line gone",
] as const;
