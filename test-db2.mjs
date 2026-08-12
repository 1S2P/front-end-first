import postgres from "postgres";
async function main() {
  const sql = postgres({
    host: "aws-0-ap-southeast-1.pooler.supabase.com",
    port: 6543,
    database: "postgres",
    username: "postgres.xxbwbkokvcbwbexyzohg",
    password: "Rarehimalayandanfetea@2020",
    ssl: "require",
    max: 1,
  });
  try {
    const r = await sql.unsafe("SELECT 1 AS test");
    console.log("Connected!", r);
    await sql.end();
  } catch (e) {
    console.error("Error:", e.message);
    process.exit(1);
  }
}
main();
