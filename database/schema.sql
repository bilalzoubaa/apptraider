CREATE TABLE IF NOT EXISTS user (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
SELECT * FROM users;

CREATE TABLE IF NOT EXISTS challenge_plan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price_dh INTEGER NOT NULL,
  starting_balance REAL NOT NULL,
  profit_target_pct REAL DEFAULT 10.0,
  max_daily_loss_pct REAL DEFAULT 5.0,
  max_total_loss_pct REAL DEFAULT 10.0
);

CREATE TABLE IF NOT EXISTS user_challenge (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  challenge_id INTEGER NOT NULL,
  status TEXT DEFAULT 'active',
  start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  end_date DATETIME,
  equity REAL NOT NULL,
  highest_equity REAL NOT NULL,
  lowest_equity REAL NOT NULL,
  FOREIGN KEY(user_id) REFERENCES user(id),
  FOREIGN KEY(challenge_id) REFERENCES challenge_plan(id)
);

CREATE TABLE IF NOT EXISTS trade (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_challenge_id INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL,
  quantity REAL NOT NULL,
  price REAL NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  pnl REAL DEFAULT 0.0,
  FOREIGN KEY(user_challenge_id) REFERENCES user_challenge(id)
);

CREATE TABLE IF NOT EXISTS position (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_challenge_id INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  quantity REAL NOT NULL,
  avg_price REAL NOT NULL,
  side TEXT NOT NULL,
  opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_challenge_id) REFERENCES user_challenge(id)
);

CREATE TABLE IF NOT EXISTS payment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  method TEXT NOT NULL,
  status TEXT NOT NULL,
  meta TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES user(id)
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  paypal_client_id TEXT,
  paypal_secret TEXT
);
