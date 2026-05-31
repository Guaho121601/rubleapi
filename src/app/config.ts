import path from "node:path";

import dotenv from "dotenv";

dotenv.config();

function getEnvValue(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key];

    if (value != null && value !== "") {
      return value;
    }
  }

  return undefined;
}

export interface AppConfig {
  host: string;
  port: number;
  databasePath: string;
  publicBaseUrl: string;
  ratesSyncIntervalHours: number;
  nodeEnv: string;
}

const DEFAULT_HOST = "0.0.0.0";
const DEFAULT_PORT = 3000;
const DEFAULT_DATABASE_PATH = "./data/rubleapi.sqlite";
const DEFAULT_PUBLIC_BASE_URL = "http://127.0.0.1:3000";
const DEFAULT_RATES_SYNC_INTERVAL_HOURS = 6;

export function getConfig(): AppConfig {
  const port = Number(getEnvValue("port", "PORT") ?? DEFAULT_PORT);
  const ratesSyncIntervalHours = Number(
    getEnvValue("rates_sync_interval_hours", "RATES_SYNC_INTERVAL_HOURS") ??
      DEFAULT_RATES_SYNC_INTERVAL_HOURS,
  );

  return {
    host: getEnvValue("host", "HOST") ?? DEFAULT_HOST,
    port: Number.isFinite(port) ? port : DEFAULT_PORT,
    databasePath: path.resolve(
      process.cwd(),
      getEnvValue("database_path", "DATABASE_PATH") ?? DEFAULT_DATABASE_PATH,
    ),
    publicBaseUrl:
      getEnvValue("public_base_url", "PUBLIC_BASE_URL") ?? DEFAULT_PUBLIC_BASE_URL,
    ratesSyncIntervalHours:
      Number.isFinite(ratesSyncIntervalHours) && ratesSyncIntervalHours > 0
        ? ratesSyncIntervalHours
        : DEFAULT_RATES_SYNC_INTERVAL_HOURS,
    nodeEnv: getEnvValue("node_env", "NODE_ENV") ?? "development",
  };
}
