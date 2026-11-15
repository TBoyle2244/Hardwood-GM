# Career Mode for Hardwood GM: Brief for a New Chat

**For the new Claude chat:** Tanner wants to add a **career mode**, where you are a single player instead of the general manager. This brief tells you what already exists, what can be reused, and which decisions need answers before any code is written. Read it first, then `HANDOFF.md` (the full history and state of the game), then the code in `hardwood-gm-source.zip`.

*Written 2026-11-14 (updated the same day: career mode will be part of Hardwood GM). Game version at hand-off: **2026-11-11c**.*

**Files that should come with this brief:**

| File | What it is |
|---|---|
| `CAREER-MODE-BRIEF.md` | This file: the career-mode starting point |
| `HANDOFF.md` | Everything about Hardwood GM: features, settings, version history, tests, and how Tanner works |
| `hardwood-gm-source.zip` | The source code: `src/`, `tools/`, `test/`, `build.py`. The built-in data `nba-data.json` (about 4.8 MB) isn't in it. Get it from `hardwood-gm.zip` or the live repo, or rebuild it with `tools/build_data.py`. |

---

## 1. Who you're working with

- **Tanner** (GitHub `tboyle2244`) builds games with Claude as a hobby. He doesn't program and does everything on an iPad.
  - He uploads built files to GitHub through the website.
  - Never give him steps that need a computer or a terminal.
- **Reply rules he set (follow them every time):**
  1. Never open by agreeing. The first sentence challenges an assumption or names what he's missing.
  2. Tag claims [Certain], [Likely] or [Guessing].
  3. Never use "Great question", "You're absolutely right", "That makes a lot of sense", "Absolutely" or "Definitely".
  4. When he's wrong: "I disagree because… Here's what I'd do instead… The risk in your approach is…"
  5. Give the uncomfortable answer first.
  6. No warm-up paragraphs.
  7. Don't give in when he pushes back without new information.
- **How he likes to work:** he asks for a feature, you build and test it, then you hand him the files to upload with a short "what changed".
  - He often asks "what else could we add?", so keep an honest list of ideas.
  - He often refers back to what was done in his NFL game, *Gridiron GM*.

## 2. What the career mode is (his words so far)

> "I want to start a separate chat about making a career mode of this game where you are the player."

That is everything he has decided. **Don't assume more.** The questions in section 5 need his answers first.

## 3. What Hardwood GM already is (short version; details in HANDOFF.md)

Hardwood GM is a historical NBA general-manager game.
- **Where:** live at https://tboyle2244.github.io/Hardwood-GM/.
- **Format:** a one-page offline web app (PWA) that runs on his iPad.
- **Seasons:** start at the 1976 merger (with the ABA dispersal draft) or any season since.
- **Data:** real rosters, ratings, drafts and rules for each year, from Basketball-Reference data (github.com/sumitrodatta/bball-reference-datasets).
- **What you do:** run a team. That covers the roster, the coaching system, trades (including three-team deals), the draft, scouting, free agency by era, the salary cap, and an owner who can fire you.

**The parts a career mode can reuse** (all in `src/engine.js` unless noted; function names are real):

| Need in career mode | Already built | Where to look |
|---|---|---|
| A living league around the player | Full season, playoff and offseason simulation; AI teams that trade, draft and sign by era | `simDay`, `playGame`, `startRegular`, `startNextSeason`, `aiTrades`, `openFreeAgency` |
| Per-game stat lines | Every game credits each player's box score from team ratings, minutes and his stat profile | `playGame` → `creditStats`, `makeBox`; history in `p.hist[year]`, playoffs in `p.phist` |
| Ratings from real production | OVR from game score and box plus/minus, ranked within each season; potential from a player's best real seasons | `rateRow`, `playerFromSeason`, `truePot`, `RANK_CURVE` |
| Getting better and declining | Yearly development by age, minutes and coaching; "grace" players who age well | `progress` |
| Minutes and role | The rotation decides minutes; youth focus; lineup styles by era | `minutesFor`, `ratings`, `lineupEffects` |
| Draft entry | Real classes every year, made-up classes in the future, scouting that fills in during the season, workouts, the lottery by era, undrafted players | `genProspect`, `prepClass`, `scoutWeek`, `startDraft`, `undraftedClass` |
| Contracts and money | Market value, asking price, re-signing, free agency bidding (offers scored on money, years, winning, fit, minutes and loyalty), player and team options, rookie scale, Bird rights, the cap, tax, dead money, buyouts, waivers | `marketValue`, `askPrice`, `offerScore`, `setContract`, `resolveOptions`, `buyout`, `waive` |
| Happiness | Morale from winning and minutes; trade requests, promises, holdouts | `mor`, `addMor`, weekly morale code |
| Injuries and retirement | Injuries by days missed; retirement from age, decline, injuries and quality | `logInjury`, `retireChance` |
| Recognition | Awards by era, All-NBA and All-Defense, All-Star Game, Hall of Fame, retired jerseys, record book | awards code, `recordBook` |
| Fit with teammates | Player types (floor general, 3-and-D wing, rim protector…) and team chemistry | `archetypes`, `chemRaw`, `chemistry` |
| **Playing games yourself** | **Arcade mode (beta)** in `src/play.js`: side view, 5-on-5, touch controls; ratings and your skill count about the same | `ARC.Game` (pure logic, testable in Node), `ARC.rate(p, year)`, `View` (canvas + touch) |

**About the arcade mode:** it's an exhibition prototype from 2026-11-11.
- **On offense** you control whoever has the ball. **On defense** you control one defender, plus Switch, Steal and Jump.
- **Not built yet:** substitutions, fatigue, and counting results in the season.
- **Not yet played on the iPad:** Tanner hasn't given feedback yet.
- **For career mode it would need a "control only my player" setting.** Teammates would have to get open, pass to you and call for the ball, and your player would stay ringed while the ball is elsewhere.

## 4. How the code is built and shipped (short version)

- `src/shell.html` + `style.css` + `engine.js` + `play.js` + `help.js` + `ui.js` → `python3 build.py` → `dist/hardwood-gm/index.html`, plus 6 other files.
- Tanner uploads 7 files to the repo root: `index.html`, `sw.js`, `manifest.json`, `nba-data.json` and three icons.
- **Every release:**
  - bump `APP_VERSION` in `ui.js` and the cache `'vNN'` in `sw.js` (currently v32);
  - update the in-game manual in `src/help.js`;
  - run the tests (Node in `test/`, plus Playwright browser tests and screenshots);
  - update `HANDOFF.md`.
- **Year convention:** inside the engine, `L.year = 1976` means the 1976-77 season. The dataset keys seasons by the *ending* year.
- **Saves** go in IndexedDB on the device, with JSON backups from the Data tab. Keep save files small; the test prints the save size.

## 5. Decisions to settle with Tanner before building

Question 1 is already answered. Ask the rest, a few at a time, with a recommendation for each. Answers change the design a lot.

1. **Same app or separate app? DECIDED (2026-11-14): part of Hardwood GM.** Career mode goes inside the existing game, not a separate site. That means:
   - **Start screen:** "Career" sits next to "GM", and career leagues are saved separately from GM leagues.
   - **Shared code:** both modes use the same `engine.js`, `play.js` and `nba-data.json`.
   - **Same 7 files:** Tanner keeps uploading the same 7 files to the same repo (`TBoyle2244/Hardwood-GM`).
   - **Every career-mode release also replaces the GM game.** Run the full GM test suite on every release too: `test/run.js`, `reallong.js`, `health.js` and the `ui*.js` browser tests. An engine change made for career mode must not change GM behavior unless intended.
   - **Keep career-only logic in its own file**, for example `src/career.js` inlined by `build.py` like `play.js`. Add hooks to the engine only where needed.
   - **Old GM saves** must still load.
2. **Who is the player?** A created player (name, position, height, build, hometown, college), or taking over a real player's career (rewriting history)? Or both?
3. **Where does the career start?** At the draft (as a prospect in a real class), in college or high school first, or as an undrafted free agent? In which years: any season from 1976 on?
4. **How are games played?**
   - Sim only: you see your minutes and stat line.
   - Play key moments: clutch possessions in arcade mode.
   - Play every game in arcade mode, controlling just your player.
   - A choice per game.
   - Arcade games are 4-20 minutes each, so an 82-game season played in full is a lot.
5. **How does the player improve?**
   - Stay with the single OVR/POT from the GM game, or add attributes the player can see (shooting, handling, defense, athleticism)?
   - Training choices between games or in the summer? Experience from how well you play?
6. **What do you control off the court?**
   - Your agent and contract talks.
   - Picking free-agent offers.
   - Asking for a trade.
   - Your relationship with the coach and your role in the team.
   - Endorsements and money, fame and media.
7. **What's the goal and the ending?**
   - A legacy or "greatness" score: awards, rings, records, Hall of Fame odds against real legends.
   - Retirement: chosen by you, or forced by decline and injuries (the retirement code already exists).
8. **Does history play out around you?** The real players and drafts arrive as in the GM game, with your presence changing results. The GM game already does this, so it carries over.
9. **What do you see each week and season?** Box score, season log, career stats against real players, awards race, the team's chemistry with you in it, news about you.

## 6. A good first step once those are answered

Build the smallest playable loop first, then grow it.
- **The loop:** create a player → enter a real draft → get picked → sim a season with your stat line every game → offseason development → second season.
- **Prove it out:**
  - check that numbers by era look like real careers (a #1 pick shouldn't average 30 as a rookie in 1985);
  - give Tanner a version to try on the iPad;
  - then add playing games, contracts and the extras.

## 7. Prompt Tanner can paste into the new chat

> I'm attaching three files about my NBA game Hardwood GM: CAREER-MODE-BRIEF.md, HANDOFF.md and hardwood-gm-source.zip. Read the brief first. I want to add a career mode where I'm a single player instead of the GM. Follow my reply preferences in the files. Career mode will be part of Hardwood GM, not a separate game. Start by asking me the remaining decisions in section 5 of the brief, a few at a time, with your recommendation for each.
