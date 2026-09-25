# Oil Baron: Build It or Buy It?

Classroom game for **Battery Creek High School** US history, lesson G4 **Captains of Industry** (USHC.3.CO / USHC.3.P). Students run a Cleveland refinery from 1870 to 1890 and each round play one card: efficiency (please customers) or privilege (rebates, buyouts, the trust).

No accounts, no backend. Progress stays in `localStorage`. Sound is generated in the browser (no audio files). Pixel art is drawn by the game. Nothing is loaded from a CDN at runtime.

## Run locally

```bash
cd oil-baron-game
npm install
npx playwright install chromium
npm test
npm run dev
```

Open the printed local URL. `npm run build` writes a static site to `dist/`. Paths are relative (`base: './'`), so it works at `/oil-baron-game/` on GitHub Pages.

## One class period (about 20 minutes)

1. **Title.** Solo, or Teams (2–4, hot-seat on the projector). Short game is 6 rounds. Full game is 10 (1870–1890).
2. **Each round.** Play one card. Blue cards cut the cost of kerosene. Amber cards chase railroad favors and buyouts. Rivals answer. A history card lands (Panic of 1873, Tidewater, the trust, the Interstate Commerce Act, Sherman).
3. **Ledger.** Two scores: Customer Value and Political Privilege. Badges include Market Entrepreneur, Political Entrepreneur, and Trust Buster Target.
4. **Result slip.** Copy or print. The prompts are DBQ question 11: which strategy won the share, was it fair to customers, and one historical fact.

Keys: `1` `2` `3` choose a card, `Enter` plays it, `Space` continues an event, `M` mutes, `T` opens teacher controls (pause, skip to the end, restart), `Esc` pauses.

## Facts the game keeps

Labeled approximate where the lesson says so: Standard Oil founded 1870; kerosene about 26¢ a gallon in the early 1870s to about 8¢ by 1885; about 90% of U.S. refining by ~1880; South Improvement Company 1872; Standard Oil Trust 1882; Interstate Commerce Act 1887; Sherman Antitrust Act 1890 (Senate 51–1, House 242–0). Ida Tarbell's *History of the Standard Oil Company* (1902–1904) is an epilogue, "History's verdict," not a round inside 1870–1890.

The end screen states both lenses: Folsom's market entrepreneur versus political entrepreneur, and the critics' case from Tarbell and Lloyd. Both condemn special privilege. They disagree about which score explains a fortune like this one.

## Credits

- Art: original pixel drawings generated in the game.
- Sound: original square- and triangle-wave synthesis. No third-party samples.
- History: the G4 Captains of Industry packet (Carnegie, Rockefeller, Vanderbilt, Morgan, Folsom, Tarbell, the Sherman Act).

## Pages

Published at `https://animayer.github.io/USHC-Class/oil-baron-game/` from the `gh-pages` branch. The workflow builds this game and `build-the-line-sim`, then publishes both.
