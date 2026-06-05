import type { CryptoService } from "./crypto.service";

export class CryptoScheduler {
  private started = false;
  private intervalId: NodeJS.Timeout | null = null;
  private syncInProgress: Promise<void> | null = null;

  constructor(
    private readonly cryptoService: CryptoService,
    private readonly syncIntervalMinutes: number,
  ) {}

  async start(): Promise<void> {
    if (this.started) {
      return;
    }

    this.started = true;
    await this.syncOnStartupIfNeeded();

    this.intervalId = setInterval(() => {
      void this.runScheduledSync();
    }, this.syncIntervalMinutes * 60 * 1000);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.started = false;
  }

  private async syncOnStartupIfNeeded(): Promise<void> {
    try {
      const hasStoredCrypto = await this.cryptoService.hasStoredCrypto();

      if (!hasStoredCrypto) {
        await this.runSync();
      }
    } catch (error) {
      console.error("crypto scheduler startup sync failed");
      console.error(error);
    }
  }

  private async runScheduledSync(): Promise<void> {
    try {
      await this.runSync();
    } catch (error) {
      console.error("crypto scheduler sync failed");
      console.error(error);
    }
  }

  private async runSync(): Promise<void> {
    if (this.syncInProgress) {
      return this.syncInProgress;
    }

    this.syncInProgress = this.cryptoService.manualSync().then(
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
