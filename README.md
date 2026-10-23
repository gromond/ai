# Practice — TOEFL Practice App (Simplified)

Practice is a simple, polished TOEFL practice web app. **No accounts, no sign-up, no classroom admin.** Anyone opens the site, chooses Reading, Listening, Speaking, or Writing, completes a session, and sees their results.

## Run it

No build step. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# http://localhost:8000
```

On Vercel, deploy the project root as a static site; `api/feedback.js` is deployed automatically as a serverless function.

## What works

- **Landing page** — monochrome, minimalist. Headline, four skill cards, "How it works", working links throughout.
- **Reading** — 2 original passages × 5 questions, question navigation, timer with auto-submit, answers saved in the browser, instant objective scoring with explanations and a full answer review.
- **Listening** — 2 original exercises × 5 questions. Audio really plays: the device's speech-synthesis voice reads the original script (replay allowed in practice), with a transcript practice aid and a clear fallback message if speech is unavailable.
- **Speaking** — 2 prompts, preparation/response times, real microphone recording (MediaRecorder), playback, re-record, finish. Permission and unsupported-browser errors are handled plainly. Recordings stay in the browser.
- **Writing** — 2 tasks (academic discussion + integrated), clean editor, live word count, draft kept in the browser, timer, submit to a results page showing the response.
- **Results page** — skill + set title, raw score / percentage / correct-incorrect counts for objective skills, answer review with explanations, and an **overall AI feedback** section (below). Retry / choose another skill buttons.
- **Persistence** — in-progress sessions are kept in `localStorage` (`practice_simple_v1`) so a refresh does not lose work. No personal information is collected.

## AI: overall feedback only

AI is used **only** for overall feedback after a session — never for navigation, rendering, or grading. Objective scores are computed by the app itself.

- Endpoint: `api/feedback.js` (server-side; the API key never reaches the browser).
- Configure in Vercel Project Settings (see `.env.example`):
  - `AI_FEEDBACK_API_KEY` — required to enable AI feedback.
  - `AI_FEEDBACK_API_URL` — optional, OpenAI-compatible chat completions URL (default: OpenAI).
  - `AI_FEEDBACK_MODEL` — optional (default: `gpt-4o-mini`).
- Reading/Listening: the endpoint receives the app's computed score plus the topics of missed questions, and is instructed not to change or invent scores.
- Writing: the endpoint receives the prompt and the submitted response and returns a summary, strengths, areas to improve, and next steps — labelled AI-generated and unofficial in the UI.
- Speaking: AI audio evaluation is **not** configured in this build, so the results page says so plainly and never fabricates an analysis of a recording.
- **No key configured?** The endpoint returns `{ available: false }` and the results page shows a clear fallback message. The app works fully without AI.

## Tests

```bash
node tests/scoring.test.mjs   # objective scoring + seed-content integrity
node tests/smoke.test.mjs     # no-auth guarantee, module wiring, AI fallback, endpoint hygiene
node --check api/feedback.js  # endpoint syntax (or import it in your runtime)
```

## Content

All passages, conversations, lectures, prompts and questions are original, written for Practice. No commercial TOEFL content is reproduced, and no score in Practice is an official ETS score.
