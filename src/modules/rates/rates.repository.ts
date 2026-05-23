import type { LatestRatesParams, RateSnapshot } from "./rates.types";

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

export class RatesRepository {
  private latestSnapshot: RateSnapshot = DEFAULT_SNAPSHOT;
  private snapshotsByDate = new Map<string, RateSnapshot>([[DEFAULT_SNAPSHOT.date, DEFAULT_SNAPSHOT]]);

  async getLatest(params?: LatestRatesParams): Promise<RateSnapshot> {
    if (!params?.symbols?.length) {
      return this.latestSnapshot;
    }

    return {
      ...this.latestSnapshot,
      base: params.base ?? this.latestSnapshot.base,
      rates: this.latestSnapshot.rates.filter((rate) => params.symbols?.includes(rate.code)),
    };
  }

  async getByDate(date: string): Promise<RateSnapshot | null> {
    return this.snapshotsByDate.get(date) ?? null;
  }

  async save(snapshot: RateSnapshot): Promise<RateSnapshot> {
    this.latestSnapshot = snapshot;
    this.snapshotsByDate.set(snapshot.date, snapshot);

    return snapshot;
  }
}
