import type { ParsedCbrRates, Rate, RatesSnapshot } from "../../rates/rates.types";

export class CbrMapper {
  toRates(parsedRates: ParsedCbrRates): Rate[] {
    return parsedRates.rates.map((rate) => ({
      code: rate.charCode,
      nominal: rate.nominal,
      name: rate.name,
      value: rate.value,
    }));
  }

  toSnapshot(parsedRates: ParsedCbrRates): RatesSnapshot {
    return {
      base: "RUB",
      date: parsedRates.date,
      source: parsedRates.source,
      updatedAt: new Date().toISOString(),
      rates: this.toRates(parsedRates),
    };
  }
}
