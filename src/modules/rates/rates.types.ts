export type CurrencyCode = "USD" | "EUR" | "CNY" | "RUB";

export interface RateRecord {
  code: string;
  nominal: number;
  value: number;
}

export interface RateSnapshot {
  base: string;
  date: string;
  source: string;
  updatedAt: string;
  rates: RateRecord[];
}

export interface LatestRatesParams {
  base?: string;
  symbols?: string[];
}

export interface WidgetPayload {
  widgetKey: string;
  mode: "free" | "paid";
  branding: boolean;
  base: string;
  date: string;
  source: string;
  rates: RateRecord[];
}

export interface CbrRawResponse {
  requestedAt: string;
  source: string;
  payload: unknown;
}

export interface ParsedCbrRates {
  date: string;
  source: string;
  items: Array<{
    code: string;
    nominal: number;
    value: number;
  }>;
}
