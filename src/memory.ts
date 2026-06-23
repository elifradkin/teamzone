// Per-user memory: file-backed store under users/<userId>/.
// Canonical data for profile/targets is JSON; human/agent-readable .md views are
// rendered alongside so context injection stays clean and parsing stays reliable.

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Profile, Targets, computeTargets } from "./profile.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const USERS_DIR = path.join(ROOT, "users");
const KNOWLEDGE = path.join(ROOT, "knowledge", "skills");

const userDir = (id: string) => path.join(USERS_DIR, sanitize(id));
function sanitize(id: string): string {
  if (!/^[a-zA-Z0-9_-]{1,40}$/.test(id)) throw new Error("invalid userId");
  return id;
}
async function readOr(file: string, fallback = ""): Promise<string> {
  try {
    return await fs.readFile(file, "utf8");
  } catch {
    return fallback;
  }
}

export async function ensureUser(id: string): Promise<void> {
  await fs.mkdir(path.join(userDir(id), "log"), { recursive: true });
}

// ---------- Profile ----------
export async function loadProfile(id: string): Promise<Profile | null> {
  const raw = await readOr(path.join(userDir(id), "profile.json"));
  return raw ? (JSON.parse(raw) as Profile) : null;
}

export async function saveProfile(id: string, profile: Profile): Promise<Targets> {
  await ensureUser(id);
  await fs.writeFile(path.join(userDir(id), "profile.json"), JSON.stringify(profile, null, 2));
  await fs.writeFile(path.join(userDir(id), "profile.md"), renderProfileMd(profile));
  // Metrics drive targets — always recompute & persist when profile changes.
  const targets = computeTargets(profile);
  await saveTargets(id, targets);
  return targets;
}

export async function loadTargets(id: string): Promise<Targets | null> {
  const raw = await readOr(path.join(userDir(id), "targets.json"));
  return raw ? (JSON.parse(raw) as Targets) : null;
}

export async function saveTargets(id: string, t: Targets): Promise<void> {
  await ensureUser(id);
  await fs.writeFile(path.join(userDir(id), "targets.json"), JSON.stringify(t, null, 2));
  await fs.writeFile(path.join(userDir(id), "targets.md"), renderTargetsMd(t));
}

// ---------- Schedule / summary (free markdown) ----------
export async function setSchedule(id: string, markdown: string): Promise<void> {
  await ensureUser(id);
  await fs.writeFile(path.join(userDir(id), "schedule.md"), markdown.trim() + "\n");
}
export async function setSummary(id: string, markdown: string): Promise<void> {
  await ensureUser(id);
  await fs.writeFile(path.join(userDir(id), "summary.md"), markdown.trim() + "\n");
}

// ---------- Daily log ----------
export async function appendLog(id: string, date: string, line: string): Promise<void> {
  await ensureUser(id);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("bad date");
  const file = path.join(userDir(id), "log", `${date}.md`);
  const existing = await readOr(file, `# Log — ${date}\n`);
  await fs.writeFile(file, existing.replace(/\s*$/, "") + `\n- ${line}\n`);
}
export async function readLog(id: string, date: string): Promise<string> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("bad date");
  return readOr(path.join(userDir(id), "log", `${date}.md`), `(no log for ${date})`);
}

// ---------- Context bundle injected every turn (small) ----------
export async function loadContext(id: string): Promise<string> {
  const dir = userDir(id);
  const profile = await readOr(path.join(dir, "profile.md"), "(no profile yet — run onboarding)");
  const targets = await readOr(path.join(dir, "targets.md"), "(no targets yet)");
  const schedule = await readOr(path.join(dir, "schedule.md"), "(no training schedule yet)");
  const summary = await readOr(path.join(dir, "summary.md"), "(no history yet)");
  return [
    "## This user's PROFILE\n" + profile,
    "## This user's TARGETS\n" + targets,
    "## This user's TRAINING SCHEDULE\n" + schedule,
    "## This user's SUMMARY / HISTORY\n" + summary,
  ].join("\n\n");
}

// ---------- On-demand reference (knowledge files) ----------
const REFERENCES: Record<string, string> = {
  "food-database": "nutrition-engine/food-database.md",
  "calorie-macros": "nutrition-engine/calorie-macros.md",
  "meal-timing": "nutrition-engine/meal-timing.md",
  "plan-men": "nutrition-engine/plan-men.md",
  "plan-women": "nutrition-engine/plan-women.md",
  glossary: "bilingual/glossary-he-en.md",
  "memory-schema": "user-memory/memory-schema.md",
  "intake-questions": "onboarding/intake-questions.md",
};
export function referenceNames(): string[] {
  return Object.keys(REFERENCES);
}
export async function readReference(name: string): Promise<string> {
  const rel = REFERENCES[name];
  if (!rel) throw new Error(`unknown reference: ${name}`);
  return readOr(path.join(KNOWLEDGE, rel), "(reference not found)");
}
export async function readSkill(rel: string): Promise<string> {
  return readOr(path.join(KNOWLEDGE, rel), "");
}

// ---------- Markdown renderers ----------
function renderProfileMd(p: Profile): string {
  return `# Profile — ${p.name ?? p.userId}
- userId: ${p.userId}
- language: ${p.language ?? "auto"}
- sex: ${p.sex}
- age: ${p.age ?? "?"}
- height_cm: ${p.height_cm ?? "?"}
- weight_kg: ${p.weight_kg}
- bodyfat_pct: ${p.bodyfat_pct ?? "unknown"}
- activity: ${p.activity}
- goal: ${p.goal}${p.goal_rate ? ` (${p.goal_rate})` : ""}
- restrictions: ${(p.restrictions ?? ["kosher", "no_fish", "no_eggplant"]).join(", ")}
- dislikes: ${p.dislikes ?? "-"}
- notes: ${p.notes ?? "-"}
`;
}

function renderTargetsMd(t: Targets): string {
  const m = t.per_meal_protein_g;
  return `# Daily Targets
- basis: ${t.basis}
- rmr_kcal: ${t.rmr_kcal}
- tdee_kcal: ${t.tdee_kcal}
- calories_kcal: ${t.calories_kcal}
- protein_g: ${t.protein_g}
- carbs_g: ${t.carbs_g}
- fat_g: ${t.fat_g}
- per_meal_protein_g: breakfast ${m.breakfast}, lunch ${m.lunch}, snack ${m.snack}, dinner ${m.dinner}, night ${m.night}
`;
}
