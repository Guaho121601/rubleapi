import { CbrClient } from "../src/modules/sources/cbr/cbr.client";
import { CbrMapper } from "../src/modules/sources/cbr/cbr.mapper";
import { CbrParser } from "../src/modules/sources/cbr/cbr.parser";
import { RatesRepository } from "../src/modules/rates/rates.repository";
import { RatesService } from "../src/modules/rates/rates.service";

async function main() {
  const repository = new RatesRepository();
  const service = new RatesService(repository, new CbrClient(), new CbrParser(), new CbrMapper());
  const snapshot = await service.manualSync();

  console.log("Manual sync completed");
  console.log(JSON.stringify(snapshot, null, 2));
}

main().catch((error) => {
  console.error("Manual sync failed");
  console.error(error);
  process.exit(1);
});
