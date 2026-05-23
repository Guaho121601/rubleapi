import type { CbrRawResponse, ParsedCbrRates } from "../../rates/rates.types";

interface StubPayload {
  date?: string;
  rates?: Array<{
    charCode?: string;
    nominal?: number;
    value?: number;
  }>;
}

export class CbrParser {
  parse(rawResponse: CbrRawResponse): ParsedCbrRates {
    const payload = rawResponse.payload as StubPayload;

    return {
      date: payload.date ?? new Date().toISOString().slice(0, 10),
      source: rawResponse.source,
      items: (payload.rates ?? []).map((rate) => ({
        code: rate.charCode ?? "UNKNOWN",
        nominal: rate.nominal ?? 1,
        value: rate.value ?? 0,
      })),
    };
  }
}
