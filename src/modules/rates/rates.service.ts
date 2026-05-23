import type { CbrClient } from "../sources/cbr/cbr.client";
import type { CbrMapper } from "../sources/cbr/cbr.mapper";
import type { CbrParser } from "../sources/cbr/cbr.parser";
import type {
  LatestRatesParams,
  RateSnapshot,
  WidgetPayload,
} from "./rates.types";
import { RatesRepository } from "./rates.repository";

export class RatesService {
  private schedulerReady = false;

  constructor(
    private readonly ratesRepository: RatesRepository,
    private readonly cbrClient: CbrClient,
    private readonly cbrParser: CbrParser,
    private readonly cbrMapper: CbrMapper,
  ) {}

  async getLatestRates(params?: LatestRatesParams): Promise<RateSnapshot> {
    return this.ratesRepository.getLatest(params);
  }

  async getRatesByDate(date: string): Promise<RateSnapshot | null> {
    return this.ratesRepository.getByDate(date);
  }

  async getWidgetPayload(widgetKey: string): Promise<WidgetPayload> {
    const latest = await this.getLatestRates();
    const isPaid = widgetKey !== "demo";

    return {
      widgetKey,
      mode: isPaid ? "paid" : "free",
      branding: !isPaid,
      base: latest.base,
      date: latest.date,
      source: latest.source,
      rates: latest.rates,
    };
  }

  async manualSync(): Promise<RateSnapshot> {
    const rawResponse = await this.cbrClient.fetchLatestRates();
    const parsedRates = this.cbrParser.parse(rawResponse);
    const snapshot = this.cbrMapper.toSnapshot(parsedRates);

    return this.ratesRepository.save(snapshot);
  }

  markSchedulerReady(): void {
    this.schedulerReady = true;
  }

  getStatus() {
    return {
      schedulerReady: this.schedulerReady,
    };
  }
}
