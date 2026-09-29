import { TERRITORY_IDS } from "./territories";
import type { Faction, Hold, Snapshot } from "./types";

function h(faction: Faction, caption: string, armies = 1): Hold {
  return { faction, caption, armies };
}

function board(partial: Record<string, Hold>): Snapshot {
  for (const id of TERRITORY_IDS) {
    if (!partial[id]) throw new Error(`Snapshot missing ${id}`);
  }
  return partial;
}

function patch(base: Snapshot, changes: Record<string, Hold>): Snapshot {
  return board({ ...base, ...changes });
}

/** January 1922, before the March on Rome. */
export const Y1922: Snapshot = board({
  canada: h("democracy", "British dominion", 1),
  usa: h("democracy", "United States. Officially at peace and wary of new alliances.", 2),
  latin: h("neutral", "Independent republics", 1),
  britain: h("democracy", "United Kingdom", 3),
  france: h("democracy", "French Third Republic", 3),
  low: h("democracy", "Belgium, the Netherlands, and Luxembourg", 1),
  germany: h("weimar", "Weimar Republic", 2),
  poland: h("democracy", "Independent republic", 2),
  dennor: h("neutral", "Neutral democracies", 1),
  sweden: h("neutral", "Neutral democracy", 1),
  spain: h("neutral", "Constitutional monarchy under Alfonso XIII", 1),
  italy: h("neutral", "Liberal kingdom, before the March on Rome", 2),
  austria: h("democracy", "Republic after the Habsburg collapse", 1),
  czech: h("democracy", "Czechoslovakia", 1),
  balkans: h("neutral", "Several states, not one country. Includes Greece and Yugoslavia.", 1),
  wsoviet: h("soviet", "Soviet Union", 3),
  siberia: h("soviet", "Soviet Union", 1),
  turkey: h("neutral", "The republic is proclaimed in 1923", 2),
  mideast: h("colonial", "British and French mandates", 1),
  nafrica: h("colonial", "French, Spanish, and Italian colonies. Libya is already Italian.", 1),
  egypt: h("colonial", "Kingdom under strong British influence", 1),
  wafrica: h("colonial", "Mostly British and French colonies", 1),
  ethiopia: h("neutral", "Independent empire under Haile Selassie", 1),
  safrica: h("colonial", "British Empire and the Union of South Africa", 1),
  manchuria: h("china", "Part of the Republic of China", 1),
  nchina: h("china", "Republic of China, divided by warlords", 2),
  schina: h("china", "Republic of China, divided by warlords", 2),
  korea: h("japan", "Under Japanese rule since 1910", 1),
  japan: h("japan", "Empire of Japan", 3),
  seasia: h("colonial", "British, French, Dutch, and American colonies", 1),
  philippines: h("colonial", "United States commonwealth", 1),
  pacific: h("colonial", "Mandates and colonies", 1),
  australia: h("democracy", "British dominion", 1),
});

/** After Mussolini’s appointment and Stalin’s rise. Germany is still a republic. */
export const Y1928: Snapshot = patch(Y1922, {
  italy: h("fascist", "Fascist prime minister since October 1922", 2),
  spain: h("neutral", "Primo de Rivera’s dictatorship, 1923–1930", 1),
  wsoviet: h("soviet", "Stalin is now the dominant figure", 3),
  turkey: h("neutral", "Republic of Turkey", 2),
});

/** Nazi government in Germany. Manchuria is a Japanese puppet. Famine is not a tile. */
export const Y1933: Snapshot = patch(Y1928, {
  germany: h("nazi", "Nazi rule after 30 January 1933", 3),
  manchuria: h("japan", "Manchukuo, a Japanese puppet, from 1932", 2),
  spain: h("democracy", "Spanish Republic, proclaimed in 1931", 1),
});

/** End of 1938: Austria annexed, Sudetenland ceded, Spain still at war, China at war. */
export const Y1938: Snapshot = patch(Y1933, {
  austria: h("nazi", "Annexed in the Anschluss, March 1938", 1),
  czech: h("contested", "Sudetenland ceded at Munich, September 1938. The rest is not yet occupied.", 1),
  ethiopia: h("fascist", "Conquered by Italy, 1935–1936", 1),
  spain: h("contested", "Civil war, July 1936–April 1939", 2),
  nchina: h("contested", "War with Japan since July 1937", 2),
  schina: h("contested", "War with Japan. Nanjing fell in December 1937.", 2),
});

/** Autumn 1939: Poland has been invaded. France has not yet fallen. */
export const Y1939: Snapshot = patch(Y1938, {
  czech: h("nazi", "Bohemia and Moravia occupied, 15 March 1939", 1),
  poland: h("occupied", "Invaded 1 September 1939 and divided with the Soviet Union", 1),
  spain: h("nationalist", "Franco’s victory, 1 April 1939. Spain stays out of the war.", 2),
  balkans: h("neutral", "Albania was occupied by Italy in April 1939. Greece and Yugoslavia are not yet invaded.", 1),
});

/** September 1939 through the fall of France, 1940. Sweden stays neutral. */
export const Y1940: Snapshot = patch(Y1939, {
  czech: h("nazi", "Bohemia and Moravia occupied, 15 March 1939", 1),
  poland: h("occupied", "Invaded 1 September 1939 and divided with the Soviet Union", 1),
  dennor: h("occupied", "Invaded 9 April 1940. Sweden stayed neutral.", 1),
  low: h("occupied", "Invaded 10 May 1940", 1),
  france: h("occupied", "Armistice 22 June 1940. Vichy under Pétain, and a German occupation zone.", 1),
  nafrica: h("contested", "Desert war. Italy holds Libya and has attacked toward Egypt.", 2),
});

/** After Barbarossa and the first Pacific conquests. */
export const Y1941: Snapshot = patch(Y1940, {
  balkans: h("occupied", "Yugoslavia and Greece invaded, April 1941", 1),
  wsoviet: h("contested", "Invaded 22 June 1941. Not conquered.", 3),
  seasia: h("japan", "Japanese occupation, late 1941 into 1942", 2),
  philippines: h("japan", "Invaded December 1941. Bataan falls in 1942.", 1),
  pacific: h("japan", "Widest Japanese advance, early 1942", 1),
});

/** After Stalingrad, Midway, and the fall of Mussolini. */
export const Y1943: Snapshot = patch(Y1941, {
  wsoviet: h("soviet", "German Sixth Army surrenders at Stalingrad, 2 February 1943", 3),
  nafrica: h("democracy", "Axis forces defeated in North Africa, May 1943", 2),
  italy: h("contested", "Mussolini dismissed 25 July 1943. Germany then occupies the north.", 2),
  ethiopia: h("neutral", "Liberated in 1941. Haile Selassie returns.", 1),
  pacific: h("contested", "Japan checked at Midway, June 1942", 2),
});

/** Nazi rule is gone from the map. */
export const Y1945: Snapshot = patch(Y1943, {
  germany: h("occupied", "Occupied by the Allies, 1945. Nazi government destroyed.", 1),
  austria: h("occupied", "Occupied, 1945. Treated as a liberated country.", 1),
  france: h("democracy", "Liberated, 1944. De Gaulle leads the provisional government.", 2),
  low: h("democracy", "Liberated, 1944–1945", 1),
  dennor: h("neutral", "Freed in 1945. Both return to independence.", 1),
  poland: h("soviet", "Freed from Nazi rule by the Soviet army. A communist government is imposed.", 1),
  czech: h("soviet", "Freed from Nazi rule, 1945. A communist coup follows in 1948.", 1),
  balkans: h("contested", "Axis occupation ends. Greece does not join the Soviet bloc. Yugoslavia breaks with Stalin.", 1),
  italy: h("democracy", "Fascist regime ended. The republic is founded in 1946.", 1),
  japan: h("occupied", "Surrender announced 15 August 1945. Formal surrender 2 September.", 1),
  korea: h("occupied", "Japanese rule ends. The peninsula is divided.", 1),
  manchuria: h("china", "Japan defeated, August 1945", 1),
  nchina: h("china", "War with Japan ends. Civil war with the Communists resumes.", 2),
  schina: h("china", "War with Japan ends. Civil war with the Communists resumes.", 2),
  seasia: h("contested", "Japanese surrender. Colonial powers try to return.", 1),
  philippines: h("democracy", "Liberated, 1945", 1),
  pacific: h("democracy", "Japanese garrisons surrender", 1),
  spain: h("nationalist", "Franco still rules. Spain never formally entered the war.", 2),
});

/** Through Franco’s death, 20 November 1975. */
export const Y1975: Snapshot = patch(Y1945, {
  germany: h("contested", "Divided: a democracy in the west, a communist state in the east.", 2),
  austria: h("neutral", "Independent and neutral from 1955", 1),
  poland: h("soviet", "Communist state in the Soviet sphere", 1),
  czech: h("soviet", "Communist state after the 1948 coup", 1),
  japan: h("democracy", "Postwar constitution. Hirohito remains emperor until his death in 1989.", 2),
  korea: h("contested", "Two states after 1948. The Korean War is 1950–1953.", 2),
  nchina: h("china", "People’s Republic of China from 1 October 1949. Mao still rules in 1975.", 2),
  schina: h("china", "People’s Republic on the mainland. Chiang’s government is on Taiwan.", 2),
  manchuria: h("china", "Part of the People’s Republic", 1),
  wsoviet: h("soviet", "Stalin dies 5 March 1953. The Soviet state continues.", 3),
  siberia: h("soviet", "Soviet Union", 1),
  spain: h("nationalist", "Franco rules until his death on 20 November 1975.", 2),
  seasia: h("contested", "Decolonization and war, including Vietnam. Shown as context, not a conquest score.", 1),
});

export const SNAPSHOTS = {
  Y1922,
  Y1928,
  Y1933,
  Y1938,
  Y1939,
  Y1940,
  Y1941,
  Y1943,
  Y1945,
  Y1975,
};
