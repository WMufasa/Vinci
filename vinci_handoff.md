# Vinci: handoff to Claude Code

Vinci is a daily estimation game (Fermi-style) about tech, stocks and markets.
Each day has three questions. A player gets one guess per question and is
scored by how many times off they were. `vinci.html` is the current working
version: one self-contained file holding all the HTML, CSS and JS. It was built
as a claude.ai artifact.

**Keep the look exactly as it is.** The owner is happy with the current design.
Port it, don't redesign it.

## What's in vinci.html

| Part | Where (approx. line) | Notes |
|---|---|---|
| Design tokens | top of `<style>`, `:root` | Light theme only, no dark mode. Yellow page background `--bg #FFEC80`, orange cards `--paper #FF9F43`, cream highlight `--hi #FFF8EC` (answer box, input), red accent `--accent #D92D16` (buttons). |
| Fonts | `<link>` to Google Fonts | Bricolage Grotesque (display), IBM Plex Sans (body), IBM Plex Mono (numbers and labels). |
| Question bank | `var Q = [` (~208) | 12 questions. Each has `id, topic, q, unit, answer`, plus `napkin, note, src, asof`. Those last four are not shown in the UI any more but are kept as research notes. `group` stops two near-duplicate questions landing on the same day. |
| Answer parser | `tokenize` / `evaluate` | Accepts `2.5b`, `350 million`, `8*365*1e6`, `1,245`, `( ) ^`. |
| Scoring | `multiple`, `geoMean`, `verdict` | Per question: max(guess/answer, answer/guess), so 1× is perfect. Daily score: geometric mean of the three. Verdict bands: ≤1.5× good, ≤5× warn, otherwise bad. |
| Daily pick | `pickSet` (~361) | Seeded shuffle keyed on the local date (`YYYY-MM-DD`), so everyone gets the same three questions per day. This is what "new puzzle at midnight" does today. |
| Local history | `localStorage` key `napkin-ticker-v1` | Today's guesses and per-day scores, per browser only. |
| Shared guesses | `initDb`, `recordGuess`, `othersFor` (~514–560) | **Specific to claude.ai.** Uses `window.claude.use('db')` and `use('user')`. This must be replaced with your own backend API (see below). |
| Screens | `renderAsk`, `renderReveal`, `renderDone` | Ask: question, input and calculator keypad. Reveal: guess and answer boxes, "You landed", histogram of everyone's guesses. Done: score, per-question rows, copyable share text, personal record. |

## Current shared-data model (to replace)

One document per player: `plays/<userId>` holds `{ g: { <questionId>: <guess> }, updated }`.
Only a player's first guess on a question counts. The histogram and the
"closer than X% of players" line read every player's guess for the current
question. Scoring itself always happens on the player's own device.

## What to build next

1. **Backend and database** to store every player's guesses and daily scores
   (for example a small API with Postgres or SQLite, or Supabase or Firebase).
   Replace `initDb`, `recordGuess` and `othersFor` with calls like:
   - `POST /api/guess {puzzleNo, questionId, guess}`
   - `GET /api/distribution?questionId=…` returns the list of guesses (or pre-binned counts)
   - `POST /api/score {puzzleNo, score}` and `GET /api/leaderboard?puzzleNo=…`
   - Player identity: start with an anonymous id kept in localStorage, and add
     sign-in later if needed.
2. **A new puzzle every midnight.** Move the question bank into the database
   with a `puzzles` table (`date, puzzleNo, questionIds[]`). Either schedule a
   job to create tomorrow's puzzle, or keep the seeded picker on the server.
   Pick one timezone for the midnight switch (it is local time today). Make
   the bank grow so questions don't repeat every few days, and keep a source
   and as-of date for every answer.
3. **Own domain.** Deploy (for example Vercel, Netlify or Cloudflare Pages for
   the front end, plus your API host) and point the domain's DNS at it.
4. Keep the scoring and parsing functions exactly as they are. They are
   tested: the geometric mean of 1.45, 2.18 and 2.30 is 1.94.

