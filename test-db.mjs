import postgres from "postgres";
async function main() {
  const url = process.env.DATABASE_URL || "postgresql://postgres.xxbwbkokvcbwbexyzohg:Rarehimalayandanfetea%402020@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres";
  console.log("Connecting with URL:", url.replace(/:[^:@]+@/, ":****@"));
  const sql = postgres(url, { ssl: "require", max: 1 });
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
