import { mkdirSync } from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

import { applySchema } from "./schema";

const DATABASE_FILE_PATH = path.resolve(process.cwd(), "src/db/rubleapi.sqlite");

let databaseInstance: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (databaseInstance) {
    return databaseInstance;
  }

  mkdirSync(path.dirname(DATABASE_FILE_PATH), { recursive: true });

  const database = new Database(DATABASE_FILE_PATH);
  database.pragma("foreign_keys = ON");

  applySchema(database);

  databaseInstance = database;
  return databaseInstance;
}

export function getDatabaseFilePath(): string {
  return DATABASE_FILE_PATH;
}
