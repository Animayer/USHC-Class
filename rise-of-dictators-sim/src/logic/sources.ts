export interface SourceItem {
  id: string;
  name: string;
  detail: string;
}

export const SOURCES: SourceItem[] = [
  {
    id: "ushmm",
    name: "United States Holocaust Memorial Museum",
    detail: "Holocaust encyclopedia, including “Introduction to the Holocaust” and the Wannsee Conference.",
  },
  {
    id: "evans",
    name: "Richard J. Evans, The Third Reich trilogy",
    detail: "The Coming of the Third Reich; The Third Reich in Power; The Third Reich at War.",
  },
  {
    id: "kershaw",
    name: "Ian Kershaw, Hitler",
    detail: "Used for the rise to the chancellorship, the Rhineland gamble, and the wartime collapse.",
  },
  {
    id: "bosworth",
    name: "R. J. B. Bosworth, Mussolini",
    detail: "March on Rome, Ethiopia, Albania, and the fall in 1943.",
  },
  {
    id: "applebaum",
    name: "Anne Applebaum, Red Famine (2017)",
    detail: "The Holodomor and collectivization. Ukrainian death toll given as about 3.9 million.",
  },
  {
    id: "khlevniuk",
    name: "Oleg Khlevniuk, Stalin: New Biography of a Dictator (2015)",
    detail: "Stalin’s rise, the Five-Year Plans, and archival figures for the Great Terror.",
  },
  {
    id: "preston",
    name: "Paul Preston, Franco",
    detail: "The Spanish Civil War, Guernica, neutrality in World War II, and Franco’s death in 1975.",
  },
  {
    id: "mitter",
    name: "Rana Mitter, China's War with Japan (2013)",
    detail: "Marco Polo Bridge, Nanjing, Chiang Kai-shek, and the Chinese front.",
  },
  {
    id: "bix",
    name: "Herbert P. Bix, Hirohito and the Making of Modern Japan (2000)",
    detail: "The emperor’s role. Historians still debate how far he drove policy.",
  },
  {
    id: "imtfe",
    name: "International Military Tribunal for the Far East",
    detail: "Tokyo trials, 1946–1948. Nanjing finding of more than 200,000 dead. Tojo executed 23 December 1948.",
  },
  {
    id: "state",
    name: "Office of the Historian, U.S. Department of State",
    detail: "Milestones essays on Pearl Harbor, the wartime conferences, and Allied diplomacy.",
  },
  {
    id: "britannica",
    name: "Encyclopaedia Britannica",
    detail: "Date checks for the Enabling Act, Munich, the Nazi-Soviet Pact, Midway, and Franco’s death.",
  },
];
