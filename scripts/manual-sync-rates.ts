import { CbrClient } from "../src/modules/sources/cbr/cbr.client";
import { CbrMapper } from "../src/modules/sources/cbr/cbr.mapper";
import { CbrParser } from "../src/modules/sources/cbr/cbr.parser";

async function main() {
  const client = new CbrClient();
  const parser = new CbrParser();
  const mapper = new CbrMapper();

  const rawResponse = await client.fetchLatestRates();
  const parsedRates = parser.parse(rawResponse);
  const snapshot = mapper.toSnapshot(parsedRates);

  console.log("Manual sync completed");
  console.log(JSON.stringify(snapshot, null, 2));
}

main().catch((error) => {
  console.error("Manual sync failed");
  console.error(error);
  process.exit(1);
});
