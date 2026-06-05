import type { CoinGeckoClient } from "../sources/coingecko/coingecko.client";
import {
  SUPPORTED_CRYPTO_ASSETS,
  type CryptoAsset,
  type CryptoSnapshot,
  type LatestCryptoParams,
} from "./crypto.types";
import { CryptoRepository } from "./crypto.repository";

export class CryptoService {
  constructor(
    private readonly cryptoRepository: CryptoRepository,
    private readonly coinGeckoClient: CoinGeckoClient,
  ) {}

  async findLatestCrypto(params?: LatestCryptoParams): Promise<CryptoSnapshot | null> {
    if (!params?.symbols?.length) {
      return this.cryptoRepository.getLatestSnapshot();
    }

    const normalizedSymbols = params.symbols.map((symbol) => symbol.trim().toUpperCase());
    return this.cryptoRepository.getLatest({
      symbols: normalizedSymbols,
    });
  }

  async manualSync(): Promise<CryptoSnapshot> {
    const rawData = await this.coinGeckoClient.fetchLatestPrices(
      SUPPORTED_CRYPTO_ASSETS.map((asset) => asset.coinId),
    );

    const fallbackUpdatedAt = new Date().toISOString();
    const assets = SUPPORTED_CRYPTO_ASSETS.map((asset): CryptoAsset | null => {
      const item = rawData[asset.coinId];

      if (!item || !Number.isFinite(item.usd) || !Number.isFinite(item.rub)) {
        return null;
      }

      return {
        symbol: asset.symbol,
        coinId: asset.coinId,
        name: asset.name,
        priceUsd: Number(item.usd),
        priceRub: Number(item.rub),
        change24hPercent:
          item.usd_24h_change == null || !Number.isFinite(item.usd_24h_change)
            ? null
            : Number(item.usd_24h_change),
        source: "CoinGecko",
        updatedAt: item.last_updated_at
          ? new Date(item.last_updated_at * 1000).toISOString()
          : fallbackUpdatedAt,
      };
    }).filter((asset): asset is CryptoAsset => asset !== null);

    if (!assets.length) {
      throw new Error("CoinGecko returned no supported crypto assets");
    }

    const snapshot: CryptoSnapshot = {
      source: "CoinGecko",
      updatedAt: assets.reduce((latest, asset) => {
        return asset.updatedAt > latest ? asset.updatedAt : latest;
      }, fallbackUpdatedAt),
      assets,
    };

    return this.cryptoRepository.saveSnapshot(snapshot);
  }

  async hasStoredCrypto(): Promise<boolean> {
    const latestSnapshot = await this.cryptoRepository.getLatestSnapshot();
    return latestSnapshot !== null;
  }
}
