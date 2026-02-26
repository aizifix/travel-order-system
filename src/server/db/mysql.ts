import mysql, { type Pool } from "mysql2/promise";

declare global {
  var __toSystemMysqlPool: Pool | undefined;
}

let poolInstance: Pool | undefined;

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function createMysqlPool(): Pool {
  const host = getRequiredEnv("DB_HOST");
  const user = getRequiredEnv("DB_USER");
  const database = getRequiredEnv("DB_NAME");
  const password = process.env.DB_PASSWORD ?? "";
  const port = Number(process.env.DB_PORT ?? "3306");

  return mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    namedPlaceholders: false,
    decimalNumbers: true,
  });
}

export function getDbPool(): Pool {
  if (process.env.NODE_ENV === "production") {
    if (!poolInstance) {
      poolInstance = createMysqlPool();
    }
    return poolInstance;
  }

  if (!globalThis.__toSystemMysqlPool) {
    globalThis.__toSystemMysqlPool = createMysqlPool();
  }

  return globalThis.__toSystemMysqlPool;
}
