-- Question bank. status 'draft' = researched but not yet verified by the owner; only 'live' questions are published.
CREATE TABLE questions (
  id           TEXT PRIMARY KEY,
  topic        TEXT NOT NULL,
  text         TEXT NOT NULL,
  unit         TEXT NOT NULL,
  answer       REAL NOT NULL CHECK (answer > 0),
  grp          TEXT,
  napkin       TEXT,
  note         TEXT,
  source_label TEXT NOT NULL,
  source_url   TEXT NOT NULL,
  as_of        TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('live', 'draft')),
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- One row per published day. date is the Asia/Jerusalem calendar date (YYYY-MM-DD).
CREATE TABLE puzzles (
  date       TEXT PRIMARY KEY,
  puzzle_no  INTEGER NOT NULL UNIQUE,
  q1         TEXT NOT NULL REFERENCES questions(id),
  q2         TEXT NOT NULL REFERENCES questions(id),
  q3         TEXT NOT NULL REFERENCES questions(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE players (
  id         TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Only a player's first guess on a question counts, enforced by the primary key.
CREATE TABLE guesses (
  player_id   TEXT NOT NULL REFERENCES players(id),
  question_id TEXT NOT NULL REFERENCES questions(id),
  guess       REAL NOT NULL CHECK (guess > 0),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (player_id, question_id)
);
CREATE INDEX guesses_by_question ON guesses (question_id, created_at DESC);

CREATE TABLE scores (
  player_id  TEXT NOT NULL REFERENCES players(id),
  puzzle_no  INTEGER NOT NULL REFERENCES puzzles(puzzle_no),
  score      REAL NOT NULL CHECK (score >= 1),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (player_id, puzzle_no)
);
CREATE INDEX scores_by_puzzle ON scores (puzzle_no, score);
