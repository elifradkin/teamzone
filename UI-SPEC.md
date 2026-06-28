# UI-SPEC.md — TeamZone v2

UI/UX specification for the bilingual (HE/EN, RTL-first) fitness + nutrition app,
web + mobile. Shared components across web (React) and mobile (React Native /
Expo). Companion to PLAN.md, ARCHITECTURE.md, DECISIONS-AND-RISKS.md. This
describes the intended UI; it is not built until its phase is active (Rule 1).

## 1. Principles
- **Bilingual + RTL-first.** Every screen works in Hebrew (RTL) and English
  (LTR): mirrored layout, right-aligned text, flipped chevrons/icons, localized
  numbers/units/dates, and correct bidi for mixed content (Hebrew text with
  English exercise/food names or numbers). No hardcoded display strings.
- **Original visualizations only.** The mannequin and all charts are original art
  built from the user's own numbers — never Motra's UI, assets, or styling
  (CLAUDE.md Rule 6). North-star = `front_example.png` / `back_example.png`.
- **Shared components.** The mannequin, heat scale, cards, and logging flows are
  written once and reused on web + mobile.
- **Trust + control.** AI never silently writes or invents numbers: food macros
  come from the database; AI actions require an explicit confirm (R-17, R-18).
- **Accessibility.** ≥44px tap targets; the muscle List view is a full
  alternative to tapping the figure; semantic labels; luminance-based heat scale
  (not red/green) so it's colorblind-safe.

## 2. Navigation
- **Five bottom tabs:** Home · Body · Train · Nutrition · Coach.
- **Profile / Settings** is reached from an avatar icon in the header (not a tab).
- In Hebrew the tab bar mirrors right-to-left; the primary tab sits on the right;
  the header avatar swaps sides.

## 3. Cross-cutting states
Every data screen defines: first-run/empty (with a setup prompt), loading
skeleton, error + retry, and — for Motra-backed views — a sync-failed state that
shows last-synced data with a retry (never a blank screen; R-2/R-3).

---

## 4. Home tab
**Purpose:** daily cockpit — body status + what to do today.
**Content (scrolling):**
- Header: greeting + date + sync status; avatar icon → Profile.
- Recovery summary card (plain-language muscle status) → Body.
- Today's training suggestion (train/rest, from recovery + goals).
- Nutrition block: calorie ring (consumed vs target + remaining), macro bars,
  "+ Log food" (search/barcode), recent-foods quick re-add, water counter, the
  "adjusted for your training" badge, next planned meal.
- Weight check-in nudge + trend sparkline (progress toward target) → Nutrition.
- Recent workouts (source badge: Motra/Manual/Health) → Train.
- Quick actions: Log workout, Ask coach.
**States:** first-run (setup prompts: connect Motra / log first workout / set
goals); sync states; loading. Pull-to-refresh triggers a Motra sync.

## 5. Body tab
**Purpose:** muscle-map of **recovery** ("how ready is each muscle right now") +
jump to exercises. (Effort/volume analytics live in Train, by decision — keeps
this hero screen unambiguous.)
**Main screen:**
- Title "Recovery" + one-line definition + an "i" for how it's estimated.
- View switch: **Mannequin | List** (remembers last choice).
- Mannequin view: **front + back shown together**; the figure **reflects the
  user's sex + body type** (multiple base illustrations) with the avatar head
  shown **by default**; warm **yellow→orange→red heat ramp (Option A)** —
  luminance-safe, with the List view + numeric % as the non-color backup; legend;
  a "what to train today" suggestion (highlights fresh muscles); a numeric readout
  (e.g. "Legs 35% recovered · trained 1d ago").
- List view: muscles grouped by region (upper body / core / lower body), each
  with status + recovery, → same muscle detail.
- Tap a muscle (or list row) → **muscle detail sheet**: name (HE/EN), status
  (recovery %, last trained, volume/RPE), recommended exercises (from
  free-exercise-db, filtered by profile/equipment); fatigued muscles lead with
  recovery guidance before exercises. → exercise detail.
**States:** no-data/new user (neutral figure + prompt to sync/log); avatar on/off;
muscles Motra doesn't cover shown neutral.
**Notes:** avatar toggle lives in Profile; colorblind-safe via luminance; full
RTL mirroring incl. the legend (Fresh on the right in Hebrew).

## 6. Train tab
**Purpose:** workout data — sync, log, review, plan, browse exercises.
**Content:**
- Sync header: Motra connection + last-sync + "Sync now" (or "Connect Motra");
  manual entry always available.
- "Log workout" (manual entry: pick exercises → sets/reps/weight/RPE → save).
- **Effort / volume analytics** (moved here from Body): sets-by-muscle over a
  7/30-day window, most/least trained, an "undertrained muscle" nudge.
- Workout history (reverse-chronological; source badge; tap → workout detail with
  per-exercise breakdown; edit/delete manual entries only — Motra is read-only).
- **Native workout templates/plans**: build/save routines in-app (from
  recommendations or manually). Motra MCP is read-only — templates live in the
  app; no push to Motra; Motra auto-detects the actual session and it flows back
  via the read path (D13).
- Browse exercise library (search + filter by muscle/equipment/level) → exercise
  detail (shared with Body).

## 7. Nutrition tab
**Purpose:** plan, log, and track eating, weight, and water. Top switch:
**Today (diary)** and **Plan**.
**Today (diary):**
- Date bar (swipe to past days).
- Daily summary: calorie ring (consumed vs target + remaining) + macro bars.
- Meals (Breakfast/Lunch/Dinner/Snacks): logged items with calories + "+ Add food"
  per meal.
- Water: tap-to-add counter toward a user-set goal.
- Weight (+ optional body fat): check-in + trend → history; progress toward
  target weight/body-fat.
**Plan mode:** recommended meal plan (baseline M/F seeds auto-adjusted by profile
+ training load) with the "adjusted for your training" rationale, per-meal swaps,
respects free-text food preferences, "log this plan."
**Add food screen (key flow):**
- Methods: presets/recent/frequent (one-tap); manual search; **barcode scan**;
  **AI natural-language entry** ("2 eggs, toast and a coffee") parsed by Claude
  into items + portions; **photo logging** (Gemini) as a flagged fast-follow.
- **Review/confirm step (mandatory):** detected items show portions + macros
  sourced "from database"; model estimates are clearly flagged; nothing saves
  until the user confirms/edits (R-17). Assign to a meal; adjust portions.
**States:** empty diary (prompt); barcode not found → manual add/search; no plan
yet; offline (queue logs, sync later).

## 8. Coach tab
**Purpose:** AI chat (Claude Sonnet, server-side) grounded in the user's own data.
**Content:**
- Thread (bilingual, RTL-aware, bidi for mixed content).
- Context indicator ("using your recovery, plan & workouts · private").
- Suggested prompts (esp. empty state).
- Personalized answers with tap-through deep-links (view exercises, start
  workout, apply meal swap, log it).
- **Coach actions:** can log/edit food, weight, water, and workouts from natural
  language (add and modify existing entries) — routed through the same
  DB-grounded pipelines; **explicit confirm card before every write**, no silent
  changes (D14, R-18). Tools scoped to the user's own data; on-domain only.
- Input: text + optional voice; clear-conversation; response language follows the
  app (can ask in either).
**Safety:** server-side keys only; data minimization; "guidance, not medical
advice" boundary; defers medical questions to professionals.

## 9. Profile / Settings (header avatar)
- **Header:** avatar + name/email → edit; a weight snapshot (current vs target).
- **About you:** body stats (current weight = latest logged measurement, single
  source of truth), food preferences.
- **Goals & targets:** goals (multiple); target weight; optional target body-fat
  %; nutrition targets (auto-derived, "custom" when overridden); water goal.
- **Avatar:** source (upload photo w/ consent / character creator / template),
  show-avatar-on-mannequin toggle. (Tapping the avatar and the source row lead to
  the same editor.)
- **Connections:** Motra (status, Pro, last sync, re-auth for token expiry R-2);
  Apple Health (Phase 10); manual entry always on.
- **Preferences:** language (HE/EN), units (metric/imperial), notifications
  (granular: meals/workouts/water/weight), theme.
- **Privacy & data:** manage consents (photo / health / AI) individually; export
  my data; data location (currently US — R-14); delete account/data.
- **Account & about:** password; sign-in methods (Google/Apple later); log out;
  **attributions** (Open Food Facts ODbL — R-15, free-exercise-db); version;
  help/contact.
- **Destructive actions** require typed confirmation + an export nudge; logout
  confirms.

## 10. Key UI decisions
- 5 tabs (Home/Body/Train/Nutrition/Coach) + Profile via header avatar.
- Body shows **Recovery only**; Effort/volume analytics live in **Train**.
- Mannequin shows **front + back together**; **Mannequin/List** view switch.
- **Warm single-hue** heat scale, colorblind-safe via luminance (no red/green).
- Food logging methods: presets, NL-AI (Claude), barcode; **photo (Gemini)** as
  fast-follow; **macros from the DB, not the model**; mandatory confirm step.
- Hydration counter **with a user-set goal**; weight + optional body fat with
  **target weight / body-fat**.
- **Coach can act** (log/edit) with **explicit confirm before every write**.
- Workout templates **native** (no Motra push; read-only MCP).
- Current weight = latest `body_metrics` (single source of truth).
- **Mannequin reflects sex + body type** (multiple base illustrations); avatar
  shown **on by default**.
- **Heat scale = Option A** (warm yellow→orange→red ramp; luminance + List/numbers
  for colorblind safety; no on-figure glyphs).
- **Nutrition targets editable in both** Profile and Nutrition (one underlying
  value, so always in sync).
- **Default notifications ON:** daily training readiness, Motra sync/re-auth
  alerts, meal-logging reminders, water + weekly weight — all individually
  toggleable; timed sensibly and bundled to avoid fatigue.
- **Character creator = focused set:** skin tone, hair style + color, facial hair,
  top + shorts color, glasses (Phase 5).

## 11. Open UI items (decide at build / later phase)
- Body-type taxonomy (the small set of body types behind the figure variants) —
  define in the Phase 2 onboarding design.
- Character-creator render approach: layered hand-drawn assets vs. Gemini-
  generated from attributes — Phase 5 implementation detail.
- Exact notification timing/bundling rules.
- Final heat-ramp hex stops (within the Option A warm ramp).
