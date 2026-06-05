export interface CryptoAssetDefinition {
  symbol: string;
  coinId: string;
  name: string;
}

export interface CryptoAsset {
  symbol: string;
  coinId: string;
  name: string;
  priceUsd: number;
  priceRub: number;
  change24hPercent: number | null;
  source: string;
  updatedAt: string;
}

export interface CryptoSnapshot {
  source: string;
  updatedAt: string;
  assets: CryptoAsset[];
}

export interface LatestCryptoParams {
  symbols?: string[];
}

export interface CoinGeckoSimplePriceItem {
  usd?: number;
  rub?: number;
  usd_24h_change?: number | null;
  last_updated_at?: number;
}

export type CoinGeckoSimplePriceResponse = Record<string, CoinGeckoSimplePriceItem>;

export const SUPPORTED_CRYPTO_ASSETS: CryptoAssetDefinition[] = [
  { symbol: "BTC", coinId: "bitcoin", name: "Bitcoin" },
  { symbol: "ETH", coinId: "ethereum", name: "Ethereum" },
  { symbol: "USDT", coinId: "tether", name: "Tether" },
  { symbol: "TON", coinId: "the-open-network", name: "TON" },
  { symbol: "SOL", coinId: "solana", name: "Solana" },
  { symbol: "BNB", coinId: "binancecoin", name: "BNB" },
];
