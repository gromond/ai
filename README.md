# Practice — TOEFL Learning & Testing Platform

Practice is a complete TOEFL preparation platform for a class of students and their instructor: landing page, accounts with student/instructor roles, a student dashboard, Reading / Listening / Speaking / Writing practice modules, a shared test engine, classroom management, and progress tracking.

## Run it

No build step. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# http://localhost:8000
```

## What works in this build

- **Landing page** — monochrome, minimalist, accessible without signing in.
- **Auth & roles** — sign up / sign in as Student or Instructor. Passwords are stored as salted SHA-256 hashes (Web Crypto). Role checks gate the instructor portal and review pages.
- **Student dashboard** — real statistics calculated from the student's own attempts (no fabricated scores), assignments, recent activity, instructor feedback, resume for in-progress tests.
- **Reading** — 2 original passages × 5 questions (main idea, detail, vocabulary-in-context, inference). Timed or resumed, answers autosave, auto-submit at the deadline, instant scoring with explanations.
- **Listening** — 2 original exercises × 5 questions. Audio is genuinely played using the device's speech-synthesis voice reading the original script (practice mode allows replay; a transcript practice aid is included). If speech is unavailable, the UI says so instead of faking playback.
- **Speaking** — 2 prompts. Real microphone recording (MediaRecorder), elapsed timer with the task's response limit, playback, re-record, submit for instructor review. Recordings are stored with the attempt.
- **Writing** — 2 tasks (academic discussion + integrated). Clean editor, live word count, autosaved drafts, timer, submit for review.
- **Test engine** — shared across skills: attempt creation/resume, saved answers, server-style deadline handling (deadline timestamp + auto-submit), duplicate-submission guard, objective scoring.
- **Instructor portal** — create classes, join codes (regenerable), roster with per-student stats, create assignments (skill + test + optional due date), review submissions, listen to speaking recordings, read writing, publish rubric scores (0–4) and feedback that students see on their dashboard.
- **Progress** — per-skill percentages and score-over-time bars computed from submitted attempts, full attempt history. Scores are labelled unofficial (not ETS scores).
- **Privacy/Terms pages**, empty states, error states (bad login, unknown class code, microphone denied, unsupported speech), keyboard-friendly controls, `prefers-reduced-motion` support.

## Data & production backend

This standalone build persists data in the browser's `localStorage` (key `practice_v1`), which makes the whole product work with zero configuration — ideal for demos and single-device classrooms.

For a multi-user production deployment, the schema and configuration are provided:

- `supabase/schema.sql` — PostgreSQL schema for Supabase (or any Postgres): profiles, classes, memberships, tests, questions, assignments, attempts, answers, recordings, writing submissions, feedback, with foreign keys, indexes and uniqueness constraints. Enable Row Level Security policies modelled on the role rules in the app before going live.
- `.env.example` — every environment variable the production integration needs (Supabase URL/keys, optional AI writing/speech evaluation providers). The app is designed so the `DB` data-layer object in `index.html` can be swapped for Supabase client calls with the same shape.
- **Never commit real secrets.** `.env` is for local use only; set production values in Vercel Project Settings.

### Optional AI services

Speaking transcription/evaluation and writing AI feedback are intentionally **not faked**. If you configure a provider (see `.env.example`), wire it behind a server-side endpoint and display its output labelled "AI-generated feedback". Until then, Speaking and Writing are reviewed by the instructor — the app states this clearly in the UI.

## Tests

```bash
node tests/scoring.test.mjs   # objective scoring + seed-content integrity
node tests/smoke.test.mjs     # static checks: routes, modules, no placeholder buttons
```

Browser journeys verified manually against the checklist in the master prompt (auth, join class, all four skills end-to-end, instructor feedback reaching the student, cross-student access blocked by the review-page role/membership checks).

## Deploy (Vercel)

The app is a static site: import the repo in Vercel (framework preset: Other / no build command, output directory: project root) or deploy `index.html` directly. The live deployment for this repo is linked from the repository's Vercel project `gromond-ai`.

## Content

All passages, conversations, lectures, prompts and questions are original and written for Practice. No commercial test content is reproduced.
