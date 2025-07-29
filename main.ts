import * as dotenv from "https://deno.land/std@0.203.0/dotenv/mod.ts";
import { Hono } from "https://deno.land/x/hono@v3.11.7/mod.ts";
import { Client } from "https://deno.land/x/mysql@v2.11.0/mod.ts";

const env = await dotenv.load();

const app = new Hono();

const client = await new Client().connect({
  hostname: env.DB_HOST,
  username: env.DB_USER,
  password: env.DB_PASS,
  db: env.DB_NAME,
  port: Number(env.DB_PORT),
});

// ✅ 表格白名單（僅允許這些）
const allowedTables = [
  "article",
  "bank",
  "cloud",
  "experience",
  "food",
  "host",
  "inventory",
  "mail",
  "member",
  "routine",
  "subscription",
  "video",
];

app.get("/", (c) => {
  const tableListItems = allowedTables
    .map(
      (table) =>
        `<li><a href="/api/${table}" target="_blank" rel="noopener noreferrer">${table}</a></li>`
    )
    .join("");

  return c.html(`
    <ul>
      ${tableListItems}
    </ul>
  `);
});

// 安全的 API：僅查詢白名單表格
app.get("/api/:table", async (c) => {
  const table = c.req.param("table");

  // ⚠️ 檢查是否在白名單中
  if (!allowedTables.includes(table)) {
    return c.json({ error: `Access to table "${table}" is not allowed.` }, 403);
  }

  try {
    const result = await client.query(`SELECT * FROM \`${table}\``);
    return c.json({ message: `Data from "${table}"`, data: result });
  } catch (err) {
    console.error(err);
    return c.json({ error: `Query failed: ${err.message}` }, 500);
  }
});

Deno.serve(app.fetch);
