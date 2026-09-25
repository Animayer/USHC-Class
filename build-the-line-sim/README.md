# Build the Line / Prove Up

Classroom simulation for **Battery Creek High School** US history, standard **USHC.3.CC / 3.P** (Opening the West, 1862–1890). Students run a 160-acre homestead, then a railroad contract. The question underneath both rounds: how federal land and railroad policy shaped settlement and corporate growth.

No accounts, no backend, no tracking. Progress stays in `localStorage` on that device. The teacher Reset button on the results screen wipes it.

Fonts are named in CSS and fall back to Segoe UI and Georgia. The page does not load a runtime CDN, so it still runs when the Chromebook is offline after the files themselves are cached.

## Run locally

```bash
cd build-the-line-sim
npm install
npm run dev
```

Open the printed `http://localhost:5173` URL.

```bash
npm test
npm run build
```

`npm run build` writes a static site to `dist/`. Paths are relative (`base: './'`).

## One class period (about 20 minutes)

1. Hub. Read the standing note: cash scores are the farm and the company. The Native land cards are a record, not points.
2. **Prove Up.** Pick miles to the rail. Play 1870–1874: wheat or corn, fence (barbed wire only in 1874), borrow or not. Rain or drought is revealed after you lock the year. 1874 brings the Rocky Mountain locusts. In 1875, prove up or abandon.
3. **Build the Line.** Pacific Railway Act contract (per-mile bonds, 1864 land grant, Credit Mobilier card) or Great Northern (no subsidy, grades, finished 1893). Read each land-record card before you build.
4. **Results.** Three prompts for packet Q10. Print. Teacher Reset clears the device.

Keys: `H` hub, `P` prove up, `B` build the line, `R` results.

Deep links: `?mode=prove`, `?mode=line`, `?mode=results`.

## Pages

Published at `https://animayer.github.io/USHC-Class/build-the-line-sim/` after an admin sets **Settings → Pages → Source** to the `gh-pages` branch, folder `/ (root)`. The workflow builds this app, copies it to `site/build-the-line-sim/`, writes `site/index.html`, adds `site/.nojekyll`, and publishes with `peaceiris/actions-gh-pages@v4`.
