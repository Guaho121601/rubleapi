export interface AppConfig {
  host: string;
  port: number;
  nodeEnv: string;
}

const DEFAULT_HOST = "0.0.0.0";
const DEFAULT_PORT = 3000;

export function getConfig(): AppConfig {
  const port = Number(process.env.PORT ?? DEFAULT_PORT);

  return {
    host: process.env.HOST ?? DEFAULT_HOST,
    port: Number.isFinite(port) ? port : DEFAULT_PORT,
    nodeEnv: process.env.NODE_ENV ?? "development",
  };
}
