import type { CbrRawRate, CbrRawResponse, ParsedCbrRates } from "../../rates/rates.types";

const VALCURS_DATE_PATTERN = /<ValCurs[^>]*Date="([^"]+)"/i;
const VALUTE_PATTERN = /<Valute\b[^>]*>([\s\S]*?)<\/Valute>/gi;

function readTagValue(block: string, tagName: string): string {
  const pattern = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = block.match(pattern);

  if (!match) {
    throw new Error(`Missing <${tagName}> in CBR XML`);
  }

  return match[1].trim();
}

function parseNumericValue(value: string): number {
  const normalized = value.replace(",", ".").trim();
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric value in CBR XML: ${value}`);
  }

  return parsed;
}

export class CbrParser {
  parse(rawResponse: CbrRawResponse): ParsedCbrRates {
    const dateMatch = rawResponse.xml.match(VALCURS_DATE_PATTERN);

    if (!dateMatch) {
      throw new Error("Missing ValCurs date in CBR XML");
    }

    const rates: CbrRawRate[] = [];
    let match: RegExpExecArray | null;

    while ((match = VALUTE_PATTERN.exec(rawResponse.xml)) !== null) {
      const block = match[1];

      rates.push({
        charCode: readTagValue(block, "CharCode"),
        nominal: parseNumericValue(readTagValue(block, "Nominal")),
        name: readTagValue(block, "Name"),
        value: parseNumericValue(readTagValue(block, "Value")),
      });
    }

    if (rates.length === 0) {
      throw new Error("No currency rates found in CBR XML");
    }

    return {
      date: dateMatch[1],
      source: rawResponse.source,
      rates,
    };
  }
}
