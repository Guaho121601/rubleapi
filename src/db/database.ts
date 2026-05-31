import { mkdirSync } from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

import { getConfig } from "../app/config";
import { applySchema } from "./schema";

let databaseInstance: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (databaseInstance) {
    return databaseInstance;
  }

  const databaseFilePath = getDatabaseFilePath();

  mkdirSync(path.dirname(databaseFilePath), { recursive: true });

  const database = new Database(databaseFilePath);
  database.pragma("foreign_keys = ON");

  applySchema(database);

  databaseInstance = database;
  return databaseInstance;
}

export function getDatabaseFilePath(): string {
  return getConfig().databasePath;
}
