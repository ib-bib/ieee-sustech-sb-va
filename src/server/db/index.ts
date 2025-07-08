import { drizzle } from "drizzle-orm/neon-http";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

import { env } from "~/env";
import * as schema from "./schema";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  // conn: postgres.Sql | undefined;
  sql: NeonQueryFunction<false, false> | undefined;
};

// const conn = globalForDb.conn ?? postgres(env.DATABASE_URL);

const sql = globalForDb.sql ?? neon(env.DATABASE_URL);

// if (env.NODE_ENV !== "production") globalForDb.conn = conn;

if (env.NODE_ENV !== "production") globalForDb.sql = sql;

// export const db = drizzle(conn, { schema });

export const db = drizzle({ client: sql, schema });
