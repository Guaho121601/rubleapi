export type CurrencyCode = "USD" | "EUR" | "CNY" | "RUB";

export interface Rate {
  code: string;
  nominal: number;
  name: string;
  value: number;
}

export interface RatesSnapshot {
  base: string;
  date: string;
  source: string;
  updatedAt: string;
  rates: Rate[];
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
  rates: Rate[];
}

export interface CbrRawRate {
  charCode: string;
  nominal: number;
  name: string;
  value: number;
}

export interface CbrRawResponse {
  requestedAt: string;
  source: string;
  status: number;
  xml: string;
}

export interface ParsedCbrRates {
  date: string;
  source: string;
  rates: CbrRawRate[];
}

export type RateRecord = Rate;
export type RateSnapshot = RatesSnapshot;
