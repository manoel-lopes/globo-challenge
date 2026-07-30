import { defineConfig, env } from "prisma/config";

const databaseUrlFromParts = `postgresql://${env("DB_USER")}:${encodeURIComponent(env("DB_PASSWORD"))}@${env("DB_HOST")}:${env("DB_PORT")}/${env("DB_NAME")}?schema=public`;
const databaseUrl = process.env.DATABASE_URL?.startsWith("postgresql://")
  ? process.env.DATABASE_URL
  : databaseUrlFromParts;

export default defineConfig({
  schema: "prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
