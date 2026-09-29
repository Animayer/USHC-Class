import type { Length, Question, SpreadState, SpreadStep, SpreadTerritory, SpreadTone } from "./types";

export const SPREAD_TERRITORIES: SpreadTerritory[] = [
  { id: "britain", name: "Britain", x: 36, y: 28, w: 118, h: 100, shape: "round", weight: 0 },
  { id: "norway", name: "Norway", x: 176, y: 12, w: 72, h: 118, shape: "rect", weight: 6 },
  { id: "sweden", name: "Sweden", x: 254, y: 12, w: 70, h: 118, shape: "rect", weight: 0 },
  { id: "denmark", name: "Denmark", x: 176, y: 136, w: 72, h: 48, shape: "rect", weight: 5 },
  { id: "france", name: "France", x: 28, y: 160, w: 140, h: 146, shape: "rect", weight: 14 },
  { id: "low", name: "Low Countries", x: 222, y: 192, w: 100, h: 52, shape: "rect", weight: 6 },
  { id: "germany", name: "Germany", x: 330, y: 108, w: 158, h: 128, shape: "rect", weight: 20 },
  { id: "poland", name: "Poland", x: 496, y: 72, w: 142, h: 132, shape: "rect", weight: 10 },
  { id: "austria", name: "Austria", x: 330, y: 244, w: 104, h: 58, shape: "rect", weight: 8 },
  { id: "czech", name: "Czechoslovakia", x: 442, y: 244, w: 124, h: 64, shape: "rect", weight: 8 },
  { id: "italy", name: "Italy", x: 228, y: 312, w: 92, h: 150, shape: "rect", weight: 0 },
  { id: "spain", name: "Spain", x: 20, y: 322, w: 190, h: 130, shape: "rect", weight: 0 },
  { id: "balkans", name: "Yugoslavia", x: 430, y: 318, w: 150, h: 108, shape: "rect", weight: 8 },
  { id: "greece", name: "Greece", x: 560, y: 436, w: 120, h: 78, shape: "rect", weight: 5 },
  { id: "ussr", name: "Soviet West", x: 656, y: 24, w: 300, h: 300, shape: "rect", weight: 14 },
  { id: "nafrica", name: "North Africa", x: 150, y: 478, w: 400, h: 52, shape: "rect", weight: 8 },
];

const ALL_IDS = SPREAD_TERRITORIES.map((territory) => territory.id);

function picture(over: Partial<Record<string, SpreadTone>>): Record<string, SpreadTone> {
  const base: Record<string, SpreadTone> = {
    britain: "allied",
    norway: "neutral",
    sweden: "neutral",
    denmark: "neutral",
    france: "allied",
    low: "allied",
    germany: "weimar",
    poland: "allied",
    austria: "allied",
    czech: "allied",
    italy: "axis",
    spain: "neutral",
    balkans: "neutral",
    greece: "allied",
    ussr: "soviet",
    nafrica: "allied",
  };
  const tones: Record<string, SpreadTone> = { ...base };
  for (const [id, tone] of Object.entries(over)) {
    if (tone) tones[id] = tone;
  }
  for (const id of ALL_IDS) {
    if (!tones[id]) throw new Error(`Spread tone missing ${id}`);
  }
  return tones;
}

function q(prompt: string, choices: string[], answer: number, explain: string): Question {
  return { prompt, choices, answer, explain };
}

function decisions(
  historicalId: string,
  items: { id: string; label: string; note: string }[],
): SpreadStep["decisions"] {
  return items.map((item) => ({ ...item, historical: item.id === historicalId }));
}

const AXIS: Partial<Record<string, SpreadTone>> = { italy: "axis" };

export const SPREAD_STEPS: SpreadStep[] = [
  {
    id: "y1923",
    year: 1923,
    yearLabel: "1923",
    title: "The Beer Hall Putsch fails",
    phaseKind: "rise",
    tones: picture({ ...AXIS, germany: "weimar" }),
    fact: "On 8–9 November 1923 Hitler tried to seize Munich and then Berlin. The putsch collapsed. He was jailed and used the time to dictate Mein Kampf. The Nazi Party was still small. Mussolini’s march had worked a year earlier because a king gave way. This one did not.",
    source: "Ian Kershaw, Hitler; Richard J. Evans, The Coming of the Third Reich",
    decisionPrompt: "A citizen in 1923 reads the news from Munich. What is the sound reading?",
    decisions: decisions("failed", [
      { id: "failed", label: "The coup failed. He is not in power.", note: "That is the record. Failure in 1923 is why the later legal path matters." },
      { id: "won", label: "The coup made him chancellor.", note: "It did not. The chancellorship is 30 January 1933." },
      { id: "ignore", label: "A failed coup can be ignored forever.", note: "The coup failed. The ideas in Mein Kampf did not disappear." },
    ]),
    check: q(
      "What was the immediate result of the Beer Hall Putsch?",
      ["Hitler became chancellor.", "The coup failed, and Hitler was jailed.", "Britain declared war.", "The Soviet Union was invaded."],
      1,
      "The putsch of 8–9 November 1923 failed. Hitler was convicted and imprisoned. He did not become chancellor until 1933, and that came by appointment, not by this coup.",
    ),
  },
  {
    id: "y1933",
    year: 1933,
    yearLabel: "1933",
    title: "Chancellor, then the Enabling Act",
    phaseKind: "rise",
    tones: picture({ ...AXIS, germany: "nazi" }),
    fact: "On 30 January 1933 President Hindenburg appointed Hitler chancellor. The Nazis had not won a majority. The Reichstag fire of 27 February was followed by a decree that suspended civil liberties. On 23 March the Enabling Act let the cabinet make laws without the Reichstag. The grip on the German state is the story of this year, not a map of Europe.",
    source: "Richard J. Evans, The Coming of the Third Reich",
    decisionPrompt: "How should a reader describe January 1933?",
    decisions: decisions("appointed", [
      { id: "appointed", label: "Appointed by the president, then given decree power.", note: "Hindenburg appointed him. The dictatorship was built in the weeks after." },
      { id: "majority", label: "Elected dictator by a majority of voters.", note: "There was no such majority. The November 1932 vote left the Nazis short of one." },
      { id: "foreign", label: "Placed in office by a foreign army.", note: "No foreign army did this. German elites and the president did." },
    ]),
    check: q(
      "Who appointed Hitler chancellor on 30 January 1933?",
      ["President Hindenburg", "Winston Churchill", "Joseph Stalin", "Franklin D. Roosevelt"],
      0,
      "Paul von Hindenburg, the president, appointed Hitler. The Enabling Act followed on 23 March 1933. Churchill was not prime minister. Roosevelt did not become president of the United States until 4 March 1933.",
    ),
  },
  {
    id: "y1936",
    year: 1936,
    yearLabel: "1936",
    title: "Troops enter the Rhineland",
    phaseKind: "expansion",
    tones: picture({ ...AXIS, germany: "nazi" }),
    fact: "On 7 March 1936 German troops reoccupied the Rhineland, which the Treaty of Versailles and the Locarno treaties had kept demilitarized. The force was a gamble. Orders existed to pull back if France fought. France and Britain protested and did not fight. The land was already German. What changed was the army on it, and the lesson Hitler drew.",
    source: "Ian Kershaw, Hitler; Encyclopaedia Britannica",
    decisionPrompt: "It is March 1936. What do Britain and France actually do?",
    decisions: decisions("protest", [
      { id: "protest", label: "Protest, and do not use force.", note: "That is what they did. The what-if is that force was still thinkable." },
      { id: "invade", label: "Invade Berlin the same week.", note: "They did not. Do not redraw 1936 into a war that did not happen." },
      { id: "welcome", label: "Welcome the move as the end of all risk.", note: "A protest without force taught the opposite lesson." },
    ]),
    check: q(
      "The Rhineland move of 7 March 1936 was a gamble mainly because…",
      [
        "German orders were to withdraw if France resisted, and France did not march.",
        "The United States had already declared war.",
        "The Rhineland was part of Poland.",
        "The Nazi-Soviet Pact required it.",
      ],
      0,
      "The Rhineland was German land under a demilitarized status. Hitler treated the reoccupation as a test. France and Britain did not fight. Later German accounts said the troops had been told to retreat if they met force. Kershaw treats that order as real, and still not a promise that resistance would have been easy.",
    ),
  },
  {
    id: "y1938a",
    year: 1938,
    yearLabel: "March 1938",
    title: "Anschluss: Austria is annexed",
    phaseKind: "expansion",
    tones: picture({ ...AXIS, germany: "nazi", austria: "nazi" }),
    fact: "German troops entered Austria on 12 March 1938. The Anschluss absorbed the Austrian state. A managed plebiscite followed in April. Austria ceased to be independent. This is the first neighboring country painted as Nazi-ruled on this map.",
    source: "Richard J. Evans, The Third Reich in Power",
    decisionPrompt: "Which label belongs on Austria after 12 March 1938?",
    decisions: decisions("annexed", [
      { id: "annexed", label: "Annexed. The state is gone.", note: "Call it annexation, not a friendly visit." },
      { id: "ally", label: "An equal ally that keeps its government.", note: "Austria did not keep an independent government." },
      { id: "later", label: "Still untouched until 1945.", note: "The date is March 1938." },
    ]),
    check: q(
      "German troops entered Austria in the Anschluss on which date?",
      ["12 March 1938", "7 March 1936", "1 September 1939", "6 June 1944"],
      0,
      "The Anschluss occupation began on 12 March 1938. The Rhineland date is 1936. Poland is 1939. D-Day is 1944.",
    ),
  },
  {
    id: "y1938b",
    year: 1938,
    yearLabel: "September 1938",
    title: "Munich and the Sudetenland",
    phaseKind: "expansion",
    tones: picture({ ...AXIS, germany: "nazi", austria: "nazi", czech: "pressure" }),
    fact: "On 29–30 September 1938 the Munich Agreement gave the Sudetenland to Germany. Chamberlain, Daladier, Hitler, and Mussolini signed. Czechoslovakia was not at the table. The rest of the country was not occupied yet. That comes in March 1939. Chamberlain said “peace for our time.” Churchill, not yet prime minister, called the bargain a defeat without a war.",
    source: "Encyclopaedia Britannica; Ian Kershaw, Hitler",
    decisionPrompt: "You are at the Allied desk in September 1938. Which reading is honest?",
    decisions: decisions("cost", [
      { id: "cost", label: "This buys a promise by giving away someone else’s land.", note: "The promise did not hold. The cost was Czech." },
      { id: "final", label: "Hitler has no further claims in Europe.", note: "He said versions of that. March 1939 disproved it." },
      { id: "war", label: "Allied armies are entering Berlin today.", note: "They are not. That war begins over Poland, not here." },
    ]),
    check: q(
      "Who was not a party to the Munich talks that decided the Sudetenland?",
      ["Czechoslovakia", "Germany", "Britain", "Italy"],
      0,
      "Germany, Britain, France, and Italy signed. Czechoslovakia was handed the result. The Sudetenland was occupied in early October 1938. On 15 March 1939 German troops took Prague.",
    ),
  },
  {
    id: "y1939",
    year: 1939,
    yearLabel: "1939",
    title: "Prague, the pact, then Poland",
    phaseKind: "expansion",
    tones: picture({ ...AXIS, germany: "nazi", austria: "nazi", czech: "nazi", poland: "nazi" }),
    fact: "On 15 March 1939 Germany occupied the rest of Bohemia and Moravia. Slovakia became a client state. On 23 August the Nazi-Soviet Pact, with a secret protocol, divided spheres in Eastern Europe. Germany invaded Poland on 1 September. Britain and France declared war on 3 September. The Soviet Union invaded eastern Poland on 17 September. The shaded Polish land is occupation, shared in fact between two armies.",
    source: "Office of the Historian, U.S. Department of State; Evans, The Third Reich in Power",
    decisionPrompt: "After Prague in March 1939, what has appeasement produced?",
    decisions: decisions("broken", [
      { id: "broken", label: "The Munich promise is already broken, before Poland.", note: "March comes before September. The order is the lesson." },
      { id: "kept", label: "The Munich promise is still keeping the peace.", note: "Prague in March shows it did not." },
      { id: "pacific", label: "This crisis is about Pearl Harbor.", note: "Pearl Harbor is December 1941." },
    ]),
    check: q(
      "Britain and France declared war on Germany after which invasion?",
      ["Poland, 1 September 1939", "The Rhineland, 1936", "Austria, 1938", "Pearl Harbor, 1941"],
      0,
      "The declaration came on 3 September 1939, two days after the invasion of Poland. Earlier crises brought protest, not this declaration.",
    ),
  },
  {
    id: "y1940a",
    year: 1940,
    yearLabel: "April 1940",
    title: "Denmark and Norway",
    phaseKind: "expansion",
    tones: picture({
      ...AXIS,
      germany: "nazi",
      austria: "nazi",
      czech: "nazi",
      poland: "nazi",
      denmark: "nazi",
      norway: "nazi",
    }),
    fact: "On 9 April 1940 Germany invaded Denmark and Norway. Denmark fell in hours. Norway fought, with British and French help, and was beaten. Sweden stayed neutral and is left unshaded on purpose. A northern label is not one country.",
    source: "Richard J. Evans, The Third Reich at War",
    decisionPrompt: "Why is Sweden still unshaded?",
    decisions: decisions("neutral", [
      { id: "neutral", label: "Sweden stayed neutral. Do not paint it by accident.", note: "Accuracy is the point of the gap." },
      { id: "fell", label: "Sweden was conquered the same morning.", note: "It was not." },
      { id: "axis", label: "Sweden joined the Axis as a full member.", note: "It did not. Neutrality had its own hard bargains, which is a different fact." },
    ]),
    check: q(
      "On 9 April 1940 Germany invaded which of these?",
      ["Denmark and Norway, not Sweden", "Spain and Portugal", "Only the Soviet Union", "The United States"],
      0,
      "Weserübung struck Denmark and Norway on 9 April 1940. Sweden remained neutral for the whole war.",
    ),
  },
  {
    id: "y1940b",
    year: 1940,
    yearLabel: "June 1940",
    title: "The Low Countries and France",
    phaseKind: "expansion",
    tones: picture({
      ...AXIS,
      germany: "nazi",
      austria: "nazi",
      czech: "nazi",
      poland: "nazi",
      denmark: "nazi",
      norway: "nazi",
      low: "nazi",
      france: "nazi",
      nafrica: "axis",
    }),
    fact: "Germany invaded the Low Countries and France on 10 May 1940. Winston Churchill became prime minister that day. Paris was occupied on 14 June. The armistice was signed on 22 June. Philippe Pétain led Vichy France. Charles de Gaulle broadcast the Appeal of 18 June from London and refused to accept defeat. Britain held in the Battle of Britain. North Africa is olive: an Axis campaign, not a province of the Reich.",
    source: "Richard J. Evans, The Third Reich at War",
    decisionPrompt: "France has signed an armistice. What is still true?",
    decisions: decisions("two", [
      { id: "two", label: "Vichy collaborates, and de Gaulle rejects the armistice.", note: "Both facts belong in the same month." },
      { id: "gone", label: "No Frenchman continues the war.", note: "Free France begins with the 18 June appeal." },
      { id: "britain", label: "Britain is occupied in June 1940.", note: "The Battle of Britain prevents an invasion." },
    ]),
    check: q(
      "Who broadcast from London on 18 June 1940, refusing the armistice?",
      ["Charles de Gaulle", "Philippe Pétain", "Neville Chamberlain", "Francisco Franco"],
      0,
      "De Gaulle’s Appeal of 18 June called on the French to keep fighting. Pétain sought the armistice and led Vichy. Chamberlain had left the premiership on 10 May. Franco kept Spain out of the war.",
    ),
  },
  {
    id: "y1941a",
    year: 1941,
    yearLabel: "Spring 1941",
    title: "Yugoslavia and Greece",
    phaseKind: "expansion",
    tones: picture({
      ...AXIS,
      germany: "nazi",
      austria: "nazi",
      czech: "nazi",
      poland: "nazi",
      denmark: "nazi",
      norway: "nazi",
      low: "nazi",
      france: "nazi",
      balkans: "nazi",
      greece: "nazi",
      nafrica: "axis",
    }),
    fact: "Italy had invaded Greece in October 1940 and stalled. On 6 April 1941 Germany invaded Yugoslavia and Greece. Both were occupied, with brutal later reprisals. The map shade is military occupation. It is not a claim that these nations agreed.",
    source: "Richard J. Evans, The Third Reich at War",
    decisionPrompt: "How should the shade on Greece be read?",
    decisions: decisions("occupied", [
      { id: "occupied", label: "Occupation after invasion, not a willing union.", note: "Say occupied. The word matters." },
      { id: "voted", label: "Greece voted to join Germany.", note: "There was no such vote. There was an invasion." },
      { id: "1938", label: "This is the Munich Agreement.", note: "Munich was September 1938, and it was about the Sudetenland." },
    ]),
    check: q(
      "Germany invaded Yugoslavia and Greece in which month?",
      ["April 1941", "March 1936", "January 1933", "June 1944"],
      0,
      "The invasion began on 6 April 1941. Italy’s earlier attack on Greece, from 28 October 1940, had failed to win the war on its own.",
    ),
  },
  {
    id: "y1941b",
    year: 1941,
    yearLabel: "1941",
    title: "Barbarossa, and a wider war",
    phaseKind: "expansion",
    tones: picture({
      ...AXIS,
      germany: "nazi",
      austria: "nazi",
      czech: "nazi",
      poland: "nazi",
      denmark: "nazi",
      norway: "nazi",
      low: "nazi",
      france: "nazi",
      balkans: "nazi",
      greece: "nazi",
      ussr: "invaded",
      nafrica: "axis",
    }),
    fact: "Operation Barbarossa began on 22 June 1941. German and Axis armies drove deep into the Soviet Union and did not conquer it. The shade on the Soviet West means invasion, not victory. The same year, Hideki Tojo became prime minister of Japan on 18 October, and Japan attacked Pearl Harbor on 7 December. The United States entered the war. This Europe map cannot show Hawaii. The fact card can.",
    source: "Evans, The Third Reich at War; Office of the Historian, U.S. Department of State",
    decisionPrompt: "The Soviet shade is not the same red as Nazi rule. Why?",
    decisions: decisions("not-won", [
      { id: "not-won", label: "The invasion is real, and the conquest is not.", note: "Hold both facts. Stalingrad comes next." },
      { id: "owned", label: "The entire Soviet Union is now a German province.", note: "It is not. Moscow has not fallen. The state fights on." },
      { id: "pact", label: "The 1939 pact is still the policy of both sides.", note: "Barbarossa tears the pact up." },
    ]),
    check: q(
      "Operation Barbarossa, the invasion of the Soviet Union, began on which date?",
      ["22 June 1941", "23 August 1939", "7 December 1941", "6 June 1944"],
      0,
      "Barbarossa began on 22 June 1941. The pact was 23 August 1939. Pearl Harbor was 7 December 1941. D-Day was 6 June 1944.",
    ),
  },
  {
    id: "y1942",
    year: 1942,
    yearLabel: "1942",
    title: "The deepest reach",
    phaseKind: "expansion",
    tones: picture({
      ...AXIS,
      germany: "nazi",
      austria: "nazi",
      czech: "nazi",
      poland: "nazi",
      denmark: "nazi",
      norway: "nazi",
      low: "nazi",
      france: "nazi",
      balkans: "nazi",
      greece: "nazi",
      ussr: "nazi",
      nafrica: "axis",
    }),
    fact: "In 1942 the occupied Soviet west is at its deepest, including the fight for Stalingrad that began in late summer. North Africa is still an Axis campaign: El Alamein and Operation Torch come in the autumn. The meter is a teaching gauge of reach. It is not a score, and it is about to fall.",
    source: "Richard J. Evans, The Third Reich at War",
    decisionPrompt: "What is the right way to read a high meter?",
    decisions: decisions("gauge", [
      { id: "gauge", label: "It measures reach. It does not award points.", note: "Say that out loud in class if you need to." },
      { id: "prize", label: "The class scores points for each new shade.", note: "No. Insight points come only from the checks." },
      { id: "done", label: "A high meter means the war is already over.", note: "1942 is not the end. It is the crest before the reverse." },
    ]),
    check: q(
      "The Battle of Stalingrad ended with the German Sixth Army’s surrender on which date?",
      ["2 February 1943", "7 March 1936", "30 January 1933", "20 November 1975"],
      0,
      "The Sixth Army surrendered on 2 February 1943. The battle had begun in August 1942. The 1975 date is Franco’s death. This check asks you to place the turning point, not to celebrate it.",
    ),
  },
  {
    id: "y1943",
    year: 1943,
    yearLabel: "1943",
    title: "Stalingrad, Africa, Mussolini",
    phaseKind: "reversal",
    tones: picture({
      italy: "falling",
      germany: "nazi",
      austria: "nazi",
      czech: "nazi",
      poland: "nazi",
      denmark: "nazi",
      norway: "nazi",
      low: "nazi",
      france: "nazi",
      balkans: "nazi",
      greece: "nazi",
      ussr: "soviet",
      nafrica: "allied",
    }),
    fact: "On 2 February 1943 the German Sixth Army surrendered at Stalingrad. In May 1943 Axis forces in North Africa surrendered. On 25 July 1943 the king dismissed Mussolini. Italy then left the war, and Germany occupied the north. The meter is still high because France, Poland, and the Balkans are still occupied. A turning point is not the same day as an empty map.",
    source: "Evans, The Third Reich at War; R. J. B. Bosworth, Mussolini",
    decisionPrompt: "Which sentence keeps the timeline honest?",
    decisions: decisions("still", [
      { id: "still", label: "The east turns, and Western Europe is still occupied.", note: "Both halves of 1943 are true." },
      { id: "empty", label: "After Stalingrad the Nazi map is already blank.", note: "France is still occupied. Look at the shade." },
      { id: "mussolini", label: "Mussolini remains prime minister through 1945.", note: "He is dismissed on 25 July 1943. A German-backed regime lingers in the north until 1945." },
    ]),
    check: q(
      "Mussolini was dismissed by the king on which date?",
      ["25 July 1943", "28 October 1922", "30 April 1945", "18 October 1941"],
      0,
      "The Fascist Grand Council turned on him and King Victor Emmanuel III dismissed him on 25 July 1943. October 1922 was his rise. 30 April 1945 is Hitler’s death. Partisans killed Mussolini on 28 April 1945.",
    ),
  },
  {
    id: "y1944",
    year: 1944,
    yearLabel: "1944",
    title: "D-Day and the shrink",
    phaseKind: "reversal",
    tones: picture({
      italy: "falling",
      germany: "nazi",
      austria: "nazi",
      czech: "nazi",
      poland: "nazi",
      denmark: "nazi",
      norway: "nazi",
      low: "liberated",
      france: "liberated",
      balkans: "nazi",
      greece: "liberated",
      ussr: "soviet",
      nafrica: "allied",
    }),
    fact: "Allied armies landed in Normandy on 6 June 1944. Paris was liberated in August. The Low Countries were largely freed in the autumn, with a hard winter still ahead. Greece was leaving Axis occupation. Tojo had resigned on 18 July 1944 after the fall of Saipan. The shade pulls back from France. It has not yet left Germany.",
    source: "Office of the Historian, U.S. Department of State; Evans, The Third Reich at War",
    decisionPrompt: "D-Day is best described as…",
    decisions: decisions("opening", [
      { id: "opening", label: "The opening of a Western front in France, not the end of the war.", note: "Victory in Europe is still eleven months away." },
      { id: "end", label: "The day Nazi rule ends everywhere.", note: "It does not. Berlin falls in 1945." },
      { id: "pacific", label: "The invasion of Japan.", note: "D-Day is Normandy. Japan is a different front." },
    ]),
    check: q(
      "D-Day, the Allied landing in Normandy, was on which date?",
      ["6 June 1944", "22 June 1941", "7 December 1941", "2 February 1943"],
      0,
      "6 June 1944 is the Normandy landing. The other dates are Barbarossa, Pearl Harbor, and the Stalingrad surrender.",
    ),
  },
  {
    id: "y1945",
    year: 1945,
    yearLabel: "1945",
    title: "The Third Reich ends",
    phaseKind: "reversal",
    tones: picture({
      italy: "liberated",
      germany: "occupiedEnd",
      austria: "occupiedEnd",
      czech: "liberated",
      poland: "liberated",
      denmark: "liberated",
      norway: "liberated",
      low: "liberated",
      france: "liberated",
      balkans: "liberated",
      greece: "liberated",
      ussr: "soviet",
      nafrica: "allied",
      britain: "allied",
      spain: "neutral",
      sweden: "neutral",
    }),
    fact: "Hitler died by suicide in Berlin on 30 April 1945. Germany surrendered, and 8 May 1945 is remembered as VE Day in the West. Mussolini had been captured and killed by Italian partisans on 28 April. The Nazi shade on this map is gone. Occupation zones replace it. Freed countries were not all free in the same way: the Soviet sphere closed on Poland and then on Czechoslovakia. That is the next lesson, not a victory lap.",
    source: "Ian Kershaw, Hitler; Richard J. Evans, The Third Reich at War",
    decisionPrompt: "The meter reads zero. What does zero mean?",
    decisions: decisions("rule-ends", [
      { id: "rule-ends", label: "Nazi rule is destroyed. The dead are not restored.", note: "Hold the second sentence." },
      { id: "fine", label: "Europe is untroubled after May 1945.", note: "Occupation, displacement, and the Soviet sphere are still ahead." },
      { id: "score", label: "Zero is a high score for the class.", note: "The meter was never a score." },
    ]),
    check: q(
      "Hitler died on which date?",
      ["30 April 1945", "6 June 1944", "28 October 1922", "20 November 1975"],
      0,
      "Hitler died by suicide on 30 April 1945. Germany’s unconditional surrender followed within days. The 1975 date is Franco’s death, which is why this chronicle does not stop in 1945.",
    ),
  },
  {
    id: "y1950",
    year: 1950,
    yearLabel: "1950",
    title: "Nuremberg, and what remained",
    phaseKind: "aftermath",
    tones: picture({
      italy: "liberated",
      germany: "occupiedEnd",
      austria: "occupiedEnd",
      czech: "soviet",
      poland: "soviet",
      denmark: "liberated",
      norway: "liberated",
      low: "liberated",
      france: "liberated",
      balkans: "liberated",
      greece: "allied",
      ussr: "soviet",
      nafrica: "allied",
    }),
    fact: "The international trial at Nuremberg ran from 20 November 1945 to 1 October 1946. Leaders were charged with crimes against peace, war crimes, and crimes against humanity. The Tokyo trials ran from 1946 to 1948. Tojo was executed on 23 December 1948. Hirohito was not tried. By 1950 the map of Nazi rule is a memory, and the map of the Cold War is already forming. Franco is still in power in Spain. This mode stops at 1950. The main chronicle continues to 1975.",
    source: "United States Holocaust Memorial Museum; International Military Tribunal for the Far East",
    decisionPrompt: "Why mention Nuremberg in a map game?",
    decisions: decisions("law", [
      { id: "law", label: "The end of the regime included a court, not only a battle.", note: "The judgment is part of the history." },
      { id: "skip", label: "Trials are optional color, not history.", note: "They are part of how the Allies named the crimes." },
      { id: "revenge", label: "The point of the trial was a class score.", note: "There is no score attached to the trial in this game." },
    ]),
    check: q(
      "The major Nuremberg trial of Nazi leaders opened in which year?",
      ["1945", "1923", "1933", "1975"],
      0,
      "It opened on 20 November 1945 and judged the surviving leadership. It did not restore the dead. It put the crimes in a public record.",
    ),
  },
];

export const QUICK_SPREAD_IDS = ["y1923", "y1933", "y1936", "y1938b", "y1939", "y1940b", "y1941b", "y1943", "y1945", "y1950"];

export interface ReflectionItem {
  id: string;
  text: string;
  answer: "serious" | "complicated";
  reveal: string;
}

export const REFLECTIONS: ReflectionItem[] = [
  {
    id: "cabinet",
    text: "A wider coalition could have refused Hitler the chancellorship in January 1933.",
    answer: "serious",
    reveal:
      "Ian Kershaw treats the months before the dictatorship locked in as the real political chance. After the Enabling Act, refusal was a different and far more dangerous act.",
  },
  {
    id: "rhine",
    text: "French and British resistance to the Rhineland move in March 1936 was a serious chance to force a pullback.",
    answer: "serious",
    reveal:
      "German orders were to withdraw if France fought. Kershaw treats the move as a gamble. That is not a promise that a war in 1936 would have been small or clean.",
  },
  {
    id: "munich-easy",
    text: "Munich was an easy, risk-free way to stop him.",
    answer: "complicated",
    reveal:
      "Refusing Munich might have meant war in 1938, when Germany was weaker than in 1940. It would still have been war, and Czechoslovakia was the country asked to pay. Easy is the wrong word.",
  },
  {
    id: "late",
    text: "By September 1939, after Poland, he could still have been stopped without a war.",
    answer: "complicated",
    reveal:
      "Britain and France declared war on 3 September 1939. Stopping further conquest then meant fighting. The branch that did not require a European war was earlier.",
  },
];

export const REFLECTION_CLOSE =
  "No choice on this screen rewrites a death. The question is only where people at the time had a branch they did not take. By 1939 the remaining branch was war.";

export function stepsFor(length: Length): SpreadStep[] {
  if (length === "full") return SPREAD_STEPS;
  const want = new Set(QUICK_SPREAD_IDS);
  return SPREAD_STEPS.filter((step) => want.has(step.id));
}

export function meterFor(tones: Record<string, SpreadTone>): number {
  let total = 0;
  let held = 0;
  for (const territory of SPREAD_TERRITORIES) {
    if (territory.weight <= 0) continue;
    total += territory.weight;
    const tone = tones[territory.id];
    if (tone === "nazi") held += territory.weight;
    else if (tone === "pressure" || tone === "invaded") held += territory.weight / 2;
  }
  if (total <= 0) return 0;
  return Math.round((held / total) * 100);
}

export function spreadOverlaps(): string[] {
  const hits: string[] = [];
  for (let i = 0; i < SPREAD_TERRITORIES.length; i += 1) {
    for (let j = i + 1; j < SPREAD_TERRITORIES.length; j += 1) {
      const a = SPREAD_TERRITORIES[i];
      const b = SPREAD_TERRITORIES[j];
      const separated = a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
      if (!separated) hits.push(`${a.id} overlaps ${b.id}`);
    }
  }
  return hits;
}

export function createSpread(length: Length): SpreadState {
  return {
    version: 1,
    length,
    stepIndex: 0,
    phase: "play",
    decisionId: null,
    answered: false,
    choice: null,
    feedback: "",
    insight: 0,
    streak: 0,
    bestStreak: 0,
    decisions: [],
    reflect: Object.fromEntries(REFLECTIONS.map((item) => [item.id, null])),
    reflectScored: false,
    badges: [],
  };
}

export function currentSpreadStep(state: SpreadState): SpreadStep {
  const steps = stepsFor(state.length);
  return steps[Math.min(state.stepIndex, steps.length - 1)];
}

export function chooseSpreadDecision(state: SpreadState, id: string): SpreadState {
  if (state.phase !== "play" || state.answered) return state;
  const step = currentSpreadStep(state);
  if (!step.decisions.some((item) => item.id === id)) return state;
  return { ...state, decisionId: id };
}

export function answerSpread(state: SpreadState, choice: number): SpreadState {
  if (state.phase !== "play" || state.answered || !state.decisionId) return state;
  const step = currentSpreadStep(state);
  if (choice < 0 || choice >= step.check.choices.length) return state;
  const correct = choice === step.check.answer;
  const streak = correct ? state.streak + 1 : 0;
  const bonus = correct && streak >= 2 ? 2 : 0;
  const insight = state.insight + (correct ? 10 + bonus : 0);
  const badges = [...state.badges];
  if (streak >= 5 && !badges.includes("steady-reading")) badges.push("steady-reading");
  return {
    ...state,
    answered: true,
    choice,
    feedback: step.check.explain,
    phase: "feedback",
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
    insight,
    decisions: [...state.decisions, state.decisionId],
    badges,
  };
}

export function continueSpread(state: SpreadState): SpreadState {
  if (state.phase === "feedback") {
    const steps = stepsFor(state.length);
    const next = state.stepIndex + 1;
    if (next >= steps.length) {
      return { ...state, phase: "reflect", feedback: "", stepIndex: steps.length - 1 };
    }
    return {
      ...state,
      phase: "play",
      stepIndex: next,
      decisionId: null,
      answered: false,
      choice: null,
      feedback: "",
    };
  }
  if (state.phase === "reflect") return scoreReflection(state);
  return state;
}

export function setReflection(state: SpreadState, id: string, value: "serious" | "complicated"): SpreadState {
  if (state.phase !== "reflect" || state.reflectScored) return state;
  if (!REFLECTIONS.some((item) => item.id === id)) return state;
  return { ...state, reflect: { ...state.reflect, [id]: value } };
}

export function scoreReflection(state: SpreadState): SpreadState {
  if (state.phase !== "reflect") return state;
  if (state.reflectScored) return { ...state, phase: "done" };
  let extra = 0;
  for (const item of REFLECTIONS) {
    if (state.reflect[item.id] === item.answer) extra += 5;
  }
  const badges = [...state.badges];
  if (!badges.includes("stopping-point")) badges.push("stopping-point");
  if (!badges.includes("closed-chronicle")) badges.push("closed-chronicle");
  return { ...state, reflectScored: true, insight: state.insight + extra, badges, phase: "done" };
}

export function jumpSpreadYear(state: SpreadState, year: number): SpreadState {
  const steps = stepsFor(state.length);
  let index = -1;
  steps.forEach((step, stepIndex) => {
    if (step.year === year) index = stepIndex;
  });
  if (index < 0) return state;
  return {
    ...state,
    stepIndex: index,
    phase: "play",
    decisionId: null,
    answered: false,
    choice: null,
    feedback: "",
  };
}
