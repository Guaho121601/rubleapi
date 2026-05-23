import type { ParsedCbrRates, RateSnapshot } from "../../rates/rates.types";

export class CbrMapper {
  toSnapshot(parsedRates: ParsedCbrRates): RateSnapshot {
    return {
      base: "RUB",
      date: parsedRates.date,
      source: parsedRates.source,
      updatedAt: new Date().toISOString(),
      rates: parsedRates.items.map((item) => ({
        code: item.code,
        nominal: item.nominal,
        value: item.value,
      })),
    };
  }
}
