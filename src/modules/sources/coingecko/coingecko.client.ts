import type { CoinGeckoSimplePriceResponse } from "../../crypto/crypto.types";

export class CoinGeckoClient {
  constructor(private readonly baseUrl: string) {}

  async fetchLatestPrices(coinIds: string[]): Promise<CoinGeckoSimplePriceResponse> {
    const url = new URL("/api/v3/simple/price", this.baseUrl);

    url.searchParams.set("ids", coinIds.join(","));
    url.searchParams.set("vs_currencies", "usd,rub");
    url.searchParams.set("include_24hr_change", "true");
    url.searchParams.set("include_last_updated_at", "true");

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`CoinGecko request failed with status ${response.status}`);
    }

    return (await response.json()) as CoinGeckoSimplePriceResponse;
  }
}
