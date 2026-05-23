import iconv from "iconv-lite";

import type { CbrRawResponse } from "../../rates/rates.types";

export const CBR_DAILY_RATES_URL = "https://www.cbr.ru/scripts/XML_daily.asp";
const CBR_REQUEST_TIMEOUT_MS = 10000;

export class CbrClient {
  async fetchLatestRates(): Promise<CbrRawResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CBR_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(CBR_DAILY_RATES_URL, {
        method: "GET",
        headers: {
          Accept: "application/xml,text/xml;q=0.9,*/*;q=0.8",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`CBR request failed with status ${response.status}`);
      }

      const responseBuffer = Buffer.from(await response.arrayBuffer());
      const xml = iconv.decode(responseBuffer, "windows-1251");

      return {
        requestedAt: new Date().toISOString(),
        source: "cbr.ru",
        status: response.status,
        xml,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`CBR request timed out after ${CBR_REQUEST_TIMEOUT_MS}ms`);
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
