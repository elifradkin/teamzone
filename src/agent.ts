// The assistant brain: assembles a cached system prompt from the skills + the
// user's plan, exposes memory tools, and runs the tool loop against the Claude API.

import Anthropic from "@anthropic-ai/sdk";
import { Profile } from "./profile.js";
import * as mem from "./memory.js";
import * as motra from "./motra-oauth.js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL_MAIN = process.env.MODEL_MAIN || "claude-sonnet-4-6";

export type ChatMessage = Anthropic.MessageParam;

const BASE_INSTRUCTIONS = `You are the Team Zone personal fitness & nutrition assistant.
You help each user eat well and train smart, based on the Team Zone nutrition plan,
personalized to their body metrics, goals, and training schedule.

Operating rules:
- Reply in the user's language (Hebrew or English) — see the bilingual skill.
- Always honor kosher + no-fish + no-eggplant + the user's personal restrictions.
- Personalize portions to the user's TARGETS; don't just quote reference grams.
- Use the user's TRAINING SCHEDULE plus any ad-hoc time they mention for meal timing.
- Be concise, warm, and practical. Offer 1–3 concrete options with portions and a
  one-line "why it fits". Never shame food choices. You give estimates, not medical advice.
- When the user shares durable info (new weight/body-fat/goal/activity/schedule/
  preference, or a meal eaten), persist it with the memory tools. Keep summary.md short.
- If the user has no profile or key fields are missing, run the onboarding flow:
  ask in small batches, then save the profile (which auto-computes targets).
- Use read_reference to pull detail files (food swaps, formulas, glossary) only when needed.`;

/** Static, cache-friendly system blocks (vary only by the user's sex → 2 variants). */
async function staticSystemText(sex: Profile["sex"]): Promise<string> {
  const [kosher, bilingual, engine, timing] = await Promise.all([
    mem.readSkill("kosher-rules/SKILL.md"),
    mem.readSkill("bilingual/SKILL.md"),
    mem.readSkill("nutrition-engine/SKILL.md"),
    mem.readSkill("nutrition-engine/meal-timing.md"),
  ]);
  const plan = await mem.readReference(sex === "male" ? "plan-men" : "plan-women");
  return [
    BASE_INSTRUCTIONS,
    "\n# SKILL: kosher-rules\n" + kosher,
    "\n# SKILL: bilingual\n" + bilingual,
    "\n# SKILL: nutrition-engine\n" + engine,
    "\n# REFERENCE: meal-timing\n" + timing,
    "\n# THE USER'S PLAN\n" + plan,
  ].join("\n");
}

async function buildSystem(
  userId: string,
  sex: Profile["sex"],
  nowISO: string,
  motraConnected: boolean
): Promise<Anthropic.TextBlockParam[]> {
  const staticText = await staticSystemText(sex);
  const context = await mem.loadContext(userId);
  const motraNote = motraConnected
    ? "\n\n## MOTRA WORKOUT CONNECTION\n" +
      "Motra is connected for this user. Use motra MCP tools to fetch real workout history, " +
      "exercise data, and health stats when answering training or nutrition-timing questions. " +
      "Prefer actual Motra data over the static training schedule when both are available."
    : "";
  return [
    // Cached prefix: large + stable → ~90% cheaper on repeat reads.
    { type: "text", text: staticText, cache_control: { type: "ephemeral" } },
    // Volatile suffix: small per-user state + clock. Not cached.
    { type: "text", text: `# CURRENT TIME\n${nowISO}\n\n${context}${motraNote}` },
  ];
}

const TOOLS: Anthropic.Tool[] = [
  {
    name: "read_reference",
    description:
      "Read a detail reference file on demand. Use only when you need it (saves tokens). " +
      "Names: " + mem.referenceNames().join(", "),
    input_schema: {
      type: "object",
      properties: { name: { type: "string", enum: mem.referenceNames() } },
      required: ["name"],
    },
  },
  {
    name: "update_profile",
    description:
      "Create or patch the user's profile. Pass only the fields that changed. " +
      "Saving recomputes daily targets automatically and returns them.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        language: { type: "string", enum: ["he", "en"] },
        sex: { type: "string", enum: ["male", "female"] },
        age: { type: "number" },
        height_cm: { type: "number" },
        weight_kg: { type: "number" },
        bodyfat_pct: { type: "number" },
        activity: { type: "string", enum: ["sedentary", "light", "moderate", "high"] },
        goal: { type: "string", enum: ["fat_loss", "maintain", "build_muscle"] },
        goal_rate: { type: "string", enum: ["slow", "moderate", "aggressive"] },
        restrictions: { type: "array", items: { type: "string" } },
        dislikes: { type: "string" },
        notes: { type: "string" },
      },
    },
  },
  {
    name: "set_schedule",
    description: "Replace the user's weekly training schedule. Provide the full schedule as markdown.",
    input_schema: {
      type: "object",
      properties: { markdown: { type: "string" } },
      required: ["markdown"],
    },
  },
  {
    name: "update_summary",
    description:
      "Replace the rolling history summary (keep it under ~300 words: goals, trajectory, " +
      "preferences, recent milestones).",
    input_schema: {
      type: "object",
      properties: { markdown: { type: "string" } },
      required: ["markdown"],
    },
  },
  {
    name: "append_log",
    description: "Append one line to a day's log (a meal eaten, a weight, a check-in).",
    input_schema: {
      type: "object",
      properties: {
        date: { type: "string", description: "YYYY-MM-DD" },
        line: { type: "string" },
      },
      required: ["date", "line"],
    },
  },
];

async function runTool(
  userId: string,
  name: string,
  input: any
): Promise<string> {
  switch (name) {
    case "read_reference":
      return mem.readReference(input.name);
    case "update_profile": {
      const existing = (await mem.loadProfile(userId)) ?? {
        userId,
        sex: "male",
        weight_kg: 0,
        activity: "moderate",
        goal: "maintain",
        restrictions: ["kosher", "no_fish", "no_eggplant"],
      };
      const merged: Profile = { ...existing, ...input, userId };
      if (!merged.weight_kg || merged.weight_kg <= 0)
        return "Cannot compute targets without a valid weight_kg. Ask the user for it.";
      const targets = await mem.saveProfile(userId, merged);
      return `Profile saved. New targets: ${targets.calories_kcal} kcal, ` +
        `${targets.protein_g}g protein, ${targets.carbs_g}g carbs, ${targets.fat_g}g fat ` +
        `(basis: ${targets.basis}).`;
    }
    case "set_schedule":
      await mem.setSchedule(userId, input.markdown);
      return "Schedule updated.";
    case "update_summary":
      await mem.setSummary(userId, input.markdown);
      return "Summary updated.";
    case "append_log":
      await mem.appendLog(userId, input.date, input.line);
      return "Logged.";
    default:
      return `Unknown tool: ${name}`;
  }
}

/**
 * Run one user turn. `history` is the prior conversation (already trimmed).
 * Returns the assistant reply text and the new history (incl. this exchange).
 */
export async function runTurn(
  userId: string,
  history: ChatMessage[],
  userText: string,
  nowISO: string
): Promise<{ reply: string; history: ChatMessage[] }> {
  const profile = await mem.loadProfile(userId);
  const sex: Profile["sex"] = profile?.sex ?? "male";
  const motraToken = await motra.ensureToken(userId);
  const system = await buildSystem(userId, sex, nowISO, motraToken !== null);

  const messages: ChatMessage[] = [...history, { role: "user", content: userText }];

  // Tool loop — keep going while the model requests tools.
  for (let i = 0; i < 8; i++) {
    const baseParams = {
      model: MODEL_MAIN,
      max_tokens: 1200,
      system,
      messages,
    };

    // When Motra is connected, use the MCP connector beta. Anthropic executes
    // motra tool calls server-side; we only handle our local tools below.
    let res: any;
    if (motraToken) {
      res = await (client.beta as any).messages.create({
        ...baseParams,
        betas: ["mcp-client-2025-11-20"],
        mcp_servers: [
          {
            type: "url",
            url: "https://mcp.motra.com/mcp",
            name: "motra",
            authorization_token: motraToken,
          },
        ],
        tools: [...TOOLS, { type: "mcp_toolset", mcp_server_name: "motra" }],
      });
    } else {
      res = await client.messages.create({ ...baseParams, tools: TOOLS });
    }

    messages.push({ role: "assistant", content: res.content });

    if (res.stop_reason === "tool_use") {
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of res.content) {
        // Only handle our local tools — mcp_tool_use blocks are handled by Anthropic.
        if (block.type === "tool_use") {
          let out: string;
          try {
            out = await runTool(userId, block.name, block.input);
          } catch (e: any) {
            out = `Error: ${e?.message ?? e}`;
          }
          toolResults.push({ type: "tool_result", tool_use_id: block.id, content: out });
        }
      }
      if (toolResults.length > 0) {
        messages.push({ role: "user", content: toolResults });
      }
      continue; // let the model use the results
    }

    // Final answer
    const reply = (res.content as any[])
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("\n")
      .trim();
    return { reply: reply || "(no reply)", history: messages };
  }
  return { reply: "Sorry — I got stuck. Please try rephrasing.", history: messages };
}
