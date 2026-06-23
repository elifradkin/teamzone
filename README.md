# Team Zone — Bilingual Fitness & Nutrition Assistant

A web assistant (Hebrew + English) that gives personalized, kosher, fish-free,
eggplant-free nutrition guidance based on the Team Zone plans, and remembers each
user across conversations. Built on the Claude API with a Markdown "Skills"
knowledge base and per-user memory files.

- **Text first** (this build). **Voice is phase 2** (design in `ARCHITECTURE.md`).
- **~20 users**, simple PIN login, per-user memory.
- **Token-efficient:** cached static plans + on-demand reference files + rolling
  per-user summaries.

## Quick start (local)

Prerequisites: **Node.js 20+**.

```bash
# 1. install dependencies
npm install

# 2. configure
cp .env.example .env
#   then edit .env: add ANTHROPIC_API_KEY, set SESSION_SECRET,
#   and list your users in AUTH_USERS (e.g. eli:1234,dana:5678)

# 3. run
npm run dev
#   open http://localhost:3000  → sign in with a user/PIN from AUTH_USERS
```

First sign-in for a new user has no profile, so the assistant runs **onboarding**
(asks metrics → goal → schedule → preferences) and computes their targets.

## How it works (one paragraph)

Each message hits `src/agent.ts`, which builds a **cached system prompt** from the
skills + the user's plan (men's/women's), appends that user's small live state
(`profile`, `targets`, `schedule`, `summary`), and calls Claude with a set of
**memory tools**. When the user shares durable info (new weight, goal, schedule,
a meal eaten), the model calls a tool that updates the user's files; changing body
metrics auto-recomputes targets. Knowledge lives in `knowledge/skills/` as Markdown;
private user data lives in `users/<id>/` (git-ignored).

## Project layout

```
knowledge/skills/        # the assistant's brain (Markdown "Skills")
  nutrition-engine/      #   SKILL + plan-men/women, calorie-macros, meal-timing, food-database
  kosher-rules/          #   kosher + no-fish + no-eggplant filter
  bilingual/             #   Hebrew/English behavior + glossary
  user-memory/           #   memory rules + file schemas
  onboarding/            #   first-run intake
src/                     # the app
  profile.ts             #   calorie/macro math (mirrors calorie-macros.md)
  memory.ts              #   per-user file read/write + reference loader
  agent.ts               #   system-prompt assembly, tools, Claude tool loop
  index.ts               #   Express server, auth, sessions
  web/                   #   chat UI (text; RTL-aware)
users/<id>/              # private per-user memory (git-ignored)
```

## Managing users

Edit `AUTH_USERS` in `.env` as `id:PIN` pairs, comma-separated. A user's data is
created on first login under `users/<id>/`. To inspect or back up a user, just read
their Markdown files.

## Deploy to Hetzner (Docker + HTTPS)

On a fresh Hetzner Cloud VPS (e.g. CX22) with Docker installed:

```bash
# 1. copy this project to the server (git clone or scp), then:
cp .env.example .env        # fill in real values
#    point a domain's A record at the server IP
#    edit Caddyfile: set your domain + email

# 2. launch (app + Caddy with auto Let's Encrypt TLS)
docker compose up -d
```

Your assistant is then live at `https://your-domain`. The `users/` folder is a
mounted volume, so memory persists across deploys. Back it up regularly.

See `ARCHITECTURE.md` for the design, token/cost strategy, and the voice (phase 2) plan.
See `CLAUDE.md` for conventions when developing with Claude Code.
