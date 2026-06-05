import type Database from "better-sqlite3";

export function applySchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS rate_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      date TEXT NOT NULL,
      fetched_at TEXT NOT NULL,
      raw_count INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS currency_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      snapshot_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      code TEXT NOT NULL,
      nominal REAL NOT NULL,
      name TEXT NOT NULL,
      value REAL NOT NULL,
      source TEXT NOT NULL,
      FOREIGN KEY (snapshot_id) REFERENCES rate_snapshots(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_rate_snapshots_fetched_at
      ON rate_snapshots(fetched_at DESC);

    CREATE INDEX IF NOT EXISTS idx_rate_snapshots_date
      ON rate_snapshots(date);

    CREATE INDEX IF NOT EXISTS idx_currency_rates_snapshot_id
      ON currency_rates(snapshot_id);

    CREATE INDEX IF NOT EXISTS idx_currency_rates_date
      ON currency_rates(date);

    CREATE TABLE IF NOT EXISTS crypto_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      fetched_at TEXT NOT NULL,
      raw_count INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS crypto_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      snapshot_id INTEGER NOT NULL,
      symbol TEXT NOT NULL,
      coin_id TEXT NOT NULL,
      name TEXT NOT NULL,
      price_usd REAL NOT NULL,
      price_rub REAL NOT NULL,
      change_24h_percent REAL,
      source TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (snapshot_id) REFERENCES crypto_snapshots(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_crypto_snapshots_fetched_at
      ON crypto_snapshots(fetched_at DESC);

    CREATE INDEX IF NOT EXISTS idx_crypto_rates_snapshot_id
      ON crypto_rates(snapshot_id);

    CREATE INDEX IF NOT EXISTS idx_crypto_rates_symbol
      ON crypto_rates(symbol);
  `);
}
