# Hardwood GM: Project Handoff

**For a new Claude chat:** this file is the full history and current state of Hardwood GM, a historical NBA general-manager game. Read all of it before changing anything. Attach `hardwood-gm-source.zip` too: it has the real code. This file is only a guide to the code.

*Written 2026-11-09. Current version: **2026-11-10c**.*

---

## 1. The person and how to work with him

- **Tanner** (GitHub user `tboyle2244`). He builds games with Claude as a hobby. He has no programming background and works in audit by day.
- **Does everything on an iPad:** downloads the zip, unzips it in the Files app, and uploads the files to GitHub through the website. Never give steps that need a computer or a terminal.
- **Sister project:** *Gridiron GM*, an NFL version starting in 1970 (`tboyle2244.github.io/gridiron-gm`, built in another chat). Hardwood GM copies its approach, and he often asks for "what you did for the football game".
- **His standing preferences for every reply:**
  1. Never open by agreeing. The first sentence challenges an assumption or names what he's missing.
  2. Tag claims **[Certain]**, **[Likely]** or **[Guessing]**.
  3. Never use "Great question", "You're absolutely right", "That makes a lot of sense", "Absolutely" or "Definitely".
  4. When he's wrong: "I disagree because… Here's what I'd do instead… The risk in your approach is…"
  5. Give the uncomfortable answer first.
  6. No warm-up paragraphs.
  7. Don't give in when he pushes back without new information.
- **Each delivery:** bump the version, test it (node tests plus browser screenshots with Playwright), send the zip, and tell him to check that the Data tab shows the new version.

## 2. Where everything lives

| Thing | Where |
|---|---|
| Live game | https://tboyle2244.github.io/Hardwood-GM/ (capital H, G and M matter) |
| GitHub repo | `TBoyle2244/Hardwood-GM`. He uploads the files at the top level of the repo, with no folders. |
| Visitor stats | https://hardwoodgm.goatcounter.com (GoatCounter, site code `hardwoodgm`) |
| Files he uploads (7) | `index.html`, `sw.js`, `manifest.json`, `nba-data.json`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png` |
| Data source | github.com/sumitrodatta/bball-reference-datasets (Basketball-Reference tables, updated through the current 2026-27 season) |

**Updating the live game:** download `hardwood-gm.zip` → unzip → on GitHub, *Add file → Upload files* → select all 7 files → *Commit*. Wait about a minute, then open the app; the Data tab should show the new version. The service worker loads the page network-first, so one launch is enough. If it shows the old version, close the app completely and reopen it.

## 3. How the code is built

```
src/shell.html   page shell; <!--PWA-->…<!--/PWA--> block (manifest, icons, GoatCounter) only in the hosted build
src/style.css    hardwood palette, light/dark themes
src/engine.js    ALL game logic (≈3,300 lines). Works in the browser (window.HW) and Node (module.exports)
src/ui.js        ALL screens (≈1,160 lines). APP_VERSION constant lives here
src/help.js      in-game manual text (HELP sections, HELP_TAB); inlined before ui.js. Keep it current.
src/sw.js        service worker; cache name PREFIX + 'vNN' (bump each release, currently v25)
src/nba-data.json  built-in data (≈4.8 MB), made by tools/build_data.py
tools/build_data.py  turns the dataset CSVs into nba-data.json
build.py         inlines css+engine+help+ui into shell → dist/hardwood-gm/index.html (+ copies the other 6 files)
                 and dist/artifact.html (a preview without the PWA block)
test/            node + Playwright tests (see §8)
```

- **One-page offline web app (PWA).** Saves go to IndexedDB `hardwood-gm`, falling back to localStorage `hw-*`. Backups export and import as JSON from the Data tab.
- **Release steps:** edit src → bump `APP_VERSION` in ui.js and `'vNN'` in sw.js → `python3 build.py` → run the tests → `cd dist && zip -qr hardwood-gm.zip hardwood-gm` → send the zip.
- **Rebuilding the data:** clone the dataset repo, then `python3 tools/build_data.py <repo>/Data src/nba-data.json`. The build needs `Player Per Game.csv`, `Advanced.csv`, `Player Totals.csv` and `Draft Pick History.csv`.
- **Year conventions (easy to get wrong):**
  - Inside the engine, `L.year = 1976` means the **1976-77** season (the year it starts).
  - Basketball-Reference and the dataset use the **ending** year: `NBA_1977` is 1976-77.
  - In imports, `future[E]` is keyed by ending year E, so its start year is E−1.
  - Draft year Y is the June draft before season Y.
- The built-in data is turned into import tables by `G.fromBundle(B)`: `pg`/`adv` (1975-76 NBA+ABA), `future[E]` (every season from 1977 on), `advs[E]`, `drafts[Y]`, plus `complete:true` and `partial:<current season, still in progress>`. The UI merges this with any manual imports in `IX()`; built-in data wins where both exist.

## 4. Everything the game does (features)

**Setup and history**
- Start in any season from 1976-77 (the merger, with the ABA dispersal draft and the Julius Erving sale decision) to 2026-27, with real rosters and the real rules of that year.
- Teams, expansions (with expansion drafts), relocations, renames and realignments follow `EVENTS` and `ALIGN`.
- Difficulty levels: Rookie, Pro and All-Star.

**Rules by era (`rules(y)`)**
- Games per season: 82, cut to 50 in 1998, 66 in 2011, and 72 in 2019-20.
- Playoffs: 12 teams with byes until 1983, then 16; play-in tournament from 2020.
- Three-point line from 1979; zone defense from 2001.
- Draft rounds: 10/8/10/7/3/2 by era.
- Roster limit 12, then 15 from 2005.
- Salary cap from 1984, rookie scale from 1995, mid-level exception from 1999, luxury tax from 2002.
- Lottery types follow history.
- Salary floor from 1999: 75% of the cap, 85% from 2011, 90% from 2013. A team under it pays the gap to its players.

**Free agency**
- Compensation picks (to 1980), then right of first refusal (1981–87), then unrestricted free agency with bidding rounds (1988 on), with restricted free agents and offer sheets.
- Soft cap with Bird rights; trades must match salaries within 125% + $100K.
- Sign-and-trades from 1999: 4-year maximum from 2017, apron limit from 2013.

**Trades**
- Trade builder, trading block, AI-to-AI trades and incoming AI offers, and a trade deadline.
- Before you propose, the builder shows exactly why a deal can't work (cap rules or roster size). Messages appear as a toast fixed above the tab bar, wherever the screen is scrolled.

**Draft and scouting**
- The next draft class is visible all season. A random handful of prospects get graded each week, so the board reshuffles, and everyone is graded by the end of the regular season.
- At the draft, 10 workouts (plus perks) show a prospect's true potential and five skill grades.
- You can shop your pick, and AI teams call to trade up.
- Draft tracker (11-10b): a live card on the draft screen (newest first, team and round filters, TRUE only for your workouts), and League tab → Drafts for every past draft with draft-day scout grade, current OVR/POT and the real pick. Picks are kept in `L.draftLog[year]` ({n, r, tid, pid, ab, sc, pot}) at `endDraft`; `p.dtid` is the drafting team. `draftHistory(L)` rebuilds drafts from older saves using the team each player first played for.
- Real undrafted players arrive as free agents in the summer they really debuted (from 1977). Their potential stays hidden for their first season, AI teams judge them by scout grade only, and most get camp contracts.

**Players**
- Ratings come from rank: Hollinger game score blended with box plus/minus, weighted by minutes, then ranked into a fixed curve.
- Potential is the player's **prime**: the average of his best 3 seasons.
- Position is the one he played most. Shooting habits come from his biggest season.
- Development and aging: each player has a hidden "grace" trait (some barely slow down). A big injury at 28 or older costs extra rating points.
- Retirement depends on age, how far he's fallen from his peak, how good he still is, and his injuries. A few stars play to 40.
- Morale, trade requests, promised minutes, holdouts, injuries, and playing through injury.

**Coaching**
- Offenses and defenses that come and go with their eras; a game plan for each game.
- A head coach and two assistants. Retired players can become coaches.
- Lineup styles: Traditional, Best five, Twin towers, Small ball. Their effect depends on the era (`posRigidity`, `bigEra`). Big men matter most early; lineups become positionless by the mid-2010s.
- AI teams value positions by era: centers are worth more early and guards more later.

**Team chemistry (11-09b)**
- Every player gets one or two archetypes from his stat profile (`archetypes(p, y)`): floor general, scoring guard, shot creator, 3-and-D wing (shooter-defender before 1980), slasher, stretch big, post scorer, rim protector, rebounder, two-way star, or role player.
- The rotation is scored on six parts plus time together (`chemRaw`): play style (tempo, offense focus, defense fit), skill coverage, offensive synergy, defensive synergy, positional balance (the old `lineupEffects`, now inside chemistry), archetype diversity, and time together (`p.jd` = when he joined; `tenure()`, capped at 3 seasons, builds during the season).
- Each part is compared with the league that season (`chemNorm`, cached per year/phase/two weeks, non-enumerable `L._chemN`). 80% of the part that just tracks talent is taken out (`CHEM.untalent`), so the score measures fit, not quality. 50 = league average.
- The effect on team rating tops out at ±3 (`CHEM.max`, reached at 2 standard deviations), added to both off and def. Measured: ±3 ≈ ±6.5–8 wins. `TUNE.k` went 0.75 → 0.68 to keep the league's spread where it was.
- Coach tab Chemistry card: score, effect in rating and wins, part bars, what's hurting and helping, and an expandable view of the rotation's roles and seasons together. Archetype tags on the Roster tab and player card. The trade builder shows "Chemistry X → Y" and the team rating before and after (`chemPreview`).
- AI teams use fit: trade value is scaled by the chemistry change (contenders care most, `chemCare`), and in free agency they pick the best fit among near-equal players.
- Leagues started after 1976 seed time together from the real previous seasons. Old saves pick it up from player history.

**Games**
- Each game is simulated as a score plus a box score. There's no play-by-play.
- Personal fouls depend on the matchup. Six fouls means fouling out, and the bench takes the lost minutes. Box scores have a PF column, and season tables show PF and DQ.

**Your job**
- Owner goals and job security; you can be fired and pick from job offers.
- History decisions: three-point line 1979, salary cap 1983, Olympics from 1992 on, overseas scouting 1996, lockouts 1998 and 2011, luxury tax 2002, analytics 2007.

**Records**
- Awards, including All-NBA 1st/2nd/3rd teams, All-Defensive teams, statistical titles and the All-Star Game with its MVP.
- Hall of Fame and retired jerseys.
- A record book for the league or any franchise: single-season, career and playoff leaders, plus best and worst team seasons.
- Playoff stats are kept separately.
- Offseason progression report.

**App**
- In-game manual (11-10a): the **?** button in the header opens Help at the section for the current tab (draft and contracts sections at those times of year). 17 collapsible sections, topic chips, search, cross-links, and a "How to play" button on the setup screen. The text lives in `src/help.js` (`HELP`, `HELP_TAB`), which build.py inlines just before ui.js. **Update help.js whenever a feature changes.**
- Offline play; light and dark themes; backup export and import.
- GoatCounter counts visits plus named events: `new-league-YYYY`, `team-<key>`, `difficulty-*`, `season-sim`, `playoffs-done`, `draft-done`, `new-season`, `trade-made`, `tab-*`. It only runs on `tboyle2244.github.io`, and the service worker never caches it.

## 5. Key settings, tuned with 45-season test runs

| Setting | Value | What it controls |
|---|---|---|
| `TUNE` | k 0.68 (was 0.75 before chemistry), sd 9.3, star 0.08, soft 5, softK 0.4 | Talent→margin, game randomness, star bonus, diminishing returns |
| `PAY.base` | 1.07 | Salary curve (puts about 1–2 teams over the tax each season) |
| `FOUL` / `foulOutP(y)` | 0.15 (1976) → 0.07 (2016) | Share of six-foul games that end in a foul-out |
| `SCOUT_VISITS` | 10 | Draft workouts per year |
| `JERSEY_LINE` | 420 | Franchise score needed to retire a jersey |
| `RANK_CURVE` | #1 ≈ 95, #30 ≈ 78 | Season-rank → rating |
| `CHEM` | max 3, sdCap 2, untalent 0.8 | Chemistry effect cap, how far out it's reached, how much talent is removed |
| `retireChance()` | age table × decline × quality × injury | Retirement |

**What the game should look like against real history:**
- Best record about 63 wins, worst about 20.
- About 1–2 seventy-win seasons per 45 years.
- 15–21 different champions in 45 years.
- League scoring within about 0.5 points of real averages.
- Players rated 80+: about 21 in 1976, about 40 in the 2010s (30 teams).
- Draft classes: top-5 average about 80–88, with 2–8 prospects at 80+.

## 6. Version history (what changed when)

- **Oct 27–28:** core game, built-in import screens, era offenses and defenses, iPad install guide. Ratings moved to a rank curve (Moses Malone's potential fixed). Later-season imports added for potential. Scout grades in the dispersal draft. Trading block.
- **28a–28c:**
  - Trade requests, draft-night trades, progression report, All-Star Game and more honors.
  - Long-run balance check: there was too much parity. Made-up classes caused rating collapse, and stars went unsigned.
- **29a:** record book, retired jerseys, history decisions.
- **29b:** Bird's potential fix (career win shares outweigh draft slot); open-draft rescore.
- **29c:**
  - Season-long scouting; draft-entry ages by era; positions from imported seasons.
  - AI front offices: contending, middle or rebuilding; luxury-tax spenders.
  - Playoff stats; retired players become coaches; salary floor; sign-and-trades.
- **29d:** era-based lineups and positions; Coach-tab Lineup card.
- **29e:** AI values positions by era.
- **30a:** three-point habits for drafted players (Bird barely shot threes); NaN display fix.
- **30b:** fouls and foul-outs; start in any season (from imports).
- **30c:** retirement tied to decline and injuries, "grace" aging, teams re-sign players 35+.
- **30d:** potential blends win shares with BPM and leans less on draft slot (Drexler 82 → about 89).
- **30e:** clear trade-rejection reasons; fixed-position messages.
- **11-01a:** real undrafted free agents, an Undrafted rookies card, camp contracts.
- **11-02a:** **built-in dataset**, so nothing needs importing:
  - Potential is now the average of a player's best 3 seasons.
  - BPM is weighted by minutes.
  - Positions are the most-played one.
  - Undrafted players from 1977.
- **11-02b:** in-season scouting grades come in fully random order.
- **11-02c / 11-02d:** GoatCounter visits, then named events.
- **11-09a:** draft classes from real draft history. Made-up classes after 2026 and the newest real classes (last 6 years) draw potential from what real picks at that slot became (1985–2016 drafts). Existing leagues refresh the class on the board once.
- **11-09b:** team chemistry (six parts plus time together, ±3 team rating), archetypes, chemistry in the trade builder, AI uses fit. The lineup shape now counts through chemistry's positional balance instead of directly. Service worker v22.
- **11-10a:** in-game Help and manual (`src/help.js`); setup screen's "Import data" button became "How to play". Service worker v23.
- **11-10b:** draft tracker (live during the draft, plus League → Drafts history). Service worker v24.
- **11-10c:** sort by salary (this season's, highest first) on Roster, Contracts and the trade builder (`cmp('sal')`, `salNow`, `sortSeg(..., withSal)`). Before the cap, the trade builder shows salary instead of age while sorted by salary. Service worker v25.

## 7. Known issues and ideas not built yet

- Role players retire a little late: typically at 33, where in reality many are out by 30–32.
- In a long league, the number of 80+ players grows from about 21 to about 40, mostly because the league expands to 30 teams.
- Peak ratings top out near 95, so Jordan peaks around 95 while LeBron reaches 99 on career length.
- AI teams can still very rarely go 75+ wins (about once in 200 test seasons).
- The 1998-99 lockout season has no All-Star Game, which is correct.
- Offseason moves (trades and signings in the summer) are missing for leagues started after 1976. Rosters come from the previous season's final teams.
- **Ideas offered but not built:**
  - Weekly power rankings and preseason predictions.
  - Watching playoff games live with play-by-play.
  - Money side (attendance and revenue).
  - Two-way contracts and the G League.
  - Changing a player's position.
  - Lasting injury damage and injury-prone players. Injuries feed retirement, but there's no separate injury-proneness trait.
  - In-app play history (play counts and time played, stored on the device).

## 8. How to test (in the repo's `test/` folder)

- `node test/run.js`: quick regression of a full season cycle.
- `node test/reallong.js uta 45`: 45 seasons from 1976 with the **real** data. Prints balance, top players, undrafted careers, timing and save size.
- `node test/health.js 45 real|gen out.json` + `node test/hreport.js out.json`: long-run metrics using made-up test data. `test/tune.sh` compares tuning settings.
- `test/udfa.js`, `sat.js`, `start.js`, `shoot.js`, `feat.js`, `hist.js`: feature checks.
- Browser tests: start `python3 -m http.server 8765 --directory dist/hardwood-gm` in the background, then run `node test/ui5.js` … `ui12.js` and `gc.js` (Playwright). They print `errors []` when clean, and most save screenshots.
- `node test/chem.js 10 1990`: chemistry check (archetype mix, score spread, wins per chemistry point, link to talent). Browser: `test/ui13.js` (Chemistry card, roster tags, trade preview), `test/ui14.js` (Help: context sections, links, search, back, phone width), `test/ui15.js` (draft tracker: rebuilt start-year draft, live tracker, saved history, filters), `test/ui16.js` (salary sort, 1976 and 2016, phone width).
- `test/fixtures.js`: made-up 1976 rosters for tests that don't need real data.

## 9. Conversation timeline, condensed

1. He asked for an NBA version of Gridiron GM starting at the 1976 merger, with any team, before the dispersal draft, as a separate app (free GitHub accounts can host several).
2. Built the game. He set up GitHub on the iPad, installed it as a web app, and imported Basketball-Reference tables by copy and paste.
3. **Ratings:** stars were too low, so ratings moved to a rank curve. Moses Malone's potential led to later-season imports.
4. **Features in batches:**
   - Trade finder, then trade requests, draft-night trades, progression report and honors.
   - A long-run health check, then the record book, jerseys and history decisions.
   - Draft potential fixes: Bird, then Drexler.
   - Season-long scouting, playoff stats, coaches from retired players, salary floor and sign-and-trades.
   - Era lineups and era player values.
   - Three-pointers, fouls and foul-outs, and start years.
   - Retirement and aging, trade messages, and undrafted free agents.
5. He asked whether an nflverse-style dataset exists for the NBA. Found **bball-reference-datasets** and built it in, so nothing needs importing anymore.
6. Scouting order made random; GoatCounter visitor counting and events added.
7. Friends played past 2026 and found the draft classes weak. The fix was history-based classes (11-09a).
8. Talked about letting him play games live, then pivoted to team chemistry. He asked for play style, skill coverage, offensive and defensive synergy, positional balance and archetype diversity, said time together should matter and ±3 points is right. Built in 11-09b.
9. Asked for a help menu and full manual. Built in 11-10a.
10. Asked for a draft tracker showing who AI teams drafted. Built in 11-10b.
11. Asked to sort by yearly salary on the Roster and trade screens. Built in 11-10c.
