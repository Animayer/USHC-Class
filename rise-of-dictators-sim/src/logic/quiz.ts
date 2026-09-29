import type { Question, QuizState } from "./types";

export const QUIZ: Question[] = [
  {
    prompt: "The March on Rome was in October 1922. What happened next?",
    choices: [
      "King Victor Emmanuel III refused martial law and asked Mussolini to form a government.",
      "Mussolini won a free election and became dictator the same week.",
      "The march failed, and Mussolini left politics until 1939.",
      "Britain and France declared war on Italy.",
    ],
    answer: 0,
    explain:
      "The march reached Rome on 28 October 1922. The king would not sign the martial-law decree, and he invited Mussolini to be prime minister. The failed coup in November 1923 was Hitler’s Beer Hall Putsch, not this march.",
  },
  {
    prompt: "Which statement about 30 January 1933 is accurate?",
    choices: [
      "The Nazi Party had already won a majority of the vote, so Hitler became dictator that morning.",
      "President Hindenburg appointed Hitler chancellor. The Nazis were the largest party, not a majority.",
      "The Beer Hall Putsch succeeded and made Hitler chancellor.",
      "The Enabling Act was passed on that day.",
    ],
    answer: 1,
    explain:
      "In the November 1932 election the Nazis were the largest party and still short of a majority. Hindenburg appointed Hitler chancellor on 30 January 1933, with conservative partners who thought they could control him. The Enabling Act came later, on 23 March 1933.",
  },
  {
    prompt: "The Enabling Act of 23 March 1933 mattered because it let the cabinet do what?",
    choices: [
      "Make laws without the Reichstag, including laws that broke the constitution.",
      "Restore the Kaiser and dissolve the army.",
      "Sign the Nazi-Soviet Pact.",
      "Grant independence to Poland.",
    ],
    answer: 0,
    explain:
      "The act let Hitler’s cabinet legislate without the Reichstag. Communist deputies were excluded. The Social Democrats voted no. The Centre Party voted yes. Dictatorship arrived in legal dress.",
  },
  {
    prompt: "The Munich Agreement of 29–30 September 1938 did what?",
    choices: [
      "Gave the Sudetenland to Germany. Czechoslovakia was not a party to the talks.",
      "Sent Allied armies into Berlin.",
      "Created the United Nations.",
      "Ended the war in the Pacific.",
    ],
    answer: 0,
    explain:
      "Chamberlain, Daladier, Hitler, and Mussolini signed. Czech leaders were told the terms, not invited to write them. In March 1939 Germany occupied the rest of Bohemia and Moravia. Chamberlain spoke of “peace for our time” on 30 September 1938. Churchill was not prime minister yet.",
  },
  {
    prompt: "The Nazi-Soviet Pact of 23 August 1939 included which secret term?",
    choices: [
      "A division of Eastern Europe into spheres, followed by a Soviet invasion of eastern Poland.",
      "A promise that Germany would become communist.",
      "An alliance with the United States.",
      "The text of the Munich Agreement.",
    ],
    answer: 0,
    explain:
      "The public text was a non-aggression pact. A secret protocol divided spheres in Eastern Europe. Germany invaded Poland on 1 September 1939. The Soviet Union invaded eastern Poland on 17 September. The Winter War against Finland began on 30 November 1939.",
  },
  {
    prompt: "Which sequence matches the record?",
    choices: [
      "Rhineland 1936, Anschluss 1938, Poland 1939, France 1940, invasion of the Soviet Union 1941.",
      "Poland 1933, Rhineland 1939, Anschluss 1945.",
      "France 1936, D-Day 1938, Rhineland 1941.",
      "Anschluss 1922, Pearl Harbor 1936, Stalingrad 1938.",
    ],
    answer: 0,
    explain:
      "The Rhineland was remilitarized on 7 March 1936. Austria was annexed in March 1938. Poland was invaded on 1 September 1939. France signed an armistice on 22 June 1940. Operation Barbarossa began on 22 June 1941.",
  },
  {
    prompt: "Japan attacked Pearl Harbor on 7 December 1941. Which statement is the fairest?",
    choices: [
      "The attack brought the United States into the war. Tojo was prime minister. Hirohito approved the decision for war and was not tried afterward.",
      "The attack caused Britain to sign the Munich Agreement.",
      "Hirohito planned the raid alone, with no cabinet and no navy staff.",
      "The attack happened before the war in China began.",
    ],
    answer: 0,
    explain:
      "The China war had begun in July 1937. Tojo became prime minister on 18 October 1941. The emperor approved the war decision. He was not charged at the Tokyo trials, a choice the occupation made. Historians, including Herbert Bix, disagree about how active he was. He was not a lone plotter, and he was not only a blank signature.",
  },
  {
    prompt: "Which statement about the Holocaust is accurate?",
    choices: [
      "It was the Nazi regime’s systematic murder of six million Jews, and of millions of other civilians. It is not a move and not a score.",
      "It was a battle resolved with dice.",
      "It began with the March on Rome in 1922.",
      "It was invented after 1945, with no wartime record.",
    ],
    answer: 0,
    explain:
      "The United States Holocaust Memorial Museum gives the figure of six million Jews. Roma people, people with disabilities, Poles, Soviet prisoners of war, and political opponents were also murdered. Mass shooting expanded with the 1941 invasion of the Soviet Union. The Wannsee Conference of 20 January 1942 coordinated killing that had already begun.",
  },
  {
    prompt: "Which statement about Francisco Franco is accurate?",
    choices: [
      "He won the Spanish Civil War in 1939, kept Spain out of a formal declaration of war, and ruled until his death on 20 November 1975.",
      "He led the Soviet Union after Lenin.",
      "He died in 1939, when the civil war ended.",
      "He signed the Munich Agreement for France.",
    ],
    answer: 0,
    explain:
      "The civil war ran from July 1936 to 1 April 1939. Nazi Germany and Fascist Italy aided the Nationalists. Guernica was bombed on 26 April 1937. Franco met Hitler at Hendaye in 1940 and did not bring Spain into the war. He died on 20 November 1975.",
  },
  {
    prompt: "Which statement about Hideki Tojo is accurate?",
    choices: [
      "He became prime minister in October 1941, resigned in July 1944, and was executed on 23 December 1948 after the Tokyo trials.",
      "He led the March on Rome.",
      "He was the emperor of Japan.",
      "He died in office during the Pearl Harbor attack.",
    ],
    answer: 0,
    explain:
      "Tojo was a Kwantung Army officer who became that army’s chief of staff in 1937. He did not personally start the 1931 Manchurian Incident. He resigned on 18 July 1944 after the fall of Saipan. The Tokyo tribunal sentenced him to death. Hirohito, not Tojo, was the emperor.",
  },
];

export function createQuiz(): QuizState {
  return {
    index: 0,
    picked: null,
    correctCount: 0,
    showExplain: false,
    done: false,
    picks: [],
  };
}

export function pickQuiz(state: QuizState, choice: number): QuizState {
  if (state.done || state.showExplain) return state;
  const question = QUIZ[state.index];
  if (!question || choice < 0 || choice >= question.choices.length) return state;
  const correct = choice === question.answer;
  return {
    ...state,
    picked: choice,
    showExplain: true,
    correctCount: state.correctCount + (correct ? 1 : 0),
    picks: [...state.picks, choice],
  };
}

export function advanceQuiz(state: QuizState): QuizState {
  if (!state.showExplain || state.done) return state;
  const next = state.index + 1;
  if (next >= QUIZ.length) {
    return { ...state, done: true, showExplain: false };
  }
  return { ...state, index: next, picked: null, showExplain: false };
}
