import type Database from "better-sqlite3";

import { getDatabase } from "../../db/database";
import type { CryptoAsset, CryptoSnapshot, LatestCryptoParams } from "./crypto.types";

interface CryptoSnapshotRow {
  id: number;
  source: string;
  fetched_at: string;
  raw_count: number;
}

interface CryptoAssetRow {
  symbol: string;
  coin_id: string;
  name: string;
  price_usd: number;
  price_rub: number;
  change_24h_percent: number | null;
  source: string;
  updated_at: string;
}

export class CryptoRepository {
  private readonly db: Database.Database;

  constructor() {
    this.db = getDatabase();
  }

  async saveSnapshot(snapshot: CryptoSnapshot): Promise<CryptoSnapshot> {
    const persistSnapshot = this.db.transaction((currentSnapshot: CryptoSnapshot) => {
      const insertSnapshot = this.db.prepare(`
        INSERT INTO crypto_snapshots (source, fetched_at, raw_count)
        VALUES (@source, @fetchedAt, @rawCount)
      `);

      const insertAsset = this.db.prepare(`
        INSERT INTO crypto_rates (
          snapshot_id,
          symbol,
          coin_id,
          name,
          price_usd,
          price_rub,
          change_24h_percent,
          source,
          updated_at
        )
        VALUES (
          @snapshotId,
          @symbol,
          @coinId,
          @name,
          @priceUsd,
          @priceRub,
          @change24hPercent,
          @source,
          @updatedAt
        )
      `);

      const snapshotResult = insertSnapshot.run({
        source: currentSnapshot.source,
        fetchedAt: currentSnapshot.updatedAt,
        rawCount: currentSnapshot.assets.length,
      });

      const snapshotId = Number(snapshotResult.lastInsertRowid);

      for (const asset of currentSnapshot.assets) {
        insertAsset.run({
          snapshotId,
          symbol: asset.symbol,
          coinId: asset.coinId,
          name: asset.name,
          priceUsd: asset.priceUsd,
          priceRub: asset.priceRub,
          change24hPercent: asset.change24hPercent,
          source: asset.source,
          updatedAt: asset.updatedAt,
        });
      }
    });

    persistSnapshot(snapshot);
    return snapshot;
  }

  async getLatestSnapshot(): Promise<CryptoSnapshot | null> {
    const snapshotRow = this.db
      .prepare(`
        SELECT id, source, fetched_at, raw_count
        FROM crypto_snapshots
        ORDER BY id DESC
        LIMIT 1
      `)
      .get() as CryptoSnapshotRow | undefined;

    if (!snapshotRow) {
      return null;
    }

    return this.buildSnapshot(snapshotRow);
  }

  async getLatest(params?: LatestCryptoParams): Promise<CryptoSnapshot | null> {
    const latestSnapshot = await this.getLatestSnapshot();

    if (!latestSnapshot) {
      return null;
    }

    if (!params?.symbols?.length) {
      return latestSnapshot;
    }

    const normalizedSymbols = new Set(params.symbols.map((symbol) => symbol.toUpperCase()));

    return {
      ...latestSnapshot,
      assets: latestSnapshot.assets.filter((asset) => normalizedSymbols.has(asset.symbol)),
    };
  }

  private buildSnapshot(snapshotRow: CryptoSnapshotRow): CryptoSnapshot {
    const assets = this.db
      .prepare(`
        SELECT
          symbol,
          coin_id,
          name,
          price_usd,
          price_rub,
          change_24h_percent,
          source,
          updated_at
        FROM crypto_rates
        WHERE snapshot_id = ?
        ORDER BY id ASC
      `)
      .all(snapshotRow.id) as CryptoAssetRow[];

    return {
      source: snapshotRow.source,
      updatedAt: snapshotRow.fetched_at,
      assets: assets.map(
        (asset): CryptoAsset => ({
          symbol: asset.symbol,
          coinId: asset.coin_id,
          name: asset.name,
          priceUsd: asset.price_usd,
          priceRub: asset.price_rub,
          change24hPercent: asset.change_24h_percent,
          source: asset.source,
          updatedAt: asset.updated_at,
        }),
      ),
    };
  }
}
