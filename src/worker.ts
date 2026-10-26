import logic from '../public/logic.js';

interface Env { DB: D1Database; WRITE_LIMITER?: RateLimit; READ_LIMITER?: RateLimit }

const TZ = 'Asia/Jerusalem';
const EPOCH = '2026-10-24'; // puzzle No. 1
const MAX_DISTRIBUTION = 5000;
const LOW_BANK_WARNING = 14;

interface QuestionRow {
  id: string; topic: string; text: string; unit: string; answer: number; grp: string | null; last_used?: string | null;
}
interface PuzzleRow { date: string; puzzle_no: number; q1: string; q2: string; q3: string }

/* ---------- dates ---------- */

/** Calendar date (YYYY-MM-DD) in Asia/Jerusalem. This is what "midnight" means for the puzzle switch. */
export function jerusalemDate(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

export function puzzleNoFor(date: string): number {
  const days = Math.round((Date.parse(date + 'T00:00:00Z') - Date.parse(EPOCH + 'T00:00:00Z')) / 864e5);
  return Math.max(1, days + 1);
}

/* ---------- seeded picker (same hash/rng as the original client) ---------- */

function hash(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Seeded shuffle, then least-recently-used first (never-used questions lead), then at most one question
 * per `grp` so near-duplicates never share a day. Deterministic for a given seed and bank state.
 */
export function pickThree(bank: QuestionRow[], seed: string): QuestionRow[] {
  const r = rng(hash(seed));
  const idx = bank.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const ordered = idx.map((i) => bank[i]).sort((a, b) => (a.last_used ?? '').localeCompare(b.last_used ?? ''));
  const chosen: QuestionRow[] = [];
  const groups = new Set<string>();
  for (const q of ordered) {
    if (chosen.length === 3) break;
    if (q.grp && groups.has(q.grp)) continue;
    chosen.push(q);
    if (q.grp) groups.add(q.grp);
  }
  return chosen;
}

/* ---------- puzzles ---------- */

const BANK_SQL = `SELECT q.id, q.topic, q.text, q.unit, q.answer, q.grp,
  (SELECT MAX(p.date) FROM puzzles p WHERE q.id IN (p.q1, p.q2, p.q3)) AS last_used
  FROM questions q WHERE q.status = 'live'`;

async function getPuzzle(db: D1Database, date: string): Promise<PuzzleRow | null> {
  return db.prepare('SELECT * FROM puzzles WHERE date = ?').bind(date).first<PuzzleRow>();
}

/** Returns the puzzle for `date`, creating it on first call. Safe to call concurrently: the insert is OR IGNORE. */
export async function ensurePuzzle(db: D1Database, date: string): Promise<PuzzleRow> {
  const existing = await getPuzzle(db, date);
  if (existing) return existing;
  const { results } = await db.prepare(BANK_SQL).all<QuestionRow>();
  const picks = pickThree(results, date);
  if (picks.length < 3) throw new HttpError(503, 'Not enough live questions to publish a puzzle');
  await db.prepare('INSERT OR IGNORE INTO puzzles (date, puzzle_no, q1, q2, q3) VALUES (?, ?, ?, ?, ?)')
    .bind(date, puzzleNoFor(date), picks[0].id, picks[1].id, picks[2].id).run();
  const created = await getPuzzle(db, date);
  if (!created) throw new HttpError(500, 'Could not create puzzle');
  return created;
}

async function questionsFor(db: D1Database, p: PuzzleRow): Promise<QuestionRow[]> {
  const { results } = await db.prepare('SELECT id, topic, text, unit, answer, grp FROM questions WHERE id IN (?, ?, ?)')
    .bind(p.q1, p.q2, p.q3).all<QuestionRow>();
  return [p.q1, p.q2, p.q3].map((id) => results.find((q) => q.id === id)!);
}

/* ---------- http helpers ---------- */

class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function playerId(req: Request, required: true): string;
function playerId(req: Request, required: false): string | null;
function playerId(req: Request, required: boolean): string | null {
  const id = req.headers.get('x-player-id');
  if (id && UUID.test(id)) return id.toLowerCase();
  if (required) throw new HttpError(400, 'Missing or invalid X-Player-Id');
  return null;
}

function validNum(x: unknown): x is number {
  return typeof x === 'number' && isFinite(x) && x > 0 && x < 1e21;
}

async function body(req: Request): Promise<Record<string, unknown>> {
  try {
    const b = await req.json();
    if (b && typeof b === 'object') return b as Record<string, unknown>;
  } catch { /* fall through */ }
  throw new HttpError(400, 'Invalid JSON body');
}

/* ---------- routes ---------- */

async function today(req: Request, env: Env): Promise<Response> {
  const date = jerusalemDate();
  const p = await ensurePuzzle(env.DB, date);
  const qs = await questionsFor(env.DB, p);
  const pid = playerId(req, false);
  const guesses: Record<string, number> = {};
  const answers: Record<string, number> = {};
  if (pid) {
    const { results } = await env.DB.prepare('SELECT question_id, guess FROM guesses WHERE player_id = ? AND question_id IN (?, ?, ?)')
      .bind(pid, p.q1, p.q2, p.q3).all<{ question_id: string; guess: number }>();
    for (const g of results) {
      guesses[g.question_id] = g.guess;
      answers[g.question_id] = qs.find((q) => q.id === g.question_id)!.answer;
    }
  }
  return json({
    date, puzzleNo: p.puzzle_no,
    questions: qs.map((q) => ({ id: q.id, topic: q.topic, q: q.text, unit: q.unit })),
    guesses, answers
  });
}

async function postGuess(req: Request, env: Env): Promise<Response> {
  const pid = playerId(req, true);
  const b = await body(req);
  const questionId = b.questionId, guess = b.guess, puzzleNo = b.puzzleNo;
  if (typeof questionId !== 'string' || !validNum(guess) || typeof puzzleNo !== 'number') throw new HttpError(400, 'Invalid guess');

  // Accept the current puzzle, or yesterday's for players who crossed midnight mid-game.
  const current = puzzleNoFor(jerusalemDate());
  if (puzzleNo > current || puzzleNo < current - 1) throw new HttpError(409, 'That puzzle is closed');
  const p = await env.DB.prepare('SELECT * FROM puzzles WHERE puzzle_no = ?').bind(puzzleNo).first<PuzzleRow>();
  if (!p || ![p.q1, p.q2, p.q3].includes(questionId)) throw new HttpError(404, 'Question is not in that puzzle');

  await env.DB.batch([
    env.DB.prepare('INSERT OR IGNORE INTO players (id) VALUES (?)').bind(pid),
    env.DB.prepare('INSERT OR IGNORE INTO guesses (player_id, question_id, guess) VALUES (?, ?, ?)').bind(pid, questionId, guess)
  ]);
  // The first guess wins; return whatever is stored, even if this request was a repeat.
  const stored = await env.DB.prepare(
    'SELECT g.guess, q.answer FROM guesses g JOIN questions q ON q.id = g.question_id WHERE g.player_id = ? AND g.question_id = ?'
  ).bind(pid, questionId).first<{ guess: number; answer: number }>();
  return json({ guess: stored!.guess, answer: stored!.answer });
}

async function distribution(req: Request, env: Env): Promise<Response> {
  const pid = playerId(req, false);
  const questionId = new URL(req.url).searchParams.get('questionId');
  if (!questionId) throw new HttpError(400, 'questionId required');
  const p = await ensurePuzzle(env.DB, jerusalemDate());

  // Others' guesses hint at the answer, so for today's questions they are shown only to players who have guessed.
  if ([p.q1, p.q2, p.q3].includes(questionId)) {
    const mine = pid && await env.DB.prepare('SELECT 1 AS x FROM guesses WHERE player_id = ? AND question_id = ?').bind(pid, questionId).first();
    if (!mine) throw new HttpError(403, 'Guess first');
  }
  const { results } = await env.DB.prepare(
    'SELECT guess FROM guesses WHERE question_id = ? AND player_id != ? ORDER BY created_at DESC LIMIT ?'
  ).bind(questionId, pid ?? '', MAX_DISTRIBUTION).all<{ guess: number }>();
  return json({ guesses: results.map((r) => r.guess) });
}

async function postScore(req: Request, env: Env): Promise<Response> {
  const pid = playerId(req, true);
  const puzzleNo = (await body(req)).puzzleNo;
  if (typeof puzzleNo !== 'number') throw new HttpError(400, 'puzzleNo required');
  const p = await env.DB.prepare('SELECT * FROM puzzles WHERE puzzle_no = ?').bind(puzzleNo).first<PuzzleRow>();
  if (!p) throw new HttpError(404, 'Unknown puzzle');

  // The score is recomputed here from the stored guesses with the same formula the client uses,
  // so the leaderboard cannot be filled with made-up numbers.
  const qs = await questionsFor(env.DB, p);
  const { results } = await env.DB.prepare('SELECT question_id, guess FROM guesses WHERE player_id = ? AND question_id IN (?, ?, ?)')
    .bind(pid, p.q1, p.q2, p.q3).all<{ question_id: string; guess: number }>();
  if (results.length < 3) throw new HttpError(409, 'Finish all three questions first');
  const ms = qs.map((q) => logic.multiple(results.find((g) => g.question_id === q.id)!.guess, q.answer));
  await env.DB.prepare('INSERT OR IGNORE INTO scores (player_id, puzzle_no, score) VALUES (?, ?, ?)').bind(pid, puzzleNo, logic.geoMean(ms)).run();
  const stored = await env.DB.prepare('SELECT score FROM scores WHERE player_id = ? AND puzzle_no = ?').bind(pid, puzzleNo).first<{ score: number }>();
  return json({ score: stored!.score });
}

/** Everyone's scores for a puzzle (anonymous), newest first up to a cap, plus this player's rank. The client draws the histogram. */
async function leaderboard(req: Request, env: Env): Promise<Response> {
  const pid = playerId(req, false);
  const raw = new URL(req.url).searchParams.get('puzzleNo');
  const puzzleNo = raw ? Number(raw) : puzzleNoFor(jerusalemDate());
  if (!Number.isInteger(puzzleNo)) throw new HttpError(400, 'Invalid puzzleNo');
  const all = await env.DB.prepare('SELECT score FROM scores WHERE puzzle_no = ? ORDER BY created_at DESC LIMIT ?').bind(puzzleNo, MAX_DISTRIBUTION).all<{ score: number }>();
  const total = await env.DB.prepare('SELECT COUNT(*) AS n FROM scores WHERE puzzle_no = ?').bind(puzzleNo).first<{ n: number }>();
  let rank: number | null = null;
  if (pid) {
    const mine = await env.DB.prepare('SELECT score FROM scores WHERE player_id = ? AND puzzle_no = ?').bind(pid, puzzleNo).first<{ score: number }>();
    if (mine) {
      const better = await env.DB.prepare('SELECT COUNT(*) AS n FROM scores WHERE puzzle_no = ? AND score < ?').bind(puzzleNo, mine.score).first<{ n: number }>();
      rank = better!.n + 1;
    }
  }
  return json({ puzzleNo, players: total!.n, rank, scores: all.results.map((r) => r.score) });
}

/** A random set for practice mode. Excludes today's questions so no unplayed answer is revealed. Nothing is recorded. */
async function practice(_req: Request, env: Env): Promise<Response> {
  const p = await ensurePuzzle(env.DB, jerusalemDate());
  const { results } = await env.DB.prepare(BANK_SQL).all<QuestionRow>();
  let pool = results.filter((q) => ![p.q1, p.q2, p.q3].includes(q.id));
  if (pool.length < 3) pool = results;
  pool = pool.map((q) => ({ ...q, last_used: null }));
  const picks = pickThree(pool, 'practice-' + crypto.randomUUID());
  return json({ questions: picks.map((q) => ({ id: q.id, topic: q.topic, q: q.text, unit: q.unit, answer: q.answer })) });
}

const routes: Record<string, (req: Request, env: Env) => Promise<Response>> = {
  'GET /api/today': today,
  'POST /api/guess': postGuess,
  'GET /api/distribution': distribution,
  'POST /api/score': postScore,
  'GET /api/leaderboard': leaderboard,
  'GET /api/practice': practice
};

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const handler = routes[req.method + ' ' + new URL(req.url).pathname];
    if (!handler) return json({ error: 'Not found' }, 404);
    // Limit per client IP. The limiter is skipped if the binding is missing, so local tests without it still work.
    const limiter = req.method === 'POST' ? env.WRITE_LIMITER : env.READ_LIMITER;
    if (limiter) {
      const { success } = await limiter.limit({ key: req.headers.get('cf-connecting-ip') ?? 'unknown' });
      if (!success) return new Response(JSON.stringify({ error: 'Too many requests. Try again in a minute.' }), { status: 429, headers: { 'content-type': 'application/json', 'retry-after': '60' } });
    }
    try {
      return await handler(req, env);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      console.error(e);
      return json({ error: 'Server error' }, 500);
    }
  },

  /** Cron: publish the new day's puzzle just after midnight Jerusalem time, and warn when the bank runs low. */
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil((async () => {
      const date = jerusalemDate();
      await ensurePuzzle(env.DB, date);
      const fresh = await env.DB.prepare(
        `SELECT COUNT(*) AS n FROM questions q WHERE q.status = 'live' AND NOT EXISTS (SELECT 1 FROM puzzles p WHERE q.id IN (p.q1, p.q2, p.q3))`
      ).first<{ n: number }>();
      console.log(`Puzzle ready for ${date}; ${fresh!.n} live questions never used yet`);
      if (fresh!.n < LOW_BANK_WARNING) console.warn(`LOW QUESTION BANK: only ${fresh!.n} unused live questions (${Math.floor(fresh!.n / 3)} days). Add more.`);
    })());
  }
};
