import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars");
  process.exit(1);
}

const supabase = createClient(url, anon);

async function main() {
  try {
    // 1) list jobs (with company and skills)
    const { data: jobs, error: e1 } = await supabase
      .from("job")
      .select(
        "job_id,title,location,company:company_id(name),skills:job_skill(skill:skill_id(skill_id,skill_name))"
      )
      .limit(5);
    if (e1) throw new Error("Jobs query failed: " + e1.message);
    console.log("Jobs count:", jobs?.length || 0);
    console.log(
      (jobs || []).map((j) => ({
        title: j.title,
        company: j.company?.name,
        skills: (j.skills || []).map((s) => s.skill?.skill_name),
      }))
    );

    // 2) list skills
    const { data: skills, error: e2 } = await supabase
      .from("skill")
      .select("skill_name")
      .limit(5);
    if (e2) throw new Error("Skills query failed: " + e2.message);
    console.log("Sample skills:", (skills || []).map((s) => s.skill_name));

    // 3) applications read (may be blocked by RLS if not owner)
    const { data: apps, error: e3 } = await supabase
      .from("application")
      .select("application_id")
      .limit(1);
    if (e3) console.log("Applications read likely blocked by RLS (expected if not owner):", e3.message);
    else console.log("Applications rows (may be 0):", apps?.length || 0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
