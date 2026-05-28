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

  async findLatestRates(params?: LatestRatesParams): Promise<RateSnapshot | null> {
    const latestSnapshot = await this.ratesRepository.getLatestSnapshot();

    if (!latestSnapshot) {
      return null;
    }

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

  async getLatestRates(params?: LatestRatesParams): Promise<RateSnapshot> {
    const latestSnapshot = await this.findLatestRates(params);

    if (latestSnapshot) {
      return latestSnapshot;
    }

    return this.ratesRepository.getLatest(params);
  }

  async getRatesByDate(date: string): Promise<RateSnapshot | null> {
    return this.ratesRepository.getRatesByDate(date);
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

    return this.ratesRepository.saveSnapshot(snapshot);
  }

  async hasStoredRates(): Promise<boolean> {
    const latestSnapshot = await this.ratesRepository.getLatestSnapshot();
    return latestSnapshot !== null;
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
