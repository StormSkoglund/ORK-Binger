import { createClient } from "@supabase/supabase-js";
import readline from "readline";
import fs from "fs";
import path from "path";

// Load .env if present so the script works without manual `export` in PowerShell
function loadDotEnvFile() {
  try {
    const p = path.resolve(process.cwd(), ".env");
    if (!fs.existsSync(p)) return;
    const content = fs.readFileSync(p, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const m = trimmed.match(
        /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?:"([^"\\]*(?:\\.[^"\\]*)*)"|'([^']*)'|(.+))$/,
      );
      if (!m) continue;
      const key = m[1];
      const val = m[2] ?? m[3] ?? m[4] ?? "";
      const clean = val.replace(/\\n/g, "\n").replace(/\\r/g, "\r");
      if (!process.env[key]) process.env[key] = clean;
    }
  } catch (err) {
    // ignore — fall back to existing env vars
  }
}
loadDotEnvFile();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_ANON_KEY (or VITE_ variants).",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// calendar id for multi-tenant projects; can be set via env var or CLI
let CALENDAR_ID =
  process.env.CALENDAR_ID || process.env.VITE_CALENDAR_ID || "default";

function getWeeklyTemplates(calendarId) {
  const id = (calendarId || "").toLowerCase();

  // Musikkbinge 2 (Os Sentrum) fixed weekly schedule.
  if (id === "musikkbinge2" || id === "os_sentrum" || id === "musikkbingeos") {
    return [
      {
        names: "Henrik Furuvik",
        weekday: 0,
        startTime: "18:00",
        endTime: "22:00",
      }, // Sunday
    ];
  }

  // Søfteland (musikkbinge1) weekly schedule
  if (id === "musikkbinge1" || id === "soefteland") {
    return [
      {
        names: "Storm Valley",
        weekday: 1,
        startTime: "19:00",
        endTime: "24:00",
      }, // Monday
      { names: "E39", weekday: 2, startTime: "18:00", endTime: "24:00" }, // Tuesday
      {
        names: "De Navnløse",
        weekday: 0,
        startTime: "17:00",
        endTime: "20:00",
      }, // Sunday
    ];
  }

  // No default schedule: this project is configured with explicit tenant schedules only.
  return [];
}

function getDateForWeekday(base, weekday, weekOffset = 0) {
  const d = new Date(base);
  const diff = (weekday - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff + weekOffset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function setTime(dt, timeStr) {
  const [hhStr, mmStr] = timeStr.split(":");
  const hh = parseInt(hhStr, 10);
  const mm = parseInt(mmStr, 10);
  const d = new Date(dt);

  // treat 24:00 as the end of day (next midnight)
  if (hh === 24) {
    d.setDate(d.getDate() + 1);
    d.setHours(0, mm, 0, 0);
  } else {
    d.setHours(hh, mm, 0, 0);
  }

  return d;
}

function toYMD(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function confirmPrompt(question) {
  return new Promise((res) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (ans) => {
      rl.close();
      res(/^y(es)?$/i.test(ans));
    });
  });
}

async function main() {
  const argv = process.argv.slice(2);
  let weeks = 52;
  let autoYes = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--yes" || a === "-y") autoYes = true;
    if ((a === "--weeks" || a === "-w") && argv[i + 1]) {
      weeks = parseInt(argv[i + 1], 10) || weeks;
      i++;
    }
    if ((a === "--calendar" || a === "-c") && argv[i + 1]) {
      CALENDAR_ID = argv[i + 1];
      i++;
    }
    if (!isNaN(Number(a)) && argv.length === 1) {
      weeks = parseInt(a, 10);
    }
  }

  if (!autoYes) {
    const ok = await confirmPrompt(
      `Insert weekly schedule for the next ${weeks} weeks? (yes/no) `,
    );
    if (!ok) {
      console.log("Aborted by user.");
      process.exit(0);
    }
  }

  console.log(
    `Seeding weekly schedule for calendar '${CALENDAR_ID}' — ${weeks} weeks...`,
  );
  const today = new Date();
  const templates = getWeeklyTemplates(CALENDAR_ID);
  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  for (let w = 0; w < weeks; w++) {
    for (const tpl of templates) {
      const bandName = Array.isArray(tpl.names)
        ? tpl.names[w % tpl.names.length]
        : tpl.names;
      const dayDate = getDateForWeekday(today, tpl.weekday, w);
      const startDt = setTime(dayDate, tpl.startTime);
      const endDt = setTime(dayDate, tpl.endTime);

      try {
        const { data, error } = await supabase
          .from("bookings")
          .insert([
            {
              start_ts: startDt.toISOString(),
              end_ts: endDt.toISOString(),
              user_name: bandName,
              /* no date column in new schema */
              calendar_id: CALENDAR_ID,
            },
          ])
          .select()
          .single();

        if (error || !data) {
          skipped++;
          // log cause for visibility
          if (error)
            console.log(
              `Skipped ${bandName} ${toYMD(startDt)} (${error.message || error.details || "constraint"})`,
            );
          continue;
        }

        inserted++;
        process.stdout.write(`+`);
      } catch (err) {
        failed++;
        console.error(
          `Error inserting ${bandName} on ${toYMD(startDt)}:`,
          err instanceof Error ? err.message : String(err),
        );
      }
    }
    // small flush for readability
    if (w % 5 === 0) process.stdout.write(` (${w + 1}/${weeks} weeks)\n`);
  }

  console.log(
    `\nDone — inserted: ${inserted}, skipped: ${skipped}, failed: ${failed}`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
