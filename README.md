# Our Life Dashboard

A personal life dashboard for Jordyn & Ty to share. One login, one dashboard,
three zones: **Shared**, **Jordyn**, and **Ty**.

- **Frontend:** React + Vite, deployed on Netlify
- **Backend:** Supabase (Postgres + Auth). No separate server — the React app
  talks to Supabase directly via the JS client.
- **Data:** the entire dashboard is one JSON blob in a `dashboards` table, so
  adding a section later is just a new key, never a schema migration.

## What's in this first version

- Email **magic-link** login (one shared account).
- **Person switcher** at the top — Jordyn / Ty / Shared. Defaults to Jordyn.
- **Live date & time**, updating every second.
- **This Week** view (Jordyn and Ty each get their own):
  - Task checklist with optional colored **lanes**, add/complete/edit/delete,
    plus a satisfying confetti pop when you check something off.
  - **Weekly focus** — one line for the most important thing.
  - **Today** — a manual time/event list (Google Calendar comes later).
  - A daily **reflection / notes** field.
- **Week navigation:** back/forward arrows and a month jump. Each week is saved
  under that person's `weeks` object, keyed by its Monday (ISO date). Past
  weeks stay forever and remain editable.
- **Carry-forward:** the first time you open a new week, still-unchecked tasks
  from the most recent prior week follow you forward — once, no duplicates.
  Checked tasks stay behind in history.
- **Editable lanes** (⚙︎ Lanes): rename, recolor, add, remove. Tasks reference
  a lane by id, so all the week logic works no matter how you change them.
- **Auto-save** to Supabase, debounced so it isn't writing on every keystroke.

---

## Setup

### 1. Create the Supabase table + security policy

In your Supabase project, open **SQL Editor → New query**, paste the contents
of [`supabase/schema.sql`](supabase/schema.sql), and **Run**. This creates the
`dashboards` table and the Row Level Security policies so the logged-in account
can only read and write its own row.

### 2. Turn on email magic-link auth

In Supabase: **Authentication → Providers → Email** — make sure **Email** is
enabled (magic links are on by default). For local dev, also add your dev URL
under **Authentication → URL Configuration → Redirect URLs**
(e.g. `http://localhost:5173`). Add your Netlify URL there too once deployed.

### 3. Environment variables

You need exactly two, both found in Supabase under **Settings → API**:

| Variable                  | Where to find it in Supabase                                            |
| ------------------------- | ----------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`       | Settings → API → **Project URL** (e.g. `https://abcd1234.supabase.co`)  |
| `VITE_SUPABASE_ANON_KEY`  | Settings → API → **Project API keys → `anon` `public`**                 |

> The `anon` key is meant to be public — Row Level Security is what protects
> your data. **Never** use the `service_role` key in this app.

Copy `.env.example` to `.env` and fill them in:

```bash
cp .env.example .env
# then edit .env
```

### 4. Run it

```bash
npm install
npm run dev
```

Open the local URL, enter your email, click the magic link, and you're in.

---

## Deploying to Netlify

1. Push this repo to GitHub and "New site from Git" in Netlify.
2. Build settings are already in [`netlify.toml`](netlify.toml)
   (`npm run build` → publish `dist`, with SPA redirects).
3. In **Site settings → Environment variables**, add `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY`.
4. Add your Netlify URL to Supabase's **Redirect URLs** (step 2 above).

---

## Data shape (for future sessions)

```text
settings.lanes[]            { id, label, color }
shared.{ pipeline, contentEngine, businessGoals, launchpad,
         syncSpace, parkingLot, winsWall, bookshelf, dreamList }   // placeholders
jordyn.weeks["YYYY-MM-DD"]  { tasks[], focus, today[], reflection, carriedForward }
jordyn.reflection           {}   // reserved placeholder
ty.weeks / ty.reflection    same shape as jordyn
```

Weeks are keyed by their Monday in local ISO date. The `carriedForward` flag on
a week record is how carry-forward stays "once per week."
