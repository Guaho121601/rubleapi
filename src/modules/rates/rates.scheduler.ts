import type { RatesService } from "./rates.service";

export class RatesScheduler {
  private started = false;

  constructor(private readonly ratesService: RatesService) {}

  start(): void {
    this.started = true;
    this.ratesService.markSchedulerReady();
  }

  stop(): void {
    this.started = false;
  }

  isStarted(): boolean {
    return this.started;
  }
}
