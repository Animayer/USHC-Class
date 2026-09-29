# Rise of Dictators

Classroom game for **Battery Creek High School** US history, Ryan Mayer’s 11th grade. Students play a war-map chronicle from the March on Rome in 1922 through Franco’s death on 20 November 1975. The score is Insight: a correct reading of a cause, a date, or a source. Land changes color because the record changed. Dice illustrate a battle. They do not award territory, and they do not award points.

No accounts and no install. Open it in Chrome on a Chromebook or on the projector. Sound is synthesized in the browser. Portraits and the map are drawn by the game. Fonts are bundled. Nothing is loaded from a CDN at runtime.

The Holocaust, the Holodomor, and the Nanjing massacre appear as record panels. They are never a move, a tile to capture, or a score. There is no swastika and no cheering of a regime.

## Run locally

```bash
cd rise-of-dictators-sim
npm install
npx playwright install chromium
npm test
npm run dev
```

Open the printed local URL. `npm run build` writes a static site to `dist/`. Paths are relative (`base: './'`), so the game works at `/rise-of-dictators-sim/` on GitHub Pages.

## A short class (about 10 minutes)

1. **Title.** Choose Quick round for one student, or Projector teams (2–5) and set the length to Quick round.
2. **Four eras.** 1922–1933, appeasement through Poland, the war through 1943, then the legacy to 1975. Each era opens with a headline. Play one card. Answer the check.
3. **Quiet panels.** Famine, Nanjing, and the Holocaust stop the game. Read them. They give no points.
4. **Debrief and exit quiz.** Ten questions, each with an explanation. The key is printed below so the screen and the sheet cannot drift.

## A full period (about 20–30 minutes)

Use Full chronicle. Eight eras, and in a team game every desk plays a card before the check. Or send the class into Hitler’s Spread: Europe, year by year, from the failed 1923 putsch to the empty map of 1945 and a Nuremberg note in 1950. The gauge is labeled so students do not mistake it for a score. The reflection asks what could have stopped him. “Easy” is one of the wrong answers.

Keys: `1` and `2` play cards, `Enter` or `Space` continues, `M` mutes, `N` toggles history notes, `T` opens the teacher desk, `Esc` closes it. The teacher desk can hide notes, reset, skip to the debrief, open the quiz, or clear the class board. The board stores understanding points in `localStorage` on that machine.

## Standards

Teach the **2019** South Carolina College- and Career-Ready Standards for United States History and the Constitution. The codes below are the ones this chronicle can honestly carry. Wording is the 2019 indicator, shortened only where the line broke across a table in the state PDF.

- **USHC.4** — how American identity at home and abroad was affected by imperialism, world conflict, and economic boom and bust, 1893–1945. The enduring understanding includes the return to neutrality and the way World War II ended isolation.
- **USHC.4.CO** — comparative analysis of the motives for and outcomes of American policies regarding foreign intervention, including the outcomes of intervention in the world wars.
- **USHC.4.CC** — continuity and change on the U.S. home front in the world wars, including America’s response to the Holocaust.
- **USHC.4.E** — primary and secondary sources on changes in American foreign policy, worldwide conflicts, and business cycles.
- **USHC.4.CE** is the boom and bust of the 1920s and 1930s and the New Deal debate. This game uses the Depression only as a condition for the Nazi vote. It does not teach the New Deal. Do not list the period as a USHC.4.CE lesson.
- **USHC.5.CE** — causes and effects of Cold War turning points, including the rivalry with the Soviet Union. The 1945–1975 close (Yalta and Potsdam, the Soviet presence in Eastern Europe, Mao still in power in 1975, Franco’s death) is the bridge into that standard. Korea and Vietnam are not in this game.

The older end-of-course cousins, kept only for review packets that still print them, are **USHC-7.1** (the decision to enter the war: the rise of totalitarianism, isolation, Pearl Harbor) and **USHC-7.4** (humanitarian and diplomatic effects, including the Holocaust and the war-crimes trials). Teach the 2019 indicators.

## Discussion

1. Chamberlain said “peace for our time.” Who was not in the room at Munich, and what did that absence cost?
2. Why is the famine of 1932–33 a record on this map, and not a card a team can play?
3. What did the Nazi-Soviet Pact say in public, and what did the secret protocol add?
4. Why does this chronicle run to 1975 if Hitler, Mussolini, and Tojo were dead by 1948?
5. Where, before September 1939, was there a real chance to stop him, and why is “easy” the wrong word for it?

## Exit quiz

In this sheet the correct choice is printed first, then the explanation the game shows. On screen the four buttons stay in the order written in the code, so the right answer is not always the top button.

1. The March on Rome was in October 1922. What happened next?
   - King Victor Emmanuel III refused martial law and asked Mussolini to form a government.
   - The march reached Rome on 28 October 1922. The king would not sign the martial-law decree, and he invited Mussolini to be prime minister. The failed coup in November 1923 was Hitler’s Beer Hall Putsch, not this march.

2. Which statement about 30 January 1933 is accurate?
   - President Hindenburg appointed Hitler chancellor. The Nazis were the largest party, not a majority.
   - In the November 1932 election the Nazis were the largest party and still short of a majority. Hindenburg appointed Hitler chancellor on 30 January 1933, with conservative partners who thought they could control him. The Enabling Act came later, on 23 March 1933.

3. The Enabling Act of 23 March 1933 mattered because it let the cabinet do what?
   - Make laws without the Reichstag, including laws that broke the constitution.
   - The act let Hitler’s cabinet legislate without the Reichstag. Communist deputies were excluded. The Social Democrats voted no. The Centre Party voted yes. Dictatorship arrived in legal dress.

4. The Munich Agreement of 29–30 September 1938 did what?
   - Gave the Sudetenland to Germany. Czechoslovakia was not a party to the talks.
   - Chamberlain, Daladier, Hitler, and Mussolini signed. Czech leaders were told the terms, not invited to write them. In March 1939 Germany occupied the rest of Bohemia and Moravia. Chamberlain spoke of “peace for our time” on 30 September 1938. Churchill was not prime minister yet.

5. The Nazi-Soviet Pact of 23 August 1939 included which secret term?
   - A division of Eastern Europe into spheres, followed by a Soviet invasion of eastern Poland.
   - The public text was a non-aggression pact. A secret protocol divided spheres in Eastern Europe. Germany invaded Poland on 1 September 1939. The Soviet Union invaded eastern Poland on 17 September. The Winter War against Finland began on 30 November 1939.

6. Which sequence matches the record?
   - Rhineland 1936, Anschluss 1938, Poland 1939, France 1940, invasion of the Soviet Union 1941.
   - The Rhineland was remilitarized on 7 March 1936. Austria was annexed in March 1938. Poland was invaded on 1 September 1939. France signed an armistice on 22 June 1940. Operation Barbarossa began on 22 June 1941.

7. Japan attacked Pearl Harbor on 7 December 1941. Which statement is the fairest?
   - The attack brought the United States into the war. Tojo was prime minister. Hirohito approved the decision for war and was not tried afterward.
   - The China war had begun in July 1937. Tojo became prime minister on 18 October 1941. The emperor approved the war decision. He was not charged at the Tokyo trials, a choice the occupation made. Historians, including Herbert Bix, disagree about how active he was. He was not a lone plotter, and he was not only a blank signature.

8. Which statement about the Holocaust is accurate?
   - It was the Nazi regime’s systematic murder of six million Jews, and of millions of other civilians. It is not a move and not a score.
   - The United States Holocaust Memorial Museum gives the figure of six million Jews. Roma people, people with disabilities, Poles, Soviet prisoners of war, and political opponents were also murdered. Mass shooting expanded with the 1941 invasion of the Soviet Union. The Wannsee Conference of 20 January 1942 coordinated killing that had already begun.

9. Which statement about Francisco Franco is accurate?
   - He won the Spanish Civil War in 1939, kept Spain out of a formal declaration of war, and ruled until his death on 20 November 1975.
   - The civil war ran from July 1936 to 1 April 1939. Nazi Germany and Fascist Italy aided the Nationalists. Guernica was bombed on 26 April 1937. Franco met Hitler at Hendaye in 1940 and did not bring Spain into the war. He died on 20 November 1975.

10. Which statement about Hideki Tojo is accurate?
    - He became prime minister in October 1941, resigned in July 1944, and was executed on 23 December 1948 after the Tokyo trials.
    - Tojo was a Kwantung Army officer who became that army’s chief of staff in 1937. He did not personally start the 1931 Manchurian Incident. He resigned on 18 July 1944 after the fall of Saipan. The Tokyo tribunal sentenced him to death. Hirohito, not Tojo, was the emperor.

## Credits and sources

Portraits, the map, and the sound are original. Control is shown by a color and a plain letter, not by a flag or a party emblem.

- United States Holocaust Memorial Museum. Holocaust encyclopedia, including the introduction and the Wannsee Conference.
- Richard J. Evans, *The Third Reich* trilogy.
- Ian Kershaw, *Hitler*.
- R. J. B. Bosworth, *Mussolini*.
- Anne Applebaum, *Red Famine* (2017). Ukrainian death toll given as about 3.9 million.
- Oleg Khlevniuk, *Stalin: New Biography of a Dictator* (2015).
- Paul Preston, *Franco*.
- Rana Mitter, *China’s War with Japan* (2013).
- Herbert P. Bix, *Hirohito and the Making of Modern Japan* (2000).
- International Military Tribunal for the Far East. Nanjing finding of more than 200,000 dead. Tojo executed 23 December 1948.
- Office of the Historian, U.S. Department of State.
- Encyclopaedia Britannica, for date checks.

## Pages

Published at `https://animayer.github.io/USHC-Class/rise-of-dictators-sim/` from the `gh-pages` branch, beside the other classroom sims.
