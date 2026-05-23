import type Database from "better-sqlite3";

import { getDatabase } from "../../db/database";
import type { LatestRatesParams, Rate, RateSnapshot } from "./rates.types";

const DEFAULT_SNAPSHOT: RateSnapshot = {
  base: "RUB",
  date: "2026-05-24",
  source: "stub",
  updatedAt: "2026-05-24T09:00:00.000Z",
  rates: [
    { code: "USD", nominal: 1, name: "US Dollar", value: 89.5 },
    { code: "EUR", nominal: 1, name: "Euro", value: 97.2 },
    { code: "CNY", nominal: 1, name: "Chinese Yuan", value: 12.4 },
  ],
};

interface SnapshotRow {
  id: number;
  source: string;
  date: string;
  fetched_at: string;
  raw_count: number;
}

interface CurrencyRateRow {
  code: string;
  nominal: number;
  name: string;
  value: number;
}

export class RatesRepository {
  private readonly db: Database.Database;

  constructor() {
    this.db = getDatabase();
  }

  async saveSnapshot(snapshot: RateSnapshot): Promise<RateSnapshot> {
    const persistSnapshot = this.db.transaction((currentSnapshot: RateSnapshot) => {
      const insertSnapshot = this.db.prepare(`
        INSERT INTO rate_snapshots (source, date, fetched_at, raw_count)
        VALUES (@source, @date, @fetchedAt, @rawCount)
      `);

      const insertRate = this.db.prepare(`
        INSERT INTO currency_rates (snapshot_id, date, code, nominal, name, value, source)
        VALUES (@snapshotId, @date, @code, @nominal, @name, @value, @source)
      `);

      const snapshotResult = insertSnapshot.run({
        source: currentSnapshot.source,
        date: currentSnapshot.date,
        fetchedAt: currentSnapshot.updatedAt,
        rawCount: currentSnapshot.rates.length,
      });

      const snapshotId = Number(snapshotResult.lastInsertRowid);

      for (const rate of currentSnapshot.rates) {
        insertRate.run({
          snapshotId,
          date: currentSnapshot.date,
          code: rate.code,
          nominal: rate.nominal,
          name: rate.name,
          value: rate.value,
          source: currentSnapshot.source,
        });
      }
    });

    persistSnapshot(snapshot);
    return snapshot;
  }

  async getLatestSnapshot(): Promise<RateSnapshot | null> {
    const snapshotRow = this.db
      .prepare(`
        SELECT id, source, date, fetched_at, raw_count
        FROM rate_snapshots
        ORDER BY id DESC
        LIMIT 1
      `)
      .get() as SnapshotRow | undefined;

    if (!snapshotRow) {
      return null;
    }

    return this.buildSnapshot(snapshotRow);
  }

  async getRatesByDate(date: string): Promise<RateSnapshot | null> {
    const snapshotRow = this.db
      .prepare(`
        SELECT id, source, date, fetched_at, raw_count
        FROM rate_snapshots
        WHERE date = ?
        ORDER BY id DESC
        LIMIT 1
      `)
      .get(date) as SnapshotRow | undefined;

    if (!snapshotRow) {
      return null;
    }

    return this.buildSnapshot(snapshotRow);
  }

  async getLatest(params?: LatestRatesParams): Promise<RateSnapshot> {
    const latestSnapshot = (await this.getLatestSnapshot()) ?? DEFAULT_SNAPSHOT;

    if (!params?.symbols?.length) {
      return {
        ...latestSnapshot,
        base: params?.base ?? latestSnapshot.base,
      };
    }

    return {
      ...latestSnapshot,
      base: params.base ?? latestSnapshot.base,
      rates: latestSnapshot.rates.filter((rate) => params.symbols?.includes(rate.code)),
    };
  }

  async getByDate(date: string): Promise<RateSnapshot | null> {
    return this.getRatesByDate(date);
  }

  async save(snapshot: RateSnapshot): Promise<RateSnapshot> {
    return this.saveSnapshot(snapshot);
  }

  private buildSnapshot(snapshotRow: SnapshotRow): RateSnapshot {
    const rates = this.db
      .prepare(`
        SELECT code, nominal, name, value
        FROM currency_rates
        WHERE snapshot_id = ?
        ORDER BY id ASC
      `)
      .all(snapshotRow.id) as CurrencyRateRow[];

    return {
      base: "RUB",
      date: snapshotRow.date,
      source: snapshotRow.source,
      updatedAt: snapshotRow.fetched_at,
      rates: rates.map((rate): Rate => ({
        code: rate.code,
        nominal: rate.nominal,
        name: rate.name,
        value: rate.value,
      })),
    };
  }
}
