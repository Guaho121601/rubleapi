import type { RatesService } from "./rates.service";

const SIX_HOURS_IN_MS = 6 * 60 * 60 * 1000;

export class RatesScheduler {
  private started = false;
  private intervalId: NodeJS.Timeout | null = null;
  private syncInProgress: Promise<void> | null = null;

  constructor(private readonly ratesService: RatesService) {}

  async start(): Promise<void> {
    if (this.started) {
      return;
    }

    this.started = true;
    this.ratesService.markSchedulerReady();

    await this.syncOnStartupIfNeeded();

    this.intervalId = setInterval(() => {
      void this.runScheduledSync();
    }, SIX_HOURS_IN_MS);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.started = false;
  }

  isStarted(): boolean {
    return this.started;
  }

  private async syncOnStartupIfNeeded(): Promise<void> {
    try {
      const hasStoredRates = await this.ratesService.hasStoredRates();

      if (!hasStoredRates) {
        await this.runSync();
      }
    } catch (error) {
      console.error("rates scheduler startup sync failed");
      console.error(error);
    }
  }

  private async runScheduledSync(): Promise<void> {
    try {
      await this.runSync();
    } catch (error) {
      console.error("rates scheduler sync failed");
      console.error(error);
    }
  }

  private async runSync(): Promise<void> {
    if (this.syncInProgress) {
      return this.syncInProgress;
    }

    this.syncInProgress = this.ratesService.manualSync().then(
      () => undefined,
      (error) => {
        throw error;
      },
    );

    try {
      await this.syncInProgress;
    } finally {
      this.syncInProgress = null;
    }
  }
}
