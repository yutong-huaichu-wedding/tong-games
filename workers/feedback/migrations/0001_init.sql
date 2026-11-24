-- TONG GAMES 留言（D1 / SQLite）
CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  game_id TEXT NOT NULL,
  rating INTEGER NOT NULL,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  nickname TEXT,
  public_requested INTEGER NOT NULL DEFAULT 0,
  approved INTEGER NOT NULL DEFAULT 0,
  ip_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_feedback_public
  ON feedback (game_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_created
  ON feedback (created_at DESC);

CREATE TABLE IF NOT EXISTS rate_limits (
  ip_hash TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL
);
