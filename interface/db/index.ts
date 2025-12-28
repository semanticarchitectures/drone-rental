// Server-only database module
// This file should only be imported in API routes and server components
import "server-only";

import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";

// Database file path - relative to where Next.js runs (interface directory)
// When Next.js runs, process.cwd() is the interface directory
const dbPath = path.join(process.cwd(), "drone-rental.db");
const migrationsFolder = path.join(process.cwd(), "drizzle");

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

// Run migrations
try {
  migrate(db, { migrationsFolder });
  console.log("Migrations applied successfully");
} catch (error) {
  // Log migration errors for debugging
  console.error("Migration error:", error);
  // Don't throw - migration might have already been applied
}

